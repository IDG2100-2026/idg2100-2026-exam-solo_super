//404 error handling
const errorMiddleware = (err, req, res, next) => {
  if (!err) {
    return res.status(404).json({
      success: false,
      message: `Route not found: ${req.originalUrl}`
    });
  }
  console.error("Error:", err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
};

module.exports = errorMiddleware;