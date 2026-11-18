/**
 * AI Academy - Source Document Details API
 * GET /api/v1/sources/[id]
 * DELETE /api/v1/sources/[id]
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import SourceDocument from '@/models/SourceDocument';
import DocumentChunk from '@/models/DocumentChunk';
import SourceDocumentVersion from '@/models/SourceDocumentVersion';
import { NotFoundError } from '@/lib/errors';
import { PERMISSIONS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const document = await SourceDocument.findOne({ _id: id, tenantId }).lean();
    if (!document) {
      throw new NotFoundError('Source document not found');
    }

    const [chunks, versions] = await Promise.all([
      DocumentChunk.find({ documentId: id, tenantId }).sort({ chunkIndex: 1 }).limit(100).lean(),
      SourceDocumentVersion.find({ documentId: id, tenantId }).sort({ versionNumber: -1 }).lean(),
    ]);

    return successResponse({ document, chunks, versions }, 'Source document retrieved');
  } catch (error) {
    return handleApiError(error, 'GetSourceDocument');
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateRequest(request, {
      permissions: PERMISSIONS.COURSE_DELETE,
    });
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const document = await SourceDocument.findOne({ _id: id, tenantId });
    if (!document) {
      throw new NotFoundError('Source document not found');
    }

    await Promise.all([
      DocumentChunk.deleteMany({ documentId: id, tenantId }),
      SourceDocumentVersion.deleteMany({ documentId: id, tenantId }),
      SourceDocument.deleteOne({ _id: id, tenantId }),
    ]);

    return successResponse({ success: true }, 'Document and chunks deleted successfully');
  } catch (error) {
    return handleApiError(error, 'DeleteSourceDocument');
  }
}

