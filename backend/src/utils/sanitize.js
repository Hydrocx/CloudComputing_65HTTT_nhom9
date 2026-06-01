const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

const ESCAPE_REGEX = /[&<>"'/]/g;

export const escapeHtml = (value) => value.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char]);
