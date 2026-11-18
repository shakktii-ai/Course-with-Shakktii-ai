import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import LessonBlock from '../models/LessonBlock.js';
import Course from '../models/Course.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

export class CurriculumService extends BaseService {
  constructor() {
    super(Module);
  }

  // ==========================================
  // MODULES
  // ==========================================

  static async createModule(tenantId, courseId, data, userId) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestError('Module title is required');
    }

    const course = await Course.findOne({ _id: courseId, tenantId });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const highestOrderMod = await Module.findOne({ courseId, tenantId }).sort({ order: -1 }).select('order');
    const order = data.order !== undefined ? data.order : (highestOrderMod ? highestOrderMod.order + 1 : 0);

    return await Module.create({
      tenantId,
      courseId,
      title: data.title.trim(),
      description: data.description || '',
      order,
      durationMinutes: data.durationMinutes || 0,
      isOptional: Boolean(data.isOptional),
      createdBy: userId,
      updatedBy: userId,
    });
  }

  static async getModules(tenantId, courseId) {
    return await Module.find({ courseId, tenantId }).sort({ order: 1 }).lean();
  }

  static async updateModule(tenantId, moduleId, data, userId) {
    const moduleDoc = await Module.findOne({ _id: moduleId, tenantId });
    if (!moduleDoc) {
      throw new NotFoundError('Module not found');
    }

    if (data.title) moduleDoc.title = data.title.trim();
    if (data.description !== undefined) moduleDoc.description = data.description;
    if (data.order !== undefined) moduleDoc.order = data.order;
    if (data.durationMinutes !== undefined) moduleDoc.durationMinutes = data.durationMinutes;
    if (data.isOptional !== undefined) moduleDoc.isOptional = data.isOptional;
    moduleDoc.updatedBy = userId;

    await moduleDoc.save();
    return moduleDoc;
  }

  static async deleteModule(tenantId, moduleId) {
    const moduleDoc = await Module.findOne({ _id: moduleId, tenantId });
    if (!moduleDoc) {
      throw new NotFoundError('Module not found');
    }

    // Cascade delete lessons and blocks in this module
    const lessons = await Lesson.find({ moduleId, tenantId }).select('_id');
    const lessonIds = lessons.map((l) => l._id);

    await Promise.all([
      LessonBlock.deleteMany({ lessonId: { $in: lessonIds }, tenantId }),
      Lesson.deleteMany({ moduleId, tenantId }),
      Module.deleteOne({ _id: moduleId, tenantId }),
    ]);

    return { success: true, message: 'Module and associated lessons deleted' };
  }

  static async reorderModules(tenantId, courseId, moduleIds) {
    if (!Array.isArray(moduleIds)) {
      throw new BadRequestError('moduleIds must be an array');
    }

    const updates = moduleIds.map((id, index) =>
      Module.updateOne({ _id: id, courseId, tenantId }, { $set: { order: index } })
    );

    await Promise.all(updates);
    return { success: true, message: 'Modules reordered successfully' };
  }

  // ==========================================
  // LESSONS
  // ==========================================

  static async createLesson(tenantId, courseId, moduleId, data, userId) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestError('Lesson title is required');
    }

    const moduleDoc = await Module.findOne({ _id: moduleId, courseId, tenantId });
    if (!moduleDoc) {
      throw new NotFoundError('Module not found in this course');
    }

    const slug = data.slug
      ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')
      : data.title.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const highestOrderLesson = await Lesson.findOne({ moduleId, tenantId }).sort({ order: -1 }).select('order');
    const order = data.order !== undefined ? data.order : (highestOrderLesson ? highestOrderLesson.order + 1 : 0);

    const lesson = await Lesson.create({
      tenantId,
      courseId,
      moduleId,
      title: data.title.trim(),
      slug,
      type: data.type || 'ARTICLE',
      order,
      durationMinutes: data.durationMinutes || 5,
      description: data.description || '',
      isPreview: Boolean(data.isPreview),
      isMandatory: data.isMandatory !== false,
      videoUrl: data.videoUrl || '',
      videoDuration: data.videoDuration || 0,
      articleContent: data.articleContent || '',
      createdBy: userId,
      updatedBy: userId,
    });

    // Update module total duration
    await Module.updateOne(
      { _id: moduleId, tenantId },
      { $inc: { durationMinutes: lesson.durationMinutes } }
    );

    return lesson;
  }

  static async getLessons(tenantId, moduleId) {
    return await Lesson.find({ moduleId, tenantId }).sort({ order: 1 }).lean();
  }

  static async getLessonById(tenantId, lessonId) {
    const lesson = await Lesson.findOne({ _id: lessonId, tenantId }).lean();
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }
    return lesson;
  }

  static async updateLesson(tenantId, lessonId, data, userId) {
    const lesson = await Lesson.findOne({ _id: lessonId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const oldDuration = lesson.durationMinutes;

    if (data.title) lesson.title = data.title.trim();
    if (data.description !== undefined) lesson.description = data.description;
    if (data.type) lesson.type = data.type;
    if (data.order !== undefined) lesson.order = data.order;
    if (data.durationMinutes !== undefined) lesson.durationMinutes = data.durationMinutes;
    if (data.isPreview !== undefined) lesson.isPreview = data.isPreview;
    if (data.isMandatory !== undefined) lesson.isMandatory = data.isMandatory;
    if (data.videoUrl !== undefined) lesson.videoUrl = data.videoUrl;
    if (data.videoDuration !== undefined) lesson.videoDuration = data.videoDuration;
    if (data.articleContent !== undefined) lesson.articleContent = data.articleContent;
    lesson.updatedBy = userId;

    await lesson.save();

    if (data.durationMinutes !== undefined && data.durationMinutes !== oldDuration) {
      const diff = data.durationMinutes - oldDuration;
      await Module.updateOne({ _id: lesson.moduleId, tenantId }, { $inc: { durationMinutes: diff } });
    }

    return lesson;
  }

  static async deleteLesson(tenantId, lessonId) {
    const lesson = await Lesson.findOne({ _id: lessonId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    await Promise.all([
      LessonBlock.deleteMany({ lessonId, tenantId }),
      Lesson.deleteOne({ _id: lessonId, tenantId }),
      Module.updateOne(
        { _id: lesson.moduleId, tenantId },
        { $inc: { durationMinutes: -lesson.durationMinutes } }
      ),
    ]);

    return { success: true, message: 'Lesson deleted successfully' };
  }

  static async reorderLessons(tenantId, moduleId, lessonIds) {
    if (!Array.isArray(lessonIds)) {
      throw new BadRequestError('lessonIds must be an array');
    }

    const updates = lessonIds.map((id, index) =>
      Lesson.updateOne({ _id: id, moduleId, tenantId }, { $set: { order: index } })
    );

    await Promise.all(updates);
    return { success: true, message: 'Lessons reordered successfully' };
  }

  // ==========================================
  // LESSON CONTENT BLOCKS
  // ==========================================

  static async createBlock(tenantId, courseId, lessonId, data, userId) {
    if (!data.type) {
      throw new BadRequestError('Block type is required');
    }

    const lesson = await Lesson.findOne({ _id: lessonId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const highestOrderBlock = await LessonBlock.findOne({ lessonId, tenantId }).sort({ order: -1 }).select('order');
    const order = data.order !== undefined ? data.order : (highestOrderBlock ? highestOrderBlock.order + 1 : 0);

    const block = await LessonBlock.create({
      tenantId,
      courseId,
      lessonId,
      type: data.type,
      order,
      title: data.title || '',
      content: data.content || {},
      metadata: data.metadata || {},
      isOptional: Boolean(data.isOptional),
      createdBy: userId,
      updatedBy: userId,
    });

    await Lesson.updateOne({ _id: lessonId, tenantId }, { $inc: { blockCount: 1 } });

    return block;
  }

  static async getBlocks(tenantId, lessonId) {
    return await LessonBlock.find({ lessonId, tenantId }).sort({ order: 1 }).lean();
  }

  static async updateBlock(tenantId, blockId, data, userId) {
    const block = await LessonBlock.findOne({ _id: blockId, tenantId });
    if (!block) {
      throw new NotFoundError('Block not found');
    }

    if (data.title !== undefined) block.title = data.title;
    if (data.content !== undefined) block.content = data.content;
    if (data.metadata !== undefined) block.metadata = data.metadata;
    if (data.order !== undefined) block.order = data.order;
    if (data.isOptional !== undefined) block.isOptional = data.isOptional;
    block.updatedBy = userId;

    await block.save();
    return block;
  }

  static async deleteBlock(tenantId, blockId) {
    const block = await LessonBlock.findOne({ _id: blockId, tenantId });
    if (!block) {
      throw new NotFoundError('Block not found');
    }

    await Promise.all([
      LessonBlock.deleteOne({ _id: blockId, tenantId }),
      Lesson.updateOne({ _id: block.lessonId, tenantId }, { $inc: { blockCount: -1 } }),
    ]);

    return { success: true, message: 'Content block deleted successfully' };
  }

  /**
   * Get the complete nested curriculum hierarchy for course studio or learner player
   */
  static async getFullCurriculum(tenantId, courseId) {
    const [course, modules, lessons, blocks] = await Promise.all([
      Course.findOne({ _id: courseId, tenantId }).lean(),
      Module.find({ courseId, tenantId }).sort({ order: 1 }).lean(),
      Lesson.find({ courseId, tenantId }).sort({ order: 1 }).lean(),
      LessonBlock.find({ courseId, tenantId }).sort({ order: 1 }).lean(),
    ]);

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Assemble blocks by lesson
    const blocksByLesson = {};
    for (const blk of blocks) {
      const lId = String(blk.lessonId);
      if (!blocksByLesson[lId]) blocksByLesson[lId] = [];
      blocksByLesson[lId].push(blk);
    }

    // Assemble lessons by module
    const lessonsByModule = {};
    for (const les of lessons) {
      const mId = String(les.moduleId);
      if (!lessonsByModule[mId]) lessonsByModule[mId] = [];
      lessonsByModule[mId].push({
        ...les,
        blocks: blocksByLesson[String(les._id)] || [],
      });
    }

    // Assemble module tree
    const curriculum = modules.map((mod) => ({
      ...mod,
      lessons: lessonsByModule[String(mod._id)] || [],
    }));

    return {
      course,
      modules: curriculum,
      totalModules: modules.length,
      totalLessons: lessons.length,
      totalBlocks: blocks.length,
    };
  }
}
