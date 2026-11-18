/**
 * AI Academy - Source Document Sync API
 * POST /api/v1/sources/[id]/sync
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { DocumentProcessorService } from '@/services/document-processor.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const syncSchema = {
  newContent: { type: 'string', required: true },
  changelog: { type: 'string' },
};

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_UPDATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, syncSchema, { throwOnError: true });

    const result = await DocumentProcessorService.syncDocumentRevision(
      tenantId,
      id,
      sanitized.newContent,
      sanitized.changelog || 'Document revision update',
      user._id
    );

    return successResponse(result, 'Document revision processed and change report generated');
  } catch (error) {
    return handleApiError(error, 'SyncDocumentRevision');
  }
}

