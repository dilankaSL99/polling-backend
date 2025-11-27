const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-increment userId before saving
UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.userId) {
    try {
      const lastUser = await this.constructor.findOne({}, {}, { sort: { 'userId': -1 } });
      this.userId = lastUser ? lastUser.userId + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);