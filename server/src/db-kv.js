import { EMPTY } from './db-shared.js';

// 整个数据库序列化成一个 JSON 存在单个 key 里（数据量很小，一次读写即可）
const STATE_KEY = 'state';

// EdgeOne Pages KV 存储实现
// 接口与 db.js / db-d1.js 保持一致：all / get / set / mutate
export function createKvDb(kv) {
  async function readAll() {
    const raw = await kv.get(STATE_KEY, { type: 'json' });
    const state = structuredClone(EMPTY);
    if (raw && typeof raw === 'object') {
      for (const key of Object.keys(EMPTY)) {
        if (raw[key] !== undefined) state[key] = raw[key];
      }
    }
    return state;
  }

  async function writeAll(state) {
    await kv.put(STATE_KEY, JSON.stringify(state));
  }

  return {
    async all() {
      return readAll();
    },
    async get(key) {
      return (await readAll())[key];
    },
    async set(key, value) {
      const state = await readAll();
      state[key] = value;
      await writeAll(state);
      return value;
    },
    // 读-改-写：小项目并发量低，直接整体回写
    async mutate(fn) {
      const state = await readAll();
      const result = fn(state);
      await writeAll(state);
      return result;
    }
  };
}
