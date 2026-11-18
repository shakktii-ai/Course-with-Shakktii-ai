import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';
import CourseCategory from '../models/CourseCategory.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import LessonBlock from '../models/LessonBlock.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError, ConflictError } from '../lib/errors.js';
import { COURSE_STATUS } from '../constants/index.js';

export class CourseService extends BaseService {
  constructor() {
    super(Course);
  }

  static async createCourse(tenantId, data, userId) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestError('Course title is required');
    }

    const slug = data.slug
      ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')
      : data.title.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const existing = await Course.findOne({ tenantId, slug });
    if (existing) {
      throw new ConflictError(`Course with slug "${slug}" already exists`);
    }

    if (data.categoryId) {
      const category = await CourseCategory.findOne({ _id: data.categoryId, tenantId });
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const course = await Course.create({
      tenantId,
      title: data.title.trim(),
      slug,
      headline: data.headline || '',
      description: data.description || '',
      thumbnail: data.thumbnail || '',
      categoryId: data.categoryId || null,
      difficulty: data.difficulty || 'BEGINNER',
      visibility: data.visibility || 'PUBLIC',
      status: COURSE_STATUS.DRAFT,
      durationHours: data.durationHours || 1,
      objectives: Array.isArray(data.objectives) ? data.objectives : [],
      targetAudience: Array.isArray(data.targetAudience) ? data.targetAudience : [],
      prerequisitesText: Array.isArray(data.prerequisitesText) ? data.prerequisitesText : [],
      instructorId: data.instructorId || userId,
      currentVersion: 1,
      scheduledPublishDate: data.scheduledPublishDate || null,
      createdBy: userId,
      updatedBy: userId,
    });

    if (data.categoryId) {
      await CourseCategory.updateOne({ _id: data.categoryId, tenantId }, { $inc: { courseCount: 1 } });
    }

    return course;
  }

  static async getCourses(tenantId, filters = {}, pagination = {}) {
    const query = { tenantId };

    if (filters.status) query.status = filters.status;
    if (filters.visibility) query.visibility = filters.visibility;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.instructorId) query.instructorId = filters.instructorId;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(pagination.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('categoryId', 'name slug color icon')
        .populate('instructorId', 'name email avatar')
        .sort(pagination.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query),
    ]);

    return {
      items: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCourseById(tenantId, courseId) {
    const course = await Course.findOne({ _id: courseId, tenantId })
      .populate('categoryId', 'name slug color icon')
      .populate('instructorId', 'name email avatar')
      .lean();

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return course;
  }

  static async getCourseBySlug(tenantId, slug) {
    const course = await Course.findOne({ slug, tenantId })
      .populate('categoryId', 'name slug color icon')
      .populate('instructorId', 'name email avatar')
      .lean();

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return course;
  }

  static async updateCourse(tenantId, courseId, data, userId) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (data.title) course.title = data.title.trim();
    if (data.headline !== undefined) course.headline = data.headline;
    if (data.description !== undefined) course.description = data.description;
    if (data.thumbnail !== undefined) course.thumbnail = data.thumbnail;
    if (data.difficulty) course.difficulty = data.difficulty;
    if (data.visibility) course.visibility = data.visibility;
    if (data.durationHours !== undefined) course.durationHours = data.durationHours;
    if (data.objectives) course.objectives = data.objectives;
    if (data.targetAudience) course.targetAudience = data.targetAudience;
    if (data.prerequisitesText) course.prerequisitesText = data.prerequisitesText;
    if (data.instructorId) course.instructorId = data.instructorId;
    if (data.scheduledPublishDate !== undefined) course.scheduledPublishDate = data.scheduledPublishDate;

    if (data.categoryId && String(data.categoryId) !== String(course.categoryId)) {
      if (course.categoryId) {
        await CourseCategory.updateOne({ _id: course.categoryId, tenantId }, { $inc: { courseCount: -1 } });
      }
      await CourseCategory.updateOne({ _id: data.categoryId, tenantId }, { $inc: { courseCount: 1 } });
      course.categoryId = data.categoryId;
    }

    course.updatedBy = userId;
    await course.save();

    return course;
  }

  static async deleteCourse(tenantId, courseId) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (course.categoryId) {
      await CourseCategory.updateOne({ _id: course.categoryId, tenantId }, { $inc: { courseCount: -1 } });
    }

    // Cascade delete curriculum elements
    await Promise.all([
      Module.deleteMany({ courseId, tenantId }),
      Lesson.deleteMany({ courseId, tenantId }),
      LessonBlock.deleteMany({ courseId, tenantId }),
      CourseVersion.deleteMany({ courseId, tenantId }),
      Course.deleteOne({ _id: courseId, tenantId }),
    ]);

    return { success: true, message: 'Course and all curriculum components deleted successfully' };
  }

  /**
   * Publish course and generate immutable version snapshot
   */
  static async publishCourse(tenantId, courseId, userId) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Fetch complete syllabus snapshot
    const modules = await Module.find({ courseId, tenantId }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({ courseId, tenantId }).sort({ order: 1 }).lean();
    const blocks = await LessonBlock.find({ courseId, tenantId }).sort({ order: 1 }).lean();

    const snapshot = {
      course: {
        title: course.title,
        slug: course.slug,
        description: course.description,
        difficulty: course.difficulty,
        durationHours: course.durationHours,
        objectives: course.objectives,
      },
      modules,
      lessons,
      blocks,
    };

    const versionNumber = course.currentVersion || 1;

    // Create immutable version record
    const version = await CourseVersion.create({
      tenantId,
      courseId,
      versionNumber,
      status: 'PUBLISHED',
      title: `${course.title} v${versionNumber}`,
      description: `Published version ${versionNumber}`,
      changelog: `Published at ${new Date().toISOString()}`,
      snapshot,
      isImmutable: true,
      publishedAt: new Date(),
      createdBy: userId,
    });

    course.status = COURSE_STATUS.PUBLISHED;
    course.publishedVersionId = version._id;
    course.publishedAt = new Date();
    course.currentVersion = versionNumber + 1;
    course.updatedBy = userId;
    await course.save();

    return {
      success: true,
      course,
      version,
      message: `Course published successfully as Version ${versionNumber}`,
    };
  }

  /**
   * Archive a course
   */
  static async archiveCourse(tenantId, courseId, userId) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    course.status = COURSE_STATUS.ARCHIVED;
    course.updatedBy = userId;
    await course.save();

    return {
      success: true,
      course,
      message: 'Course archived successfully',
    };
  }

  /**
   * Create an explicit named version snapshot
   */
  static async createVersion(tenantId, courseId, changelog = 'Snapshot created', userId) {
    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const modules = await Module.find({ courseId, tenantId }).sort({ order: 1 }).lean();
    const lessons = await Lesson.find({ courseId, tenantId }).sort({ order: 1 }).lean();
    const blocks = await LessonBlock.find({ courseId, tenantId }).sort({ order: 1 }).lean();

    const snapshot = {
      course: {
        title: course.title,
        description: course.description,
        objectives: course.objectives,
      },
      modules,
      lessons,
      blocks,
    };

    const versionNumber = course.currentVersion || 1;

    const version = await CourseVersion.create({
      tenantId,
      courseId,
      versionNumber,
      status: 'DRAFT',
      title: `${course.title} v${versionNumber}`,
      changelog,
      snapshot,
      isImmutable: false,
      createdBy: userId,
    });

    course.currentVersion = versionNumber + 1;
    await course.save();

    return version;
  }

  /**
   * Get version history for a course
   */
  static async getCourseVersions(tenantId, courseId) {
    return await CourseVersion.find({ tenantId, courseId })
      .sort({ versionNumber: -1 })
      .populate('createdBy', 'name email')
      .lean();
  }

  /**
   * Rollback course to a previous version snapshot
   */
  static async rollbackVersion(tenantId, courseId, versionId, userId) {
    const [course, version] = await Promise.all([
      Course.findOne({ _id: courseId, tenantId }),
      CourseVersion.findOne({ _id: versionId, courseId, tenantId }),
    ]);

    if (!course) throw new NotFoundError('Course not found');
    if (!version) throw new NotFoundError('Version snapshot not found');

    const snapshot = version.snapshot;
    if (!snapshot || !snapshot.modules) {
      throw new BadRequestError('Invalid version snapshot data');
    }

    // Wipe current draft curriculum
    await Promise.all([
      Module.deleteMany({ courseId, tenantId }),
      Lesson.deleteMany({ courseId, tenantId }),
      LessonBlock.deleteMany({ courseId, tenantId }),
    ]);

    // Restore modules and build ID mapping
    const moduleIdMap = {};
    for (const mod of snapshot.modules) {
      const oldId = mod._id;
      const restoredMod = await Module.create({
        tenantId,
        courseId,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        durationMinutes: mod.durationMinutes,
        isOptional: mod.isOptional,
        createdBy: userId,
      });
      moduleIdMap[oldId] = restoredMod._id;
    }

    // Restore lessons and build ID mapping
    const lessonIdMap = {};
    for (const les of snapshot.lessons) {
      const oldId = les._id;
      const targetModuleId = moduleIdMap[les.moduleId];
      if (targetModuleId) {
        const restoredLesson = await Lesson.create({
          tenantId,
          courseId,
          moduleId: targetModuleId,
          title: les.title,
          slug: les.slug,
          type: les.type,
          order: les.order,
          durationMinutes: les.durationMinutes,
          description: les.description,
          isPreview: les.isPreview,
          videoUrl: les.videoUrl,
          articleContent: les.articleContent,
          createdBy: userId,
        });
        lessonIdMap[oldId] = restoredLesson._id;
      }
    }

    // Restore blocks
    if (snapshot.blocks && Array.isArray(snapshot.blocks)) {
      for (const blk of snapshot.blocks) {
        const targetLessonId = lessonIdMap[blk.lessonId];
        if (targetLessonId) {
          await LessonBlock.create({
            tenantId,
            courseId,
            lessonId: targetLessonId,
            type: blk.type,
            order: blk.order,
            title: blk.title,
            content: blk.content,
            metadata: blk.metadata,
            createdBy: userId,
          });
        }
      }
    }

    course.updatedBy = userId;
    await course.save();

    return {
      success: true,
      message: `Course successfully restored to Version ${version.versionNumber}`,
      restoredVersionNumber: version.versionNumber,
    };
  }
}

