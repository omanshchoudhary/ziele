import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .optional();

const optionalUrlString = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => !value || /^https?:\/\//i.test(value),
    "Media URL must start with http:// or https://",
  )
  .optional();

export const postCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(50000),
  tags: z.array(z.string().trim().min(1).max(30)).max(8).optional(),
  mediaUrl: optionalUrlString,
  mediaType: optionalTrimmedString,
  mediaSource: optionalTrimmedString,
  coverUrl: optionalUrlString,
  language: z.string().trim().max(24).optional(),
  premium: z.boolean().optional(),
});

export const postUpdateSchema = postCreateSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required to update a post.",
  );

export const postCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const postReactionSchema = z.object({
  type: z.enum(["like", "dislike"]),
});

export const postMediaUrlSchema = z.object({
  mediaUrl: z.string().trim().min(1).max(2048),
  mediaType: z.string().trim().max(16).optional(),
});

export const aiTranslateSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  sourceLanguage: z.string().trim().max(24).optional(),
  targetLanguage: z.string().trim().min(2).max(24),
});

export const aiSummarizeSchema = z.object({
  title: z.string().trim().max(120).optional(),
  text: z.string().trim().min(1).max(15000),
  targetLanguage: z.string().trim().min(2).max(24),
});

export const aiFactCheckSchema = z.object({
  title: z.string().trim().max(120).optional(),
  text: z.string().trim().min(1).max(15000),
  tags: z.array(z.string().trim().max(30)).max(8).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  bio: z.string().trim().max(160).optional(),
  avatar: z.string().trim().max(2048).optional(),
  handle: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(
      /^@?[a-zA-Z0-9_]+$/,
      "Handle can only contain letters, numbers and underscores",
    )
    .optional(),
});

