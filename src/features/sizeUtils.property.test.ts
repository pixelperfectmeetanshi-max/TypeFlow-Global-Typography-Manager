/**
 * TypeFlow Plugin - Size Utilities Property Tests
 *
 * Property-based tests for size validation functions.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin, Property 8: Size Validation Accepts Positive Numbers
 * **Validates: Requirements 4.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateFontSize,
  validateLineHeight,
  validateLetterSpacing,
} from './sizeUtils';

describe('sizeUtils property tests', () => {
  describe('Property 8: Size Validation Accepts Positive Numbers', () => {
    /**
     * Feature: typeflow-plugin, Property 8: Size Validation Accepts Positive Numbers
     * **Validates: Requirements 4.5**
     *
     * For any numeric input to size controls, the validation function should
     * return valid=true if and only if the value is a positive number (greater than 0).
     */

    describe('validateFontSize', () => {
      it('should return valid=true for any positive number', () => {
        fc.assert(
          fc.property(
            fc.double({ min: Number.MIN_VALUE, max: Number.MAX_VALUE, noNaN: true }),
            (value) => {
              // Only test positive finite numbers
              fc.pre(value > 0 && Number.isFinite(value));
              const result = validateFontSize(value);
              expect(result.isValid).toBe(true);
              expect(result.sanitizedValue).toBe(value);
              expect(result.error).toBeUndefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return valid=false for zero', () => {
        const result = validateFontSize(0);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should return valid=false for any negative number', () => {
        fc.assert(
          fc.property(
            fc.double({ min: -Number.MAX_VALUE, max: -Number.MIN_VALUE, noNaN: true }),
            (value) => {
              // Only test negative finite numbers
              fc.pre(value < 0 && Number.isFinite(value));
              const result = validateFontSize(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return valid=false for non-finite numbers (NaN, Infinity)', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant(-Infinity)
            ),
            (value) => {
              const result = validateFontSize(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('validateLineHeight', () => {
      it('should return valid=true for any positive number', () => {
        fc.assert(
          fc.property(
            fc.double({ min: Number.MIN_VALUE, max: Number.MAX_VALUE, noNaN: true }),
            (value) => {
              // Only test positive finite numbers
              fc.pre(value > 0 && Number.isFinite(value));
              const result = validateLineHeight(value);
              expect(result.isValid).toBe(true);
              expect(result.sanitizedValue).toBe(value);
              expect(result.error).toBeUndefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return valid=false for zero', () => {
        const result = validateLineHeight(0);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should return valid=false for any negative number', () => {
        fc.assert(
          fc.property(
            fc.double({ min: -Number.MAX_VALUE, max: -Number.MIN_VALUE, noNaN: true }),
            (value) => {
              // Only test negative finite numbers
              fc.pre(value < 0 && Number.isFinite(value));
              const result = validateLineHeight(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return valid=false for non-finite numbers (NaN, Infinity)', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant(-Infinity)
            ),
            (value) => {
              const result = validateLineHeight(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('validateLetterSpacing', () => {
      it('should return valid=true for any positive number', () => {
        fc.assert(
          fc.property(
            fc.double({ min: Number.MIN_VALUE, max: Number.MAX_VALUE, noNaN: true }),
            (value) => {
              // Only test positive finite numbers
              fc.pre(value > 0 && Number.isFinite(value));
              const result = validateLetterSpacing(value);
              expect(result.isValid).toBe(true);
              expect(result.sanitizedValue).toBe(value);
              expect(result.error).toBeUndefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return valid=false for zero', () => {
        const result = validateLetterSpacing(0);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should return valid=false for any negative number', () => {
        fc.assert(
          fc.property(
            fc.double({ min: -Number.MAX_VALUE, max: -Number.MIN_VALUE, noNaN: true }),
            (value) => {
              // Only test negative finite numbers
              fc.pre(value < 0 && Number.isFinite(value));
              const result = validateLetterSpacing(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should return valid=false for non-finite numbers (NaN, Infinity)', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant(-Infinity)
            ),
            (value) => {
              const result = validateLetterSpacing(value);
              expect(result.isValid).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Combined property test: For all three validation functions,
     * valid=true if and only if value > 0 and isFinite(value)
     */
    describe('Combined validation property', () => {
      it('validation returns true iff value is positive and finite', () => {
        const validators = [
          { name: 'fontSize', fn: validateFontSize },
          { name: 'lineHeight', fn: validateLineHeight },
          { name: 'letterSpacing', fn: validateLetterSpacing },
        ];

        fc.assert(
          fc.property(
            fc.double({ noDefaultInfinity: true, noNaN: true }),
            fc.integer({ min: 0, max: 2 }),
            (value, validatorIndex) => {
              const validator = validators[validatorIndex];
              const result = validator.fn(value);
              const shouldBeValid = value > 0 && Number.isFinite(value);
              
              expect(result.isValid).toBe(shouldBeValid);
              
              if (shouldBeValid) {
                expect(result.sanitizedValue).toBe(value);
                expect(result.error).toBeUndefined();
              } else {
                expect(result.error).toBeDefined();
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
