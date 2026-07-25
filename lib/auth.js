import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb, COLLECTIONS } from './db';

const SECRET = process.env.SESSION_SECRET || 'dev-secret';
const COOKIE_NAME = 'lh_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(payloadStr) {
  return crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
}

export function createToken(payload) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE };
  const payloadStr = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = sign(payloadStr);
  return `${payloadStr}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadStr, sig] = token.split('.');
  const expected = sign(payloadStr);
  if (expected !== sig) return null;
  try {
    const body = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user) {
  const token = createToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionFromRequest(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

export async function hashPassword(pwd) {
  return bcrypt.hash(pwd, 10);
}

export async function comparePassword(pwd, hash) {
  return bcrypt.compare(pwd, hash);
}

export const ROLES = { ADMIN: 'ADMIN', MEMBER: 'MEMBER' };

export async function ensureSeed() {
  const db = await getDb();
  const users = db.collection(COLLECTIONS.USERS);
  const existing = await users.findOne({ email: 'admin@demo.com' });
  if (!existing) {
    const { v4: uuidv4 } = await import('uuid');
    await users.insertOne({
      id: uuidv4(),
      email: 'admin@demo.com',
      name: 'Demo Admin',
      passwordHash: await hashPassword('admin123'),
      role: ROLES.ADMIN,
      createdAt: new Date(),
    });
  }
  const member = await users.findOne({ email: 'member@demo.com' });
  if (!member) {
    const { v4: uuidv4 } = await import('uuid');
    await users.insertOne({
      id: uuidv4(),
      email: 'member@demo.com',
      name: 'Demo Member',
      passwordHash: await hashPassword('member123'),
      role: ROLES.MEMBER,
      createdAt: new Date(),
    });
  }
}
