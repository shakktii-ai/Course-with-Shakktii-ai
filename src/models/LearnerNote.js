import mongoose from 'mongoose';

const learnerNoteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    videoTimestamp: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

learnerNoteSchema.index({ tenantId: 1, userId: 1, lessonId: 1 });
learnerNoteSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

const LearnerNote = mongoose.models.LearnerNote || mongoose.model('LearnerNote', learnerNoteSchema);

export default LearnerNote;

