import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// 数据结构（与前端 localStorage 中的集合一一对应）
const EMPTY = {
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

let state = null;

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    state = structuredClone(EMPTY);
    persist();
    return;
  }
  state = { ...structuredClone(EMPTY), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
}

function ensure() {
  if (!state) load();
  return state;
}

// 原子写入：先写临时文件再重命名，避免进程中断把 db.json 写坏
function persist() {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

export function all() {
  return ensure();
}

export function get(key) {
  return ensure()[key];
}

export function set(key, value) {
  ensure()[key] = value;
  persist();
  return value;
}

// 一次修改多个集合，只落盘一次
export function mutate(fn) {
  const result = fn(ensure());
  persist();
  return result;
}
