import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc.js";
import { getPostById, getPosts } from "../../models/contentModel.js";

export const postsRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return getPosts();
  }),
  byId: publicProcedure
    .input(
      z.object({
        id: z.coerce.number().int().positive(),
      }),
    )
    .query(async ({ input }) => {
      return getPostById(input.id);
    }),
});
