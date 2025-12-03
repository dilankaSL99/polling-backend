//This defines what user data should look like for users.
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Auto-incrementing numeric ID
  userId: {
    type: Number,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  //Password is not required for google/facebook OAuth users
  password: {
    type: String,
    required: function() { return !this.googleId && !this.facebookId; }
  },
  googleId: {
    type: String,
    sparse: true,
  },
  facebookId: {
    type: String,
    sparse: true,
  },
  profilePicture: {
    type: String, // Base64 encoded image string
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-increment userId before saving
//Runs before saving a user
UserSchema.pre('save', async function(next) {
  //Checks if the user is new and userId is not set.
  if (this.isNew && !this.userId) {
    try {
      //Finds the last user 
      const lastUser = await this.constructor.findOne({}, {}, { sort: { 'userId': -1 } });
      this.userId = lastUser ? lastUser.userId + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

//Export the User model
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);