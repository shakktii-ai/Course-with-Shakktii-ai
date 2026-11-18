/**
 * AI Academy - MongoDB Infrastructure & Connection Manager
 * Features:
 * - Connection caching across Next.js invocations
 * - Health status reporting
 * - Tenant isolation schema plugin
 * - Resilient reconnection & error handling
 */

import mongoose from 'mongoose';
import { logger } from './logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_academy';
const MAX_POOL_SIZE = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10);

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 * This prevents connections growing exponentially during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with connection caching
 */
export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: MAX_POOL_SIZE,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    logger.info('[MongoDB] Initiating database connection...', { uri: MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') });

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        logger.info('[MongoDB] Connection established successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        logger.error('[MongoDB] Connection failure', { message: error.message, stack: error.stack });
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Check MongoDB Connection Health
 */
export async function checkMongoHealth() {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;
  const status = stateMap[state] || 'unknown';

  if (state !== 1) {
    return {
      healthy: false,
      status,
      readyState: state,
      message: `Database is not connected (current state: ${status})`,
    };
  }

  try {
    const startTime = Date.now();
    // Ping database
    await mongoose.connection.db.admin().ping();
    const latency = Date.now() - startTime;

    return {
      healthy: true,
      status: 'connected',
      readyState: state,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      latencyMs: latency,
    };
  } catch (err) {
    return {
      healthy: false,
      status: 'error',
      readyState: state,
      message: err.message,
    };
  }
}

/**
 * Tenant Isolation Plugin
 * Automatically enforces tenantId field, audit timestamps, and indexing on models.
 */
export function tenantPlugin(schema) {
  schema.add({
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  });

  // Query helper to enforce tenant scoping
  schema.query.byTenant = function (tenantId) {
    if (!tenantId) {
      throw new Error('[TenantIsolationError] Attempted to query tenant-scoped collection without a valid tenantId');
    }
    return this.where({ tenantId });
  };
}

export default connectToDatabase;
