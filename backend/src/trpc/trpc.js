import { initTRPC, TRPCError } from "@trpc/server";

const t = initTRPC.context().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedures reuse the Clerk-authenticated request that Express already prepared.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.authContext?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Clerk authentication is required for this procedure.",
    });
  }

  return next();
});
