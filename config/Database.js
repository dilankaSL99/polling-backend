const mongoose = require('mongoose');

class Database {
  static async connect() {
    try {
      const dbURI = process.env.DB_URI;
      await mongoose.connect(dbURI);
      console.log('Successfully connected to MongoDB');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      process.exit(1);
    }
  }
}

module.exports = Database;