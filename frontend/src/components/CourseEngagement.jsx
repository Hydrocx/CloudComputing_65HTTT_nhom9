import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import useCourseComments from "../hooks/useCourseComments.js";
import useCourseReviews from "../hooks/useCourseReviews.js";
import RoleBadge from "./RoleBadge.jsx";
import StarRating from "./StarRating.jsx";

const formatTimestamp = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "-";

const buildCommentTree = (comments) => {
  const map = new Map();
  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  const roots = [];
  map.forEach((comment) => {
    if (comment.parentCommentId && map.has(comment.parentCommentId)) {
      map.get(comment.parentCommentId).replies.push(comment);
    } else {
      roots.push(comment);
    }
  });

  const sortByDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
  const sortTree = (nodes) => {
    nodes.sort(sortByDate);
    nodes.forEach((node) => sortTree(node.replies));
  };

  sortTree(roots);
  return roots;
};

const CourseEngagement = ({ courseId }) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewReady, setReviewReady] = useState(false);

  const {
    comments,
    isLoading: isLoadingComments,
    isMutating: isMutatingComments,
    createComment,
  } = useCourseComments(courseId, { enabled: isOpen });

  const {
    stats,
    reviews,
    isLoading: isLoadingReviews,
    isMutating: isMutatingReviews,
    submitReview,
  } = useCourseReviews(courseId, { enabled: isOpen });

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  useEffect(() => {
    if (!isOpen) return;
    setDraft("");
    setActiveReplyId(null);
    setReplyDraft("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || reviewReady || !currentUser) return;
    const existing = reviews.find((review) => review.author?.email === currentUser.email);
    if (existing) {
      setRating(existing.rating);
      setReviewDraft(existing.content || "");
    }
    setReviewReady(true);
  }, [currentUser, isOpen, reviewReady, reviews]);

  const handleSubmitComment = async (content, parentCommentId = null) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await createComment({ content: trimmed, parentCommentId });
    setDraft("");
    setReplyDraft("");
    setActiveReplyId(null);
  };

  const handleSubmitReview = async () => {
    if (!rating) return;
    await submitReview({ rating, content: reviewDraft.trim() || undefined });
  };

  const renderComments = (items, depth = 0) =>
    items.map((comment) => {
      const author = comment.author;
      const isReplying = activeReplyId === comment.id;

      return (
        <div
          key={comment.id}
          style={{ marginLeft: depth ? depth * 16 : 0 }}
          className="rounded-2xl border border-white/5 bg-slate-950/40 p-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-100">
              {author?.name || "Nguoi dung"}
            </span>
            {author?.role ? <RoleBadge role={author.role} /> : null}
            <span>{formatTimestamp(comment.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-200">{comment.content}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <button
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-slate-300 hover:bg-white/5"
              onClick={() => {
                if (isReplying) {
                  setActiveReplyId(null);
                  setReplyDraft("");
                  return;
                }
                setActiveReplyId(comment.id);
                setReplyDraft("");
              }}
            >
              Tra loi
            </button>
            {isReplying ? (
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-slate-400 hover:bg-white/5"
                onClick={() => {
                  setActiveReplyId(null);
                  setReplyDraft("");
                }}
              >
                Huy
              </button>
            ) : null}
          </div>

          {isReplying ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder="Tra loi binh luan..."
                className="h-20 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  onClick={() => handleSubmitComment(replyDraft, comment.id)}
                  disabled={isMutatingComments}
                >
                  Gui phan hoi
                </button>
              </div>
            </div>
          ) : null}

          {comment.replies?.length ? (
            <div className="mt-3 space-y-3">
              {renderComments(comment.replies, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });

  return (
    <div className="mt-4">
      <button
        type="button"
        className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "An thao luan & danh gia" : "Mo thao luan & danh gia"}
      </button>

      {isOpen ? (
        <div className="mt-4 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Danh gia khoa hoc</h4>
                <p className="text-xs text-slate-400">
                  Diem trung binh va nhan xet tu hoc vien.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StarRating
                  value={Math.round(stats.averageRating || 0)}
                  readOnly
                  size={18}
                />
                <div className="text-sm text-slate-200">
                  {(stats.averageRating || 0).toFixed(1)} / 5
                  <span className="ml-2 text-xs text-slate-500">
                    ({stats.totalReviews || 0} danh gia)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Danh gia cua ban</p>
                <StarRating value={rating} onChange={setRating} size={22} />
              </div>
              <div className="space-y-2">
                <textarea
                  value={reviewDraft}
                  onChange={(event) => setReviewDraft(event.target.value)}
                  placeholder="Chia se cam nhan ve khoa hoc..."
                  className="h-24 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    onClick={handleSubmitReview}
                    disabled={isMutatingReviews || !rating}
                  >
                    {isMutatingReviews ? "Dang gui" : "Gui danh gia"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400">Danh gia moi nhat</p>
              {isLoadingReviews ? (
                <p className="mt-2 text-xs text-slate-500">Dang tai...</p>
              ) : reviews.length ? (
                <div className="mt-3 space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-white/5 bg-slate-950/50 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-100">
                          {review.author?.name || "Nguoi dung"}
                        </span>
                        {review.author?.role ? (
                          <RoleBadge role={review.author.role} />
                        ) : null}
                        <span>{formatTimestamp(review.updatedAt || review.createdAt)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-200">
                        <StarRating value={review.rating} readOnly size={16} />
                        <span>{review.rating} / 5</span>
                      </div>
                      {review.content ? (
                        <p className="mt-2 text-sm text-slate-200">
                          {review.content}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Chua co danh gia.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Thao luan</h4>
                <p className="text-xs text-slate-400">Dat cau hoi va tra loi.</p>
              </div>
              <span className="text-xs text-slate-500">
                {comments.length} binh luan
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Nhap binh luan moi..."
                className="h-24 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  onClick={() => handleSubmitComment(draft)}
                  disabled={isMutatingComments}
                >
                  {isMutatingComments ? "Dang gui" : "Gui binh luan"}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingComments ? (
                <p className="text-xs text-slate-500">Dang tai...</p>
              ) : commentTree.length ? (
                renderComments(commentTree)
              ) : (
                <p className="text-xs text-slate-500">Chua co binh luan.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CourseEngagement;
