/**
 * AI Academy - Source Documents Collection API
 * GET /api/v1/sources
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { TenantService } from '@/services/tenant.service';
import SourceDocument from '@/models/SourceDocument';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const fileType = searchParams.get('fileType');
    const search = searchParams.get('search');

    const query = { tenantId };
    if (status) query.status = status;
    if (fileType) query.fileType = fileType.toLowerCase();
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } },
      ];
    }

    const documents = await SourceDocument.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(documents, 'Source documents retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetSourceDocuments');
  }
}

