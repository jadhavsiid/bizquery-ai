function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: message || "Something went wrong"
  });
}

module.exports = sendError;
