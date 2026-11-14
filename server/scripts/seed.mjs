// 用前端 data.js 里的默认示例数据生成后端初始数据库
// 用法：npm run seed   （已存在 db.json 时不会覆盖，除非加 --force）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');
const FRONT_DATA_JS = path.join(__dirname, '..', '..', 'JS', 'data.js');

if (fs.existsSync(DATA_FILE) && !process.argv.includes('--force')) {
  console.log('data/db.json 已存在，跳过。需要重建请执行：npm run seed -- --force');
  process.exit(0);
}

const storage = new Map();
const localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};
const window = {};
const context = vm.createContext({ localStorage, window, console, Date, JSON, Math, setTimeout });

const source = fs.readFileSync(FRONT_DATA_JS, 'utf8');
vm.runInContext(source, context, { filename: 'data.js' });
vm.runInContext('DB.init()', context);

const DB = context.window.DB;
const read = (key, fallback) => JSON.parse(storage.get(key) || JSON.stringify(fallback));

const db = {
  users: [],
  tokens: [],
  articles: read(DB.KEYS.ARTICLES, []),
  comments: read(DB.KEYS.COMMENTS, []),
  messages: read(DB.KEYS.MESSAGES, []),
  tags: read(DB.KEYS.TAGS, []),
  categories: read(DB.KEYS.CATEGORIES, []),
  profiles: read(DB.KEYS.PROFILES, {}),
  favorites: read(DB.KEYS.FAVORITES, [])
};

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');

console.log('已生成 data/db.json：');
console.log(`  文章 ${db.articles.length} 篇，评论 ${db.comments.length} 条，留言 ${db.messages.length} 条，标签 ${db.tags.length} 个，分类 ${db.categories.length} 个`);
