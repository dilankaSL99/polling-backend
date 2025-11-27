const express = require('express');
const router = express.Router();
const PollController = require('../controllers/PollController');
const authenticateToken = require('../middleware/AuthMiddleware');

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 */
router.post('/', authenticateToken, PollController.createPoll);

/**
 * @swagger
 * /api/polls:
 *   get:
 *     summary: Get all public polls
 *     tags: [Polls]
 */
router.get('/', PollController.getAllPolls);

/**
 * @swagger
 * /api/polls/me:
 *   get:
 *     summary: Get polls created by the logged-in user
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 */
router.get('/me', authenticateToken, PollController.getMyPolls);

module.exports = router;