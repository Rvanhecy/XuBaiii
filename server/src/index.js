import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app.js';
import { createJsonDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

const app = createApp(createJsonDb());

// 静态文件：直接用后端服务器跑整个前端，本地联调不用处理跨域
app.get('/', (c) => c.redirect('/HTML/index.html'));
app.use('/*', serveStatic({ root: PROJECT_ROOT }));

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`叙白屋后端已启动: http://localhost:${info.port}/HTML/index.html`);
  console.log(`局域网访问（手机同 WiFi）: http://<你的电脑IP>:${info.port}/HTML/index.html`);
});
