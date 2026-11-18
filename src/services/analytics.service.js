import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import CourseProgress from '../models/CourseProgress.js';
import LessonProgress from '../models/LessonProgress.js';
import Assessment from '../models/Assessment.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Certificate from '../models/Certificate.js';
import Department from '../models/Department.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import { BaseService } from './base.service.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { ENROLLMENT_STATUS, PROGRESS_STATUS } from '../constants/index.js';

export class AnalyticsService extends BaseService {
  constructor() {
    super(CourseProgress);
  }

  /**
   * Module 08.2: Organization Executive KPI Overview
   */
  static async getOrganizationOverview(tenantId) {
    if (!tenantId) throw new BadRequestError('Tenant ID is required');

    const [
      totalLearners,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertificates,
      attemptsAgg,
      timeAgg,
      popularCoursesAgg,
    ] = await Promise.all([
      OrganizationMembership.countDocuments({
        tenantId,
        $or: [{ roles: 'STUDENT' }, { role: 'STUDENT' }],
      }),
      Course.countDocuments({ tenantId }),
      Enrollment.countDocuments({ tenantId }),
      Enrollment.countDocuments({ tenantId, status: ENROLLMENT_STATUS.COMPLETED }),
      Certificate.countDocuments({ tenantId, status: 'ISSUED' }),
      AssessmentAttempt.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$scorePercentage' },
            totalAttempts: { $sum: 1 },
          },
        },
      ]),
      LessonProgress.aggregate([
        { $match: { tenantId } },
        { $group: { _id: null, totalSeconds: { $sum: '$timeSpentSeconds' } } },
      ]),
      Enrollment.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: '$course' },
        {
          $project: {
            courseId: '$_id',
            title: '$course.title',
            slug: '$course.slug',
            enrollmentsCount: '$count',
          },
        },
      ]),
    ]);

    const completionRate =
      totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
    const avgAssessmentScore = Math.round(attemptsAgg[0]?.avgScore || 0);
    const totalStudyHours = Math.round((timeAgg[0]?.totalSeconds || 0) / 3600);

    return {
      totalLearners,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      totalCertificates,
      avgAssessmentScore,
      totalStudyHours,
      popularCourses: popularCoursesAgg,
    };
  }

  /**
   * Module 08.2: Department Performance Comparison
   */
  static async getDepartmentAnalytics(tenantId) {
    const departments = await Department.find({ tenantId }).lean();
    if (departments.length === 0) return [];

    const results = await Promise.all(
      departments.map(async (dept) => {
        const members = await OrganizationMembership.find({
          tenantId,
          departmentId: dept._id,
        }).lean();

        const userIds = members.map((m) => m.userId);

        const [enrollmentCount, completedCount, attemptsAgg] = await Promise.all([
          Enrollment.countDocuments({ tenantId, userId: { $in: userIds } }),
          Enrollment.countDocuments({
            tenantId,
            userId: { $in: userIds },
            status: ENROLLMENT_STATUS.COMPLETED,
          }),
          AssessmentAttempt.aggregate([
            { $match: { tenantId, userId: { $in: userIds } } },
            { $group: { _id: null, avgScore: { $avg: '$scorePercentage' } } },
          ]),
        ]);

        const completionRate =
          enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0;
        const avgScore = Math.round(attemptsAgg[0]?.avgScore || 0);

        return {
          departmentId: dept._id,
          name: dept.name,
          code: dept.code,
          memberCount: userIds.length,
          enrollmentsCount: enrollmentCount,
          completionsCount: completedCount,
          completionRate,
          avgAssessmentScore: avgScore,
        };
      })
    );

    return results;
  }

  /**
   * Module 08.2: Learner Engagement Trends (Daily completion velocity)
   */
  static async getLearnerEngagementTrends(tenantId, days = 14) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [enrollmentsByDate, completionsByDate] = await Promise.all([
      Enrollment.aggregate([
        { $match: { tenantId, createdAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      LessonProgress.aggregate([
        { $match: { tenantId, isCompleted: true, completedAt: { $gte: sinceDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      daysRange: days,
      enrollmentsTrend: enrollmentsByDate.map((item) => ({ date: item._id, count: item.count })),
      completionsTrend: completionsByDate.map((item) => ({ date: item._id, count: item.count })),
    };
  }

  /**
   * Module 08.2: At-Risk Learner Detection (Dropout & Failure Prediction)
   */
  static async getAtRiskLearners(tenantId, thresholdDays = 14) {
    const inactivityThreshold = new Date();
    inactivityThreshold.setDate(inactivityThreshold.getDate() - thresholdDays);

    // Active enrollments that have not completed
    const activeEnrollments = await Enrollment.find({
      tenantId,
      status: ENROLLMENT_STATUS.ACTIVE,
    })
      .populate('userId', 'name email lastLoginAt')
      .populate('courseId', 'title')
      .lean();

    const atRiskList = [];

    for (const enrollment of activeEnrollments) {
      if (!enrollment.userId) continue;

      const [courseProgress, recentAttempts] = await Promise.all([
        CourseProgress.findOne({
          tenantId,
          userId: enrollment.userId._id,
          courseId: enrollment.courseId?._id,
        }).lean(),
        AssessmentAttempt.find({
          tenantId,
          userId: enrollment.userId._id,
        })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),
      ]);

      const percent = courseProgress?.percentComplete || 0;
      const lastActivity = courseProgress?.lastAccessedAt || enrollment.createdAt;
      const isInactive = new Date(lastActivity) < inactivityThreshold;

      // Check if learner has failed consecutive attempts
      const hasLowScores =
        recentAttempts.length > 0 &&
        recentAttempts.every((att) => (att.scorePercentage || 0) < 50);

      if (isInactive || (hasLowScores && percent < 80)) {
        let riskReason = 'Extended inactivity';
        if (isInactive && hasLowScores) riskReason = 'Inactivity & low assessment scores';
        else if (hasLowScores) riskReason = 'Failing recent assessment attempts';

        atRiskList.push({
          userId: enrollment.userId._id,
          name: enrollment.userId.name,
          email: enrollment.userId.email,
          courseTitle: enrollment.courseId?.title || 'Course',
          percentComplete: percent,
          lastActiveAt: lastActivity,
          riskFactor: hasLowScores ? 'HIGH' : 'MEDIUM',
          riskReason,
        });
      }
    }

    return atRiskList;
  }

  /**
   * Module 08.3: Course Funnel & Drop-off Analysis
   */
  static async getCourseAnalytics(tenantId, courseId) {
    const course = await Course.findOne({ _id: courseId, tenantId }).lean();
    if (!course) throw new NotFoundError('Course not found');

    const [
      totalEnrolled,
      completedCount,
      lessons,
      attemptsAgg,
      lessonProgressAgg,
    ] = await Promise.all([
      Enrollment.countDocuments({ tenantId, courseId }),
      Enrollment.countDocuments({ tenantId, courseId, status: ENROLLMENT_STATUS.COMPLETED }),
      Lesson.find({ tenantId, courseId }).sort({ order: 1 }).lean(),
      AssessmentAttempt.aggregate([
        { $match: { tenantId, courseId } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$scorePercentage' },
            passCount: { $sum: { $cond: ['$passed', 1, 0] } },
            totalCount: { $sum: 1 },
          },
        },
      ]),
      LessonProgress.aggregate([
        { $match: { tenantId, courseId, isCompleted: true } },
        { $group: { _id: '$lessonId', completions: { $sum: 1 } } },
      ]),
    ]);

    const completionMap = new Map(lessonProgressAgg.map((lp) => [String(lp._id), lp.completions]));

    // Build lesson progression funnel
    const lessonFunnel = lessons.map((l) => {
      const completedStudents = completionMap.get(String(l._id)) || 0;
      const dropoffRate =
        totalEnrolled > 0
          ? Math.max(0, Math.round(((totalEnrolled - completedStudents) / totalEnrolled) * 100))
          : 0;

      return {
        lessonId: l._id,
        title: l.title,
        order: l.order,
        completedStudents,
        dropoffRate,
      };
    });

    const completionRate =
      totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0;
    const avgScore = Math.round(attemptsAgg[0]?.avgScore || 0);
    const passRate =
      attemptsAgg[0]?.totalCount > 0
        ? Math.round((attemptsAgg[0].passCount / attemptsAgg[0].totalCount) * 100)
        : 100;

    return {
      courseId: course._id,
      title: course.title,
      totalEnrolled,
      completedCount,
      completionRate,
      avgAssessmentScore: avgScore,
      assessmentPassRate: passRate,
      lessonFunnel,
    };
  }

  /**
   * Module 08.4: Learner Personal Learning Dashboard
   */
  static async getLearnerPersonalAnalytics(tenantId, userId) {
    const [
      enrollments,
      completedEnrollments,
      certificates,
      timeAgg,
      attemptsAgg,
      progressLogs,
    ] = await Promise.all([
      Enrollment.countDocuments({ tenantId, userId }),
      Enrollment.countDocuments({ tenantId, userId, status: ENROLLMENT_STATUS.COMPLETED }),
      Certificate.countDocuments({ tenantId, userId, status: 'ISSUED' }),
      LessonProgress.aggregate([
        { $match: { tenantId, userId } },
        { $group: { _id: null, totalSeconds: { $sum: '$timeSpentSeconds' } } },
      ]),
      AssessmentAttempt.aggregate([
        { $match: { tenantId, userId } },
        { $group: { _id: null, avgScore: { $avg: '$scorePercentage' } } },
      ]),
      LessonProgress.find({ tenantId, userId, isCompleted: true })
        .select('completedAt')
        .sort({ completedAt: -1 })
        .limit(60)
        .lean(),
    ]);

    let streak = 0;
    const daysSeen = new Set();
    const todayStr = new Date().toISOString().split('T')[0];

    for (const p of progressLogs) {
      if (!p.completedAt) continue;
      const day = new Date(p.completedAt).toISOString().split('T')[0];
      daysSeen.add(day);
    }

    // Check consecutive days starting today or yesterday
    let checkDate = new Date();
    while (true) {
      const dayStr = checkDate.toISOString().split('T')[0];
      if (daysSeen.has(dayStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      coursesEnrolled: enrollments,
      coursesCompleted: completedEnrollments,
      inProgressCourses: Math.max(0, enrollments - completedEnrollments),
      certificatesEarned: certificates,
      totalHoursLearned: Math.round(((timeAgg[0]?.totalSeconds || 0) / 3600) * 10) / 10,
      averageQuizScore: Math.round(attemptsAgg[0]?.avgScore || 0),
      currentStreakDays: streak,
    };
  }
}

export default AnalyticsService;
