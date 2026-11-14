import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { get, mutate } from './db.js';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// 生成登录凭证，有效期 30 天
export function issueToken(username) {
  const token = crypto.randomUUID().replace(/-/g, '');
  mutate((s) => {
    s.tokens = s.tokens.filter((t) => t.username !== username);
    s.tokens.push({ token, username, createdAt: Date.now() });
  });
  return token;
}

export function userFromRequest(c) {
  const header = c.req.header('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const record = get('tokens').find((t) => t.token === token);
  if (!record) return null;

  const maxAge = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - record.createdAt > maxAge) return null;

  return record.username;
}

// 写操作必须带有效 token；返回 null 表示未登录（调用方直接返回 401）
export function requireUser(c) {
  return userFromRequest(c);
}

export function revokeToken(token) {
  mutate((s) => {
    s.tokens = s.tokens.filter((t) => t.token !== token);
  });
}
