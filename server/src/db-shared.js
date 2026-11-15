// 数据结构定义（本地 JSON 存储和 D1 存储共用）
// 与前端 localStorage 中的集合一一对应
export const EMPTY = {
  users: [],       // { username, phone, passwordHash, createdAt }
  tokens: [],      // { token, username, createdAt }
  articles: [],    // { id, title, content, author, categoryId, tags, createdAt, likes, views, cover }
  comments: [],    // { id, articleId, author, content, createdAt, likes, replies }
  messages: [],    // { id, author, content, createdAt, likes, views, replies }
  tags: [],        // { id, name, color }
  categories: [],  // { id, name }
  profiles: {},    // { username: { nickname, avatar, bio, ... } }
  favorites: []    // { id, username, articleId, createdAt }
};
