const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ message: 'Validation Error', errors: messages });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: `Resource not found with id: ${err.value}` });
  if (err.code === 11000) return res.status(400).json({ message: 'Duplicate field value entered' });
  res.status(err.statusCode || 500).json({
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;