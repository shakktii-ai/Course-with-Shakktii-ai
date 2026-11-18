import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
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
    title: {
      type: String,
      default: '',
      trim: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

bookmarkSchema.index({ tenantId: 1, userId: 1, lessonId: 1 }, { unique: true });
bookmarkSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;

