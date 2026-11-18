/**
 * AI Academy - Issue Certificate API
 * POST /api/v1/certificates/issue
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { CertificateService } from '@/services/certificate.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';
import { BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.CERTIFICATE_ISSUE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { courseId, userId, gradeScore, skillsLearned } = body;

    if (!courseId || !userId) {
      throw new BadRequestError('courseId and userId are required to issue certificate');
    }

    const certificate = await CertificateService.issueCertificate(tenantId, courseId, userId, {
      gradeScore,
      skillsLearned,
      issuedBy: user._id,
    });

    return successResponse(certificate, 'Certificate issued successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'IssueCertificate');
  }
}

