const crypto = require('crypto');
const { Poll, Section, Question, Choice, PollAccess, VoteRecord } = require('../models/poll');
const ApiError = require('../utils/ApiError');
const UserHelper = require('../utils/userHelper');

class PollController {

  // ========================================
  // CREATE POLL (Complex Structure)
  // ========================================
  async createPoll(req, res, next) {
    try {
      // Get the actual MongoDB _id from the numeric userId
      const creatorId = await UserHelper.getUserObjectId(req.userId);
      const { title, description, visibility, expiryDate, sections, inviteUsers } = req.body;

      // Validation
      if (!title || !sections || sections.length === 0) {
        throw new ApiError(400, 'Please provide title and at least one section.');
      }

      // Validate each section has questions
      for (let section of sections) {
        if (!section.questions || section.questions.length === 0) {
          throw new ApiError(400, `Section "${section.title}" must have at least one question.`);
        }
      }

      // If private poll, ensure inviteUsers is provided
      if (visibility === 'private' && (!inviteUsers || inviteUsers.length === 0)) {
        throw new ApiError(400, 'Private polls must have at least one invited user.');
      }

      // Create the main poll
      const newPoll = new Poll({
        title,
        description,
        visibility: visibility || 'public',
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        creatorId,
        shareLinkToken: visibility === 'public' ? crypto.randomBytes(16).toString('hex') : null,
      });

      await newPoll.save();

      // Create sections, questions, and choices
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const sectionData = sections[sectionIndex];
        
        const newSection = new Section({
          pollId: newPoll._id,
          title: sectionData.title,
          order: sectionIndex,
        });
        await newSection.save();

        // Create questions for this section
        for (let qIndex = 0; qIndex < sectionData.questions.length; qIndex++) {
          const qData = sectionData.questions[qIndex];
          
          const newQuestion = new Question({
            sectionId: newSection._id,
            pollId: newPoll._id,
            questionText: qData.questionText,
            questionType: qData.questionType || 'single',
            order: qIndex,
            required: qData.required || false,
          });
          await newQuestion.save();

          // Create choices for this question (if applicable)
          if (qData.choices && qData.choices.length > 0) {
            for (let cIndex = 0; cIndex < qData.choices.length; cIndex++) {
              const choiceText = qData.choices[cIndex];
              
              const newChoice = new Choice({
                questionId: newQuestion._id,
                choiceText,
                order: cIndex,
              });
              await newChoice.save();
            }
          }
        }
      }

      // If private poll, create access records
      if (visibility === 'private' && inviteUsers) {
        for (let email of inviteUsers) {
          const accessRecord = new PollAccess({
            pollId: newPoll._id,
            userEmail: email.toLowerCase(),
          });
          await accessRecord.save();
        }
      }

      // Generate share link
      const shareLink = visibility === 'public' 
        ? `${process.env.APP_URL || 'http://localhost:3000'}/poll/${newPoll.shareLinkToken}`
        : null;

      res.status(201).json({
        message: 'Poll created successfully!',
        pollId: newPoll._id,
        shareLink,
      });

    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // GET ALL PUBLIC POLLS (Dashboard)
  // ========================================
  async getAllPublicPolls(req, res, next) {
    try {
      const polls = await Poll.find({ 
        visibility: 'public',
        status: 'active'
      })
        .sort({ createdAt: -1 })
        .populate('creatorId', 'firstName lastName email')
        .select('title description createdAt totalVotes shareLinkToken')
        .limit(50);

      res.status(200).json({
        message: 'Public polls retrieved successfully',
        polls,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // GET MY CREATED POLLS
  // ========================================
  async getMyPolls(req, res, next) {
    try {
      // Get the actual MongoDB _id from the numeric userId
      const creatorId = await UserHelper.getUserObjectId(req.userId);
      
      const polls = await Poll.find({ creatorId })
        .sort({ createdAt: -1 })
        .select('title description visibility status createdAt totalVotes shareLinkToken');

      res.status(200).json({
        message: 'Your polls retrieved successfully',
        polls,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // GET POLLS I'M INVITED TO (Private)
  // ========================================
  async getInvitedPolls(req, res, next) {
    try {
      // Get full user document to access email
      const user = await UserHelper.getUserByUserId(req.userId);

      // Find all poll access records for this user's email
      const accessRecords = await PollAccess.find({ 
        userEmail: user.email.toLowerCase() 
      }).select('pollId');

      const pollIds = accessRecords.map(record => record.pollId);

      // Get the actual polls
      const polls = await Poll.find({ 
        _id: { $in: pollIds },
        status: 'active'
      })
        .sort({ createdAt: -1 })
        .populate('creatorId', 'firstName lastName email')
        .select('title description createdAt totalVotes');

      res.status(200).json({
        message: 'Invited polls retrieved successfully',
        polls,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // GET POLL DETAILS (with sections, questions, choices)
  // ========================================
  async getPollDetails(req, res, next) {
    try {
      const { pollId } = req.params;
      const userId = req.userId; // May be null for public polls

      // Get the poll
      const poll = await Poll.findById(pollId)
        .populate('creatorId', 'firstName lastName email');

      if (!poll) {
        throw new ApiError(404, 'Poll not found.');
      }

      // Check access for private polls
      if (poll.visibility === 'private') {
        if (!userId) {
          throw new ApiError(401, 'Authentication required for private polls.');
        }

        const user = await UserHelper.getUserByUserId(userId);
        
        const hasAccess = await PollAccess.findOne({
          pollId: poll._id,
          userEmail: user.email.toLowerCase(),
        });

        const isCreator = poll.creatorId._id.toString() === user._id.toString();

        if (!hasAccess && !isCreator) {
          throw new ApiError(403, 'You do not have access to this poll.');
        }
      }

      // Check if poll is expired
      if (poll.expiryDate && new Date() > poll.expiryDate) {
        poll.status = 'expired';
        await poll.save();
      }

      // Get sections
      const sections = await Section.find({ pollId: poll._id }).sort({ order: 1 });

      // Get questions for each section
      const sectionsWithQuestions = await Promise.all(
        sections.map(async (section) => {
          const questions = await Question.find({ sectionId: section._id }).sort({ order: 1 });
          
          // Get choices for each question
          const questionsWithChoices = await Promise.all(
            questions.map(async (question) => {
              const choices = await Choice.find({ questionId: question._id }).sort({ order: 1 });
              return {
                ...question.toObject(),
                choices,
              };
            })
          );

          return {
            ...section.toObject(),
            questions: questionsWithChoices,
          };
        })
      );

      res.status(200).json({
        message: 'Poll details retrieved successfully',
        poll: {
          ...poll.toObject(),
          sections: sectionsWithQuestions,
        },
      });

    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // SUBMIT VOTE
  // ========================================
  // ========================================
// SUBMIT VOTE (FIXED)
// ========================================
async submitVote(req, res, next) {
  try {
    const { pollId } = req.params;
    const { votes, deviceFingerprint } = req.body;
    const userId = req.userId; // May be null for anonymous votes (numeric userId)
    const ipAddress = req.ip;

    // votes format: [{ questionId, choiceIds: [] }, ...]
    if (!votes || votes.length === 0) {
      throw new ApiError(400, 'Please provide your votes.');
    }

    // Get the poll
    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new ApiError(404, 'Poll not found.');
    }

    if (poll.status !== 'active') {
      throw new ApiError(400, 'This poll is no longer accepting votes.');
    }

    // Convert numeric userId to ObjectId for database query
    let userObjectId = null;
    if (userId) {
      userObjectId = await UserHelper.getUserObjectId(userId);
    }

    // Check if user already voted (prevent duplicate voting)
    const existingVote = await VoteRecord.findOne({
      pollId,
      $or: [
        userObjectId ? { userId: userObjectId } : null, // Use ObjectId instead of numeric userId
        deviceFingerprint ? { deviceFingerprint: deviceFingerprint } : null,
        ipAddress ? { ipAddress: ipAddress } : null
      ].filter(Boolean) // Remove null values
    });

    if (existingVote) {
      throw new ApiError(400, 'You have already voted on this poll.');
    }

    // Process each vote
    for (let vote of votes) {
      const { questionId, choiceIds } = vote;

      // Validate question exists
      const question = await Question.findById(questionId);
      if (!question) {
        throw new ApiError(404, `Question not found: ${questionId}`);
      }

      // Update vote counts
      for (let choiceId of choiceIds) {
        await Choice.findByIdAndUpdate(choiceId, { $inc: { votes: 1 } });
        
        // Record the vote with ObjectId
        const voteRecord = new VoteRecord({
          pollId,
          questionId,
          choiceId,
          userId: userObjectId || null, // Use ObjectId
          deviceFingerprint: deviceFingerprint || null,
          ipAddress: ipAddress || null,
        });
        await voteRecord.save();
      }
    }

    // Update total votes count on poll
    await Poll.findByIdAndUpdate(pollId, { $inc: { totalVotes: 1 } });

    res.status(200).json({
      message: 'Your vote has been recorded successfully!',
    });

  } catch (error) {
    next(error);
  }
}

  // ========================================
  // GET POLL RESULTS
  // ========================================
  async getPollResults(req, res, next) {
    try {
      const { pollId } = req.params;

      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new ApiError(404, 'Poll not found.');
      }

      // Get sections with questions and choices (including vote counts)
      const sections = await Section.find({ pollId: poll._id }).sort({ order: 1 });

      const sectionsWithResults = await Promise.all(
        sections.map(async (section) => {
          const questions = await Question.find({ sectionId: section._id }).sort({ order: 1 });
          
          const questionsWithResults = await Promise.all(
            questions.map(async (question) => {
              const choices = await Choice.find({ questionId: question._id }).sort({ order: 1 });
              
              // Calculate percentages
              const totalVotes = choices.reduce((sum, choice) => sum + choice.votes, 0);
              const choicesWithPercentage = choices.map(choice => ({
                ...choice.toObject(),
                percentage: totalVotes > 0 ? ((choice.votes / totalVotes) * 100).toFixed(1) : 0,
              }));

              return {
                ...question.toObject(),
                choices: choicesWithPercentage,
                totalVotes,
              };
            })
          );

          return {
            ...section.toObject(),
            questions: questionsWithResults,
          };
        })
      );

      res.status(200).json({
        message: 'Poll results retrieved successfully',
        poll: {
          title: poll.title,
          description: poll.description,
          totalVotes: poll.totalVotes,
          sections: sectionsWithResults,
        },
      });

    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // DELETE POLL (Creator only)
  // ========================================
  async deletePoll(req, res, next) {
    try {
      const { pollId } = req.params;

      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new ApiError(404, 'Poll not found.');
      }

      // Check if user is the creator
      const user = await UserHelper.getUserByUserId(req.userId);
      
      if (poll.creatorId.toString() !== user._id.toString()) {
        throw new ApiError(403, 'Only the poll creator can delete this poll.');
      }

      // Delete all related data
      await Section.deleteMany({ pollId });
      await Question.deleteMany({ pollId });
      await Choice.deleteMany({ questionId: { $in: await Question.find({ pollId }).select('_id') } });
      await PollAccess.deleteMany({ pollId });
      await VoteRecord.deleteMany({ pollId });
      await Poll.findByIdAndDelete(pollId);

      res.status(200).json({
        message: 'Poll deleted successfully',
      });

    } catch (error) {
      next(error);
    }
  }

  // ========================================
// GET POLL INSIGHTS/ANALYTICS (Creator only)
// ========================================
async getPollInsights(req, res, next) {
  try {
    const { pollId } = req.params;

    // Get the poll
    const poll = await Poll.findById(pollId).populate('creatorId', 'firstName lastName email');
    
    if (!poll) {
      throw new ApiError(404, 'Poll not found.');
    }

    // Check if user is the creator
    const user = await UserHelper.getUserByUserId(req.userId);
    
    if (poll.creatorId._id.toString() !== user._id.toString()) {
      throw new ApiError(403, 'Only the poll creator can view insights.');
    }

    // Get all vote records for this poll
    const voteRecords = await VoteRecord.find({ pollId })
      .populate('userId', 'firstName lastName email userId')
      .populate('questionId', 'questionText')
      .populate('choiceId', 'choiceText')
      .sort({ votedAt: -1 });

    // Get sections with questions and choices
    const sections = await Section.find({ pollId: poll._id }).sort({ order: 1 });

    const sectionsWithStats = await Promise.all(
      sections.map(async (section) => {
        const questions = await Question.find({ sectionId: section._id }).sort({ order: 1 });
        
        const questionsWithStats = await Promise.all(
          questions.map(async (question) => {
            const choices = await Choice.find({ questionId: question._id }).sort({ order: 1 });
            
            // Calculate total votes for this question
            const totalQuestionVotes = choices.reduce((sum, choice) => sum + choice.votes, 0);
            
            // Get detailed vote breakdown
            const choicesWithStats = choices.map(choice => {
              const percentage = totalQuestionVotes > 0 
                ? ((choice.votes / totalQuestionVotes) * 100).toFixed(1) 
                : 0;
              
              return {
                _id: choice._id,
                choiceText: choice.choiceText,
                votes: choice.votes,
                percentage: parseFloat(percentage)
              };
            });

            return {
              _id: question._id,
              questionText: question.questionText,
              questionType: question.questionType,
              totalVotes: totalQuestionVotes,
              choices: choicesWithStats
            };
          })
        );

        // Calculate total votes for this section
        const sectionTotalVotes = questionsWithStats.reduce(
          (sum, q) => sum + q.totalVotes, 
          0
        );

        return {
          _id: section._id,
          title: section.title,
          totalVotes: sectionTotalVotes,
          questions: questionsWithStats
        };
      })
    );

    // Get unique voters with their vote details
    const voterMap = new Map();
    
    voteRecords.forEach(record => {
      let voterId;
      let voterInfo;

      if (record.userId) {
        // Registered user
        voterId = record.userId._id.toString();
        voterInfo = {
          userId: record.userId.userId,
          firstName: record.userId.firstName,
          lastName: record.userId.lastName,
          email: record.userId.email,
          type: 'registered',
          votedAt: record.votedAt
        };
      } else {
        // Anonymous voter - use deviceFingerprint or IP as identifier
        voterId = record.deviceFingerprint || record.ipAddress || 'unknown';
        voterInfo = {
          userId: null,
          firstName: 'Anonymous',
          lastName: 'User',
          email: null,
          type: 'anonymous',
          identifier: record.deviceFingerprint ? 'Device' : 'IP',
          identifierValue: record.deviceFingerprint || record.ipAddress,
          votedAt: record.votedAt
        };
      }

      if (!voterMap.has(voterId)) {
        voterMap.set(voterId, {
          ...voterInfo,
          votes: []
        });
      }

      // Add vote details
      voterMap.get(voterId).votes.push({
        questionText: record.questionId.questionText,
        choiceText: record.choiceId.choiceText,
        votedAt: record.votedAt
      });
    });

    const voters = Array.from(voterMap.values()).sort(
      (a, b) => new Date(b.votedAt) - new Date(a.votedAt)
    );

    // Calculate summary statistics
    const totalVoters = voters.length;
    const registeredVoters = voters.filter(v => v.type === 'registered').length;
    const anonymousVoters = voters.filter(v => v.type === 'anonymous').length;

    // Response
    res.status(200).json({
      message: 'Poll insights retrieved successfully',
      poll: {
        _id: poll._id,
        title: poll.title,
        description: poll.description,
        visibility: poll.visibility,
        status: poll.status,
        createdAt: poll.createdAt,
        expiryDate: poll.expiryDate,
        shareLink: poll.shareLinkToken 
          ? `${process.env.APP_URL || 'http://localhost:3000'}/poll/${poll.shareLinkToken}`
          : null
      },
      summary: {
        totalVotes: poll.totalVotes,
        totalVoters: totalVoters,
        registeredVoters: registeredVoters,
        anonymousVoters: anonymousVoters
      },
      sections: sectionsWithStats,
      voters: voters,
      recentActivity: voteRecords.slice(0, 10).map(record => ({
        voter: record.userId 
          ? `${record.userId.firstName} ${record.userId.lastName}` 
          : 'Anonymous User',
        question: record.questionId.questionText,
        choice: record.choiceId.choiceText,
        votedAt: record.votedAt
      }))
    });

  } catch (error) {
    next(error);
  }
} 


}



module.exports = new PollController();