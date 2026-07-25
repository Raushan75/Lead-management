import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LeadService, leadCreateSchema } from '@/lib/services/leadService';
import { getDb, COLLECTIONS } from '@/lib/db';
import {
  comparePassword,
  setSessionCookie,
  clearSessionCookie,
  getSessionFromRequest,
  ensureSeed,
  ROLES,
} from '@/lib/auth';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

async function requireAuth(request) {
  const s = await getSessionFromRequest(request);
  if (!s) return { error: err('Unauthorized', 401) };
  return { session: s };
}
function requireRole(session, roles) {
  if (!roles.includes(session.role)) return err('Forbidden', 403);
  return null;
}

// Ensure seed on module load (best-effort)
let seeded = false;
async function seedOnce() {
  if (seeded) return;
  try { await ensureSeed(); seeded = true; } catch (e) { console.error('seed err', e); }
}

async function route(request, method) {
  await seedOnce();
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [r0, r1, r2] = parts;

  try {
    // ---------- Health ----------
    if (parts.length === 0 && method === 'GET') {
      return json({ ok: true, service: 'LeadHub API' });
    }

    // ---------- Auth ----------
    if (r0 === 'auth') {
      if (r1 === 'login' && method === 'POST') {
        const body = await request.json();
        const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
        const { email, password } = schema.parse(body);
        const db = await getDb();
        const user = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase() });
        if (!user) return err('Invalid credentials', 401);
        const ok = await comparePassword(password, user.passwordHash);
        if (!ok) return err('Invalid credentials', 401);
        await setSessionCookie({ id: user.id, email: user.email, role: user.role, name: user.name });
        return json({ user: { id: user.id, email: user.email, role: user.role, name: user.name } });
      }
      if (r1 === 'logout' && method === 'POST') {
        await clearSessionCookie();
        return json({ ok: true });
      }
      if (r1 === 'me' && method === 'GET') {
        const s = await getSessionFromRequest(request);
        if (!s) return json({ user: null });
        return json({ user: { id: s.id, email: s.email, role: s.role, name: s.name } });
      }
    }

    // ---------- Public Leads ----------
    if (r0 === 'leads' && !r1 && method === 'POST') {
      const body = await request.json();
      const parsed = leadCreateSchema.parse(body);
      const lead = await LeadService.createFromPublic(parsed);
      return json({ lead }, 201);
    }

    // ---------- Protected Leads ----------
    if (r0 === 'leads' && !r1 && method === 'GET') {
      const auth = await requireAuth(request);
      if (auth.error) return auth.error;
      const status = url.searchParams.get('status') || undefined;
      const search = url.searchParams.get('search') || undefined;
      const sort = url.searchParams.get('sort') || '-createdAt';
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '200', 10);
      const result = await LeadService.list({ status, search, sort, page, limit });
      return json(result);
    }

    if (r0 === 'leads' && r1 && !r2 && method === 'PATCH') {
      const auth = await requireAuth(request);
      if (auth.error) return auth.error;
      const body = await request.json();
      if (!body.status) return err('status is required');
      const lead = await LeadService.updateStatus(r1, body.status);
      if (!lead) return err('Lead not found', 404);
      return json({ lead });
    }

    // ---------- Stats ----------
    if (r0 === 'stats' && method === 'GET') {
      const auth = await requireAuth(request);
      if (auth.error) return auth.error;
      const stats = await LeadService.stats();
      return json(stats);
    }

    return err('Not Found', 404);
  } catch (e) {
    if (e?.issues) {
      return err('Validation failed', 422, { issues: e.issues });
    }
    console.error('API error', e);
    return err(e?.message || 'Internal Server Error', 500);
  }
}

export async function GET(request)    { return route(request, 'GET'); }
export async function POST(request)   { return route(request, 'POST'); }
export async function PATCH(request)  { return route(request, 'PATCH'); }
export async function PUT(request)    { return route(request, 'PUT'); }
export async function DELETE(request) { return route(request, 'DELETE'); }
