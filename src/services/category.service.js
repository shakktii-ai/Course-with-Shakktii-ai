import CourseCategory from '../models/CourseCategory.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError, ConflictError } from '../lib/errors.js';

export class CategoryService extends BaseService {
  constructor() {
    super(CourseCategory);
  }

  static async createCategory(tenantId, data, userId) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestError('Category name is required');
    }

    const slug = data.slug
      ? data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')
      : data.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const existing = await CourseCategory.findOne({ tenantId, slug });
    if (existing) {
      throw new ConflictError(`Category with slug "${slug}" already exists`);
    }

    return await CourseCategory.create({
      tenantId,
      name: data.name.trim(),
      slug,
      description: data.description || '',
      icon: data.icon || 'BookOpen',
      color: data.color || '#059669',
      order: data.order || 0,
      isActive: data.isActive !== false,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  static async getCategories(tenantId, options = {}) {
    const query = { tenantId };
    if (options.onlyActive) {
      query.isActive = true;
    }

    return await CourseCategory.find(query).sort({ order: 1, name: 1 }).lean();
  }

  static async getCategoryById(tenantId, categoryId) {
    const category = await CourseCategory.findOne({ _id: categoryId, tenantId });
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  static async updateCategory(tenantId, categoryId, data, userId) {
    const category = await CourseCategory.findOne({ _id: categoryId, tenantId });
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (data.name) category.name = data.name.trim();
    if (data.description !== undefined) category.description = data.description;
    if (data.icon) category.icon = data.icon;
    if (data.color) category.color = data.color;
    if (data.order !== undefined) category.order = data.order;
    if (data.isActive !== undefined) category.isActive = data.isActive;
    category.updatedBy = userId;

    await category.save();
    return category;
  }

  static async deleteCategory(tenantId, categoryId) {
    const category = await CourseCategory.findOne({ _id: categoryId, tenantId });
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await CourseCategory.deleteOne({ _id: categoryId, tenantId });
    return { success: true, message: 'Category deleted successfully' };
  }
}

