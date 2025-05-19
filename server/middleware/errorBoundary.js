// middleware/errorBoundary.js
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  
  // Default error message
  const message = err.message || "Something went wrong!";
  const status = err.statusCode || 500;
  
  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};