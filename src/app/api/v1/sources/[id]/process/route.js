/**
 * AI Academy - Process Document Content API
 * POST /api/v1/sources/[id]/process
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { DocumentProcessorService } from '@/services/document-processor.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

const processSchema = {
  rawContent: { type: 'string', required: true },
};

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, processSchema, { throwOnError: true });

    const result = await DocumentProcessorService.processDocumentContent(
      tenantId,
      id,
      sanitized.rawContent
    );

    return successResponse(result, 'Document processed and indexed successfully');
  } catch (error) {
    return handleApiError(error, 'ProcessSourceDocument');
  }
}

