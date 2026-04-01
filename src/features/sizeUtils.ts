/**
 * TypeFlow Plugin - Size Utilities
 *
 * Size validation and manipulation utilities for typography controls.
 * Implements validation for font size, line height, and letter spacing,
 * as well as increment/decrement operations.
 */

/**
 * Result of a validation operation.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: number;
}

/**
 * Validates a font size value.
 * Font size must be a positive number (greater than 0).
 *
 * **Validates: Requirements 4.5**
 *
 * @param value - The font size value to validate
 * @returns ValidationResult indicating if the value is valid
 */
export function validateFontSize(value: number): ValidationResult {
  // Check if value is a valid number
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      isValid: false,
      error: 'Font size must be a valid number',
    };
  }

  // Check if value is positive (greater than 0)
  if (value <= 0) {
    return {
      isValid: false,
      error: 'Font size must be a positive number',
    };
  }

  return {
    isValid: true,
    sanitizedValue: value,
  };
}

/**
 * Validates a line height value.
 * Line height must be a positive number (greater than 0).
 *
 * **Validates: Requirements 4.5**
 *
 * @param value - The line height value to validate
 * @returns ValidationResult indicating if the value is valid
 */
export function validateLineHeight(value: number): ValidationResult {
  // Check if value is a valid number
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      isValid: false,
      error: 'Line height must be a valid number',
    };
  }

  // Check if value is positive (greater than 0)
  if (value <= 0) {
    return {
      isValid: false,
      error: 'Line height must be a positive number',
    };
  }

  return {
    isValid: true,
    sanitizedValue: value,
  };
}

/**
 * Validates a letter spacing value.
 * Letter spacing must be a positive number (greater than 0).
 *
 * **Validates: Requirements 4.5**
 *
 * @param value - The letter spacing value to validate
 * @returns ValidationResult indicating if the value is valid
 */
export function validateLetterSpacing(value: number): ValidationResult {
  // Check if value is a valid number
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return {
      isValid: false,
      error: 'Letter spacing must be a valid number',
    };
  }

  // Check if value is positive (greater than 0)
  if (value <= 0) {
    return {
      isValid: false,
      error: 'Letter spacing must be a positive number',
    };
  }

  return {
    isValid: true,
    sanitizedValue: value,
  };
}

/**
 * Increments a size value by a given step.
 *
 * **Validates: Requirements 4.7**
 *
 * @param current - The current size value
 * @param step - The amount to increment by
 * @returns The incremented value
 */
export function incrementSize(current: number, step: number): number {
  return current + step;
}

/**
 * Decrements a size value by a given step, respecting a minimum value.
 *
 * **Validates: Requirements 4.7**
 *
 * @param current - The current size value
 * @param step - The amount to decrement by
 * @param min - The minimum allowed value (defaults to a small positive number)
 * @returns The decremented value, clamped to the minimum
 */
export function decrementSize(current: number, step: number, min: number = 0.01): number {
  const newValue = current - step;
  return Math.max(newValue, min);
}
