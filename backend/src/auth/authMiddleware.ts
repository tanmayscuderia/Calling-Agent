import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthContext } from './types';

/**
 * Lightweight Supabase client (anon key) for JWT verification only.
 * We use getUser() which validates the JWT against Supabase's GoTrue server.
 */
let _authClient: ReturnType<typeof createClient> | null = null;
function getAuthClient() {
  if (_authClient) return _authClient;
  _authClient = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _authClient;
}

// ---- In-memory LRU cache for resolved auth contexts (5 min TTL) ----
interface CacheEntry {
  ctx: AuthContext;
  expires: number;
}
const ctxCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(userId: string): AuthContext | null {
  const entry = ctxCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    ctxCache.delete(userId);
    return null;
  }
  return entry.ctx;
}

function setCached(userId: string, ctx: AuthContext) {
  ctxCache.set(userId, { ctx, expires: Date.now() + CACHE_TTL });
  // Prevent unbounded growth
  if (ctxCache.size > 500) {
    const oldest = [...ctxCache.entries()].sort((a, b) => a[1].expires - b[1].expires)[0];
    if (oldest) ctxCache.delete(oldest[0]);
  }
}

/**
 * Resolve AuthContext from a Supabase JWT.
 * Returns null if no token / invalid token (prototype fallback mode).
 */
export async function resolveAuthContext(req: FastifyRequest): Promise<AuthContext | null> {
  // Check Authorization header first (API clients)
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  // Fall back to httpOnly cookie (browser sessions)
  if (!token) {
    token = (req as any).cookies?.['sb-access-token'];
  }

  if (!token || token.length < 10) return null;

  try {
    // Verify JWT with Supabase
    const { data, error } = await getAuthClient().auth.getUser(token);
    if (error || !data.user) return null;

    const userId = data.user.id;

    // Check cache
    const cached = getCached(userId);
    if (cached) return cached;

    // Resolve org + member from DB
    const sb = (await import('../db/supabase')).supabaseAdmin();

    // Get member + org in parallel
    const [memberRes, orgRes] = await Promise.all([
      sb.from('organization_members')
        .select('id, org_id, role, full_name, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
      sb.from('organizations')
        .select('id, industry, owner_user_id')
        .eq('owner_user_id', userId)
        .limit(1)
        .maybeSingle(),
    ]);

    let orgId: string | null = null;
    let memberId: string | null = null;
    let role = 'member';
    let fullName: string | null = null;

    if (memberRes.data) {
      orgId = memberRes.data.org_id;
      memberId = memberRes.data.id;
      role = memberRes.data.role || 'member';
      fullName = memberRes.data.full_name;
    } else if (orgRes.data) {
      // User is org owner but not in organization_members
      orgId = orgRes.data.id;
      role = 'owner';
    } else {
      return null; // User exists but has no org
    }

    // Type narrowing: at this point orgId is guaranteed non-null (we returned above if null)
    if (!orgId) return null;

    // Get org industry (fast: already fetched if owner, otherwise quick query)
    let industry = 'real_estate';
    if (orgRes.data?.id === orgId) {
      industry = (orgRes.data as any).industry || 'real_estate';
    } else {
      const { data: orgData } = await sb.from('organizations')
        .select('industry')
        .eq('id', orgId)
        .maybeSingle();
      industry = orgData?.industry || 'real_estate';
    }

    const ctx: AuthContext = {
      userId,
      orgId,
      memberId,
      role,
      fullName,
      permissions: {},
      industry,
    };

    setCached(userId, ctx);
    return ctx;
  } catch (err) {
    logger.debug({ err }, 'JWT verification failed');
    return null;
  }
}

/**
 * Fastify preHandler hook for protected routes.
 * Attaches req.authContext. Falls back to prototype mode if no JWT.
 */
export async function authMiddleware(req: FastifyRequest, _reply: FastifyReply) {
  const ctx = await resolveAuthContext(req);
  (req as any).authContext = ctx;

  // Attach helper to get orgId (JWT-based or fallback to config default)
  (req as any).getOrgId = () => ctx?.orgId ?? config.defaultOrgId;
  (req as any).getMemberId = () => ctx?.memberId ?? config.defaultMemberId;
}

/**
 * Get org ID from request — JWT auth context or query param fallback.
 * This is the backward-compatible bridge: existing prototype routes use query param,
 * new auth-aware routes use JWT.
 */
export function getOrgIdFromRequest(req: FastifyRequest): string {
  const ctx = (req as any).authContext as AuthContext | undefined;
  if (ctx?.orgId) return ctx.orgId;
  // Fallback: query param or default
  return (req.query as any)?.orgId || config.defaultOrgId;
}

export function getMemberIdFromRequest(req: FastifyRequest): string | null {
  const ctx = (req as any).authContext as AuthContext | undefined;
  if (ctx?.memberId) return ctx.memberId;
  return (req.query as any)?.memberId || config.defaultMemberId || null;
}
