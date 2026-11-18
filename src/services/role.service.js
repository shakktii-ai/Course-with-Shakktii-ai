import { Role, User, UserRole, Permission } from '../models/index.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../lib/errors.js';
import { AuditService } from './audit.service.js';

export class RoleService extends BaseService {
  constructor() {
    super(Role, 'Role');
  }

  /**
   * List available roles for tenant (includes global system roles + tenant-specific roles)
   */
  async getAvailableRoles(tenantId = null) {
    const filter = {
      $or: [
        { isPlatformRole: false, tenantId: null }, // System template roles
        ...(tenantId ? [{ tenantId }] : []),
      ],
      isActive: true,
    };

    return Role.find(filter).sort({ isSystemRole: -1, name: 1 }).lean().exec();
  }

  /**
   * Create custom role within a tenant
   */
  async createTenantRole(tenantId, { name, slug, description, permissions = [] }, creatorId = null) {
    const cleanSlug = slug.toUpperCase().trim();

    const existing = await Role.findOne({
      tenantId,
      slug: cleanSlug,
    });

    if (existing) {
      throw new ConflictError(`A role with slug '${cleanSlug}' already exists for this organization`);
    }

    const role = await Role.create({
      tenantId,
      name: name.trim(),
      slug: cleanSlug,
      description: description?.trim() || '',
      permissions,
      isPlatformRole: false,
      isSystemRole: false,
      isActive: true,
    });

    await AuditService.logEvent({
      tenantId,
      userId: creatorId,
      action: 'ROLE_CREATED',
      resourceType: 'ROLE',
      resourceId: String(role._id),
      details: { slug: cleanSlug, permissionsCount: permissions.length },
    });

    return role;
  }

  /**
   * Update a custom role
   */
  async updateRole(tenantId, roleId, updateData, modifierId = null) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) {
      throw new NotFoundError('Role not found or cannot be modified');
    }

    if (role.isSystemRole) {
      throw new ForbiddenError('System-protected roles cannot be edited');
    }

    if (updateData.name) role.name = updateData.name.trim();
    if (updateData.description !== undefined) role.description = updateData.description.trim();
    if (updateData.permissions && Array.isArray(updateData.permissions)) {
      role.permissions = updateData.permissions;
    }
    if (updateData.isActive !== undefined) role.isActive = Boolean(updateData.isActive);

    await role.save();

    await AuditService.logEvent({
      tenantId,
      userId: modifierId,
      action: 'ROLE_UPDATED',
      resourceType: 'ROLE',
      resourceId: String(role._id),
      details: updateData,
    });

    return role;
  }

  /**
   * Delete a custom role
   */
  async deleteRole(tenantId, roleId, modifierId = null) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystemRole) {
      throw new ForbiddenError('System roles cannot be deleted');
    }

    // Verify if users are assigned to this role
    const assignedCount = await User.countDocuments({ tenantId, roles: role.slug });
    if (assignedCount > 0) {
      throw new BadRequestError(`Cannot delete role: ${assignedCount} user(s) are currently assigned to it`);
    }

    await Role.deleteOne({ _id: roleId });

    await AuditService.logEvent({
      tenantId,
      userId: modifierId,
      action: 'ROLE_DELETED',
      resourceType: 'ROLE',
      resourceId: String(roleId),
      details: { slug: role.slug },
    });

    return { success: true, message: 'Role deleted successfully' };
  }

  /**
   * Assign or update permissions for a role
   */
  async assignPermissions(tenantId, roleId, permissions, modifierId = null) {
    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystemRole) {
      throw new ForbiddenError('Cannot modify permissions of a protected system role');
    }

    role.permissions = permissions;
    await role.save();

    await AuditService.logEvent({
      tenantId,
      userId: modifierId,
      action: 'PERMISSION_CHANGED',
      resourceType: 'ROLE',
      resourceId: String(roleId),
      details: { permissions },
    });

    return role;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(tenantId, userId, roleSlug, assignerId = null) {
    const user = await User.findOne({ _id: userId, tenantId });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.roles.includes(roleSlug)) {
      user.roles.push(roleSlug);
      await user.save();
    }

    // Record UserRole junction entry
    await UserRole.findOneAndUpdate(
      { tenantId, userId, roleSlug },
      { assignedBy: assignerId, assignedAt: new Date() },
      { upsert: true, new: true }
    );

    await AuditService.logEvent({
      tenantId,
      userId: assignerId,
      action: 'ROLE_ASSIGNED',
      resourceType: 'USER',
      resourceId: String(userId),
      details: { roleSlug },
    });

    return user;
  }
}

export const roleService = new RoleService();
export default roleService;

