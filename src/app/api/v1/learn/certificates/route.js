/**
 * AI Academy - Learner Certificates API
 * GET /api/v1/learn/certificates
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { CertificateService } from '@/services/certificate.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const certificates = await CertificateService.getLearnerCertificates(tenantId, user._id);
    return successResponse(certificates, 'Learner certificates retrieved');
  } catch (error) {
    return handleApiError(error, 'GetLearnerCertificates');
  }
}

