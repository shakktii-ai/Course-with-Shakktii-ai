/**
 * AI Academy - Enterprise Error Hierarchy
 * Standardized application errors with HTTP status codes and machine-readable error codes.
 */

import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';

export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.BAD_REQUEST, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied: insufficient permissions', details = null) {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found', details = null) {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate record', details = null) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please try again later.', details = null) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, details);
  }
}

export class TenantIsolationError extends AppError {
  constructor(message = 'Tenant boundary violation detected', details = null) {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.TENANT_ISOLATION_ERROR, details);
  }
}

/**
 * Normalize any thrown error (native, Mongoose, or custom) into a safe, consistent representation.
 */
export function normalizeError(error) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // Handle Mongoose ValidationError
  if (error?.name === 'ValidationError' && error?.errors) {
    const details = Object.keys(error.errors).map((field) => ({
      field,
      message: error.errors[field].message,
    }));
    return {
      message: 'Validation failed on database model',
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      details,
    };
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (error?.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    return {
      message: `A record with this ${fields.join(', ')} already exists`,
      code: ERROR_CODES.CONFLICT,
      statusCode: HTTP_STATUS.CONFLICT,
      details: { fields },
    };
  }

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (error?.name === 'CastError') {
    return {
      message: `Invalid identifier format for ${error.path}`,
      code: ERROR_CODES.BAD_REQUEST,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      details: { path: error.path, value: error.value },
    };
  }

  // Generic fallback
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    message: isProduction ? 'An unexpected server error occurred' : (error?.message || 'Internal server error'),
    code: ERROR_CODES.INTERNAL_ERROR,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details: isProduction ? null : { stack: error?.stack },
  };
}
