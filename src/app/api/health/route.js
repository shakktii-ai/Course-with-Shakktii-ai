/**
 * AI Academy - Infrastructure Health Check API
 * GET /api/health
 * Checks database connectivity and server uptime. (Direct architecture - no Redis)
 */

import { successResponse, handleApiError } from '@/lib/response';
import { connectToDatabase, checkMongoHealth } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    try {
      await connectToDatabase();
    } catch {
      // Connect error captured in checkMongoHealth
    }

    const dbHealth = await checkMongoHealth();
    const systemStatus = dbHealth.healthy ? 'HEALTHY' : 'UNHEALTHY';

    return successResponse(
      {
        status: systemStatus,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        architecture: 'Direct Server-Side Execution (App Router)',
        services: {
          database: dbHealth,
        },
      },
      `System status: ${systemStatus}`,
      { version: '0.1.0' }
    );
  } catch (error) {
    return handleApiError(error, 'HealthAPI');
  }
}
