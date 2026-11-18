import { Department, OrganizationMembership } from '../models/index.js';
import { BaseService } from './base.service.js';
import { ConflictError, NotFoundError, BadRequestError } from '../lib/errors.js';

export class DepartmentService extends BaseService {
  constructor() {
    super(Department, 'Department');
  }

  /**
   * Get all departments for a tenant with member count
   */
  async getDepartments(tenantId) {
    const departments = await Department.find({ tenantId })
      .populate('managerId', 'name email avatarUrl')
      .sort({ name: 1 })
      .lean()
      .exec();

    // Compute live member counts
    const counts = await OrganizationMembership.aggregate([
      { $match: { tenantId, departmentId: { $ne: null } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    return departments.map((d) => ({
      ...d,
      memberCount: countMap[String(d._id)] || 0,
    }));
  }

  /**
   * Create department within tenant
   */
  async createDepartment(tenantId, { name, code, description, managerId }, creatorId = null) {
    const cleanName = name.trim();

    const existing = await Department.findOne({ tenantId, name: cleanName });
    if (existing) {
      throw new ConflictError(`Department '${cleanName}' already exists in this organization`);
    }

    return Department.create({
      tenantId,
      name: cleanName,
      code: code ? code.trim().toUpperCase() : null,
      description: description?.trim() || '',
      managerId: managerId || null,
      createdBy: creatorId,
      updatedBy: creatorId,
    });
  }

  /**
   * Update department within tenant
   */
  async updateDepartment(tenantId, departmentId, updateData, modifierId = null) {
    const dept = await Department.findOne({ _id: departmentId, tenantId });
    if (!dept) throw new NotFoundError('Department not found');

    if (updateData.name) dept.name = updateData.name.trim();
    if (updateData.code !== undefined) dept.code = updateData.code ? updateData.code.trim().toUpperCase() : null;
    if (updateData.description !== undefined) dept.description = updateData.description.trim();
    if (updateData.managerId !== undefined) dept.managerId = updateData.managerId || null;

    dept.updatedBy = modifierId;
    await dept.save();

    return dept;
  }

  /**
   * Delete department within tenant
   */
  async deleteDepartment(tenantId, departmentId, modifierId = null) {
    const dept = await Department.findOne({ _id: departmentId, tenantId });
    if (!dept) throw new NotFoundError('Department not found');

    // Unassign members from this department
    await OrganizationMembership.updateMany(
      { tenantId, departmentId },
      { $set: { departmentId: null } }
    );

    await Department.deleteOne({ _id: departmentId, tenantId });
    return { success: true, message: 'Department deleted successfully' };
  }
}

export const departmentService = new DepartmentService();
export default departmentService;

