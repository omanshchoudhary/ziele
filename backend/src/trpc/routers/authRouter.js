import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import { getProfileForClerkUser } from "../../models/clerkSyncModel.js";

export const authRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return getProfileForClerkUser(ctx.authContext.userId);
  }),
});
