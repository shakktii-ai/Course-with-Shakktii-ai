import Bookmark from '../models/Bookmark.js';
import LearnerNote from '../models/LearnerNote.js';
import LessonProgress from '../models/LessonProgress.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

export class LearnerFeaturesService {
  // ==========================================
  // BOOKMARKS
  // ==========================================

  static async addBookmark(tenantId, userId, courseId, lessonId, title = '', note = '') {
    if (!courseId || !lessonId) {
      throw new BadRequestError('courseId and lessonId are required');
    }

    const lesson = await Lesson.findOne({ _id: lessonId, courseId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { tenantId, userId, lessonId },
      {
        courseId,
        title: title || lesson.title,
        note: note || '',
      },
      { upsert: true, new: true }
    );

    return bookmark;
  }

  static async removeBookmark(tenantId, userId, lessonId) {
    await Bookmark.deleteOne({ tenantId, userId, lessonId });
    return { success: true, message: 'Bookmark removed' };
  }

  static async getBookmarks(tenantId, userId) {
    return await Bookmark.find({ tenantId, userId })
      .populate('courseId', 'title slug thumbnail')
      .populate('lessonId', 'title slug type durationMinutes')
      .sort({ createdAt: -1 })
      .lean();
  }

  // ==========================================
  // LEARNER NOTES
  // ==========================================

  static async createNote(tenantId, userId, courseId, lessonId, content, videoTimestamp = 0) {
    if (!content || !content.trim()) {
      throw new BadRequestError('Note content is required');
    }

    return await LearnerNote.create({
      tenantId,
      userId,
      courseId,
      lessonId,
      content: content.trim(),
      videoTimestamp: Math.max(0, videoTimestamp),
    });
  }

  static async getNotes(tenantId, userId, courseId, lessonId = null) {
    const query = { tenantId, userId, courseId };
    if (lessonId) query.lessonId = lessonId;

    return await LearnerNote.find(query)
      .populate('lessonId', 'title slug')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async deleteNote(tenantId, userId, noteId) {
    const note = await LearnerNote.findOne({ _id: noteId, tenantId, userId });
    if (!note) {
      throw new NotFoundError('Note not found');
    }

    await LearnerNote.deleteOne({ _id: noteId, tenantId, userId });
    return { success: true, message: 'Note deleted' };
  }

  // ==========================================
  // LEARNING HISTORY
  // ==========================================

  static async getLearningHistory(tenantId, userId) {
    const history = await LessonProgress.find({ tenantId, userId })
      .populate('courseId', 'title slug thumbnail')
      .populate('lessonId', 'title slug type durationMinutes')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return history;
  }
}

