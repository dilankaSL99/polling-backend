import { Schema, model } from 'mongoose';

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
  category: {
    type: String,
    required: true,
  },
  // Array of option objects
  options: [
    {
      text: { type: String, required: true },
      votes: { type: Number, default: 0 }, 
    }
  ],
  // Link to the User who created it
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isPublic: {
    type: Boolean,
    default: true,
  }
});

export default model('Poll', PollSchema);