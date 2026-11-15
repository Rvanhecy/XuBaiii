// EdgeOne Pages 边缘函数入口
// 路由 /edge-functions/api/[[default]].js 会接住所有 /api/* 请求，交给共用的 Hono 应用处理
// 存储使用 EdgeOne KV（在 Pages 项目中把命名空间绑定的变量名设为 DB）
import { createApp } from '../../server/src/app.js';
import { createKvDb } from '../../server/src/db-kv.js';

let app = null;

function resolveKv(env) {
  if (env && env.DB) return env.DB;
  // 平台也可能把绑定的命名空间直接注入为同名全局变量
  return typeof DB !== 'undefined' ? DB : null;
}

function getApp(env) {
  if (!app) {
    const kv = resolveKv(env);
    if (!kv) throw new Error('KV 未绑定：请在 Pages 项目里绑定命名空间，变量名填 DB');
    app = createApp(createKvDb(kv));
  }
  return app;
}

async function onRequest(context) {
  const { request, env, waitUntil } = context;
  return getApp(env).fetch(request, env, waitUntil ? { waitUntil } : {});
}

export { onRequest };
export default onRequest;
