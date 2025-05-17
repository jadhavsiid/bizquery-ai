// === middleware/sanitize.js ===
function sanitizeQuestion(question) {
  if (typeof question !== "string") return "";
  question = question.trim();
  if (question.length > 300) return "";

  // Remove potentially unsafe characters
  const unsafeChars = /[`"'\\;]/g;
  return question.replace(unsafeChars, "");
}

module.exports = sanitizeQuestion;
