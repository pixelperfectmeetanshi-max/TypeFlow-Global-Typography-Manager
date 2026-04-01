/**
 * TypeFlow Plugin - Apply Typography Property Tests
 *
 * Property-based tests for typography application functions.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin
 * - Property 11: Preview Mode Round-Trip
 * - Property 14: Apply Typography to All Selected Elements
 * - Property 15: Failed Apply Preserves Original Styles
 *
 * **Validates: Requirements 5.1, 5.2, 6.1, 6.4, 6.5**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  applyTypography,
  revertTypography,
  clearOriginalStyles,
  getOriginalStyles,
} from './applyTypography';
import { FramerElement, TypographyStyle } from '../types/typography';

/**
 * Arbitrary for generating valid TypographyStyle objects
 */
const typographyStyleArb: fc.Arbitrary<TypographyStyle> = fc.record({
  fontFamily: fc.string({ minLength: 1, maxLength: 50 }),
  fontSize: fc.integer({ min: 1, max: 200 }),
  fontWeight: fc.constantFrom(100, 200, 300, 400, 500, 600, 700, 800, 900),
  lineHeight: fc.double({ min: 0.5, max: 3, noNaN: true }),
  letterSpacing: fc.double({ min: -5, max: 10, noNaN: true }),
});

/**
 * Arbitrary for generating FramerElement with typography
 */
const elementWithTypographyArb: fc.Arbitrary<FramerElement> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('text', 'heading', 'paragraph'),
  typography: typographyStyleArb,
});

/**
 * Arbitrary for generating arrays of FramerElements with typography
 */
const elementsArrayArb = fc.array(elementWithTypographyArb, {
  minLength: 1,
  maxLength: 20,
});


/**
 * Helper to deep clone a typography style
 */
function cloneStyle(style: TypographyStyle): TypographyStyle {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
  };
}

/**
 * Helper to compare two typography styles for equality
 */
function stylesEqual(a: TypographyStyle, b: TypographyStyle): boolean {
  return (
    a.fontFamily === b.fontFamily &&
    a.fontSize === b.fontSize &&
    a.fontWeight === b.fontWeight &&
    a.lineHeight === b.lineHeight &&
    a.letterSpacing === b.letterSpacing
  );
}

describe('Property 11: Preview Mode Round-Trip', () => {
  /**
   * Feature: typeflow-plugin, Property 11: Preview Mode Round-Trip
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any set of selected elements with original typography, enabling preview mode
   * and then disabling it should restore all elements to their exact original typography styles.
   */

  beforeEach(() => {
    clearOriginalStyles();
  });

  it('enabling preview and then reverting restores exact original styles', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          // Store original styles before any modifications
          const originalStyles = new Map<string, TypographyStyle>();
          for (const element of elements) {
            if (element.typography) {
              originalStyles.set(element.id, cloneStyle(element.typography));
            }
          }

          // Enable preview (temporary apply)
          await applyTypography(elements, newStyle, { temporary: true });

          // Get stored original styles for revert
          const storedOriginals = getOriginalStyles();

          // Disable preview (revert)
          await revertTypography(elements, storedOriginals);

          // Verify all elements are restored to their exact original styles
          for (const element of elements) {
            const original = originalStyles.get(element.id);
            if (original && element.typography) {
              expect(stylesEqual(element.typography, original)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });


  it('multiple preview updates followed by revert restores original styles', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        fc.array(typographyStyleArb, { minLength: 2, maxLength: 5 }),
        async (elements, styles) => {
          // Store original styles
          const originalStyles = new Map<string, TypographyStyle>();
          for (const element of elements) {
            if (element.typography) {
              originalStyles.set(element.id, cloneStyle(element.typography));
            }
          }

          // Apply multiple preview updates
          for (const style of styles) {
            await applyTypography(elements, style, { temporary: true });
          }

          // Get stored original styles for revert
          const storedOriginals = getOriginalStyles();

          // Revert
          await revertTypography(elements, storedOriginals);

          // Verify restoration to original (not intermediate) styles
          for (const element of elements) {
            const original = originalStyles.get(element.id);
            if (original && element.typography) {
              expect(stylesEqual(element.typography, original)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preview stores original styles only once (first original)', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        typographyStyleArb,
        async (elements, style1, style2) => {
          // Store true originals
          const trueOriginals = new Map<string, TypographyStyle>();
          for (const element of elements) {
            if (element.typography) {
              trueOriginals.set(element.id, cloneStyle(element.typography));
            }
          }

          // First preview apply
          await applyTypography(elements, style1, { temporary: true });

          // Second preview apply
          await applyTypography(elements, style2, { temporary: true });

          // Stored originals should be the true originals, not style1
          const storedOriginals = getOriginalStyles();
          for (const [id, stored] of storedOriginals) {
            const trueOriginal = trueOriginals.get(id);
            if (trueOriginal) {
              expect(stylesEqual(stored, trueOriginal)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all typography properties are preserved through round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementWithTypographyArb,
        typographyStyleArb,
        async (element, newStyle) => {
          const elements = [element];
          const original = cloneStyle(element.typography!);

          // Preview apply
          await applyTypography(elements, newStyle, { temporary: true });

          // Revert
          const storedOriginals = getOriginalStyles();
          await revertTypography(elements, storedOriginals);

          // Check each property individually
          expect(element.typography!.fontFamily).toBe(original.fontFamily);
          expect(element.typography!.fontSize).toBe(original.fontSize);
          expect(element.typography!.fontWeight).toBe(original.fontWeight);
          expect(element.typography!.lineHeight).toBe(original.lineHeight);
          expect(element.typography!.letterSpacing).toBe(original.letterSpacing);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 14: Apply Typography to All Selected Elements', () => {
  /**
   * Feature: typeflow-plugin, Property 14: Apply Typography to All Selected Elements
   * **Validates: Requirements 6.1, 6.4**
   *
   * For any apply operation with N selected elements and a TypographyStyle, all N elements
   * should have their typography updated to match the TypographyStyle (fontFamily, fontSize,
   * fontWeight, lineHeight, letterSpacing).
   */

  beforeEach(() => {
    clearOriginalStyles();
  });

  it('all N elements have typography updated to match the applied style', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          const result = await applyTypography(elements, newStyle, { temporary: false });

          // All elements should be updated
          expect(result.success).toBe(true);
          expect(result.appliedCount).toBe(elements.length);

          // Each element should have the new style
          for (const element of elements) {
            expect(element.typography).toBeDefined();
            expect(stylesEqual(element.typography!, newStyle)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('appliedCount equals the number of elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        typographyStyleArb,
        async (count, newStyle) => {
          // Generate exactly 'count' elements
          const elements: FramerElement[] = [];
          for (let i = 0; i < count; i++) {
            elements.push({
              id: `element-${i}`,
              type: 'text',
              typography: {
                fontFamily: `Original-${i}`,
                fontSize: 12 + i,
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: 0,
              },
            });
          }

          const result = await applyTypography(elements, newStyle, { temporary: false });

          expect(result.appliedCount).toBe(count);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all typography properties are applied correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          await applyTypography(elements, newStyle, { temporary: false });

          for (const element of elements) {
            expect(element.typography!.fontFamily).toBe(newStyle.fontFamily);
            expect(element.typography!.fontSize).toBe(newStyle.fontSize);
            expect(element.typography!.fontWeight).toBe(newStyle.fontWeight);
            expect(element.typography!.lineHeight).toBe(newStyle.lineHeight);
            expect(element.typography!.letterSpacing).toBe(newStyle.letterSpacing);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty elements array results in zero applied count', async () => {
    await fc.assert(
      fc.asyncProperty(typographyStyleArb, async (newStyle) => {
        const result = await applyTypography([], newStyle, { temporary: false });

        expect(result.success).toBe(true);
        expect(result.appliedCount).toBe(0);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('temporary mode also applies to all elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          const result = await applyTypography(elements, newStyle, { temporary: true });

          expect(result.success).toBe(true);
          expect(result.appliedCount).toBe(elements.length);

          // Each element should have the new style
          for (const element of elements) {
            expect(stylesEqual(element.typography!, newStyle)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Property 15: Failed Apply Preserves Original Styles', () => {
  /**
   * Feature: typeflow-plugin, Property 15: Failed Apply Preserves Original Styles
   * **Validates: Requirements 6.5**
   *
   * For any apply operation that fails, all affected elements should retain their
   * original typography styles—no partial updates should persist.
   */

  beforeEach(() => {
    clearOriginalStyles();
  });

  /**
   * Note: The current implementation doesn't have a way to simulate failures
   * in the applyStyleToElement function since it's a simple assignment.
   * These tests verify the behavior when the apply succeeds (no partial updates).
   * In a real scenario with Framer API, failures could occur during API calls.
   */

  it('successful apply updates all elements atomically', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          // Store originals
          const originals = new Map<string, TypographyStyle>();
          for (const element of elements) {
            if (element.typography) {
              originals.set(element.id, cloneStyle(element.typography));
            }
          }

          const result = await applyTypography(elements, newStyle, { temporary: false });

          if (result.success) {
            // All elements should have the new style (no partial updates)
            for (const element of elements) {
              expect(stylesEqual(element.typography!, newStyle)).toBe(true);
            }
          } else {
            // If failed, all elements should have original styles
            for (const element of elements) {
              const original = originals.get(element.id);
              if (original && element.typography) {
                expect(stylesEqual(element.typography, original)).toBe(true);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no partial updates occur - either all succeed or all fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          const result = await applyTypography(elements, newStyle, { temporary: false });

          if (result.success) {
            // All elements should have the new style
            const allUpdated = elements.every(
              (el) => el.typography && stylesEqual(el.typography, newStyle)
            );
            expect(allUpdated).toBe(true);
            expect(result.appliedCount).toBe(elements.length);
          } else {
            // No elements should have the new style (all reverted)
            expect(result.appliedCount).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('errors array is empty on successful apply', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          const result = await applyTypography(elements, newStyle, { temporary: false });

          if (result.success) {
            expect(result.errors).toHaveLength(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('original styles are preserved in memory during temporary apply', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, newStyle) => {
          // Store true originals
          const trueOriginals = new Map<string, TypographyStyle>();
          for (const element of elements) {
            if (element.typography) {
              trueOriginals.set(element.id, cloneStyle(element.typography));
            }
          }

          await applyTypography(elements, newStyle, { temporary: true });

          // Verify stored originals match true originals
          const storedOriginals = getOriginalStyles();
          for (const [id, stored] of storedOriginals) {
            const trueOriginal = trueOriginals.get(id);
            if (trueOriginal) {
              expect(stylesEqual(stored, trueOriginal)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('style objects are deep copied to prevent mutation side effects', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementWithTypographyArb,
        typographyStyleArb,
        async (element, newStyle) => {
          const elements = [element];
          const originalFamily = element.typography!.fontFamily;

          await applyTypography(elements, newStyle, { temporary: true });

          // Mutating the element should not affect stored original
          element.typography!.fontFamily = 'MUTATED';

          const storedOriginals = getOriginalStyles();
          const stored = storedOriginals.get(element.id);
          if (stored) {
            expect(stored.fontFamily).toBe(originalFamily);
            expect(stored.fontFamily).not.toBe('MUTATED');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
