const express = require('express');
const router = express.Router();
const PollController = require('../controllers/PollController');
const authenticateToken = require('../middleware/AuthMiddleware');

// Optional auth middleware (allows both authenticated and anonymous access)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        req.userId = decoded.userId;
      }
    });
  }
  next();
};

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Create a new poll with sections, questions, and choices
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - sections
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionText:
 *                             type: string
 *                           questionType:
 *                             type: string
 *                             enum: [single, multiple, rating, text]
 *                           required:
 *                             type: boolean
 *                           choices:
 *                             type: array
 *                             items:
 *                               type: string
 *               inviteUsers:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/', authenticateToken, PollController.createPoll);

/**
 * @swagger
 * /api/polls/public:
 *   get:
 *     summary: Get all public polls for dashboard
 *     tags: [Polls]
 */
router.get('/public', PollController.getAllPublicPolls);

/**
 * @swagger
 * /api/polls/my-polls:
 *   get:
 *     summary: Get polls created by the logged-in user
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 */
router.get('/my-polls', authenticateToken, PollController.getMyPolls);

/**
 * @swagger
 * /api/polls/invited:
 *   get:
 *     summary: Get private polls user is invited to
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 */
router.get('/invited', authenticateToken, PollController.getInvitedPolls);

/**
 * @swagger
 * /api/polls/{pollId}:
 *   get:
 *     summary: Get detailed poll structure with sections, questions, and choices
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:pollId', optionalAuth, PollController.getPollDetails);

/**
 * @swagger
 * /api/polls/{pollId}/vote:
 *   post:
 *     summary: Submit a vote for a poll
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               votes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     choiceIds:
 *                       type: array
 *                       items:
 *                         type: string
 *               deviceFingerprint:
 *                 type: string
 */
router.post('/:pollId/vote', optionalAuth, PollController.submitVote);

/**
 * @swagger
 * /api/polls/{pollId}/results:
 *   get:
 *     summary: Get poll results with vote counts and percentages
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:pollId/results', optionalAuth, PollController.getPollResults);

/**
 * @swagger
 * /api/polls/{pollId}:
 *   delete:
 *     summary: Delete a poll (creator only)
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:pollId', authenticateToken, PollController.deletePoll);

/**
 * @swagger
 * /api/polls/{pollId}/insights:
 *   get:
 *     summary: Get detailed analytics and insights for a poll (creator only)
 *     description: Returns comprehensive statistics including voter information, vote breakdown by section/question, and recent activity
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: The poll ID
 *     responses:
 *       200:
 *         description: Poll insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 poll:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     visibility:
 *                       type: string
 *                     status:
 *                       type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalVotes:
 *                       type: number
 *                     totalVoters:
 *                       type: number
 *                     registeredVoters:
 *                       type: number
 *                     anonymousVoters:
 *                       type: number
 *                 sections:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       totalVotes:
 *                         type: number
 *                       questions:
 *                         type: array
 *                 voters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       type:
 *                         type: string
 *                       votedAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Only the poll creator can view insights
 *       404:
 *         description: Poll not found
 */
router.get('/:pollId/insights', authenticateToken, PollController.getPollInsights);




module.exports = router;