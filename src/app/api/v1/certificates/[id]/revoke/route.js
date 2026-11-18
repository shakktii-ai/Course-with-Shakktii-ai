/**
 * AI Academy - Revoke Certificate API
 * POST /api/v1/certificates/[id]/revoke
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import { CertificateService } from '@/services/certificate.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.CERTIFICATE_REVOKE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Revoked by institution administrator';

    const certificate = await CertificateService.revokeCertificate(tenantId, id, reason);
    return successResponse(certificate, 'Certificate revoked successfully');
  } catch (error) {
    return handleApiError(error, 'RevokeCertificate');
  }
}

