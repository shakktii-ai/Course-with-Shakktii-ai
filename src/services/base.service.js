/**
 * AI Academy - Base Service Architecture
 * Standardized tenant scoping, audit trail injection, and query building.
 */

import { TenantIsolationError, NotFoundError } from '../lib/errors.js';
import { executePaginatedQuery } from '../lib/pagination.js';

export class BaseService {
  constructor(model, entityName = 'Entity') {
    this.model = model;
    this.entityName = entityName;
  }

  /**
   * Enforces tenant scoping on any query
   */
  getTenantQuery(tenantId, query = {}) {
    if (!tenantId) {
      throw new TenantIsolationError(`Tenant context required for ${this.entityName} query`);
    }
    return { ...query, tenantId };
  }

  /**
   * Find many with pagination and tenant isolation
   */
  async findPaginated(tenantId, query = {}, options = {}) {
    const tenantQuery = this.getTenantQuery(tenantId, query);
    return executePaginatedQuery(this.model, tenantQuery, options);
  }

  /**
   * Find by ID with tenant isolation
   */
  async findById(tenantId, id) {
    const tenantQuery = this.getTenantQuery(tenantId, { _id: id });
    const item = await this.model.findOne(tenantQuery).lean().exec();
    if (!item) {
      throw new NotFoundError(`${this.entityName} not found`);
    }
    return item;
  }

  /**
   * Create document with tenant scoping and audit logging
   */
  async create(tenantId, data, userId = null) {
    if (!tenantId) {
      throw new TenantIsolationError(`Tenant context required to create ${this.entityName}`);
    }
    const docData = {
      ...data,
      tenantId,
      createdBy: userId,
      updatedBy: userId,
    };
    return this.model.create(docData);
  }

  /**
   * Update document with tenant isolation and audit logging
   */
  async update(tenantId, id, data, userId = null) {
    const tenantQuery = this.getTenantQuery(tenantId, { _id: id });
    const updateData = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    };
    const updated = await this.model.findOneAndUpdate(tenantQuery, updateData, {
      new: true,
      runValidators: true,
    }).lean().exec();

    if (!updated) {
      throw new NotFoundError(`${this.entityName} not found`);
    }
    return updated;
  }

  /**
   * Delete document with tenant isolation
   */
  async delete(tenantId, id) {
    const tenantQuery = this.getTenantQuery(tenantId, { _id: id });
    const deleted = await this.model.findOneAndDelete(tenantQuery).lean().exec();
    if (!deleted) {
      throw new NotFoundError(`${this.entityName} not found`);
    }
    return deleted;
  }
}
