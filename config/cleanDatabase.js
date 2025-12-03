require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB');

    // Drop the users collection
    await mongoose.connection.db.dropCollection('users');
    console.log('✅ Users collection dropped successfully');

    console.log('\n Database cleaned! You can now start fresh with the new schema.');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);

  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('Collection does not exist or already deleted');
    } else {
      console.error('Error cleaning database:', error);
    }
    process.exit(1);
  }
}

cleanDatabase();