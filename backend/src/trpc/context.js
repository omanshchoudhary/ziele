import { getAuth } from "@clerk/express";

export function createTrpcContext({ req, res }) {
  const auth = getAuth(req);

  return {
    req,
    res,
    authContext: {
      isAuthenticated: Boolean(auth?.userId),
      userId: auth?.userId || null,
      sessionId: auth?.sessionId || null,
      orgId: auth?.orgId || null,
    },
  };
}
