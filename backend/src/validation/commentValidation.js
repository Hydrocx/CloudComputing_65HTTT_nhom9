import { z } from "zod";
import { escapeHtml } from "../utils/sanitize.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .trim()
  .regex(OBJECT_ID_REGEX, "Invalid ObjectId");

const optionalObjectIdSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      return trimmed;
    }
    return value;
  },
  objectIdSchema.nullable()
);

const contentSchema = z
  .string()
  .trim()
  .min(1, "Content is required")
  .max(2000, "Content is too long")
  .transform((value) => escapeHtml(value));

export const commentPayloadSchema = z
  .object({
    courseId: objectIdSchema,
    authorId: objectIdSchema,
    parentCommentId: optionalObjectIdSchema.optional(),
    content: contentSchema,
  })
  .strict();

export const validateCommentPayload = (payload) => commentPayloadSchema.parse(payload);
