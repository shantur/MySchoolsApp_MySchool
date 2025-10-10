/**
 * School Validation Module
 * 
 * Provides comprehensive validation and sanitization for school data
 * to prevent injection attacks and ensure data integrity.
 */

/**
 * Validation error with specific error code
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'VALIDATION_ERROR',
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * School input data interface
 */
export interface SchoolInput {
  schoolId?: string;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Validate school input data
 * 
 * @param {SchoolInput} input - School data to validate
 * @throws {ValidationError} If validation fails
 */
export function validateSchoolInput(input: SchoolInput): void {
  // Validate name
  validateName(input.name);

  // Validate optional fields if provided
  if (input.contactEmail !== undefined) {
    validateEmail(input.contactEmail);
  }

  if (input.contactPhone !== undefined) {
    validatePhone(input.contactPhone);
  }

  if (input.address !== undefined) {
    validateAddress(input.address);
  }

  if (input.schoolId !== undefined) {
    validateSchoolId(input.schoolId);
  }
}

/**
 * Validate school name
 * 
 * @param {string} name - School name to validate
 * @throws {ValidationError} If validation fails
 */
function validateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new ValidationError(
      'School name is required',
      'REQUIRED_FIELD',
      'name'
    );
  }

  const trimmed = name.trim();

  if (trimmed.length > 200) {
    throw new ValidationError(
      'School name must not exceed 200 characters',
      'LENGTH_EXCEEDED',
      'name'
    );
  }

  // Check for dangerous characters (null bytes, control characters)
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    throw new ValidationError(
      'School name contains invalid characters',
      'INVALID_CHARACTERS',
      'name'
    );
  }

  // Check for HTML/script tags
  if (/<script|<iframe|javascript:/i.test(trimmed)) {
    throw new ValidationError(
      'School name contains invalid content',
      'INVALID_CONTENT',
      'name'
    );
  }
}

/**
 * Validate email address
 * 
 * @param {string} email - Email to validate
 * @throws {ValidationError} If validation fails
 */
function validateEmail(email: string): void {
  const trimmed = email.trim();

  if (trimmed.length > 100) {
    throw new ValidationError(
      'Email must not exceed 100 characters',
      'LENGTH_EXCEEDED',
      'contactEmail'
    );
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    throw new ValidationError(
      'Invalid email format',
      'INVALID_FORMAT',
      'contactEmail'
    );
  }
}

/**
 * Validate phone number
 * 
 * @param {string} phone - Phone number to validate
 * @throws {ValidationError} If validation fails
 */
function validatePhone(phone: string): void {
  const trimmed = phone.trim();

  // Remove common formatting characters for length check
  const digitsOnly = trimmed.replace(/[\s\-\(\)\+\.]/g, '');

  if (digitsOnly.length < 7) {
    throw new ValidationError(
      'Phone number is too short',
      'INVALID_FORMAT',
      'contactPhone'
    );
  }

  if (digitsOnly.length > 20) {
    throw new ValidationError(
      'Phone number is too long',
      'INVALID_FORMAT',
      'contactPhone'
    );
  }

  // Check that it contains only digits and allowed formatting
  if (!/^[\d\s\-\(\)\+\.]+$/.test(trimmed)) {
    throw new ValidationError(
      'Phone number contains invalid characters',
      'INVALID_CHARACTERS',
      'contactPhone'
    );
  }
}

/**
 * Validate address
 * 
 * @param {string} address - Address to validate
 * @throws {ValidationError} If validation fails
 */
function validateAddress(address: string): void {
  const trimmed = address.trim();

  if (trimmed.length > 500) {
    throw new ValidationError(
      'Address must not exceed 500 characters',
      'LENGTH_EXCEEDED',
      'address'
    );
  }

  // Check for null bytes
  if (/\x00/.test(trimmed)) {
    throw new ValidationError(
      'Address contains invalid characters',
      'INVALID_CHARACTERS',
      'address'
    );
  }
}

/**
 * Validate custom school ID
 * 
 * @param {string} schoolId - School ID to validate
 * @throws {ValidationError} If validation fails
 */
function validateSchoolId(schoolId: string): void {
  const trimmed = schoolId.trim();

  if (trimmed.length < 3) {
    throw new ValidationError(
      'School ID must be at least 3 characters',
      'LENGTH_TOO_SHORT',
      'schoolId'
    );
  }

  if (trimmed.length > 50) {
    throw new ValidationError(
      'School ID must not exceed 50 characters',
      'LENGTH_EXCEEDED',
      'schoolId'
    );
  }

  // Only allow alphanumeric and hyphens
  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    throw new ValidationError(
      'School ID can only contain letters, numbers, and hyphens',
      'INVALID_CHARACTERS',
      'schoolId'
    );
  }
}

/**
 * Sanitize school input data
 * 
 * Removes dangerous content and normalizes formatting
 * 
 * @param {SchoolInput} input - School data to sanitize
 * @return {SchoolInput} Sanitized school data
 */
export function sanitizeSchoolInput(input: SchoolInput): SchoolInput {
  const sanitized: SchoolInput = {
    name: sanitizeString(input.name),
  };

  if (input.schoolId !== undefined) {
    sanitized.schoolId = input.schoolId.trim();
  }

  if (input.address !== undefined) {
    sanitized.address = sanitizeString(input.address);
  }

  if (input.contactEmail !== undefined) {
    sanitized.contactEmail = input.contactEmail.trim().toLowerCase();
  }

  if (input.contactPhone !== undefined) {
    sanitized.contactPhone = input.contactPhone.trim();
  }

  return sanitized;
}

/**
 * Sanitize a string by removing HTML tags and normalizing whitespace
 * 
 * @param {string} str - String to sanitize
 * @return {string} Sanitized string
 */
function sanitizeString(str: string): string {
  // Remove HTML tags
  let sanitized = str.replace(/<[^>]*>/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim
  sanitized = sanitized.trim();
  
  return sanitized;
}
