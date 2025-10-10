/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import {
  validateSchoolInput,
  sanitizeSchoolInput,
  ValidationError,
} from '../school-validation';

describe('School Validation', () => {
  describe('validateSchoolInput', () => {
    describe('name validation', () => {
      it('should accept valid school names', () => {
        expect(() => 
          validateSchoolInput({ name: 'Test School' })
        ).not.toThrow();
        
        expect(() => 
          validateSchoolInput({ name: 'St. Mary\'s High School' })
        ).not.toThrow();
        
        expect(() => 
          validateSchoolInput({ name: 'A'.repeat(100) })
        ).not.toThrow();
      });

      it('should reject empty or whitespace-only names', () => {
        expect(() => 
          validateSchoolInput({ name: '' })
        ).toThrow(ValidationError);
        
        expect(() => 
          validateSchoolInput({ name: '   ' })
        ).toThrow(ValidationError);
      });

      it('should reject names longer than 200 characters', () => {
        expect(() => 
          validateSchoolInput({ name: 'A'.repeat(201) })
        ).toThrow(ValidationError);
      });

      it('should reject names with invalid characters', () => {
        expect(() => 
          validateSchoolInput({ name: 'School<script>alert("xss")</script>' })
        ).toThrow(ValidationError);
        
        expect(() => 
          validateSchoolInput({ name: 'School\x00Name' })
        ).toThrow(ValidationError);
      });
    });

    describe('email validation', () => {
      it('should accept valid email addresses', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactEmail: 'admin@school.com' 
          })
        ).not.toThrow();
        
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactEmail: 'contact+test@school.edu' 
          })
        ).not.toThrow();
      });

      it('should reject invalid email formats', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactEmail: 'notanemail' 
          })
        ).toThrow(ValidationError);
        
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactEmail: '@school.com' 
          })
        ).toThrow(ValidationError);
        
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactEmail: 'admin@' 
          })
        ).toThrow(ValidationError);
      });

      it('should reject emails longer than 100 characters', () => {
        const longEmail = 'a'.repeat(90) + '@school.com';
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactEmail: longEmail 
          })
        ).toThrow(ValidationError);
      });
    });

    describe('phone validation', () => {
      it('should accept valid phone numbers', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactPhone: '+1234567890' 
          })
        ).not.toThrow();
        
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactPhone: '(123) 456-7890' 
          })
        ).not.toThrow();
        
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactPhone: '123-456-7890' 
          })
        ).not.toThrow();
      });

      it('should reject phone numbers with letters', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactPhone: '123-ABC-DEFG' 
          })
        ).toThrow(ValidationError);
      });

      it('should reject phone numbers that are too short', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactPhone: '123' 
          })
        ).toThrow(ValidationError);
      });

      it('should reject phone numbers that are too long', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            contactPhone: '1'.repeat(30) 
          })
        ).toThrow(ValidationError);
      });
    });

    describe('address validation', () => {
      it('should accept valid addresses', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            address: '123 Main St, City, State 12345' 
          })
        ).not.toThrow();
      });

      it('should reject addresses longer than 500 characters', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            address: 'A'.repeat(501) 
          })
        ).toThrow(ValidationError);
      });

      it('should reject addresses with null bytes', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            address: '123 Main\x00St' 
          })
        ).toThrow(ValidationError);
      });
    });

    describe('schoolId validation', () => {
      it('should accept valid custom school IDs', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            schoolId: 'school-123' 
          })
        ).not.toThrow();
        
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            schoolId: 'abc' 
          })
        ).not.toThrow();
      });

      it('should reject school IDs shorter than 3 characters', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            schoolId: 'ab' 
          })
        ).toThrow(ValidationError);
      });

      it('should reject school IDs longer than 50 characters', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            schoolId: 'a'.repeat(51) 
          })
        ).toThrow(ValidationError);
      });

      it('should reject school IDs with special characters', () => {
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            schoolId: 'school@123' 
          })
        ).toThrow(ValidationError);
        
        expect(() => 
          validateSchoolInput({ 
            name: 'School',
            schoolId: 'school 123' 
          })
        ).toThrow(ValidationError);
      });
    });
  });

  describe('sanitizeSchoolInput', () => {
    it('should trim whitespace from all string fields', () => {
      const result = sanitizeSchoolInput({
        name: '  School Name  ',
        address: '  123 Main St  ',
        contactEmail: '  admin@school.com  ',
        contactPhone: '  123-456-7890  ',
      });

      expect(result.name).toBe('School Name');
      expect(result.address).toBe('123 Main St');
      expect(result.contactEmail).toBe('admin@school.com');
      expect(result.contactPhone).toBe('123-456-7890');
    });

    it('should normalize whitespace within strings', () => {
      const result = sanitizeSchoolInput({
        name: 'School   Name   With   Spaces',
      });

      expect(result.name).toBe('School Name With Spaces');
    });

    it('should remove HTML tags from input', () => {
      const result = sanitizeSchoolInput({
        name: 'School<script>alert("xss")</script>Name',
        address: '<b>123 Main St</b>',
      });

      expect(result.name).not.toContain('<script>');
      expect(result.name).not.toContain('</script>');
      expect(result.address).not.toContain('<b>');
    });

    it('should handle undefined optional fields', () => {
      const result = sanitizeSchoolInput({
        name: 'School',
      });

      expect(result.name).toBe('School');
      expect(result.address).toBeUndefined();
      expect(result.contactEmail).toBeUndefined();
      expect(result.contactPhone).toBeUndefined();
    });

    it('should convert email to lowercase', () => {
      const result = sanitizeSchoolInput({
        name: 'School',
        contactEmail: 'ADMIN@SCHOOL.COM',
      });

      expect(result.contactEmail).toBe('admin@school.com');
    });
  });
});
