import { createTRPCRouter } from "../trpc.js";
import { authRouter } from "./authRouter.js";
import { healthRouter } from "./healthRouter.js";
import { postsRouter } from "./postsRouter.js";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  health: healthRouter,
  posts: postsRouter,
});
