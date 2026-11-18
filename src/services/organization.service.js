import {
  Organization,
  Academy,
  AcademySettings,
  OrganizationMembership,
  User,
  OrganizationAuditLog,
} from '../models/index.js';
import { BaseService } from './base.service.js';
import { ConflictError, NotFoundError, BadRequestError } from '../lib/errors.js';
import { ORG_STATUS, ORG_ROLES } from '../constants/index.js';
import { executePaginatedQuery, parsePaginationParams, parseSortParams } from '../lib/pagination.js';

export class OrganizationService extends BaseService {
  constructor() {
    super(Organization, 'Organization');
  }

  /**
   * Complete organization onboarding:
   * 1. Creates Organization
   * 2. Creates Academy record with custom branding
   * 3. Creates AcademySettings
   * 4. Assigns Owner and creates OrganizationMembership with ORG_OWNER role
   */
  async onboardOrganization({
    name,
    slug,
    type = 'CORPORATE',
    ownerId,
    contact = {},
    creatorId = null,
  }) {
    const cleanSlug = slug.toLowerCase().trim();

    const existing = await Organization.findOne({ slug: cleanSlug });
    if (existing) {
      throw new ConflictError(`An organization with slug '${cleanSlug}' already exists`);
    }

    // 1. Create Organization
    const organization = await Organization.create({
      name: name.trim(),
      slug: cleanSlug,
      type,
      ownerId,
      contact,
      status: ORG_STATUS.ACTIVE,
      createdBy: creatorId || ownerId,
      updatedBy: creatorId || ownerId,
    });

    const tenantId = organization._id;

    // 2. Create Default Academy
    const academy = await Academy.create({
      tenantId,
      name: `${organization.name} Academy`,
      slug: cleanSlug,
      subdomain: cleanSlug,
      theme: {
        primaryColor: '#059669',
        secondaryColor: '#0f172a',
        accentColor: '#34d399',
        mode: 'light',
      },
      landingPage: {
        heroTitle: `Welcome to ${organization.name} Academy`,
        heroSubtitle: 'Industry-leading curriculum with source-grounded AI learning',
      },
      createdBy: creatorId || ownerId,
      updatedBy: creatorId || ownerId,
    });

    // 3. Create Default AcademySettings
    const settings = await AcademySettings.create({
      tenantId,
      enrollmentType: 'INVITE_ONLY',
      allowSelfRegistration: false,
      createdBy: creatorId || ownerId,
      updatedBy: creatorId || ownerId,
    });

    // 4. Update owner's tenantId and create OrganizationMembership
    if (ownerId) {
      await User.findByIdAndUpdate(ownerId, {
        tenantId,
        $addToSet: { roles: ORG_ROLES.ORG_OWNER },
      });

      await OrganizationMembership.create({
        tenantId,
        userId: ownerId,
        roles: [ORG_ROLES.ORG_OWNER, ORG_ROLES.ORG_ADMIN],
        status: 'ACTIVE',
        createdBy: creatorId || ownerId,
      });
    }

    // 5. Audit log
    await OrganizationAuditLog.create({
      tenantId,
      userId: creatorId || ownerId,
      action: 'ORGANIZATION_CREATED',
      entityType: 'ORGANIZATION',
      entityId: String(tenantId),
      details: { name: organization.name, slug: organization.slug },
    });

    return {
      organization,
      academy,
      settings,
    };
  }

  /**
   * List organizations with pagination (Super Admin)
   */
  async listOrganizations(options = {}) {
    const { page, limit } = parsePaginationParams(options);
    const sort = parseSortParams(options, ['createdAt', 'name', 'status']);
    const query = {};

    if (options.status) query.status = options.status;
    if (options.type) query.type = options.type;

    return executePaginatedQuery(Organization, query, { page, limit, sort });
  }

  /**
   * Update organization details
   */
  async updateOrganization(tenantId, updateData, modifierId = null) {
    const org = await Organization.findById(tenantId);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    if (updateData.name) org.name = updateData.name.trim();
    if (updateData.logoUrl !== undefined) org.logoUrl = updateData.logoUrl;
    if (updateData.website !== undefined) org.website = updateData.website;
    if (updateData.type) org.type = updateData.type;
    if (updateData.contact) {
      org.contact = { ...org.contact, ...updateData.contact };
    }

    org.updatedBy = modifierId;
    await org.save();

    await OrganizationAuditLog.create({
      tenantId,
      userId: modifierId,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'ORGANIZATION',
      entityId: String(tenantId),
      details: updateData,
    });

    return org;
  }

  /**
   * Suspend an organization
   */
  async suspendOrganization(tenantId, reason = 'Administrative action', modifierId = null) {
    const org = await Organization.findById(tenantId);
    if (!org) throw new NotFoundError('Organization not found');

    org.status = ORG_STATUS.SUSPENDED;
    org.updatedBy = modifierId;
    await org.save();

    await OrganizationAuditLog.create({
      tenantId,
      userId: modifierId,
      action: 'ORGANIZATION_SUSPENDED',
      entityType: 'ORGANIZATION',
      entityId: String(tenantId),
      details: { reason },
    });

    return org;
  }

  /**
   * Reactivate an organization
   */
  async reactivateOrganization(tenantId, modifierId = null) {
    const org = await Organization.findById(tenantId);
    if (!org) throw new NotFoundError('Organization not found');

    org.status = ORG_STATUS.ACTIVE;
    org.updatedBy = modifierId;
    await org.save();

    await OrganizationAuditLog.create({
      tenantId,
      userId: modifierId,
      action: 'ORGANIZATION_REACTIVATED',
      entityType: 'ORGANIZATION',
      entityId: String(tenantId),
    });

    return org;
  }
}

export const organizationService = new OrganizationService();
export default organizationService;

