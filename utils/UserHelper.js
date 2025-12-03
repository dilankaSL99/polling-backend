//A helper class for swich between ID formats for users.

const User = require('../models/User');
const ApiError = require('./ApiError');

class UserHelper {
  /**
   * Get MongoDB ObjectId from numeric userId
   * @param {Number} userId - The numeric userId from JWT
   * @returns {Promise<ObjectId>} - MongoDB ObjectId
   */
  static async getUserObjectId(userId) {
    if (!userId) {
      throw new ApiError(401, 'User ID not found in token.');
    }

    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    return user._id;
  }

  /**
   * Get full user document from numeric userId
   * @param {Number} userId - The numeric userId from JWT
   * @returns {Promise<Object>} - Full user document
   */
  static async getUserByUserId(userId) {
    if (!userId) {
      throw new ApiError(401, 'User ID not found in token.');
    }

    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    return user;
  }
}

module.exports = UserHelper;