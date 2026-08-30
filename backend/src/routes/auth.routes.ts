import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';
import { resolveAuthContext } from '../auth/authMiddleware';
import { loginSchema, parseBody } from '../validation/schemas';

/**
 * Cookie names — short, opaque, not guessable.
 * sb-access-token / sb-refresh-token follow Supabase naming conventions.
 */
const ACCESS_COOKIE = 'sb-access-token';
const REFRESH_COOKIE = 'sb-refresh-token';

/**
 * Cookie options.
 * httpOnly  = JavaScript CANNOT read it (XSS-proof)
 * secure    = only over HTTPS (auto-disabled in dev via NODE_ENV check)
 * sameSite  = 'lax' prevents CSRF while allowing top-level navigations
 * path=/   = available across the entire app
 */
function cookieOptions(maxAgeSeconds: number) {
  const isProd = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

// Supabase client with anon key — for signIn and refresh
function getAuthClient() {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function authRoutes(app: FastifyInstance) {
  // ─── LOGIN ────────────────────────────────────────────────
  app.post('/api/auth/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = parseBody(loginSchema, req.body);
    if (!parsed.ok) return reply.code(400).send({ error: parsed.error, code: 'VALIDATION' });
    const { email, password } = parsed.data;

    try {
      const client = getAuthClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.session) {
        logger.warn({ email, error: error?.message }, 'Login failed');
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      const { access_token, refresh_token, expires_in } = data.session;

      // Set httpOnly cookies — client never sees the token in JS
      reply.setCookie(ACCESS_COOKIE, access_token, cookieOptions(expires_in ?? 3600));
      reply.setCookie(REFRESH_COOKIE, refresh_token, cookieOptions(7 * 24 * 3600)); // 7 days

      // Resolve full auth context (org, member, role) for the response
      const ctx = await resolveAuthContext(req);

      logger.info({ email, userId: data.user?.id }, 'Login successful');

      return {
        ok: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          fullName: ctx?.fullName,
        },
        orgId: ctx?.orgId,
        role: ctx?.role,
        memberId: ctx?.memberId,
      };
    } catch (err: any) {
      logger.error({ err }, 'Login error');
      return reply.code(500).send({ error: 'Login failed. Please try again.' });
    }
  });

  // ─── ME — Get current user from cookie ────────────────────
  app.get('/api/auth/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const ctx = (req as any).authContext;

    if (!ctx) {
      const token = req.cookies?.[ACCESS_COOKIE];
      if (token) {
        // Cookie exists but context wasn't resolved — try refresh
        return reply.code(401).send({ error: 'Token expired', needsRefresh: true });
      }
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    // Fetch user email from Supabase
    const token = req.cookies?.[ACCESS_COOKIE];
    let email: string | undefined;
    if (token) {
      const client = getAuthClient();
      const { data } = await client.auth.getUser(token);
      email = data.user?.email;
    }

    return {
      ok: true,
      user: {
        id: ctx.userId,
        email,
        fullName: ctx.fullName,
      },
      orgId: ctx.orgId,
      role: ctx.role,
      memberId: ctx.memberId,
      industry: ctx.industry,
    };
  });

  // ─── REFRESH — Exchange refresh token for new access token ─
  app.post('/api/auth/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (!refreshToken) {
      return reply.code(401).send({ error: 'No refresh token' });
    }

    try {
      const client = getAuthClient();
      const { data, error } = await client.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        // Clear stale cookies
        reply.clearCookie(ACCESS_COOKIE, { path: '/' });
        reply.clearCookie(REFRESH_COOKIE, { path: '/' });
        return reply.code(401).send({ error: 'Session expired. Please login again.' });
      }

      const { access_token, refresh_token: new_refresh, expires_in } = data.session;

      reply.setCookie(ACCESS_COOKIE, access_token, cookieOptions(expires_in ?? 3600));
      reply.setCookie(REFRESH_COOKIE, new_refresh, cookieOptions(7 * 24 * 3600));

      return { ok: true };
    } catch (err: any) {
      logger.error({ err }, 'Token refresh failed');
      return reply.code(401).send({ error: 'Refresh failed' });
    }
  });

  // ─── LOGOUT ───────────────────────────────────────────────
  app.post('/api/auth/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies?.[ACCESS_COOKIE];

    // Try to revoke the session server-side (non-blocking, non-fatal)
    if (token) {
      try {
        const client = createClient(config.supabase.url, config.supabase.anonKey, {
          auth: { persistSession: false },
        });
        client.auth.setSession({ access_token: token, refresh_token: '' });
        await client.auth.signOut();
      } catch {
        // Non-fatal — cookie clearing is the real logout
      }
    }

    reply.clearCookie(ACCESS_COOKIE, { path: '/' });
    reply.clearCookie(REFRESH_COOKIE, { path: '/' });

    logger.info('User logged out');
    return { ok: true };
  });
}