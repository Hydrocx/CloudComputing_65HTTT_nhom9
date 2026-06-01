import { useState } from "react";

const StarIcon = ({ filled, size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2.5l2.9 5.87 6.48.94-4.69 4.57 1.11 6.46L12 17.77l-5.8 3.05 1.11-6.46-4.69-4.57 6.48-.94L12 2.5z" />
  </svg>
);

const StarRating = ({
  value,
  defaultValue = 0,
  max = 5,
  size = 20,
  readOnly = false,
  onChange,
  className = "",
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [hoverValue, setHoverValue] = useState(null);

  const currentValue = value ?? internalValue;
  const displayValue = hoverValue ?? currentValue;

  const handleSelect = (rating) => {
    if (readOnly) return;
    if (value === undefined) setInternalValue(rating);
    onChange?.(rating);
  };

  const handleHover = (rating) => {
    if (readOnly) return;
    setHoverValue(rating);
  };

  const handleLeave = () => {
    if (readOnly) return;
    setHoverValue(null);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={handleLeave}
    >
      {Array.from({ length: max }, (_, index) => {
        const ratingValue = index + 1;
        const isFilled = ratingValue <= displayValue;

        return (
          <button
            key={ratingValue}
            type="button"
            role="radio"
            aria-checked={ratingValue === currentValue}
            aria-label={`${ratingValue} star`}
            onClick={() => handleSelect(ratingValue)}
            onMouseEnter={() => handleHover(ratingValue)}
            onFocus={() => handleHover(ratingValue)}
            onBlur={handleLeave}
            disabled={readOnly}
            className={`rounded-full p-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
              isFilled ? "text-amber-400" : "text-slate-600"
            } ${readOnly ? "cursor-default" : "cursor-pointer hover:text-amber-300"}`}
          >
            <StarIcon filled={isFilled} size={size} />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
