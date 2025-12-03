const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authenticateToken = require('../middleware/AuthMiddleware.js');

// Public Routes
/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account using name, email, and password.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       '201':
 *         description: User registered successfully!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully!
 *       '400':
 *         description: Bad request (e.g., email in use, missing fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticates user credentials and returns a token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       '400':
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Log in with Google
 *     description: Authenticates a user via Google OAuth and returns a token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: ya29.a0AfH6SMA...
 *     responses:
 *       '200':
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       '400':
 *         description: Invalid Google token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/google', AuthController.authGoogle);

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Log in with Facebook
 *     description: Authenticates a user via Facebook OAuth and returns a token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 example: EAAGm0PX4ZCpsBAKZ...
 *     responses:
 *       '200':
 *         description: Facebook login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       '400':
 *         description: Invalid Facebook token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/auth/facebook', AuthController.authFacebook);


//  Protected Routes
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get the logged-in user's profile
 *     description: Returns the profile details of the currently authenticated user.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []  # This indicates the endpoint is protected
 *     responses:
 *       '200':
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       '401':
 *         description: Unauthorized (no token provided)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @swagger
 * /api/profile/update:
 *   put:
 *     summary: Update user profile (first name, last name)
 *     description: Updates the logged-in user's profile information
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Profile updated successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 */
router.put('/profile/update', authenticateToken, AuthController.updateProfile);

/**
 * @swagger
 * /api/profile/picture:
 *   put:
 *     summary: Upload or update profile picture
 *     description: Uploads a base64 encoded profile picture
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 description: Base64 encoded image string
 *     responses:
 *       '200':
 *         description: Profile picture uploaded successfully
 *       '400':
 *         description: Invalid image format
 *       '401':
 *         description: Unauthorized
 */
router.put('/profile/picture', authenticateToken, AuthController.uploadProfilePicture);

/**
 * @swagger
 * /api/profile/picture:
 *   delete:
 *     summary: Delete profile picture
 *     description: Removes the user's profile picture
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Profile picture deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: User not found
 */
router.delete('/profile/picture', authenticateToken, AuthController.deleteProfilePicture);

module.exports = router;