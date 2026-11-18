/**
 * AI Academy - Certificates Collection API
 * GET /api/v1/certificates
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { CertificateService } from '@/services/certificate.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.CERTIFICATE_ISSUE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const filters = {
      courseId: searchParams.get('courseId') || undefined,
      userId: searchParams.get('userId') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    };

    const result = await CertificateService.listCertificates(tenantId, filters, pagination);
    return successResponse(result, 'Certificates retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetCertificates');
  }
}

