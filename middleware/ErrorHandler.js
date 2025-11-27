const ApiError = require('../utils/ApiError');

class ErrorHandler {
  static handle(err, req, res, next) {
    // Log the endpoint that caused the error
    console.error(`Error on ${req.method} ${req.path}`);
    
    // Check if the error is a known ApiError
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    // Handle Mongoose validation errors more gracefully
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation Error',
        errors: messages 
      });
    }

    // Unexpected error
    console.error('UNEXPECTED SERVER ERROR:', err);
    return res.status(500).json({ message: 'Server error, please try again later.' });
  }
}

module.exports = ErrorHandler;