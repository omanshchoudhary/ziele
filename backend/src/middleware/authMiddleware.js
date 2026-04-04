import { clerkMiddleware, getAuth } from "@clerk/express";

/**
 * Global Clerk middleware.
 * Mount once at app-level so auth state is available on every request.
 */
export const clerkAuthMiddleware = clerkMiddleware();

/**
 * Optional auth parser.
 * Never blocks requests; just normalizes auth context onto req.authContext.
 */
export function optionalAuth(req, _res, next) {
  try {
    const auth = getAuth(req);

    req.authContext = {
      isAuthenticated: Boolean(auth?.userId),
      userId: auth?.userId || null,
      sessionId: auth?.sessionId || null,
      orgId: auth?.orgId || null,
      actor: auth?.actor || null,
      raw: auth || null,
    };
  } catch {
    req.authContext = {
      isAuthenticated: false,
      userId: null,
      sessionId: null,
      orgId: null,
      actor: null,
      raw: null,
    };
  }

  next();
}

/**
 * API-friendly auth guard.
 * Returns JSON 401 instead of redirecting to sign-in.
 */
export function requireClerkAuthApi(req, res, next) {
  try {
    const auth = getAuth(req);

    if (!auth?.userId) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized",
        code: "AUTH_REQUIRED",
      });
    }

    req.authContext = {
      isAuthenticated: true,
      userId: auth.userId,
      sessionId: auth.sessionId || null,
      orgId: auth.orgId || null,
      actor: auth.actor || null,
      raw: auth,
    };

    return next();
  } catch {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
      code: "AUTH_INVALID",
    });
  }
}

/**
 * Backward-compatible alias used by existing routes.
 * Keeps route code unchanged while using API-friendly semantics.
 */
export const requireAuthWithContext = requireClerkAuthApi;

/**
 * Convenience guard for endpoints that explicitly require userId.
 * Usually redundant when used after requireClerkAuthApi, but safe to keep.
 */
export function requireUserId(req, res, next) {
  const userId = req?.authContext?.userId || null;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized: missing user identity",
      code: "USER_ID_REQUIRED",
    });
  }

  return next();
}
