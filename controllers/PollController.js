import Poll, { find } from '../models/poll';
import ApiError from '../utils/ApiError';

class PollController {

  // Create a new Poll
  async createPoll(req, res, next) {
    try {
      // req.userId comes from your AuthMiddleware
      const creatorId = req.userId;
      const { title, description, category, options } = req.body;

      // Basic Validation
      if (!title || !category || !options) {
        throw new ApiError(400, 'Please provide title, category, and options.');
      }

      if (!Array.isArray(options) || options.length < 2) {
        throw new ApiError(400, 'A poll must have at least 2 options.');
      }

      // Format options for schema
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

  // Get All Polls (Public Feed)
  async getAllPolls(req, res, next) {
    try {
      // Populate fetches the creator's email instead of just showing the ID
      const polls = await find({})
        .sort({ createdAt: -1 })
        .populate('creatorId', 'email'); 

      res.status(200).json(polls);
    } catch (error) {
      next(error);
    }
  }

  // Get Polls by Current User
  async getMyPolls(req, res, next) {
    try {
      const userId = req.userId;
      const polls = await find({ creatorId: userId }).sort({ createdAt: -1 });
      res.status(200).json(polls);
    } catch (error) {
      next(error);
    }
  }
}

export default new PollController();