/**
 * AI Academy - Lightweight Schema & Object Validation Engine
 * Complies with rule: Never use Zod; native JavaScript object validation.
 */

import { ValidationError } from './errors.js';

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
export const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/**
 * Validate an object against a declarative schema definition.
 * 
 * Schema format:
 * {
 *   email: { type: 'string', required: true, pattern: EMAIL_REGEX, message: 'Valid email required' },
 *   age: { type: 'number', min: 18, max: 120 },
 *   roles: { type: 'array', itemType: 'string' }
 * }
 */
export function validate(data, schema, options = { stripUnknown: true, throwOnError: false }) {
  const errors = [];
  const sanitized = {};

  if (!data || typeof data !== 'object') {
    const err = [{ field: '_root', message: 'Payload must be a valid JSON object' }];
    if (options.throwOnError) {
      throw new ValidationError('Validation failed', err);
    }
    return { isValid: false, errors: err, sanitized: {} };
  }

  for (const [field, rules] of Object.entries(schema)) {
    let value = data[field];

    // Check required
    const isPresent = value !== undefined && value !== null && value !== '';
    if (rules.required && !isPresent) {
      errors.push({
        field,
        message: rules.message || `${field} is required`,
      });
      continue;
    }

    // Skip further checks if optional and not present
    if (!isPresent) {
      if (rules.default !== undefined) {
        sanitized[field] = typeof rules.default === 'function' ? rules.default() : rules.default;
      }
      continue;
    }

    // Type casting/checking
    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors.push({ field, message: `${field} must be a string` });
        continue;
      }
      if (rules.trim !== false) {
        value = value.trim();
      }
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({ field, message: `${field} must have at least ${rules.minLength} characters` });
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({ field, message: `${field} cannot exceed ${rules.maxLength} characters` });
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({ field, message: rules.message || `${field} has an invalid format` });
      }
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
      }
    } else if (rules.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push({ field, message: `${field} must be a valid number` });
        continue;
      }
      value = num;
      if (rules.min !== undefined && value < rules.min) {
        errors.push({ field, message: `${field} must be at least ${rules.min}` });
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push({ field, message: `${field} cannot exceed ${rules.max}` });
      }
    } else if (rules.type === 'boolean') {
      if (typeof value !== 'boolean') {
        if (value === 'true' || value === 1) value = true;
        else if (value === 'false' || value === 0) value = false;
        else {
          errors.push({ field, message: `${field} must be a boolean` });
          continue;
        }
      }
    } else if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push({ field, message: `${field} must be an array` });
        continue;
      }
      if (rules.minItems !== undefined && value.length < rules.minItems) {
        errors.push({ field, message: `${field} must contain at least ${rules.minItems} items` });
      }
      if (rules.maxItems !== undefined && value.length > rules.maxItems) {
        errors.push({ field, message: `${field} cannot contain more than ${rules.maxItems} items` });
      }
      if (rules.itemType) {
        const itemTypeErrors = [];
        value.forEach((item, idx) => {
          if (typeof item !== rules.itemType) {
            itemTypeErrors.push(`Item at index ${idx} must be a ${rules.itemType}`);
          }
        });
        if (itemTypeErrors.length > 0) {
          errors.push({ field, message: itemTypeErrors.join('; ') });
        }
      }
    } else if (rules.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push({ field, message: `${field} must be an object` });
        continue;
      }
      if (rules.schema) {
        const nestedResult = validate(value, rules.schema, options);
        if (!nestedResult.isValid) {
          nestedResult.errors.forEach((e) => {
            errors.push({ field: `${field}.${e.field}`, message: e.message });
          });
        }
        value = nestedResult.sanitized;
      }
    }

    // Custom validator function
    if (rules.validate && typeof rules.validate === 'function') {
      const customValidation = rules.validate(value, data);
      if (customValidation !== true) {
        errors.push({
          field,
          message: typeof customValidation === 'string' ? customValidation : (rules.message || `${field} is invalid`),
        });
      }
    }

    sanitized[field] = value;
  }

  // Preserve non-schema fields if stripUnknown is false
  if (!options.stripUnknown) {
    for (const [key, val] of Object.entries(data)) {
      if (!(key in sanitized)) {
        sanitized[key] = val;
      }
    }
  }

  const isValid = errors.length === 0;

  if (!isValid && options.throwOnError) {
    throw new ValidationError('Request validation failed', errors);
  }

  return { isValid, errors, sanitized };
}
