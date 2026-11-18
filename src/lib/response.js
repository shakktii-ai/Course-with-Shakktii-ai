/**
 * AI Academy - Standard API Response Formatter
 * Complies strictly with Global API Standards:
 * Success: { success: true, message, data, meta }
 * Error:   { success: false, message, code, errors }
 */

import { NextResponse } from 'next/server';
import { HTTP_STATUS, ERROR_CODES } from '../constants/index.js';
import { normalizeError } from './errors.js';
import { logger } from './logger.js';

/**
 * Returns a standardized JSON success response.
 * @param {*} data - Payload data
 * @param {string} [message='Operation completed successfully'] - Human-readable success message
 * @param {object} [meta={}] - Optional metadata (pagination, filters, timestamps, etc.)
 * @param {number} [status=200] - HTTP status code
 */
export function successResponse(
  data = {},
  message = 'Operation completed successfully',
  meta = {},
  status = HTTP_STATUS.OK
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

/**
 * Returns a standardized JSON error response.
 * @param {string} [message='Operation failed'] - Error message
 * @param {number} [status=500] - HTTP status code
 * @param {string} [code='ERR_INTERNAL_SERVER'] - Machine readable error code
 * @param {Array|object} [errors=[]] - Detailed errors list or validation failures
 */
export function errorResponse(
  message = 'Operation failed',
  status = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code = ERROR_CODES.INTERNAL_ERROR,
  errors = []
) {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
      errors: Array.isArray(errors) ? errors : [errors],
    },
    { status }
  );
}

/**
 * Formats a paginated success response.
 * @param {Array} items - List of items for current page
 * @param {number} total - Total records count across all pages
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {string} [message='Data retrieved successfully']
 */
export function paginatedResponse(
  items = [],
  total = 0,
  page = 1,
  limit = 20,
  message = 'Data retrieved successfully'
) {
  const totalPages = Math.ceil(total / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return successResponse(
    items,
    message,
    {
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    },
    HTTP_STATUS.OK
  );
}

/**
 * Standard catch-all handler for Route Handler exceptions.
 * Automatically normalizes errors, logs appropriately, and returns formatted error response.
 * @param {Error} error
 * @param {string} [context='API Route']
 */
export function handleApiError(error, context = 'API') {
  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    logger.error(`[${context}] Server Error: ${normalized.message}`, {
      code: normalized.code,
      details: normalized.details,
      raw: error?.stack || error,
    });
  } else {
    logger.warn(`[${context}] Client Warning: ${normalized.message}`, {
      code: normalized.code,
      statusCode: normalized.statusCode,
      details: normalized.details,
    });
  }

  return errorResponse(
    normalized.message,
    normalized.statusCode,
    normalized.code,
    normalized.details ? (Array.isArray(normalized.details) ? normalized.details : [normalized.details]) : []
  );
}
