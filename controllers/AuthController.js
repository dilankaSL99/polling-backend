const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const User = require('../models/User'); 
const ApiError = require('../utils/ApiError'); 

const createToken = (userId) => {
  const payload = { userId };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

class AuthController {
  
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      if (!firstName || !lastName || !email || !password) {
        throw new ApiError(400, 'Please provide first name, last name, email and password.');
      }
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'Email already in use.');
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newUser = new User({ 
        firstName,
        lastName,
        email, 
        password: hashedPassword 
      });
      await newUser.save();

      res.status(201).json({ 
        message: 'User registered successfully!',
        userId: newUser.userId 
      });

    } catch (error) {
      next(error); 
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new ApiError(400, 'Please provide both email and password.');
      }
      
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(400, 'Invalid credentials.');
      }
      
      // If user exists but has no password (e.g. created via Google), block login
      if (!user.password) {
        throw new ApiError(400, 'User registered via social media. Please login with Google/Facebook.');
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new ApiError(400, 'Invalid credentials.');
      }
      
      const token = createToken(user.userId);
      res.status(200).json({ 
        message: 'Login successful!', 
        token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });

    } catch (error) {
      next(error); 
    }
  }

  // --- GOOGLE AUTH ---
  async authGoogle(req, res, next) {
    try {
      const { idToken } = req.body;
      
      // 1. Verify the token with Google
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      // 2. Extract user info from Google
      const email = payload['email'];
      const googleId = payload['sub'];
      const firstName = payload['given_name'] || '';
      const lastName = payload['family_name'] || '';
      
      // 3. Find existing user by googleId or email
      let user = await User.findOne({ 
        $or: [{ googleId }, { email }] 
      });
      
      if (user) {
        // Update existing user with Google ID if not set
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      } else {
        // Create new user
        user = new User({
          firstName,
          lastName,
          email,
          googleId
        });
        await user.save();
      }
      
      // 4. Generate JWT for our app
      const token = createToken(user.userId);
      res.status(200).json({ 
        message: 'Google login successful!', 
        token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });

    } catch (error) {
      next(error); 
    }
  }

  async authFacebook(req, res, next) {
    try {
      const { accessToken } = req.body;
      
      if (!accessToken) {
        throw new ApiError(400, 'Access token is required.');
      }
      
      // 1. Verify token with Facebook and get user info
      const fbResponse = await axios.get(
        `https://graph.facebook.com/me?fields=id,first_name,last_name,email&access_token=${accessToken}`
      );
      
      const { id: facebookId, first_name, last_name, email } = fbResponse.data;
      
      if (!email) {
        throw new ApiError(400, 'Email not provided by Facebook. Please grant email permission.');
      }
      
      // 2. Find existing user by facebookId or email
      let user = await User.findOne({ 
        $or: [{ facebookId }, { email }] 
      });
      
      if (user) {
        // Update existing user with Facebook ID if not set
        if (!user.facebookId) {
          user.facebookId = facebookId;
          await user.save();
        }
      } else {
        // Create new user
        user = new User({
          firstName: first_name || '',
          lastName: last_name || '',
          email,
          facebookId
        });
        await user.save();
      }
      
      // 3. Generate JWT for our app
      const token = createToken(user.userId);
      res.status(200).json({ 
        message: 'Facebook login successful!', 
        token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });

    } catch (error) {
      if (error.response) {
        next(new ApiError(400, 'Invalid Facebook access token.'));
      } else {
        next(error);
      }
    }
  }

  async getProfile(req, res, next) {
    try {
      // Make sure userId exists
      if (!req.userId) {
        throw new ApiError(401, 'User ID not found in token.');
      }

      const user = await User.findOne({ userId: req.userId });

      if (!user) {
        throw new ApiError(404, 'User not found.');
      }

      res.status(200).json({ 
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();