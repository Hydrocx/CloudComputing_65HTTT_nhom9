import mongoose from "mongoose";

const toCourseId = (courseId) => {
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    return new mongoose.Types.ObjectId(courseId);
  }
  return courseId;
};

export const buildCourseRatingStatsPipeline = (courseId) => [
  {
    $match: {
      courseId: toCourseId(courseId),
    },
  },
  {
    $group: {
      _id: "$courseId",
      averageRating: { $avg: "$rating" },
      totalReviews: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      courseId: "$_id",
      averageRating: { $ifNull: ["$averageRating", 0] },
      totalReviews: 1,
    },
  },
];

export const getCourseRatingStats = async (ReviewModel, courseId) => {
  const pipeline = buildCourseRatingStatsPipeline(courseId);
  const [stats] = await ReviewModel.aggregate(pipeline);

  if (!stats) {
    return { courseId, averageRating: 0, totalReviews: 0 };
  }

  return stats;
};
