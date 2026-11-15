// ============================================
// 认证与密码哈希
// 哈希用 Web Crypto 的 PBKDF2-SHA256：Node 和 EdgeOne 边缘函数都能用，不引入第三方依赖，
// 也比纯 JS 实现的 bcrypt 更快，避免触碰边缘函数 200ms 的 CPU 上限。
// ============================================
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const encoder = new TextEncoder();

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, KEY_LENGTH);
}

// 返回格式：pbkdf2$迭代次数$盐$哈希
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(bits)}`;
}

export async function checkPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [scheme, iterations, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'pbkdf2' || !saltHex || !hashHex) return false;

  const bits = await derive(password, fromHex(saltHex), Number(iterations) || ITERATIONS);
  const actual = toHex(bits);
  if (actual.length !== hashHex.length) return false;

  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return diff === 0;
}

// 认证相关操作（依赖注入 db，本地和边缘函数共用）
export function createAuth(db) {
  // 生成登录凭证，有效期 30 天
  async function issueToken(username) {
    const token = crypto.randomUUID().replace(/-/g, '');
    await db.mutate((s) => {
      s.tokens = s.tokens.filter((t) => t.username !== username);
      s.tokens.push({ token, username, createdAt: Date.now() });
    });
    return token;
  }

  async function userFromRequest(c) {
    const header = c.req.header('Authorization') || '';
    const token = header.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    const tokens = await db.get('tokens');
    const record = tokens.find((t) => t.token === token);
    if (!record) return null;

    const maxAge = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - record.createdAt > maxAge) return null;

    return record.username;
  }

  async function revokeToken(token) {
    await db.mutate((s) => {
      s.tokens = s.tokens.filter((t) => t.token !== token);
    });
  }

  return { issueToken, userFromRequest, revokeToken };
}
