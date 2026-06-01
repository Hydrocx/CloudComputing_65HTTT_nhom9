import { z } from "zod";
import { escapeHtml } from "../utils/sanitize.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string()
  .trim()
  .regex(OBJECT_ID_REGEX, "Invalid ObjectId");

const ratingSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? Number(trimmed) : value;
    }
    return value;
  },
  z.number().int().min(1, "Rating is required").max(5, "Rating is too high")
);

const optionalContentSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    }
    return value;
  },
  z
    .string()
    .max(2000, "Content is too long")
    .transform((val) => escapeHtml(val))
    .optional()
);

export const reviewPayloadSchema = z
  .object({
    courseId: objectIdSchema,
    authorId: objectIdSchema,
    rating: ratingSchema,
    content: optionalContentSchema,
  })
  .strict();

export const validateReviewPayload = (payload) => reviewPayloadSchema.parse(payload);
