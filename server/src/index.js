import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { all, get, mutate } from './db.js';
import { checkPassword, hashPassword, issueToken, requireUser, revokeToken, userFromRequest } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

const app = new Hono();
app.use('*', cors());
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: '服务器内部错误' }, 500);
});

// ============================================
// 工具函数
// ============================================
const nicknameOf = (username) => {
  const profile = get('profiles')[username];
  return (profile && profile.nickname) || username;
};

const publicUser = (user) => ({
  username: user.username,
  phone: user.phone,
  nickname: nicknameOf(user.username)
});

const isOwner = (username, author) => {
  if (!author) return true;
  return author === username || author === nicknameOf(username);
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

  if (get('users').some((u) => u.username === username)) {
    return c.json({ error: '用户名已存在' }, 409);
  }
  const nicknameTaken = Object.values(get('profiles')).some((p) => p.nickname === username);
  if (nicknameTaken) return c.json({ error: '该昵称已被占用' }, 409);

  const user = { username, phone, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
  mutate((s) => {
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

  const token = issueToken(username);
  return c.json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const account = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!account || !password) return c.json({ error: '请输入用户名和密码' }, 400);

  // 支持「用户名」或「昵称」登录，与前端原有逻辑保持一致
  let user = get('users').find((u) => u.username === account);
  if (!user) {
    const entry = Object.entries(get('profiles')).find(([, p]) => p.nickname === account);
    if (entry) user = get('users').find((u) => u.username === entry[0]);
  }
  if (!user) return c.json({ error: '该用户不存在，请先注册' }, 404);
  if (!checkPassword(password, user.passwordHash)) return c.json({ error: '密码错误' }, 401);

  const token = issueToken(user.username);
  return c.json({ token, user: publicUser(user) });
});

app.post('/api/auth/logout', (c) => {
  const header = c.req.header('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (token) revokeToken(token);
  return c.json({ ok: true });
});

app.get('/api/me', (c) => {
  const username = userFromRequest(c);
  if (!username) return c.json({ error: '未登录' }, 401);
  const user = get('users').find((u) => u.username === username);
  if (!user) return c.json({ error: '用户不存在' }, 404);
  return c.json({ user: publicUser(user), profile: get('profiles')[username] || null });
});

// ============================================
// 全量快照：前端启动时拉一次，灌进本地缓存
// ============================================
app.get('/api/snapshot', (c) => {
  const state = all();
  const username = userFromRequest(c);
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
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const article = body.article || body;
  if (!article || !article.title) return c.json({ error: '标题不能为空' }, 400);

  const record = {
    ...article,
    id: article.id || `a${Date.now()}`,
    author: nicknameOf(username),
    createdAt: article.createdAt || new Date().toISOString(),
    likes: article.likes || 0,
    views: article.views || 0
  };
  mutate((s) => {
    const index = s.articles.findIndex((a) => a.id === record.id);
    if (index >= 0) s.articles[index] = record;
    else s.articles.unshift(record);
  });
  return c.json({ article: record }, 201);
});

app.put('/api/articles/:id', async (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const id = c.req.param('id');
  const existing = get('articles').find((a) => a.id === id);
  if (!existing) return c.json({ error: '文章不存在' }, 404);
  if (!isOwner(username, existing.author)) return c.json({ error: '无权修改这篇文章' }, 403);

  const body = await c.req.json().catch(() => ({}));
  const patch = body.article || body;
  const updated = mutate((s) => {
    const index = s.articles.findIndex((a) => a.id === id);
    s.articles[index] = { ...s.articles[index], ...patch, id, author: s.articles[index].author };
    return s.articles[index];
  });
  return c.json({ article: updated });
});

app.delete('/api/articles/:id', (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const id = c.req.param('id');
  const existing = get('articles').find((a) => a.id === id);
  if (!existing) return c.json({ error: '文章不存在' }, 404);
  if (!isOwner(username, existing.author)) return c.json({ error: '无权删除这篇文章' }, 403);

  mutate((s) => {
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
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const comment = body.comment || body;
  if (!comment || !comment.articleId) return c.json({ error: '缺少文章ID' }, 400);

  const record = {
    ...comment,
    id: comment.id || `cm${Date.now()}`,
    author: nicknameOf(username),
    createdAt: comment.createdAt || new Date().toISOString(),
    likes: comment.likes || 0,
    replies: comment.replies || []
  };
  mutate((s) => {
    const index = s.comments.findIndex((cm) => cm.id === record.id);
    if (index >= 0) s.comments[index] = record;
    else s.comments.unshift(record);
  });
  return c.json({ comment: record }, 201);
});

app.delete('/api/comments/:id', (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const id = c.req.param('id');
  const existing = get('comments').find((cm) => cm.id === id);
  if (!existing) return c.json({ error: '评论不存在' }, 404);
  if (!isOwner(username, existing.author)) return c.json({ error: '无权删除这条评论' }, 403);

  mutate((s) => {
    s.comments = s.comments.filter((cm) => cm.id !== id);
  });
  return c.json({ ok: true });
});

// ============================================
// 留言
// ============================================
app.post('/api/messages', async (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const message = body.message || body;
  if (!message || !message.content) return c.json({ error: '内容不能为空' }, 400);

  const record = {
    ...message,
    id: message.id || `m${Date.now()}`,
    author: nicknameOf(username),
    createdAt: message.createdAt || new Date().toISOString(),
    likes: message.likes || 0,
    views: message.views || 0,
    replies: message.replies || []
  };
  mutate((s) => {
    const index = s.messages.findIndex((m) => m.id === record.id);
    if (index >= 0) s.messages[index] = record;
    else s.messages.unshift(record);
  });
  return c.json({ message: record }, 201);
});

app.delete('/api/messages/:id', (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const id = c.req.param('id');
  const existing = get('messages').find((m) => m.id === id);
  if (!existing) return c.json({ error: '留言不存在' }, 404);
  if (!isOwner(username, existing.author)) return c.json({ error: '无权删除这条留言' }, 403);

  mutate((s) => {
    s.messages = s.messages.filter((m) => m.id !== id);
  });
  return c.json({ ok: true });
});

// ============================================
// 个人资料
// ============================================
app.put('/api/profiles/:username', async (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);
  if (username !== c.req.param('username')) return c.json({ error: '只能修改自己的资料' }, 403);

  const body = await c.req.json().catch(() => ({}));
  const profile = body.profile || body;
  const updated = mutate((s) => {
    s.profiles[username] = { ...(s.profiles[username] || {}), ...profile, nickname: profile.nickname || nicknameOf(username) };
    return s.profiles[username];
  });
  return c.json({ profile: updated });
});

// ============================================
// 收藏
// ============================================
app.post('/api/favorites', async (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const articleId = body.articleId;
  if (!articleId) return c.json({ error: '缺少文章ID' }, 400);

  mutate((s) => {
    if (s.favorites.some((f) => f.username === username && f.articleId === articleId)) return;
    s.favorites.push({ id: `f${Date.now()}`, username, articleId, createdAt: new Date().toISOString() });
  });
  return c.json({ ok: true, favorited: true }, 201);
});

app.delete('/api/favorites/:articleId', (c) => {
  const username = requireUser(c);
  if (!username) return c.json({ error: '未登录' }, 401);

  const articleId = c.req.param('articleId');
  mutate((s) => {
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

  mutate((s) => {
    (body.users || []).forEach((u) => {
      if (!u || !u.username) return;
      if (s.users.some((x) => x.username === u.username)) return;
      s.users.push({
        username: u.username,
        phone: u.phone || '',
        passwordHash: hashPassword(String(u.password || '123456')),
        createdAt: new Date().toISOString()
      });
      counts.users++;
    });

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

// ============================================
// 静态文件：直接用后端服务器跑整个前端，本地联调不用处理跨域
// ============================================
app.get('/', (c) => c.redirect('/HTML/index.html'));
app.use('/*', serveStatic({ root: PROJECT_ROOT }));

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`叙白屋后端已启动: http://localhost:${info.port}/HTML/index.html`);
  console.log(`局域网访问（手机同 WiFi）: http://<你的电脑IP>:${info.port}/HTML/index.html`);
});
