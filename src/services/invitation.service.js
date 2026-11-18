import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  Invitation,
  OrganizationMembership,
  User,
  Organization,
  Department,
  OrganizationAuditLog,
} from '../models/index.js';
import { BadRequestError, NotFoundError, ConflictError } from '../lib/errors.js';
import { EMAIL_REGEX } from '../lib/validation.js';

const INVITATION_EXPIRY_DAYS = 7;

export class InvitationService {
  /**
   * Invite an individual user to the organization
   */
  static async createInvitation({
    tenantId,
    email,
    roles = ['STUDENT'],
    departmentId = null,
    invitedBy,
  }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already an active member
    const existingMember = await OrganizationMembership.findOne({
      tenantId,
      userId: await User.findOne({ email: normalizedEmail }).select('_id'),
    });

    if (existingMember) {
      throw new ConflictError('This user is already an active member of this organization');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.findOneAndUpdate(
      { tenantId, email: normalizedEmail, status: 'PENDING' },
      {
        roles,
        departmentId: departmentId || null,
        token,
        invitedBy,
        status: 'PENDING',
        expiresAt,
      },
      { upsert: true, new: true }
    );

    await OrganizationAuditLog.create({
      tenantId,
      userId: invitedBy,
      action: 'USER_INVITED',
      entityType: 'INVITATION',
      entityId: String(invitation._id),
      details: { email: normalizedEmail, roles },
    });

    return invitation;
  }

  /**
   * Accept an invitation using token
   */
  static async acceptInvitation({ token, name, password }) {
    const invitation = await Invitation.findOne({
      token,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new BadRequestError('Invitation token is invalid or has expired');
    }

    const { tenantId, email, roles, departmentId } = invitation;

    let user = await User.findOne({ email });

    if (!user) {
      if (!name || !password) {
        throw new BadRequestError('Name and password are required to register this account');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        email,
        password: hashedPassword,
        name: name.trim(),
        tenantId,
        roles,
        isEmailVerified: true,
      });
    } else {
      // User exists: update tenantId and roles if needed
      user.tenantId = tenantId;
      roles.forEach((r) => {
        if (!user.roles.includes(r)) user.roles.push(r);
      });
      await user.save();
    }

    // Create or activate OrganizationMembership
    await OrganizationMembership.findOneAndUpdate(
      { tenantId, userId: user._id },
      {
        roles,
        departmentId: departmentId || null,
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date();
    await invitation.save();

    await OrganizationAuditLog.create({
      tenantId,
      userId: user._id,
      action: 'INVITATION_ACCEPTED',
      entityType: 'INVITATION',
      entityId: String(invitation._id),
      details: { email },
    });

    return {
      success: true,
      message: 'Invitation accepted successfully. Welcome to the academy!',
      user,
    };
  }

  /**
   * Bulk import users from CSV/tabular text payload
   */
  static async bulkImportUsers(tenantId, csvContent, defaultRole = 'STUDENT', creatorId = null) {
    if (!csvContent || typeof csvContent !== 'string') {
      throw new BadRequestError('CSV content must be a valid string');
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestError('CSV must include at least a header and one data row');
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const emailIdx = header.indexOf('email');
    const nameIdx = header.indexOf('name');
    const roleIdx = header.indexOf('role');
    const deptIdx = header.indexOf('department');

    if (emailIdx === -1) {
      throw new BadRequestError("CSV must include an 'email' column header");
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const email = cols[emailIdx]?.toLowerCase();
      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : 'Learner';
      const role = roleIdx !== -1 && cols[roleIdx] ? cols[roleIdx].toUpperCase() : defaultRole;
      const deptCode = deptIdx !== -1 ? cols[deptIdx] : null;

      if (!email || !EMAIL_REGEX.test(email)) {
        errors.push({ row: i + 1, email, reason: 'Invalid email address' });
        skipped++;
        continue;
      }

      try {
        let departmentId = null;
        if (deptCode) {
          const dept = await Department.findOne({ tenantId, code: deptCode.toUpperCase() });
          if (dept) departmentId = dept._id;
        }

        // Check existing user
        let user = await User.findOne({ email });
        if (!user) {
          const hashedPassword = await bcrypt.hash('Welcome123!', 10);
          user = await User.create({
            email,
            password: hashedPassword,
            name,
            tenantId,
            roles: [role],
            isEmailVerified: false,
            createdBy: creatorId,
          });
        }

        // Create membership
        await OrganizationMembership.findOneAndUpdate(
          { tenantId, userId: user._id },
          {
            roles: [role],
            departmentId,
            status: 'ACTIVE',
            createdBy: creatorId,
          },
          { upsert: true }
        );

        created++;
      } catch (err) {
        errors.push({ row: i + 1, email, reason: err.message });
        skipped++;
      }
    }

    await OrganizationAuditLog.create({
      tenantId,
      userId: creatorId,
      action: 'USERS_BULK_IMPORTED',
      entityType: 'ORGANIZATION',
      entityId: String(tenantId),
      details: { totalRows: lines.length - 1, created, skipped },
    });

    return {
      total: lines.length - 1,
      created,
      skipped,
      errors,
    };
  }
}

export default InvitationService;

