const Poll = require('../models/poll');
const ApiError = require('../utils/ApiError');

class PollController {

  // Create a new Poll
  async createPoll(req, res, next) {
    try {
      const creatorId = req.userId;
      const { title, description, category, options } = req.body;

      if (!title || !category || !options) {
        throw new ApiError(400, 'Please provide title, category, and options.');
      }

      if (!Array.isArray(options) || options.length < 2) {
        throw new ApiError(400, 'A poll must have at least 2 options.');
      }

      const formattedOptions = options.map(opt => ({
        text: typeof opt === 'string' ? opt : opt.text,
        votes: 0
      }));

      const newPoll = new Poll({
        title,
        description,
        category,
        options: formattedOptions,
        creatorId
      });

      await newPoll.save();

      res.status(201).json({ 
        message: 'Poll created successfully!', 
        poll: newPoll 
      });

    } catch (error) {
      next(error);
    }
  }

  // Get All Polls
  async getAllPolls(req, res, next) {
    try {
      const polls = await Poll.find({})
        .sort({ createdAt: -1 })
        .populate('creatorId', 'email'); 

      res.status(200).json(polls);
    } catch (error) {
      next(error);
    }
  }

  // Get My Polls
  async getMyPolls(req, res, next) {
    try {
      const userId = req.userId;
      const polls = await Poll.find({ creatorId: userId }).sort({ createdAt: -1 });
      res.status(200).json(polls);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PollController();