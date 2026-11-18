/**
 * AI Academy - MongoDB Health Check API
 * GET /api/health/database
 */

import { successResponse, errorResponse, handleApiError } from '@/lib/response';
import { connectToDatabase, checkMongoHealth } from '@/lib/mongodb';
import { HTTP_STATUS, ERROR_CODES } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Attempt connection if not already connected
    try {
      await connectToDatabase();
    } catch {
      // Connect error will be captured in checkMongoHealth
    }

    const health = await checkMongoHealth();

    if (health.healthy) {
      return successResponse(health, 'MongoDB connection is healthy');
    }

    return errorResponse(
      health.message || 'MongoDB connection unhealthy',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.DATABASE_ERROR,
      [health]
    );
  } catch (error) {
    return handleApiError(error, 'MongoHealthAPI');
  }
}

