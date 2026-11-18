import mongoose from 'mongoose';
import { TUTOR_FEEDBACK_RATING } from '../constants/index.js';

const tutorFeedbackSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorConversation',
      required: true,
      index: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TutorMessage',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: String,
      enum: Object.values(TUTOR_FEEDBACK_RATING),
      required: true,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

tutorFeedbackSchema.index({ tenantId: 1, messageId: 1, userId: 1 }, { unique: true });

const TutorFeedback =
  mongoose.models.TutorFeedback ||
  mongoose.model('TutorFeedback', tutorFeedbackSchema);

export default TutorFeedback;
export { TutorFeedback };

