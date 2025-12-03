//A custom error class that extends the built-in JavaScript Error class.
class ApiError extends Error {
  // Constructor to initialize the error with a status code and message
  constructor(statusCode, message) {
    // Call the parent error class with the message
    super(message);
    // Set the status code property
    this.statusCode = statusCode;
  }
}

//Export to make the ApiError class available for import in other files
module.exports = ApiError;