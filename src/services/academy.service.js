import crypto from 'crypto';
import { Academy, AcademySettings, DomainMapping, OrganizationAuditLog } from '../models/index.js';
import { NotFoundError, ConflictError } from '../lib/errors.js';

export class AcademyService {
  /**
   * Get academy configuration and settings for a tenant
   */
  static async getAcademy(tenantId) {
    const [academy, settings, domains] = await Promise.all([
      Academy.findOne({ tenantId }).lean(),
      AcademySettings.findOne({ tenantId }).lean(),
      DomainMapping.find({ tenantId }).lean(),
    ]);

    if (!academy) {
      throw new NotFoundError('Academy configuration not found for this organization');
    }

    return {
      academy,
      settings: settings || {},
      domains: domains || [],
    };
  }

  /**
   * Update academy branding and theme
   */
  static async updateAcademy(tenantId, updateData, modifierId = null) {
    const academy = await Academy.findOne({ tenantId });
    if (!academy) throw new NotFoundError('Academy not found');

    if (updateData.name) academy.name = updateData.name.trim();
    if (updateData.tagline !== undefined) academy.tagline = updateData.tagline.trim();
    if (updateData.description !== undefined) academy.description = updateData.description.trim();
    if (updateData.logoUrl !== undefined) academy.logoUrl = updateData.logoUrl;
    if (updateData.faviconUrl !== undefined) academy.faviconUrl = updateData.faviconUrl;
    if (updateData.isPublic !== undefined) academy.isPublic = Boolean(updateData.isPublic);

    if (updateData.theme) {
      academy.theme = { ...academy.theme, ...updateData.theme };
    }

    if (updateData.landingPage) {
      academy.landingPage = { ...academy.landingPage, ...updateData.landingPage };
    }

    academy.updatedBy = modifierId;
    await academy.save();

    await OrganizationAuditLog.create({
      tenantId,
      userId: modifierId,
      action: 'ACADEMY_UPDATED',
      entityType: 'ACADEMY',
      entityId: String(academy._id),
      details: updateData,
    });

    return academy;
  }

  /**
   * Register a custom domain for an academy
   */
  static async addCustomDomain(tenantId, domain, modifierId = null) {
    const cleanDomain = domain.toLowerCase().trim();

    const existing = await DomainMapping.findOne({ domain: cleanDomain });
    if (existing) {
      throw new ConflictError('This custom domain is already registered');
    }

    const academy = await Academy.findOne({ tenantId });
    if (!academy) throw new NotFoundError('Academy not found');

    const verificationToken = `ai-academy-verify-${crypto.randomBytes(16).toString('hex')}`;

    const mapping = await DomainMapping.create({
      tenantId,
      academyId: academy._id,
      domain: cleanDomain,
      status: 'VERIFIED', // Marked verified for sandbox / local development
      verificationToken,
      verifiedAt: new Date(),
      dnsRecords: [
        { recordType: 'CNAME', name: cleanDomain, value: `${academy.subdomain}.aiacademy.com` },
        { recordType: 'TXT', name: `_ai-verify.${cleanDomain}`, value: verificationToken },
      ],
    });

    academy.customDomain = cleanDomain;
    await academy.save();

    return mapping;
  }

  /**
   * Update academy operational settings
   */
  static async updateSettings(tenantId, settingsData, modifierId = null) {
    const settings = await AcademySettings.findOneAndUpdate(
      { tenantId },
      { ...settingsData, updatedBy: modifierId },
      { new: true, upsert: true }
    );
    return settings;
  }
}

export default AcademyService;

