import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import CourseProgress from '../models/CourseProgress.js';
import Lesson from '../models/Lesson.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError, ConflictError } from '../lib/errors.js';
import { ENROLLMENT_STATUS, ENROLLMENT_TYPE, PROGRESS_STATUS } from '../constants/index.js';

export class EnrollmentService extends BaseService {
  constructor() {
    super(Enrollment);
  }

  /**
   * Enroll a single user in a course
   */
  static async enrollUser(tenantId, {
    userId,
    courseId,
    enrollmentType = ENROLLMENT_TYPE.INDIVIDUAL,
    departmentId = null,
    groupId = null,
    isMandatory = false,
    expiresAt = null,
    enrolledBy = null,
  }) {
    if (!userId || !courseId) {
      throw new BadRequestError('User ID and Course ID are required');
    }

    const [user, course] = await Promise.all([
      User.findOne({ _id: userId, tenantId }),
      Course.findOne({ _id: courseId, tenantId }),
    ]);

    if (!user) throw new NotFoundError('User not found in this organization');
    if (!course) throw new NotFoundError('Course not found in this organization');

    const existing = await Enrollment.findOne({ tenantId, userId, courseId });
    if (existing) {
      if (existing.status === ENROLLMENT_STATUS.ACTIVE) {
        throw new ConflictError('User is already actively enrolled in this course');
      }
      // Reactivate dropped/expired enrollment
      existing.status = ENROLLMENT_STATUS.ACTIVE;
      existing.expiresAt = expiresAt;
      existing.isMandatory = isMandatory;
      existing.enrolledAt = new Date();
      existing.enrolledBy = enrolledBy;
      await existing.save();
      return existing;
    }

    const enrollment = await Enrollment.create({
      tenantId,
      userId,
      courseId,
      enrollmentType,
      departmentId,
      groupId,
      isMandatory,
      expiresAt,
      enrolledBy,
      status: ENROLLMENT_STATUS.ACTIVE,
      enrolledAt: new Date(),
    });

    // Count lessons to initialize CourseProgress
    const totalLessons = await Lesson.countDocuments({ courseId, tenantId });

    await CourseProgress.findOneAndUpdate(
      { tenantId, userId, courseId },
      {
        totalLessons,
        completedLessons: 0,
        percentComplete: 0,
        status: PROGRESS_STATUS.NOT_STARTED,
        lastAccessedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Increment course enrollment count
    await Course.updateOne({ _id: courseId, tenantId }, { $inc: { enrollmentCount: 1 } });

    return enrollment;
  }

  /**
   * Bulk enroll multiple users into a course
   */
  static async bulkEnrollUsers(tenantId, { userIds, courseId, enrollmentType = ENROLLMENT_TYPE.BULK, enrolledBy = null }) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestError('userIds must be a non-empty array');
    }

    let enrolledCount = 0;
    let skippedCount = 0;

    for (const uid of userIds) {
      try {
        await this.enrollUser(tenantId, {
          userId: uid,
          courseId,
          enrollmentType,
          enrolledBy,
        });
        enrolledCount++;
      } catch (err) {
        skippedCount++;
      }
    }

    return {
      total: userIds.length,
      enrolled: enrolledCount,
      skipped: skippedCount,
    };
  }

  /**
   * Enroll all active members of an organizational department
   */
  static async enrollDepartment(tenantId, { departmentId, courseId, isMandatory = true, enrolledBy = null }) {
    const memberships = await OrganizationMembership.find({
      tenantId,
      departmentId,
      status: 'ACTIVE',
    }).select('userId');

    const userIds = memberships.map((m) => m.userId);
    return await this.bulkEnrollUsers(tenantId, {
      userIds,
      courseId,
      enrollmentType: ENROLLMENT_TYPE.DEPARTMENT,
      enrolledBy,
    });
  }

  /**
   * Enroll all members of a learner group/cohort
   */
  static async enrollGroup(tenantId, { groupId, courseId, isMandatory = true, enrolledBy = null }) {
    const group = await Group.findOne({ _id: groupId, tenantId });
    if (!group) {
      throw new NotFoundError('Learner group not found');
    }

    return await this.bulkEnrollUsers(tenantId, {
      userIds: group.memberIds || group.members || [],
      courseId,
      enrollmentType: ENROLLMENT_TYPE.GROUP,
      enrolledBy,
    });
  }

  /**
   * Get enrollments with filters and pagination
   */
  static async getEnrollments(tenantId, filters = {}, pagination = {}) {
    const query = { tenantId };

    if (filters.courseId) query.courseId = filters.courseId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.enrollmentType) query.enrollmentType = filters.enrollmentType;

    const page = Math.max(1, parseInt(pagination.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Enrollment.find(query)
        .populate('userId', 'name email avatar')
        .populate('courseId', 'title slug thumbnail difficulty durationHours')
        .populate('departmentId', 'name code')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check learner enrollment and access permission
   */
  static async checkUserEnrollment(tenantId, userId, courseId) {
    const enrollment = await Enrollment.findOne({
      tenantId,
      userId,
      courseId,
      status: ENROLLMENT_STATUS.ACTIVE,
    }).lean();

    if (!enrollment) {
      return { isEnrolled: false, enrollment: null };
    }

    // Check expiry
    if (enrollment.expiresAt && new Date(enrollment.expiresAt) < new Date()) {
      await Enrollment.updateOne({ _id: enrollment._id }, { $set: { status: ENROLLMENT_STATUS.EXPIRED } });
      return { isEnrolled: false, enrollment: null, isExpired: true };
    }

    return { isEnrolled: true, enrollment };
  }

  /**
   * Cancel or drop enrollment
   */
  static async cancelEnrollment(tenantId, enrollmentId) {
    const enrollment = await Enrollment.findOne({ _id: enrollmentId, tenantId });
    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    enrollment.status = ENROLLMENT_STATUS.DROPPED;
    await enrollment.save();

    await Course.updateOne({ _id: enrollment.courseId, tenantId }, { $inc: { enrollmentCount: -1 } });

    return { success: true, message: 'Enrollment cancelled' };
  }
}
