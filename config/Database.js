const mongoose = require('mongoose');

class Database {
  static async connect() {
    try {
      // Try to connect to the database using the URI from environment variables
      const dbURI = process.env.DB_URI;
      await mongoose.connect(dbURI);
      console.log('Successfully connected to MongoDB');
    } catch (err) {
      // Log any connection errors and exit the process
      console.error('Error connecting to MongoDB:', err);
      process.exit(1);
    }
  }
}

//Export the Database class for use in other parts of the application
module.exports = Database;