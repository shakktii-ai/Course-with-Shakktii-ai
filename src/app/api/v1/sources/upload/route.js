/**
 * AI Academy - Source Document Upload API
 * POST /api/v1/sources/upload
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { DocumentProcessorService } from '@/services/document-processor.service';
import { TenantService } from '@/services/tenant.service';
import { PERMISSIONS, HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const uploadSchema = {
  title: { type: 'string', required: true, minLength: 2, maxLength: 200 },
  originalFilename: { type: 'string', required: true },
  fileType: { type: 'string', required: true },
  fileSize: { type: 'number' },
  storageKey: { type: 'string' },
  fileUrl: { type: 'string' },
  description: { type: 'string', maxLength: 1000 },
  rawContent: { type: 'string' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_CREATE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, uploadSchema, { throwOnError: true });

    const document = await DocumentProcessorService.registerDocument(
      tenantId,
      sanitized,
      user._id
    );

    // If raw text was supplied in upload, process immediately
    if (sanitized.rawContent) {
      await DocumentProcessorService.processDocumentContent(
        tenantId,
        document._id,
        sanitized.rawContent
      );
    }

    return successResponse(document, 'Source document registered successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'UploadSourceDocument');
  }
}

