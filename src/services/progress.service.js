import LessonProgress from '../models/LessonProgress.js';
import CourseProgress from '../models/CourseProgress.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { PROGRESS_STATUS, ENROLLMENT_STATUS } from '../constants/index.js';

export class ProgressService extends BaseService {
  constructor() {
    super(CourseProgress);
  }

  /**
   * Mark a lesson as complete or toggle completion
   */
  static async markLessonComplete(tenantId, userId, courseId, lessonId, timeSpentSeconds = 0) {
    if (!courseId || !lessonId) {
      throw new BadRequestError('courseId and lessonId are required');
    }

    const lesson = await Lesson.findOne({ _id: lessonId, courseId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found in this course');
    }

    // Upsert LessonProgress
    const lessonProgress = await LessonProgress.findOneAndUpdate(
      { tenantId, userId, lessonId },
      {
        courseId,
        isCompleted: true,
        status: PROGRESS_STATUS.COMPLETED,
        completedAt: new Date(),
        $inc: { timeSpentSeconds: Math.max(0, timeSpentSeconds) },
      },
      { upsert: true, new: true }
    );

    // Recalculate CourseProgress
    const [totalLessons, completedLessonsCount] = await Promise.all([
      Lesson.countDocuments({ courseId, tenantId }),
      LessonProgress.countDocuments({ courseId, userId, tenantId, isCompleted: true }),
    ]);

    const percentComplete = totalLessons > 0
      ? Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100))
      : 0;

    const isCourseFinished = percentComplete === 100;
    const progressStatus = isCourseFinished
      ? PROGRESS_STATUS.COMPLETED
      : PROGRESS_STATUS.IN_PROGRESS;

    const courseProgress = await CourseProgress.findOneAndUpdate(
      { tenantId, userId, courseId },
      {
        totalLessons,
        completedLessons: completedLessonsCount,
        percentComplete,
        status: progressStatus,
        lastAccessedLessonId: lessonId,
        lastAccessedAt: new Date(),
        ...(isCourseFinished ? { completedAt: new Date() } : {}),
        $inc: { totalTimeSpentSeconds: Math.max(0, timeSpentSeconds) },
      },
      { upsert: true, new: true }
    );

    // Update Enrollment
    await Enrollment.updateOne(
      { tenantId, userId, courseId },
      {
        lastAccessedLessonId: lessonId,
        lastAccessedAt: new Date(),
        ...(isCourseFinished ? { status: ENROLLMENT_STATUS.COMPLETED, completedAt: new Date() } : {}),
      }
    );

    return {
      success: true,
      lessonProgress,
      courseProgress,
      isCourseFinished,
      percentComplete,
    };
  }

  /**
   * Update video playback position for resume playback
   */
  static async updatePlaybackPosition(tenantId, userId, courseId, lessonId, positionSeconds, timeSpentSeconds = 0) {
    await LessonProgress.findOneAndUpdate(
      { tenantId, userId, lessonId },
      {
        courseId,
        videoPlaybackPosition: Math.max(0, positionSeconds),
        status: PROGRESS_STATUS.IN_PROGRESS,
        $inc: { timeSpentSeconds: Math.max(0, timeSpentSeconds) },
      },
      { upsert: true }
    );

    await CourseProgress.findOneAndUpdate(
      { tenantId, userId, courseId },
      {
        lastAccessedLessonId: lessonId,
        lastAccessedAt: new Date(),
        status: PROGRESS_STATUS.IN_PROGRESS,
        $inc: { totalTimeSpentSeconds: Math.max(0, timeSpentSeconds) },
      },
      { upsert: true }
    );

    await Enrollment.updateOne(
      { tenantId, userId, courseId },
      {
        lastAccessedLessonId: lessonId,
        lastAccessedAt: new Date(),
      }
    );

    return { success: true };
  }

  /**
   * Get learner's full progress for a course
   */
  static async getCourseProgress(tenantId, userId, courseId) {
    const [progress, completedProgresses] = await Promise.all([
      CourseProgress.findOne({ tenantId, userId, courseId }).lean(),
      LessonProgress.find({ tenantId, userId, courseId, isCompleted: true }).select('lessonId').lean(),
    ]);

    const completedLessonIds = completedProgresses.map((p) => String(p.lessonId));

    return {
      progress: progress || {
        totalLessons: 0,
        completedLessons: 0,
        percentComplete: 0,
        status: PROGRESS_STATUS.NOT_STARTED,
        lastAccessedLessonId: null,
      },
      completedLessonIds,
    };
  }

  /**
   * Get summary progress metrics for learner dashboard
   */
  static async getLearnerDashboardSummary(tenantId, userId) {
    const enrollments = await Enrollment.find({ tenantId, userId })
      .populate('courseId', 'title slug thumbnail durationHours difficulty')
      .lean();

    const courseIds = enrollments.map((e) => e.courseId?._id).filter(Boolean);

    const progresses = await CourseProgress.find({
      tenantId,
      userId,
      courseId: { $in: courseIds },
    }).lean();

    const progressMap = {};
    for (const p of progresses) {
      progressMap[String(p.courseId)] = p;
    }

    const enrichedCourses = enrollments.map((e) => {
      const p = progressMap[String(e.courseId?._id)] || {};
      return {
        enrollmentId: e._id,
        course: e.courseId,
        percentComplete: p.percentComplete || 0,
        completedLessons: p.completedLessons || 0,
        totalLessons: p.totalLessons || 0,
        status: e.status,
        lastAccessedLessonId: p.lastAccessedLessonId || null,
        lastAccessedAt: e.lastAccessedAt,
      };
    });

    const activeCount = enrollments.filter((e) => e.status === ENROLLMENT_STATUS.ACTIVE).length;
    const completedCount = enrollments.filter((e) => e.status === ENROLLMENT_STATUS.COMPLETED).length;

    return {
      totalEnrolled: enrollments.length,
      activeCount,
      completedCount,
      courses: enrichedCourses,
    };
  }
}

