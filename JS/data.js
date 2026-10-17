const DB = {
  // ============================================
  // 数据存储键定义
  // ============================================
  KEYS: {
    USERS: 'xubaiwu_users',
    CURRENT_USER: 'xubaiwu_currentUser',
    ARTICLES: 'xubaiwu_articles',
    TAGS: 'xubaiwu_tags',
    CATEGORIES: 'xubaiwu_categories',
    COMMENTS: 'xubaiwu_comments',
    MESSAGES: 'xubaiwu_messages',
    PROFILES: 'xubaiwu_profiles',
    FAVORITES: 'xubaiwu_favorites'
  },

  // ============================================
  // 初始化和数据迁移
  // ============================================
  init: function() {
    this.initDefaultData();
    this.migrateArticleCovers();
    this.migrateAuthorNames();
    this.migrateProfileNicknames();
    this.migrateAllUserAuthorNamesComplete();
  },

  migrateArticleCovers: function() {
    const articles = this.getArticles();
    const titleToCover = {
      '踏上程序员之路': '../IMG/踏上程序员之路.jpg',
      '秋日午后的咖啡时光': '../IMG/秋日午后的咖啡时光.jpg',
      'React Hooks 入门指南': '../IMG/React Hook 入门指南.jpg',
      '一个人的旅行': '../IMG/一个人的旅行.jpg',
      '深夜的思考': '../IMG/深夜的思考.jpg',
      '阅读的力量': '../IMG/阅读的力量.jpg',
      '像素风设计的魅力': '../IMG/像素风设计的魅力.jpg',
      '周末厨房': '../IMG/周末厨房.jpg',
      '今天吃什么': '../IMG/今天吃什么.jpg'
    };
    let needsSave = false;
    articles.forEach(article => {
      if (!article.cover && titleToCover[article.title]) {
        article.cover = titleToCover[article.title];
        needsSave = true;
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify(articles));
    }
  },

  migrateAuthorNames: function() {
    const articles = this.getArticles();
    const titleToAuthor = {
      '秋日午后的咖啡时光': '老师好我叫小明同学',
      '一个人的旅行': '向前看',
      '深夜的思考': 'momo',
      '阅读的力量': '取名好难',
      '周末厨房': '一个不愿透露姓名的美食家'
    };
    let needsSave = false;
    articles.forEach(article => {
      if (titleToAuthor[article.title]) {
        article.author = titleToAuthor[article.title];
        needsSave = true;
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify(articles));
    }
  },

  migrateProfileNicknames: function() {
    const profiles = this.getProfiles();
    let needsSave = false;
    for (const [username, profile] of Object.entries(profiles)) {
      if (!profile.nickname || profile.nickname === '') {
        profile.nickname = username;
        needsSave = true;
      }
    }
    if (needsSave) {
      localStorage.setItem(this.KEYS.PROFILES, JSON.stringify(profiles));
    }
  },

  migrateAllUserAuthorNames: function() {
    const profiles = this.getProfiles();
    const users = this.getUsers();
    
    users.forEach(user => {
      const profile = profiles[user.username];
      if (!profile || !profile.nickname) return;
      
      const username = user.username;
      const nickname = profile.nickname;
      
      if (username === nickname) return;
      
      this.migrateAuthorNamesForUser(username, username, nickname);
    });
  },

  migrateAllUserAuthorNamesComplete: function() {
    const profiles = this.getProfiles();
    const users = this.getUsers();
    let needsSave = false;
    
    const articles = this.getArticles();
    articles.forEach(article => {
      for (const [username, profile] of Object.entries(profiles)) {
        if (!profile.nickname) continue;
        if (article.author === username && article.author !== profile.nickname) {
          article.author = profile.nickname;
          needsSave = true;
        }
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify(articles));
      needsSave = false;
    }
    
    const comments = this.getComments();
    comments.forEach(comment => {
      for (const [username, profile] of Object.entries(profiles)) {
        if (!profile.nickname) continue;
        if (comment.author === username && comment.author !== profile.nickname) {
          comment.author = profile.nickname;
          needsSave = true;
        }
        if (comment.replies) {
          comment.replies.forEach(reply => {
            if (reply.author === username && reply.author !== profile.nickname) {
              reply.author = profile.nickname;
              needsSave = true;
            }
          });
        }
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify(comments));
      needsSave = false;
    }
    
    const messages = this.getMessages();
    messages.forEach(message => {
      for (const [username, profile] of Object.entries(profiles)) {
        if (!profile.nickname) continue;
        if (message.author === username && message.author !== profile.nickname) {
          message.author = profile.nickname;
          needsSave = true;
        }
        if (message.replies) {
          message.replies.forEach(reply => {
            if (reply.author === username && reply.author !== profile.nickname) {
              reply.author = profile.nickname;
              needsSave = true;
            }
          });
        }
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
    }
  },

  migrateAuthorNamesForUser: function(username, oldName, newName) {
    let needsSave = false;
    
    const articles = this.getArticles();
    articles.forEach(article => {
      if (article.author === oldName) {
        article.author = newName;
        needsSave = true;
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify(articles));
    }
    
    const comments = this.getComments();
    needsSave = false;
    comments.forEach(comment => {
      if (comment.author === oldName) {
        comment.author = newName;
        needsSave = true;
      }
      if (comment.replies) {
        comment.replies.forEach(reply => {
          if (reply.author === oldName) {
            reply.author = newName;
            needsSave = true;
          }
        });
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify(comments));
    }
    
    const messages = this.getMessages();
    needsSave = false;
    messages.forEach(message => {
      if (message.author === oldName) {
        message.author = newName;
        needsSave = true;
      }
      if (message.replies) {
        message.replies.forEach(reply => {
          if (reply.author === oldName) {
            reply.author = newName;
            needsSave = true;
          }
        });
      }
    });
    if (needsSave) {
      localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
    }
  },

  // ============================================
  // 默认数据初始化（首次加载时创建示例数据）
  // ============================================
  initDefaultData: function() {
    if (!localStorage.getItem(this.KEYS.TAGS)) {
      localStorage.setItem(this.KEYS.TAGS, JSON.stringify([
        { id: 't1', name: '生活', color: '#8B7355' },
        { id: 't2', name: '技术', color: '#4A7C59' },
        { id: 't3', name: '读书', color: '#6B5B95' },
        { id: 't4', name: '旅行', color: '#E08E79' },
        { id: 't5', name: '感悟', color: '#88B04B' },
        { id: 't6', name: '编程', color: '#6FA8DC' },
        { id: 't7', name: '摄影', color: '#9B59B6' },
        { id: 't8', name: '美食', color: '#E67E22' }
      ]));
    }

    if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
      localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify([
        { id: 'c1', name: '日常随笔' },
        { id: 'c2', name: '技术笔记' },
        { id: 'c3', name: '读书笔记' },
        { id: 'c4', name: '旅行日记' },
        { id: 'c5', name: '心情日记' }
      ]));
    }

    if (!localStorage.getItem(this.KEYS.ARTICLES)) {
      localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify([
        {
          id: 'a1',
          title: '踏上程序员之路',
          content: '出乎预料的开端。如标题所述，是的，主包在高考录取结果出来之前根本没有考虑过自己将来要走计算机这条路。从很小的时候，家里人就向主包灌输着当老师的思想...',
          author: 'Rvanhecy',
          categoryId: 'c2',
          tags: ['t2', 't6'],
          createdAt: '2025-09-25',
          likes: 12,
          views: 89,
          cover: '../IMG/踏上程序员之路.jpg'
        },
        {
          id: 'a2',
          title: '秋日午后的咖啡时光',
          content: '阳光透过窗户洒在木质桌面上，一杯温热的拿铁散发着浓郁的香气。这样的午后，适合读一本好书，或者写下一些零碎的思绪...',
          author: '老师好我叫小明同学',
          categoryId: 'c1',
          tags: ['t1', 't8'],
          createdAt: '2025-10-15',
          likes: 23,
          views: 156,
          cover: '../IMG/秋日午后的咖啡时光.jpg'
        },
        {
          id: 'a3',
          title: 'React Hooks 入门指南',
          content: 'React Hooks 是 React 16.8 引入的新特性，让我们可以在不编写类组件的情况下使用 state 和其他 React 特性。本文将带你从零开始学习 Hooks...',
          author: 'Rvanhecy',
          categoryId: 'c2',
          tags: ['t2', 't6'],
          createdAt: '2025-10-20',
          likes: 45,
          views: 320,
          cover: '../IMG/React Hook 入门指南.jpg'
        },
        {
          id: 'a4',
          title: '一个人的旅行',
          content: '背着背包，踏上未知的旅程。在陌生的城市中漫步，感受不同的风土人情。旅行的意义不在于目的地，而在于沿途的风景和遇见的人...',
          author: '向前看',
          categoryId: 'c4',
          tags: ['t4', 't5'],
          createdAt: '2025-10-28',
          likes: 67,
          views: 450,
          cover: '../IMG/一个人的旅行.jpg'
        },
        {
          id: 'a5',
          title: '深夜的思考',
          content: '夜深人静的时候，总是容易陷入思考。关于生活，关于梦想，关于那些还未实现的愿望。每一个深夜都是一次与自己对话的机会...',
          author: 'momo',
          categoryId: 'c5',
          tags: ['t5'],
          createdAt: '2025-11-02',
          likes: 34,
          views: 220,
          cover: '../IMG/深夜的思考.jpg'
        },
        {
          id: 'a6',
          title: '阅读的力量',
          content: '书是人类进步的阶梯，这句话虽然老套，但确实是真理。每一本书都是一扇通往新世界的大门，让我们能够体验不同的人生...',
          author: '取名好难',
          categoryId: 'c3',
          tags: ['t3'],
          createdAt: '2025-11-08',
          likes: 56,
          views: 380,
          cover: '../IMG/阅读的力量.jpg'
        },
        {
          id: 'a7',
          title: '像素风设计的魅力',
          content: '8-bit 像素风格近年来越来越受欢迎，它不仅唤起了人们对童年游戏的回忆，更以其独特的美学风格吸引着新一代的设计师...',
          author: 'Rvanhecy',
          categoryId: 'c2',
          tags: ['t2', 't7'],
          createdAt: '2025-11-15',
          likes: 28,
          views: 190,
          cover: '../IMG/像素风设计的魅力.jpg'
        },
        {
          id: 'a8',
          title: '周末厨房',
          content: '周末最惬意的事情莫过于在厨房里忙碌。尝试新的菜谱，闻着食物的香气，感受生活的美好。美食不仅是味觉的享受，更是一种生活态度...',
          author: '一个不愿透露姓名的美食家',
          categoryId: 'c1',
          tags: ['t1', 't8'],
          createdAt: '2025-11-20',
          likes: 78,
          views: 520,
          cover: '../IMG/周末厨房.jpg'
        }
      ]));
    }

    if (!localStorage.getItem(this.KEYS.COMMENTS)) {
      localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify([
        { id: 'cm1', articleId: 'a1', author: '新手小白', content: '加油！一起努力！', createdAt: '2025-09-26 14:30', likes: 3, replies: [
          { id: 'cm1-1', author: 'Rvanhecy', content: '谢谢支持！一起加油！', createdAt: '2025-09-26 15:45', likes: 2 }
        ]},
        { id: 'cm2', articleId: 'a1', author: '老程序员', content: '很真实的经历，感同身受', createdAt: '2025-09-27 09:15', likes: 5, replies: [] },
        { id: 'cm3', articleId: 'a3', author: '前端学习者', content: '写得很清楚，收藏了！', createdAt: '2025-10-21 20:00', likes: 8, replies: [
          { id: 'cm3-1', author: 'Rvanhecy', content: '很高兴对你有帮助！', createdAt: '2025-10-21 21:30', likes: 4 },
          { id: 'cm3-2', author: '另一个学习者', content: '请问 useEffect 怎么用？', createdAt: '2025-10-22 10:00', likes: 1 }
        ]},
        { id: 'cm4', articleId: 'a4', author: '旅行爱好者', content: '羡慕这样的勇气', createdAt: '2025-10-29 16:20', likes: 12, replies: [] }
      ]));
    }

    if (!localStorage.getItem(this.KEYS.MESSAGES)) {
    localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify([
      { id: 'm1', author: '访客A', content: '这里的氛围很安静，很喜欢！', createdAt: '2025-10-01 10:30', likes: 15, views: 45, replies: [] },
      { id: 'm2', author: '访客B', content: '期待更多精彩的文章', createdAt: '2025-10-15 14:20', likes: 8, views: 32, replies: [] },
      { id: 'm3', author: 'Rvanhecy', content: '感谢大家的支持，我会继续努力的！', createdAt: '2025-10-20 20:15', likes: 22, views: 67, replies: [] },
      { id: 'm4', author: '新用户', content: '刚注册，感觉这个网站很有特色', createdAt: '2025-11-01 09:00', likes: 6, views: 23, replies: [] }
    ]));
  }
  },

  // ============================================
  // 用户管理（注册、登录、身份验证）
  // ============================================
  getUsers: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
  },

  saveUser: function(user) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  getUser: function(username) {
    const users = this.getUsers();
    return users.find(u => u.username === username);
  },

  getUserByNickname: function(nickname) {
    const profiles = this.getProfiles();
    for (const [username, profile] of Object.entries(profiles)) {
      if (profile.nickname === nickname) {
        return this.getUser(username);
      }
    }
    return null;
  },

  getUserByName: function(name) {
    const user = this.getUser(name);
    if (user) return { user, isUsername: true };
    const userByNick = this.getUserByNickname(name);
    if (userByNick) return { user: userByNick, isUsername: false };
    return null;
  },

  getCurrentUser: function() {
    return localStorage.getItem(this.KEYS.CURRENT_USER);
  },

  setCurrentUser: function(username) {
    localStorage.setItem(this.KEYS.CURRENT_USER, username);
  },

  clearCurrentUser: function() {
    localStorage.removeItem(this.KEYS.CURRENT_USER);
  },

  // ============================================
  // 文章管理（增删改查、筛选、收藏关联）
  // ============================================
  getArticles: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.ARTICLES) || '[]');
  },

  getArticlesByAuthor: function(author) {
    const profile = this.getProfile(author);
    const nickname = profile && profile.nickname ? profile.nickname : author;
    return this.getArticles().filter(a => a.author === author || a.author === nickname);
  },

  getArticlesByTag: function(tagId) {
    return this.getArticles().filter(a => a.tags.includes(tagId));
  },

  getArticlesByCategory: function(categoryId) {
    return this.getArticles().filter(a => a.categoryId === categoryId);
  },

  getArticle: function(id) {
    return this.getArticles().find(a => a.id === id);
  },

  saveArticle: function(article) {
    const articles = this.getArticles();
    const index = articles.findIndex(a => a.id === article.id);
    if (index >= 0) {
      articles[index] = article;
    } else {
      article.id = 'a' + Date.now();
      articles.unshift(article);
    }
    localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify(articles));
    return article;
  },

  deleteArticle: function(id) {
    const articles = this.getArticles().filter(a => a.id !== id);
    localStorage.setItem(this.KEYS.ARTICLES, JSON.stringify(articles));
    
    const favorites = this.getFavorites();
    const newFavorites = favorites.filter(f => f.articleId !== id);
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(newFavorites));
  },

  // ============================================
  // 收藏管理（收藏/取消收藏、查询）
  // ============================================
  getFavorites: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES) || '[]');
  },

  getFavoritesByUser: function(username) {
    return this.getFavorites().filter(f => f.username === username);
  },

  saveFavorite: function(username, articleId) {
    const favorites = this.getFavorites();
    if (!favorites.find(f => f.username === username && f.articleId === articleId)) {
      favorites.push({
        id: 'f' + Date.now(),
        username,
        articleId,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
    }
  },

  removeFavorite: function(username, articleId) {
    const favorites = this.getFavorites();
    const newFavorites = favorites.filter(f => !(f.username === username && f.articleId === articleId));
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(newFavorites));
  },

  isFavorite: function(username, articleId) {
    const favorites = this.getFavorites();
    return favorites.some(f => f.username === username && f.articleId === articleId);
  },

  // ============================================
  // 标签和分类管理
  // ============================================
  getTags: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.TAGS) || '[]');
  },

  getTag: function(id) {
    return this.getTags().find(t => t.id === id);
  },

  getTagsByIds: function(ids) {
    return this.getTags().filter(t => ids.includes(t.id));
  },

  getCategories: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]');
  },

  getCategory: function(id) {
    return this.getCategories().find(c => c.id === id);
  },

  // ============================================
  // 评论管理（增删改查、回复、点赞）
  // ============================================
  getComments: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.COMMENTS) || '[]');
  },

  getCommentsByArticle: function(articleId) {
    return this.getComments().filter(c => c.articleId === articleId);
  },

  saveComment: function(comment) {
    const comments = this.getComments();
    const existingIndex = comments.findIndex(c => c.id === comment.id);
    console.log('saveComment debug:', {
      inputCommentId: comment.id,
      existingIndex: existingIndex,
      commentsCount: comments.length,
      hasReplies: comment.replies && comment.replies.length > 0,
      repliesCount: comment.replies ? comment.replies.length : 0
    });
    if (existingIndex !== -1) {
      comments[existingIndex] = comment;
    } else {
      comment.id = 'cm' + Date.now();
      comments.unshift(comment);
    }
    localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify(comments));
    return comment;
  },

  deleteComment: function(id) {
    const comments = this.getComments().filter(c => c.id !== id);
    localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify(comments));
  },

  resetComments: function() {
    localStorage.setItem(this.KEYS.COMMENTS, JSON.stringify([
      { id: 'cm1', articleId: 'a1', author: '新手小白', content: '加油！一起努力！', createdAt: '2025-09-26 14:30', likes: 3, replies: [
        { id: 'cm1-1', author: 'Rvanhecy', content: '谢谢支持！一起加油！', createdAt: '2025-09-26 15:45', likes: 2 }
      ]},
      { id: 'cm2', articleId: 'a1', author: '老程序员', content: '很真实的经历，感同身受', createdAt: '2025-09-27 09:15', likes: 5, replies: [] },
      { id: 'cm3', articleId: 'a3', author: '前端学习者', content: '写得很清楚，收藏了！', createdAt: '2025-10-21 20:00', likes: 8, replies: [
        { id: 'cm3-1', author: 'Rvanhecy', content: '很高兴对你有帮助！', createdAt: '2025-10-21 21:30', likes: 4 },
        { id: 'cm3-2', author: '另一个学习者', content: '请问 useEffect 怎么用？', createdAt: '2025-10-22 10:00', likes: 1 }
      ]},
      { id: 'cm4', articleId: 'a4', author: '旅行爱好者', content: '羡慕这样的勇气', createdAt: '2025-10-29 16:20', likes: 12, replies: [] }
    ]));
  },

  // ============================================
  // 留言板管理（增删改查）
  // ============================================
  getMessages: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.MESSAGES) || '[]');
  },

  saveMessage: function(message) {
    const messages = this.getMessages();
    const existingIndex = messages.findIndex(m => m.id === message.id);
    if (existingIndex !== -1) {
      messages[existingIndex] = message;
    } else {
      message.id = 'm' + Date.now();
      messages.unshift(message);
    }
    localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
    return message;
  },

  deleteMessage: function(id) {
    const messages = this.getMessages().filter(m => m.id !== id);
    localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
  },

  // ============================================
  // 个人资料管理（头像、昵称、统计信息）
  // ============================================
  getProfile: function(username) {
    const profiles = JSON.parse(localStorage.getItem(this.KEYS.PROFILES) || '{}');
    return profiles[username] || {
      avatar: '',
      bio: '这家伙很懒，什么都没留下~',
      nickname: '',
      gender: '',
      birthday: '',
      hometown: '',
      stats: { articles: 0, tags: 0, categories: 0, likes: 0 }
    };
  },

  getProfiles: function() {
    return JSON.parse(localStorage.getItem(this.KEYS.PROFILES) || '{}');
  },

  saveProfile: function(username, profile) {
    const profiles = this.getProfiles();
    profiles[username] = profile;
    localStorage.setItem(this.KEYS.PROFILES, JSON.stringify(profiles));
  },

  // ============================================
  // 统计和辅助功能（标签云、文章归档）
  // ============================================
  getTagCloud: function() {
    const articles = this.getArticles();
    const tagCounts = {};
    articles.forEach(article => {
      article.tags.forEach(tagId => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });
    const tags = this.getTags();
    return tags.map(tag => ({
      ...tag,
      count: tagCounts[tag.id] || 0
    }));
  },

  getArticlesGroupedByDate: function() {
    const articles = this.getArticles().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const groups = {};
    articles.forEach(article => {
      const date = article.createdAt.substring(0, 7);
      if (!groups[date]) groups[date] = [];
      groups[date].push(article);
    });
    return groups;
  },

  getArticlesGroupedByDateByAuthor: function(author) {
    const articles = this.getArticlesByAuthor(author).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const groups = {};
    articles.forEach(article => {
      const date = article.createdAt.substring(0, 7);
      if (!groups[date]) groups[date] = [];
      groups[date].push(article);
    });
    return groups;
  },

  getCommentsOnArticlesByAuthor: function(author) {
    const profile = this.getProfile(author);
    const nickname = profile && profile.nickname ? profile.nickname : author;
    const userArticles = this.getArticles().filter(a => a.author === author || a.author === nickname);
    const articleIds = new Set(userArticles.map(a => a.id));
    return this.getComments().filter(c => articleIds.has(c.articleId));
  }
};

window.DB = DB;