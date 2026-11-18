import LearningPath from '../models/LearningPath.js';
import Course from '../models/Course.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError, ConflictError } from '../lib/errors.js';

export class LearningPathService extends BaseService {
  constructor() {
    super(LearningPath);
  }

  static async createLearningPath(tenantId, data, userId) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestError('Learning path title is required');
    }

    const slug = data.slug
      ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')
      : data.title.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const existing = await LearningPath.findOne({ tenantId, slug });
    if (existing) {
      throw new ConflictError(`Learning path with slug "${slug}" already exists`);
    }

    return await LearningPath.create({
      tenantId,
      title: data.title.trim(),
      slug,
      description: data.description || '',
      thumbnail: data.thumbnail || '',
      courses: Array.isArray(data.courses) ? data.courses : [],
      estimatedHours: data.estimatedHours || 0,
      isActive: data.isActive !== false,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  static async getLearningPaths(tenantId, options = {}) {
    const query = { tenantId };
    if (options.isActive !== undefined) {
      query.isActive = options.isActive;
    }

    return await LearningPath.find(query)
      .populate('courses.courseId', 'title slug thumbnail difficulty durationHours')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getLearningPathById(tenantId, pathId) {
    const path = await LearningPath.findOne({ _id: pathId, tenantId })
      .populate('courses.courseId', 'title slug thumbnail difficulty durationHours')
      .lean();

    if (!path) {
      throw new NotFoundError('Learning path not found');
    }
    return path;
  }

  static async updateLearningPath(tenantId, pathId, data, userId) {
    const path = await LearningPath.findOne({ _id: pathId, tenantId });
    if (!path) {
      throw new NotFoundError('Learning path not found');
    }

    if (data.title) path.title = data.title.trim();
    if (data.description !== undefined) path.description = data.description;
    if (data.thumbnail !== undefined) path.thumbnail = data.thumbnail;
    if (data.courses) path.courses = data.courses;
    if (data.estimatedHours !== undefined) path.estimatedHours = data.estimatedHours;
    if (data.isActive !== undefined) path.isActive = data.isActive;
    path.updatedBy = userId;

    await path.save();
    return path;
  }

  static async deleteLearningPath(tenantId, pathId) {
    const path = await LearningPath.findOne({ _id: pathId, tenantId });
    if (!path) {
      throw new NotFoundError('Learning path not found');
    }

    await LearningPath.deleteOne({ _id: pathId, tenantId });
    return { success: true, message: 'Learning path deleted successfully' };
  }
}

