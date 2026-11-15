import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuth, checkPassword, hashPassword } from './auth.js';

// 共享路由：本地 Node 和 Cloudflare Workers 都使用这个 app
// db 由调用方注入（本地 JSON 存储 / 线上 D1 存储）
export function createApp(db) {
  const auth = createAuth(db);
  const app = new Hono();

  app.use('*', cors());
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: '服务器内部错误' }, 500);
  });

  // ============================================
  // 工具函数
  // ============================================
  const nicknameOf = async (username) => {
    const profiles = await db.get('profiles');
    const profile = profiles[username];
    return (profile && profile.nickname) || username;
  };

  const publicUser = async (user) => ({
    username: user.username,
    phone: user.phone,
    nickname: await nicknameOf(user.username)
  });

  const isOwner = async (username, author) => {
    if (!author) return true;
    return author === username || author === (await nicknameOf(username));
  };

  // ============================================
  // 健康检查
  // ============================================
  app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }));

  // ============================================
  // 账号：注册 / 登录 / 登出 / 当前用户
  // ============================================
  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const username = String(body.username || '').trim();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    if (!username) return c.json({ error: '请输入用户名' }, 400);
    if (!phone) return c.json({ error: '请输入手机号' }, 400);
    if (password.length < 6) return c.json({ error: '密码至少6位' }, 400);

    const users = await db.get('users');
    if (users.some((u) => u.username === username)) {
      return c.json({ error: '用户名已存在' }, 409);
    }
    const profiles = await db.get('profiles');
    const nicknameTaken = Object.values(profiles).some((p) => p.nickname === username);
    if (nicknameTaken) return c.json({ error: '该昵称已被占用' }, 409);

    const user = { username, phone, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
    await db.mutate((s) => {
      s.users.push(user);
      s.profiles[username] = {
        nickname: username,
        avatar: body.avatar || '',
        bio: '这家伙很懒，什么都没留下~',
        gender: '',
        birthday: '',
        hometown: '',
        stats: { articles: 0, tags: 0, categories: 0, likes: 0 }
      };
    });

    const token = await auth.issueToken(username);
    return c.json({ token, user: await publicUser(user) });
  });

  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const account = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!account || !password) return c.json({ error: '请输入用户名和密码' }, 400);

    // 支持「用户名」或「昵称」登录，与前端原有逻辑保持一致
    const users = await db.get('users');
    let user = users.find((u) => u.username === account);
    if (!user) {
      const profiles = await db.get('profiles');
      const entry = Object.entries(profiles).find(([, p]) => p.nickname === account);
      if (entry) user = users.find((u) => u.username === entry[0]);
    }
    if (!user) return c.json({ error: '该用户不存在，请先注册' }, 404);
    if (!(await checkPassword(password, user.passwordHash))) return c.json({ error: '密码错误' }, 401);

    const token = await auth.issueToken(user.username);
    return c.json({ token, user: await publicUser(user) });
  });

  app.post('/api/auth/logout', async (c) => {
    const header = c.req.header('Authorization') || '';
    const token = header.replace(/^Bearer\s+/i, '').trim();
    if (token) await auth.revokeToken(token);
    return c.json({ ok: true });
  });

  app.get('/api/me', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);
    const users = await db.get('users');
    const user = users.find((u) => u.username === username);
    if (!user) return c.json({ error: '用户不存在' }, 404);
    const profiles = await db.get('profiles');
    return c.json({ user: await publicUser(user), profile: profiles[username] || null });
  });

  // ============================================
  // 全量快照：前端启动时拉一次，灌进本地缓存
  // ============================================
  app.get('/api/snapshot', async (c) => {
    const state = await db.all();
    const username = await auth.userFromRequest(c);
    return c.json({
      articles: state.articles,
      comments: state.comments,
      messages: state.messages,
      tags: state.tags,
      categories: state.categories,
      profiles: state.profiles,
      users: state.users.map((u) => ({ username: u.username, phone: u.phone })),
      favorites: username ? state.favorites.filter((f) => f.username === username) : [],
      serverTime: new Date().toISOString()
    });
  });

  // ============================================
  // 文章
  // ============================================
  app.post('/api/articles', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const body = await c.req.json().catch(() => ({}));
    const article = body.article || body;
    if (!article || !article.title) return c.json({ error: '标题不能为空' }, 400);

    const record = {
      ...article,
      id: article.id || `a${Date.now()}`,
      author: await nicknameOf(username),
      createdAt: article.createdAt || new Date().toISOString(),
      likes: article.likes || 0,
      views: article.views || 0
    };
    await db.mutate((s) => {
      const index = s.articles.findIndex((a) => a.id === record.id);
      if (index >= 0) s.articles[index] = record;
      else s.articles.unshift(record);
    });
    return c.json({ article: record }, 201);
  });

  app.put('/api/articles/:id', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const id = c.req.param('id');
    const articles = await db.get('articles');
    const existing = articles.find((a) => a.id === id);
    if (!existing) return c.json({ error: '文章不存在' }, 404);
    if (!(await isOwner(username, existing.author))) return c.json({ error: '无权修改这篇文章' }, 403);

    const body = await c.req.json().catch(() => ({}));
    const patch = body.article || body;
    const updated = await db.mutate((s) => {
      const index = s.articles.findIndex((a) => a.id === id);
      s.articles[index] = { ...s.articles[index], ...patch, id, author: s.articles[index].author };
      return s.articles[index];
    });
    return c.json({ article: updated });
  });

  app.delete('/api/articles/:id', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const id = c.req.param('id');
    const articles = await db.get('articles');
    const existing = articles.find((a) => a.id === id);
    if (!existing) return c.json({ error: '文章不存在' }, 404);
    if (!(await isOwner(username, existing.author))) return c.json({ error: '无权删除这篇文章' }, 403);

    await db.mutate((s) => {
      s.articles = s.articles.filter((a) => a.id !== id);
      s.comments = s.comments.filter((cm) => cm.articleId !== id);
      s.favorites = s.favorites.filter((f) => f.articleId !== id);
    });
    return c.json({ ok: true });
  });

  // ============================================
  // 评论
  // ============================================
  app.post('/api/comments', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const body = await c.req.json().catch(() => ({}));
    const comment = body.comment || body;
    if (!comment || !comment.articleId) return c.json({ error: '缺少文章ID' }, 400);

    const record = {
      ...comment,
      id: comment.id || `cm${Date.now()}`,
      author: await nicknameOf(username),
      createdAt: comment.createdAt || new Date().toISOString(),
      likes: comment.likes || 0,
      replies: comment.replies || []
    };
    await db.mutate((s) => {
      const index = s.comments.findIndex((cm) => cm.id === record.id);
      if (index >= 0) s.comments[index] = record;
      else s.comments.unshift(record);
    });
    return c.json({ comment: record }, 201);
  });

  app.delete('/api/comments/:id', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const id = c.req.param('id');
    const comments = await db.get('comments');
    const existing = comments.find((cm) => cm.id === id);
    if (!existing) return c.json({ error: '评论不存在' }, 404);
    if (!(await isOwner(username, existing.author))) return c.json({ error: '无权删除这条评论' }, 403);

    await db.mutate((s) => {
      s.comments = s.comments.filter((cm) => cm.id !== id);
    });
    return c.json({ ok: true });
  });

  // ============================================
  // 留言
  // ============================================
  app.post('/api/messages', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const body = await c.req.json().catch(() => ({}));
    const message = body.message || body;
    if (!message || !message.content) return c.json({ error: '内容不能为空' }, 400);

    const record = {
      ...message,
      id: message.id || `m${Date.now()}`,
      author: await nicknameOf(username),
      createdAt: message.createdAt || new Date().toISOString(),
      likes: message.likes || 0,
      views: message.views || 0,
      replies: message.replies || []
    };
    await db.mutate((s) => {
      const index = s.messages.findIndex((m) => m.id === record.id);
      if (index >= 0) s.messages[index] = record;
      else s.messages.unshift(record);
    });
    return c.json({ message: record }, 201);
  });

  app.delete('/api/messages/:id', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const id = c.req.param('id');
    const messages = await db.get('messages');
    const existing = messages.find((m) => m.id === id);
    if (!existing) return c.json({ error: '留言不存在' }, 404);
    if (!(await isOwner(username, existing.author))) return c.json({ error: '无权删除这条留言' }, 403);

    await db.mutate((s) => {
      s.messages = s.messages.filter((m) => m.id !== id);
    });
    return c.json({ ok: true });
  });

  // ============================================
  // 个人资料
  // ============================================
  app.put('/api/profiles/:username', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);
    if (username !== c.req.param('username')) return c.json({ error: '只能修改自己的资料' }, 403);

    const body = await c.req.json().catch(() => ({}));
    const profile = body.profile || body;
    const updated = await db.mutate((s) => {
      const previous = s.profiles[username] || {};
      const nickname = profile.nickname || previous.nickname || username;
      s.profiles[username] = { ...previous, ...profile, nickname };
      return s.profiles[username];
    });
    return c.json({ profile: updated });
  });

  // ============================================
  // 收藏
  // ============================================
  app.post('/api/favorites', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const body = await c.req.json().catch(() => ({}));
    const articleId = body.articleId;
    if (!articleId) return c.json({ error: '缺少文章ID' }, 400);

    await db.mutate((s) => {
      if (s.favorites.some((f) => f.username === username && f.articleId === articleId)) return;
      s.favorites.push({ id: `f${Date.now()}`, username, articleId, createdAt: new Date().toISOString() });
    });
    return c.json({ ok: true, favorited: true }, 201);
  });

  app.delete('/api/favorites/:articleId', async (c) => {
    const username = await auth.userFromRequest(c);
    if (!username) return c.json({ error: '未登录' }, 401);

    const articleId = c.req.param('articleId');
    await db.mutate((s) => {
      s.favorites = s.favorites.filter((f) => !(f.username === username && f.articleId === articleId));
    });
    return c.json({ ok: true, favorited: false });
  });

  // ============================================
  // 旧数据迁移：把本地 localStorage 里的内容一次性搬到服务端
  // ============================================
  app.post('/api/migrate', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const counts = { users: 0, articles: 0, comments: 0, messages: 0, profiles: 0, favorites: 0 };

    // 密码哈希是异步的，先在写入前算好，再一次性合并进数据库
    const knownUsers = new Set((await db.get('users')).map((u) => u.username));
    const newUsers = [];
    for (const u of body.users || []) {
      if (!u || !u.username || knownUsers.has(u.username)) continue;
      knownUsers.add(u.username);
      newUsers.push({
        username: u.username,
        phone: u.phone || '',
        passwordHash: await hashPassword(String(u.password || '123456')),
        createdAt: new Date().toISOString()
      });
    }

    await db.mutate((s) => {
      s.users.push(...newUsers);
      counts.users = newUsers.length;

      Object.entries(body.profiles || {}).forEach(([username, profile]) => {
        if (!s.profiles[username]) {
          s.profiles[username] = { nickname: username, avatar: '', bio: '这家伙很懒，什么都没留下~', ...profile };
          counts.profiles++;
        }
      });

      (body.articles || []).forEach((a) => {
        if (!a || !a.id) return;
        if (s.articles.some((x) => x.id === a.id)) return;
        s.articles.push(a);
        counts.articles++;
      });

      (body.comments || []).forEach((cm) => {
        if (!cm || !cm.id) return;
        if (s.comments.some((x) => x.id === cm.id)) return;
        s.comments.push(cm);
        counts.comments++;
      });

      (body.messages || []).forEach((m) => {
        if (!m || !m.id) return;
        if (s.messages.some((x) => x.id === m.id)) return;
        s.messages.push(m);
        counts.messages++;
      });

      (body.favorites || []).forEach((f) => {
        if (!f || !f.id) return;
        if (s.favorites.some((x) => x.id === f.id)) return;
        s.favorites.push(f);
        counts.favorites++;
      });
    });

    return c.json({ ok: true, imported: counts });
  });

  return app;
}
