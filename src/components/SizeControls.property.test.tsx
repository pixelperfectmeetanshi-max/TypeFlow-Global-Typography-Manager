/**
 * TypeFlow Plugin - SizeControls Property Tests
 *
 * Property-based tests for size input validation in the SizeControls component.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin, Property 9: Invalid Size Reverts to Previous Value
 * **Validates: Requirements 4.6**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { SizeControls, SizeControlsProps } from './SizeControls';

describe('SizeControls property tests', () => {
  describe('Property 9: Invalid Size Reverts to Previous Value', () => {
    /**
     * Feature: typeflow-plugin, Property 9: Invalid Size Reverts to Previous Value
     * **Validates: Requirements 4.6**
     *
     * For any invalid size input (non-positive or non-numeric), the Size_Controller
     * should revert the displayed value to the previous valid value, and the
     * TypographyStyle should remain unchanged.
     */

    let mockOnFontSizeChange: ReturnType<typeof vi.fn>;
    let mockOnLineHeightChange: ReturnType<typeof vi.fn>;
    let mockOnLetterSpacingChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockOnFontSizeChange = vi.fn();
      mockOnLineHeightChange = vi.fn();
      mockOnLetterSpacingChange = vi.fn();
    });

    afterEach(() => {
      cleanup();
    });

    const renderSizeControls = (props: Partial<SizeControlsProps> = {}) => {
      const defaultProps: SizeControlsProps = {
        fontSize: 16,
        lineHeight: 1.5,
        letterSpacing: 0.5,
        onFontSizeChange: mockOnFontSizeChange,
        onLineHeightChange: mockOnLineHeightChange,
        onLetterSpacingChange: mockOnLetterSpacingChange,
        validationErrors: {},
        ...props,
      };
      return render(<SizeControls {...defaultProps} />);
    };

    /**
     * Helper to get input by id from container
     */
    const getInputById = (container: HTMLElement, id: string): HTMLInputElement => {
      const input = container.querySelector(`#${id}`) as HTMLInputElement;
      if (!input) {
        throw new Error(`Input with id "${id}" not found`);
      }
      return input;
    };

    /**
     * Arbitrary for generating invalid numeric inputs (non-positive numbers)
     */
    const invalidNumericArbitrary = fc.oneof(
      fc.constant(0),
      fc.double({ min: -1000, max: -0.001, noNaN: true }),
      fc.constant(-Infinity)
    );

    /**
     * Arbitrary for generating truly non-numeric string inputs
     * These are strings that parseFloat() will return NaN for
     * Note: parseFloat("12.34.56") returns 12.34, so we exclude such patterns
     */
    const nonNumericArbitrary = fc.oneof(
      fc.constant(''),
      fc.constant('abc'),
      fc.constant('xyz123'), // starts with letters
      fc.constant('--5'),
      fc.constant('..5'),
      fc.constant('hello world'),
      fc.constant('NaN'), // string "NaN" parses to NaN
      // Generate strings that start with non-numeric characters
      fc.stringOf(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '=', '+', '[', ']', '{', '}', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '?', '/', '`', '~'), { minLength: 1, maxLength: 10 })
    );

    /**
     * Arbitrary for generating valid positive numbers for initial values
     */
    const validPositiveArbitrary = fc.double({ min: 0.01, max: 1000, noNaN: true });

    describe('Font Size Input', () => {
      it('should revert to previous valid value when non-numeric input is entered', () => {
        fc.assert(
          fc.property(
            validPositiveArbitrary,
            nonNumericArbitrary,
            (initialValue, invalidInput) => {
              // Pre-condition: ensure the input truly parses to NaN
              fc.pre(isNaN(parseFloat(invalidInput)));
              
              cleanup();
              mockOnFontSizeChange.mockClear();

              const { container } = renderSizeControls({ fontSize: initialValue });

              const input = getInputById(container, 'fontSize');
              
              // Enter invalid non-numeric value
              fireEvent.change(input, { target: { value: invalidInput } });
              fireEvent.blur(input);

              // The onChange should NOT be called with invalid input
              expect(mockOnFontSizeChange).not.toHaveBeenCalled();
              
              // The input should revert to the previous valid value
              expect(input.value).toBe(initialValue.toString());
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should revert to previous valid value when non-positive number is entered', () => {
        fc.assert(
          fc.property(
            validPositiveArbitrary,
            invalidNumericArbitrary,
            (initialValue, invalidValue) => {
              cleanup();
              mockOnFontSizeChange.mockClear();

              const { container } = renderSizeControls({ fontSize: initialValue });

              const input = getInputById(container, 'fontSize');
              
              // Enter invalid non-positive value
              fireEvent.change(input, { target: { value: invalidValue.toString() } });
              fireEvent.blur(input);

              // The onChange should NOT be called with invalid input
              expect(mockOnFontSizeChange).not.toHaveBeenCalled();
              
              // The input should revert to the previous valid value
              expect(input.value).toBe(initialValue.toString());
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Line Height Input', () => {
      it('should revert to previous valid value when non-numeric input is entered', () => {
        fc.assert(
          fc.property(
            validPositiveArbitrary,
            nonNumericArbitrary,
            (initialValue, invalidInput) => {
              // Pre-condition: ensure the input truly parses to NaN
              fc.pre(isNaN(parseFloat(invalidInput)));
              
              cleanup();
              mockOnLineHeightChange.mockClear();

              const { container } = renderSizeControls({ lineHeight: initialValue });

              const input = getInputById(container, 'lineHeight');
              
              // Enter invalid non-numeric value
              fireEvent.change(input, { target: { value: invalidInput } });
              fireEvent.blur(input);

              // The onChange should NOT be called with invalid input
              expect(mockOnLineHeightChange).not.toHaveBeenCalled();
              
              // The input should revert to the previous valid value
              expect(input.value).toBe(initialValue.toString());
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should revert to previous valid value when non-positive number is entered', () => {
        fc.assert(
          fc.property(
            validPositiveArbitrary,
            invalidNumericArbitrary,
            (initialValue, invalidValue) => {
              cleanup();
              mockOnLineHeightChange.mockClear();

              const { container } = renderSizeControls({ lineHeight: initialValue });

              const input = getInputById(container, 'lineHeight');
              
              // Enter invalid non-positive value
              fireEvent.change(input, { target: { value: invalidValue.toString() } });
              fireEvent.blur(input);

              // The onChange should NOT be called with invalid input
              expect(mockOnLineHeightChange).not.toHaveBeenCalled();
              
              // The input should revert to the previous valid value
              expect(input.value).toBe(initialValue.toString());
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Letter Spacing Input', () => {
      it('should revert to previous valid value when non-numeric input is entered', () => {
        fc.assert(
          fc.property(
            validPositiveArbitrary,
            nonNumericArbitrary,
            (initialValue, invalidInput) => {
              // Pre-condition: ensure the input truly parses to NaN
              fc.pre(isNaN(parseFloat(invalidInput)));
              
              cleanup();
              mockOnLetterSpacingChange.mockClear();

              const { container } = renderSizeControls({ letterSpacing: initialValue });

              const input = getInputById(container, 'letterSpacing');
              
              // Enter invalid non-numeric value
              fireEvent.change(input, { target: { value: invalidInput } });
              fireEvent.blur(input);

              // The onChange should NOT be called with invalid input
              expect(mockOnLetterSpacingChange).not.toHaveBeenCalled();
              
              // The input should revert to the previous valid value
              expect(input.value).toBe(initialValue.toString());
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should revert to previous valid value when non-positive number is entered', () => {
        fc.assert(
          fc.property(
            validPositiveArbitrary,
            invalidNumericArbitrary,
            (initialValue, invalidValue) => {
              cleanup();
              mockOnLetterSpacingChange.mockClear();

              const { container } = renderSizeControls({ letterSpacing: initialValue });

              const input = getInputById(container, 'letterSpacing');
              
              // Enter invalid non-positive value
              fireEvent.change(input, { target: { value: invalidValue.toString() } });
              fireEvent.blur(input);

              // The onChange should NOT be called with invalid input
              expect(mockOnLetterSpacingChange).not.toHaveBeenCalled();
              
              // The input should revert to the previous valid value
              expect(input.value).toBe(initialValue.toString());
            }
          ),
          { numRuns: 50 }
        );
      });
    });

    describe('Combined property: Invalid input never triggers style change', () => {
      /**
       * Combined property test: For all three size inputs,
       * invalid input should never trigger the onChange callback
       * and should always revert to the previous valid value.
       */
      it('invalid input to any size field should not trigger onChange and should revert', () => {
        const sizeFields = [
          { id: 'fontSize', prop: 'fontSize', onChange: () => mockOnFontSizeChange },
          { id: 'lineHeight', prop: 'lineHeight', onChange: () => mockOnLineHeightChange },
          { id: 'letterSpacing', prop: 'letterSpacing', onChange: () => mockOnLetterSpacingChange },
        ] as const;

        /**
         * Generate invalid inputs that are either:
         * 1. Non-numeric strings (parseFloat returns NaN)
         * 2. Non-positive numbers (zero or negative)
         */
        const invalidInputArbitrary = fc.oneof(
          // Non-numeric strings
          nonNumericArbitrary.filter((s) => isNaN(parseFloat(s))),
          // Non-positive numbers as strings
          invalidNumericArbitrary.map(String)
        );

        fc.assert(
          fc.property(
            validPositiveArbitrary,
            validPositiveArbitrary,
            validPositiveArbitrary,
            fc.integer({ min: 0, max: 2 }),
            invalidInputArbitrary,
            (fontSize, lineHeight, letterSpacing, fieldIndex, invalidInput) => {
              cleanup();
              mockOnFontSizeChange.mockClear();
              mockOnLineHeightChange.mockClear();
              mockOnLetterSpacingChange.mockClear();

              const { container } = renderSizeControls({
                fontSize,
                lineHeight,
                letterSpacing,
              });

              const field = sizeFields[fieldIndex];
              const input = getInputById(container, field.id);
              const initialValue = { fontSize, lineHeight, letterSpacing }[field.prop];

              // Enter invalid value
              fireEvent.change(input, { target: { value: invalidInput } });
              fireEvent.blur(input);

              // The onChange should NOT be called
              expect(field.onChange()).not.toHaveBeenCalled();
              
              // The input should revert to the previous valid value
              expect(input.value).toBe(initialValue.toString());
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
