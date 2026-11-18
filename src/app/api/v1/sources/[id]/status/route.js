/**
 * AI Academy - Source Document Processing Status API
 * GET /api/v1/sources/[id]/status
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import DocumentProcessingJob from '@/models/DocumentProcessingJob';
import SourceDocument from '@/models/SourceDocument';
import { NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const document = await SourceDocument.findOne({ _id: id, tenantId });
    if (!document) {
      throw new NotFoundError('Source document not found');
    }

    const job = await DocumentProcessingJob.findOne({ documentId: id, tenantId }).sort({ createdAt: -1 });

    return successResponse(
      {
        status: document.status,
        chunkCount: document.chunkCount,
        pageCount: document.pageCount,
        job,
      },
      'Document status retrieved'
    );
  } catch (error) {
    return handleApiError(error, 'GetSourceStatus');
  }
}

