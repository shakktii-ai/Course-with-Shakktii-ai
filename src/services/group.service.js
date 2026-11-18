import { Group, OrganizationMembership } from '../models/index.js';
import { BaseService } from './base.service.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';

export class GroupService extends BaseService {
  constructor() {
    super(Group, 'Group');
  }

  /**
   * Get all groups for a tenant
   */
  async getGroups(tenantId) {
    return Group.find({ tenantId })
      .populate('departmentId', 'name code')
      .populate('memberIds', 'name email avatarUrl')
      .sort({ name: 1 })
      .lean()
      .exec();
  }

  /**
   * Create learner group within tenant
   */
  async createGroup(tenantId, { name, description, departmentId, memberIds = [], courseIds = [] }, creatorId = null) {
    const cleanName = name.trim();

    const existing = await Group.findOne({ tenantId, name: cleanName });
    if (existing) {
      throw new ConflictError(`Group '${cleanName}' already exists in this organization`);
    }

    const group = await Group.create({
      tenantId,
      name: cleanName,
      description: description?.trim() || '',
      departmentId: departmentId || null,
      memberIds,
      courseIds,
      createdBy: creatorId,
      updatedBy: creatorId,
    });

    // Update groupIds in OrganizationMembership for assigned members
    if (memberIds.length > 0) {
      await OrganizationMembership.updateMany(
        { tenantId, userId: { $in: memberIds } },
        { $addToSet: { groupIds: group._id } }
      );
    }

    return group;
  }

  /**
   * Update group
   */
  async updateGroup(tenantId, groupId, updateData, modifierId = null) {
    const group = await Group.findOne({ _id: groupId, tenantId });
    if (!group) throw new NotFoundError('Group not found');

    if (updateData.name) group.name = updateData.name.trim();
    if (updateData.description !== undefined) group.description = updateData.description.trim();
    if (updateData.departmentId !== undefined) group.departmentId = updateData.departmentId || null;
    if (updateData.memberIds) group.memberIds = updateData.memberIds;
    if (updateData.courseIds) group.courseIds = updateData.courseIds;

    group.updatedBy = modifierId;
    await group.save();

    return group;
  }

  /**
   * Delete group
   */
  async deleteGroup(tenantId, groupId) {
    const group = await Group.findOne({ _id: groupId, tenantId });
    if (!group) throw new NotFoundError('Group not found');

    // Remove group reference from memberships
    await OrganizationMembership.updateMany(
      { tenantId, groupIds: groupId },
      { $pull: { groupIds: groupId } }
    );

    await Group.deleteOne({ _id: groupId, tenantId });
    return { success: true, message: 'Group deleted successfully' };
  }
}

export const groupService = new GroupService();
export default groupService;

