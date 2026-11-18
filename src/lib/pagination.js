/**
 * AI Academy - Pagination, Filtering & Sorting Utilities
 * Provides robust query parsing, sanitization, and Mongoose query integration.
 */

import { PAGINATION } from '../constants/index.js';

/**
 * Extracts and sanitizes pagination parameters from a URL or Request.
 * @param {URLSearchParams|Request|object} input
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePaginationParams(input) {
  let searchParams;

  if (input instanceof Request) {
    const url = new URL(input.url);
    searchParams = url.searchParams;
  } else if (input instanceof URLSearchParams) {
    searchParams = input;
  } else if (typeof input === 'object' && input !== null) {
    const page = Math.max(1, parseInt(input.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(input.limit, 10) || PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  } else {
    searchParams = new URLSearchParams();
  }

  const page = Math.max(1, parseInt(searchParams.get('page'), 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit'), 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Parses sort parameters from search query (e.g., sort=createdAt:desc or sort=-createdAt)
 * @param {URLSearchParams|Request|object} input
 * @param {Array<string>} allowedFields - Allowed sort keys to prevent injection
 * @param {object} defaultSort - Default sort map, e.g. { createdAt: -1 }
 * @returns {object} Mongoose sort object
 */
export function parseSortParams(input, allowedFields = ['createdAt', 'updatedAt', 'name', 'title'], defaultSort = { createdAt: -1 }) {
  let sortParam = '';

  if (input instanceof Request) {
    const url = new URL(input.url);
    sortParam = url.searchParams.get('sort') || '';
  } else if (input instanceof URLSearchParams) {
    sortParam = input.get('sort') || '';
  } else if (input?.sort) {
    sortParam = String(input.sort);
  }

  if (!sortParam) return defaultSort;

  const sortObj = {};
  const parts = sortParam.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    let field = trimmed;
    let direction = 1;

    if (trimmed.startsWith('-')) {
      field = trimmed.substring(1);
      direction = -1;
    } else if (trimmed.includes(':')) {
      const [f, dir] = trimmed.split(':');
      field = f.trim();
      direction = dir.toLowerCase() === 'desc' ? -1 : 1;
    }

    if (allowedFields.includes(field)) {
      sortObj[field] = direction;
    }
  }

  return Object.keys(sortObj).length > 0 ? sortObj : defaultSort;
}

/**
 * Extracts filter fields from query params, strictly allowing only permitted keys.
 * @param {URLSearchParams|Request|object} input
 * @param {Array<string>} allowedFilters
 * @returns {object} Filter map
 */
export function parseFilterParams(input, allowedFilters = []) {
  let searchParams;

  if (input instanceof Request) {
    searchParams = new URL(input.url).searchParams;
  } else if (input instanceof URLSearchParams) {
    searchParams = input;
  } else if (typeof input === 'object' && input !== null) {
    searchParams = new URLSearchParams(input);
  } else {
    return {};
  }

  const filters = {};
  for (const key of allowedFilters) {
    const val = searchParams.get(key);
    if (val !== null && val !== undefined && val.trim() !== '') {
      filters[key] = val.trim();
    }
  }

  return filters;
}

/**
 * Executes a paginated, tenant-scoped Mongoose query with safe count and projection.
 * @param {import('mongoose').Model} model - Mongoose Model
 * @param {object} query - Base query filter (MUST include tenantId for multi-tenant isolation)
 * @param {object} options - Pagination, sorting, select, populate options
 */
export async function executePaginatedQuery(model, query = {}, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 }, select = null, populate = null } = options;
  const skip = (page - 1) * limit;

  // Execute count and query concurrently
  let queryBuilder = model.find(query).sort(sort).skip(skip).limit(limit);

  if (select) {
    queryBuilder = queryBuilder.select(select);
  }
  if (populate) {
    queryBuilder = queryBuilder.populate(populate);
  }

  const [items, total] = await Promise.all([
    queryBuilder.lean().exec(),
    model.countDocuments(query).exec(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
