import crypto from 'crypto';
import { Certificate } from '../models/Certificate.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { CERTIFICATE_STATUS } from '../constants/index.js';

export class CertificateService {
  /**
   * Issue a cryptographically verifiable completion certificate
   */
  static async issueCertificate(tenantId, courseId, userId, options = {}) {
    // Check if valid certificate already issued
    const existing = await Certificate.findOne({
      tenantId,
      courseId,
      userId,
      status: CERTIFICATE_STATUS.ISSUED,
    });
    if (existing) {
      return existing;
    }

    const [user, course] = await Promise.all([
      User.findById(userId),
      Course.findOne({ _id: courseId, tenantId }),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const recipientName =
      user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    const year = new Date().getFullYear();
    const randSerial = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certificateNumber = `ACAD-${year}-${randSerial.slice(0, 4)}-${randSerial.slice(4)}`;
    const verificationCode = crypto.randomBytes(16).toString('hex');
    const qrCodeData = `https://aiacademy.internal/verify/${verificationCode}`;
    const pdfUrl = `https://assets.aiacademy.internal/certificates/${certificateNumber}.pdf`;

    const certificate = await Certificate.create({
      tenantId,
      userId,
      courseId,
      recipientName,
      courseTitle: course.title,
      certificateNumber,
      verificationCode,
      gradeScore: options.gradeScore !== undefined ? options.gradeScore : 100,
      skillsLearned: options.skillsLearned || ['AI Systems Engineering', 'Multi-Tenant Architecture'],
      issueDate: new Date(),
      status: CERTIFICATE_STATUS.ISSUED,
      qrCodeData,
      pdfUrl,
      issuedBy: options.issuedBy || null,
      metadata: {
        autoIssued: Boolean(options.autoIssued),
        courseSlug: course.slug,
      },
    });

    return certificate;
  }

  /**
   * Public verification endpoint logic
   * Validates authenticity without requiring user login
   */
  static async verifyCertificate(verificationCode) {
    if (!verificationCode || !verificationCode.trim()) {
      return {
        isValid: false,
        message: 'A valid certificate verification code is required',
      };
    }

    const cert = await Certificate.findOne({ verificationCode: verificationCode.trim() })
      .populate('tenantId', 'name slug')
      .populate('userId', 'email');

    if (!cert) {
      return {
        isValid: false,
        status: 'NOT_FOUND',
        message: 'No certificate found with the provided verification code',
      };
    }

    if (cert.status === CERTIFICATE_STATUS.REVOKED) {
      return {
        isValid: false,
        status: 'REVOKED',
        message: 'This certificate has been revoked by the issuing academy',
        revocationReason: cert.revocationReason,
        certificate: {
          certificateNumber: cert.certificateNumber,
          recipientName: cert.recipientName,
          courseTitle: cert.courseTitle,
          issueDate: cert.issueDate,
          revocationReason: cert.revocationReason,
        },
      };
    }

    if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
      return {
        isValid: false,
        status: 'EXPIRED',
        message: 'This certificate has expired',
        certificate: {
          certificateNumber: cert.certificateNumber,
          recipientName: cert.recipientName,
          courseTitle: cert.courseTitle,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
        },
      };
    }

    return {
      isValid: true,
      status: 'VALID',
      certificate: {
        certificateNumber: cert.certificateNumber,
        recipientName: cert.recipientName,
        courseTitle: cert.courseTitle,
        gradeScore: cert.gradeScore,
        skillsLearned: cert.skillsLearned,
        issueDate: cert.issueDate,
        issuingOrganization: cert.tenantId?.name || 'AI Academy Certified Partner',
        qrCodeData: cert.qrCodeData,
        pdfUrl: cert.pdfUrl,
      },
    };
  }

  /**
   * Revoke an issued certificate
   */
  static async revokeCertificate(tenantId, certificateId, reason) {
    const cert = await Certificate.findOne({ _id: certificateId, tenantId });
    if (!cert) {
      throw new NotFoundError('Certificate not found');
    }

    cert.status = CERTIFICATE_STATUS.REVOKED;
    cert.revocationReason = reason || 'Revoked by institution administrator.';
    await cert.save();

    return cert;
  }

  /**
   * List certificates with pagination and search
   */
  static async listCertificates(tenantId, query = {}, pagination = { page: 1, limit: 20 }) {
    const filter = { tenantId };

    if (query.courseId) {
      filter.courseId = query.courseId;
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.$or = [
        { recipientName: { $regex: query.search.trim(), $options: 'i' } },
        { certificateNumber: { $regex: query.search.trim(), $options: 'i' } },
      ];
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Certificate.find(filter)
        .populate('userId', 'firstName lastName email')
        .populate('courseId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all active certificates for a specific learner
   */
  static async getLearnerCertificates(tenantId, userId) {
    return await Certificate.find({
      tenantId,
      userId,
      status: CERTIFICATE_STATUS.ISSUED,
    }).sort({ issueDate: -1 });
  }
}

export default CertificateService;
