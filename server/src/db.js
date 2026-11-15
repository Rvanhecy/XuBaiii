import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EMPTY } from './db-shared.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// 本地 JSON 文件存储（异步接口，与 D1 实现保持一致）
export function createJsonDb() {
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

  return {
    async all() {
      return ensure();
    },
    async get(key) {
      return ensure()[key];
    },
    async set(key, value) {
      ensure()[key] = value;
      persist();
      return value;
    },
    // 一次修改多个集合，只落盘一次
    async mutate(fn) {
      const result = fn(ensure());
      persist();
      return result;
    }
  };
}
