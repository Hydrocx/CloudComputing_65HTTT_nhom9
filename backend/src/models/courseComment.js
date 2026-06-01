import mongoose from "mongoose";
import { escapeHtml } from "../utils/sanitize.js";

const { Schema } = mongoose;

const CourseCommentSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "CourseComment",
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CourseCommentSchema.pre("validate", function preValidate(next) {
  if (typeof this.content === "string") {
    this.content = escapeHtml(this.content.trim());
  }
  next();
});

CourseCommentSchema.index({ courseId: 1, parentCommentId: 1, createdAt: -1 });
CourseCommentSchema.index({ courseId: 1, authorId: 1, createdAt: -1 });

export default mongoose.model("CourseComment", CourseCommentSchema);
