//This defines what data should look like for polls, sections, questions, choices, poll access and vote records.
const { Schema, model } = require('mongoose');
// Main Poll Schema
const PollSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the poll.'],
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 300,
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
  },
  shareLinkToken: {
    type: String,
    unique: true,
    sparse: true, // Only for public polls
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'expired'],
    default: 'active',
  },
  totalVotes: {
    type: Number,
    default: 0,
  }
});

// Section Schema 
const SectionSchema = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Question Schema
const QuestionSchema = new Schema({
  sectionId: {
    type: Schema.Types.ObjectId,
    ref: 'Section',
    required: true,
  },
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  questionText: {
    type: String,
    required: true,
    maxlength: 300,
  },
  questionType: {
    type: String,
    enum: ['single', 'multiple', 'rating', 'text'],
    default: 'single',
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  required: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Choice Schema
const ChoiceSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  choiceText: {
    type: String,
    required: true,
    maxlength: 200,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  votes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Poll Access Schema 
const PollAccessSchema = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  userEmail: {
    type: String,
    required: true,
  },
  accessGrantedAt: {
    type: Date,
    default: Date.now,
  }
});

// Vote Record Schema to prevent duplicate voting
const VoteRecordSchema = new Schema({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  choiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Choice',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for anonymous votes
  },
  deviceFingerprint: {
    type: String,
    default: null,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for performance
PollSchema.index({ creatorId: 1, createdAt: -1 });
PollSchema.index({ visibility: 1, status: 1 });
PollSchema.index({ shareLinkToken: 1 });

SectionSchema.index({ pollId: 1, order: 1 });
QuestionSchema.index({ sectionId: 1, order: 1 });
QuestionSchema.index({ pollId: 1 });
ChoiceSchema.index({ questionId: 1, order: 1 });
PollAccessSchema.index({ pollId: 1, userEmail: 1 });
VoteRecordSchema.index({ pollId: 1, userId: 1 });
VoteRecordSchema.index({ pollId: 1, deviceFingerprint: 1 });

module.exports = {
  Poll: model('Poll', PollSchema),
  Section: model('Section', SectionSchema),
  Question: model('Question', QuestionSchema),
  Choice: model('Choice', ChoiceSchema),
  PollAccess: model('PollAccess', PollAccessSchema),
  VoteRecord: model('VoteRecord', VoteRecordSchema),
};