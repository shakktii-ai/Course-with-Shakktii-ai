import mongoose from 'mongoose';
import { TUTOR_CONFUSION_SEVERITY } from '../constants/index.js';

const tutorConfusionTopicSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    queryCount: {
      type: Number,
      default: 1,
    },
    sampleQueries: {
      type: [String],
      default: [],
    },
    severity: {
      type: String,
      enum: Object.values(TUTOR_CONFUSION_SEVERITY),
      default: TUTOR_CONFUSION_SEVERITY.MEDIUM,
      index: true,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

tutorConfusionTopicSchema.index({ tenantId: 1, courseId: 1, topic: 1 });

const TutorConfusionTopic =
  mongoose.models.TutorConfusionTopic ||
  mongoose.model('TutorConfusionTopic', tutorConfusionTopicSchema);

export default TutorConfusionTopic;
export { TutorConfusionTopic };

