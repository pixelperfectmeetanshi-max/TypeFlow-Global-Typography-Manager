/**
 * TypeFlow Plugin - Size Utilities Tests
 *
 * Unit tests for size validation and manipulation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  validateFontSize,
  validateLineHeight,
  validateLetterSpacing,
  incrementSize,
  decrementSize,
} from './sizeUtils';

describe('sizeUtils', () => {
  describe('validateFontSize', () => {
    it('should return valid for positive numbers', () => {
      const result = validateFontSize(16);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(16);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for small positive numbers', () => {
      const result = validateFontSize(0.5);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(0.5);
    });

    it('should return invalid for zero', () => {
      const result = validateFontSize(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Font size must be a positive number');
    });

    it('should return invalid for negative numbers', () => {
      const result = validateFontSize(-10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Font size must be a positive number');
    });

    it('should return invalid for NaN', () => {
      const result = validateFontSize(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Font size must be a valid number');
    });

    it('should return invalid for Infinity', () => {
      const result = validateFontSize(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Font size must be a valid number');
    });
  });


  describe('validateLineHeight', () => {
    it('should return valid for positive numbers', () => {
      const result = validateLineHeight(1.5);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(1.5);
    });

    it('should return valid for small positive numbers', () => {
      const result = validateLineHeight(0.1);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for zero', () => {
      const result = validateLineHeight(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Line height must be a positive number');
    });

    it('should return invalid for negative numbers', () => {
      const result = validateLineHeight(-1.5);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for NaN', () => {
      const result = validateLineHeight(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Line height must be a valid number');
    });
  });

  describe('validateLetterSpacing', () => {
    it('should return valid for positive numbers', () => {
      const result = validateLetterSpacing(2);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(2);
    });

    it('should return invalid for zero', () => {
      const result = validateLetterSpacing(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Letter spacing must be a positive number');
    });

    it('should return invalid for negative numbers', () => {
      const result = validateLetterSpacing(-0.5);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for NaN', () => {
      const result = validateLetterSpacing(NaN);
      expect(result.isValid).toBe(false);
    });
  });


  describe('incrementSize', () => {
    it('should increment by the given step', () => {
      expect(incrementSize(10, 1)).toBe(11);
    });

    it('should handle decimal steps', () => {
      expect(incrementSize(1.5, 0.1)).toBeCloseTo(1.6);
    });

    it('should handle large increments', () => {
      expect(incrementSize(100, 50)).toBe(150);
    });

    it('should handle zero step', () => {
      expect(incrementSize(10, 0)).toBe(10);
    });
  });

  describe('decrementSize', () => {
    it('should decrement by the given step', () => {
      expect(decrementSize(10, 1)).toBe(9);
    });

    it('should handle decimal steps', () => {
      expect(decrementSize(1.5, 0.1)).toBeCloseTo(1.4);
    });

    it('should respect the minimum value', () => {
      expect(decrementSize(1, 2, 0.5)).toBe(0.5);
    });

    it('should use default minimum when not specified', () => {
      expect(decrementSize(0.005, 0.01)).toBe(0.01);
    });

    it('should allow custom minimum of zero', () => {
      expect(decrementSize(0.5, 1, 0)).toBe(0);
    });

    it('should not go below minimum even with large step', () => {
      expect(decrementSize(5, 100, 1)).toBe(1);
    });
  });
});
