/**
 * Auth context resolved from Supabase JWT on every authenticated request.
 * Attached to FastifyRequest as req.authContext
 */
export interface AuthContext {
  userId: string;
  orgId: string;
  memberId: string | null;
  role: string;        // 'owner' | 'admin' | 'member' | 'guest'
  fullName: string | null;
  permissions: Record<string, any>;
  industry: string;    // org's industry template
}

/**
 * Request with auth context attached.
 * Usage: const req2 = req as AuthedRequest;
 */
export interface AuthedRequest {
  authContext: AuthContext;
}

/** Check if the user has admin-level access (sees all data in the org) */
export function isAdmin(ctx: AuthContext | undefined | null): boolean {
  if (!ctx) return false;
  return ctx.role === 'owner' || ctx.role === 'admin';
}

/** Check if user can access a specific member's data */
export function canAccessMember(ctx: AuthContext, targetMemberId: string | null): boolean {
  if (isAdmin(ctx)) return true;
  if (!targetMemberId) return true; // unassigned
  return ctx.memberId === targetMemberId;
}