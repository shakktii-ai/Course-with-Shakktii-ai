/**
 * AI Academy - Learner Bookmarks API
 * GET /api/v1/learn/bookmarks
 * POST /api/v1/learn/bookmarks
 * DELETE /api/v1/learn/bookmarks
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { LearnerFeaturesService } from '@/services/learner-features.service';
import { TenantService } from '@/services/tenant.service';
import { HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const bookmarkSchema = {
  courseId: { type: 'string', required: true },
  lessonId: { type: 'string', required: true },
  title: { type: 'string' },
  note: { type: 'string' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const bookmarks = await LearnerFeaturesService.getBookmarks(tenantId, user._id);
    return successResponse(bookmarks, 'Bookmarks retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetBookmarks');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, bookmarkSchema, { throwOnError: true });

    const bookmark = await LearnerFeaturesService.addBookmark(
      tenantId,
      user._id,
      sanitized.courseId,
      sanitized.lessonId,
      sanitized.title,
      sanitized.note
    );

    return successResponse(bookmark, 'Bookmark saved', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'AddBookmark');
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    const result = await LearnerFeaturesService.removeBookmark(tenantId, user._id, lessonId);
    return successResponse(result, 'Bookmark removed');
  } catch (error) {
    return handleApiError(error, 'RemoveBookmark');
  }
}

