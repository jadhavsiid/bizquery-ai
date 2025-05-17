// === middleware/errorBoundary.js ===
module.exports = (err, req, res, next) => {
  console.error("🧨 Uncaught error:", err.stack || err);
  res.status(500).json({
    success: false,
    error: "Something broke internally.",
    message: err.message || "Unknown error"
  });
};
