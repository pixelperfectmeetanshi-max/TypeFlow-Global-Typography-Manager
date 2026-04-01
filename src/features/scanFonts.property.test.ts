/**
 * TypeFlow Plugin - Font Scanning Property Tests
 *
 * Property-based tests for font scanning functions.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin, Property 1: Font Scanner Traverses All Elements
 * **Validates: Requirements 2.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { scanFontsWithDetails, extractFontFromElement, deduplicateFonts } from './scanFonts';
import { FramerElement, FramerProject, TypographyStyle, FontMetadata } from '../types/typography';

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
 * Arbitrary for generating FramerElement without typography
 */
const elementWithoutTypographyArb: fc.Arbitrary<FramerElement> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('frame', 'image', 'rectangle', 'ellipse', 'line'),
});

/**
 * Arbitrary for generating mixed FramerElement (with or without typography)
 */
const mixedElementArb: fc.Arbitrary<FramerElement> = fc.oneof(
  elementWithTypographyArb,
  elementWithoutTypographyArb
);

/**
 * Arbitrary for generating arrays of FramerElements
 */
const elementsArrayArb = fc.array(mixedElementArb, { minLength: 0, maxLength: 50 });

/**
 * Arbitrary for generating a FramerProject
 */
const framerProjectArb: fc.Arbitrary<FramerProject> = fc.record({
  id: fc.uuid(),
  elements: elementsArrayArb,
});

describe('scanFonts property tests', () => {
  describe('Property 1: Font Scanner Traverses All Elements', () => {
    /**
     * Feature: typeflow-plugin, Property 1: Font Scanner Traverses All Elements
     * **Validates: Requirements 2.1**
     *
     * For any Framer project with N elements, when a font scan is initiated,
     * the scanner should visit exactly N elements (regardless of whether they have typography).
     */

    it('scanner visits exactly N elements for any project with N elements', async () => {
      await fc.assert(
        fc.asyncProperty(framerProjectArb, async (project) => {
          const result = await scanFontsWithDetails(project);

          // The total elements scanned should equal the number of elements in the project
          expect(result.totalElements).toBe(project.elements.length);
        }),
        { numRuns: 100 }
      );
    });

    it('success count plus error count equals total elements', async () => {
      await fc.assert(
        fc.asyncProperty(framerProjectArb, async (project) => {
          const result = await scanFontsWithDetails(project);

          // successCount + errorCount should always equal totalElements
          expect(result.successCount + result.errorCount).toBe(result.totalElements);
        }),
        { numRuns: 100 }
      );
    });

    it('scanner processes all elements regardless of typography presence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(elementWithTypographyArb, { minLength: 0, maxLength: 20 }),
          fc.array(elementWithoutTypographyArb, { minLength: 0, maxLength: 20 }),
          async (withTypography, withoutTypography) => {
            const allElements = [...withTypography, ...withoutTypography];
            const project: FramerProject = {
              id: 'test-project',
              elements: allElements,
            };

            const result = await scanFontsWithDetails(project);

            // Scanner should visit all elements
            expect(result.totalElements).toBe(allElements.length);
            // All elements should be processed successfully (no errors expected for valid elements)
            expect(result.successCount).toBe(allElements.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty project results in zero elements scanned', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (projectId) => {
          const project: FramerProject = {
            id: projectId,
            elements: [],
          };

          const result = await scanFontsWithDetails(project);

          expect(result.totalElements).toBe(0);
          expect(result.successCount).toBe(0);
          expect(result.errorCount).toBe(0);
          expect(result.fonts).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it('scanner visits each element exactly once', async () => {
      await fc.assert(
        fc.asyncProperty(framerProjectArb, async (project) => {
          const result = await scanFontsWithDetails(project);

          // Get all element IDs that were processed (from fonts metadata)
          const processedElementIds = new Set<string>();
          for (const font of result.fonts) {
            for (const elementId of font.elements) {
              processedElementIds.add(elementId);
            }
          }

          // Count elements with typography in the project
          const elementsWithTypography = project.elements.filter(
            (el) => el.typography && el.typography.fontFamily.trim() !== ''
          );

          // The number of unique element IDs in fonts should match elements with valid typography
          expect(processedElementIds.size).toBe(elementsWithTypography.length);
        }),
        { numRuns: 100 }
      );
    });

    it('total elements matches input regardless of element types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }),
          async (elementCount) => {
            // Generate a project with exactly elementCount elements
            const elements: FramerElement[] = [];
            for (let i = 0; i < elementCount; i++) {
              // Alternate between elements with and without typography
              if (i % 2 === 0) {
                elements.push({
                  id: `element-${i}`,
                  type: 'text',
                  typography: {
                    fontFamily: `Font-${i}`,
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    letterSpacing: 0,
                  },
                });
              } else {
                elements.push({
                  id: `element-${i}`,
                  type: 'frame',
                });
              }
            }

            const project: FramerProject = {
              id: 'test-project',
              elements,
            };

            const result = await scanFontsWithDetails(project);

            // Scanner should report exactly elementCount total elements
            expect(result.totalElements).toBe(elementCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


describe('Property 2: Scanned Fonts Are Unique', () => {
  /**
   * Feature: typeflow-plugin, Property 2: Scanned Fonts Are Unique
   * **Validates: Requirements 2.2**
   *
   * For any completed font scan result, there should be no duplicate font family entries—
   * each font family appears at most once in the result list.
   */

  it('deduplicateFonts returns unique font families', () => {
    const fontMetadataArb: fc.Arbitrary<FontMetadata> = fc.record({
      family: fc.string({ minLength: 1, maxLength: 30 }),
      availableWeights: fc.array(fc.constantFrom(100, 200, 300, 400, 500, 600, 700, 800, 900), { minLength: 1, maxLength: 5 }),
      styles: fc.array(fc.constantFrom('normal', 'italic', 'oblique'), { minLength: 1, maxLength: 3 }),
      usageCount: fc.integer({ min: 1, max: 100 }),
      elements: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
    });

    fc.assert(
      fc.property(fc.array(fontMetadataArb, { minLength: 0, maxLength: 50 }), (fonts) => {
        const result = deduplicateFonts(fonts);

        // Extract all family names from result
        const families = result.map((f) => f.family);
        const uniqueFamilies = new Set(families);

        // Each font family should appear at most once
        expect(families.length).toBe(uniqueFamilies.size);
      }),
      { numRuns: 100 }
    );
  });

  it('scan result contains no duplicate font families', async () => {
    await fc.assert(
      fc.asyncProperty(framerProjectArb, async (project) => {
        const result = await scanFontsWithDetails(project);

        // Extract all family names from result
        const families = result.fonts.map((f) => f.family);
        const uniqueFamilies = new Set(families);

        // Each font family should appear at most once in the result
        expect(families.length).toBe(uniqueFamilies.size);
      }),
      { numRuns: 100 }
    );
  });

  it('duplicate font families are merged with combined weights and usage counts', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(fc.constantFrom(100, 200, 300, 400, 500, 600, 700, 800, 900), { minLength: 1, maxLength: 3 }),
        fc.array(fc.constantFrom(100, 200, 300, 400, 500, 600, 700, 800, 900), { minLength: 1, maxLength: 3 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (family, weights1, weights2, usage1, usage2) => {
          const fonts: FontMetadata[] = [
            {
              family,
              availableWeights: weights1,
              styles: ['normal'],
              usageCount: usage1,
              elements: ['elem1'],
            },
            {
              family,
              availableWeights: weights2,
              styles: ['italic'],
              usageCount: usage2,
              elements: ['elem2'],
            },
          ];

          const result = deduplicateFonts(fonts);

          // Should have exactly one entry for the family
          expect(result.length).toBe(1);
          expect(result[0].family).toBe(family);

          // Usage counts should be summed
          expect(result[0].usageCount).toBe(usage1 + usage2);

          // Weights should be combined (deduplicated)
          const expectedWeights = new Set([...weights1, ...weights2]);
          expect(new Set(result[0].availableWeights)).toEqual(expectedWeights);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Typography Extraction Completeness', () => {
  /**
   * Feature: typeflow-plugin, Property 3: Typography Extraction Completeness
   * **Validates: Requirements 2.3**
   *
   * For any element with typography properties, when the font scanner extracts metadata,
   * the resulting FontMetadata object should contain a non-empty font family, at least one
   * available weight, and a usage count of at least 1.
   */

  it('extracted FontMetadata has non-empty family, at least one weight, and usageCount >= 1', () => {
    fc.assert(
      fc.property(elementWithTypographyArb, (element) => {
        const result = extractFontFromElement(element);

        // If typography has a valid (non-empty) font family, result should not be null
        if (element.typography && element.typography.fontFamily.trim() !== '') {
          expect(result).not.toBeNull();

          if (result) {
            // Non-empty font family
            expect(result.family.length).toBeGreaterThan(0);
            expect(result.family.trim()).not.toBe('');

            // At least one available weight
            expect(result.availableWeights.length).toBeGreaterThanOrEqual(1);

            // Usage count of at least 1
            expect(result.usageCount).toBeGreaterThanOrEqual(1);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('extracted FontMetadata contains the element ID in elements array', () => {
    fc.assert(
      fc.property(elementWithTypographyArb, (element) => {
        const result = extractFontFromElement(element);

        if (result) {
          // The element ID should be included in the elements array
          expect(result.elements).toContain(element.id);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('extracted FontMetadata preserves the font family from typography', () => {
    fc.assert(
      fc.property(elementWithTypographyArb, (element) => {
        const result = extractFontFromElement(element);

        if (result && element.typography) {
          // The family should match the trimmed font family from typography
          expect(result.family).toBe(element.typography.fontFamily.trim());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('extracted FontMetadata includes the font weight from typography', () => {
    fc.assert(
      fc.property(elementWithTypographyArb, (element) => {
        const result = extractFontFromElement(element);

        if (result && element.typography) {
          // The weight from typography should be in availableWeights
          const expectedWeight = element.typography.fontWeight || 400;
          expect(result.availableWeights).toContain(expectedWeight);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 4 & 5: Scanner Resilience', () => {
  /**
   * Feature: typeflow-plugin, Property 4: Scanner Resilience to Non-Typography Elements
   * **Validates: Requirements 2.4**
   *
   * For any element without typography properties, the font scanner should skip it
   * without throwing an error and continue processing remaining elements.
   */

  describe('Property 4: Scanner Resilience to Non-Typography Elements', () => {
    it('extractFontFromElement returns null for elements without typography', () => {
      fc.assert(
        fc.property(elementWithoutTypographyArb, (element) => {
          // Should not throw an error
          const result = extractFontFromElement(element);

          // Should return null for elements without typography
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('scanner processes elements without typography without errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(elementWithoutTypographyArb, { minLength: 1, maxLength: 30 }),
          async (elements) => {
            const project: FramerProject = {
              id: 'test-project',
              elements,
            };

            // Should not throw an error
            const result = await scanFontsWithDetails(project);

            // All elements should be processed successfully
            expect(result.successCount).toBe(elements.length);
            expect(result.errorCount).toBe(0);

            // No fonts should be extracted (no typography)
            expect(result.fonts).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('scanner continues processing after encountering non-typography elements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(elementWithoutTypographyArb, { minLength: 1, maxLength: 10 }),
          fc.array(elementWithTypographyArb, { minLength: 1, maxLength: 10 }),
          async (withoutTypography, withTypography) => {
            // Interleave elements with and without typography
            const elements: FramerElement[] = [];
            const maxLen = Math.max(withoutTypography.length, withTypography.length);
            for (let i = 0; i < maxLen; i++) {
              if (i < withoutTypography.length) {
                elements.push(withoutTypography[i]);
              }
              if (i < withTypography.length) {
                elements.push(withTypography[i]);
              }
            }

            const project: FramerProject = {
              id: 'test-project',
              elements,
            };

            const result = await scanFontsWithDetails(project);

            // All elements should be processed
            expect(result.totalElements).toBe(elements.length);
            expect(result.successCount).toBe(elements.length);
            expect(result.errorCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: typeflow-plugin, Property 5: Scanner Error Recovery
   * **Validates: Requirements 2.7**
   *
   * For any scan operation where some elements fail to process, the scanner should still
   * return FontMetadata for all successfully processed elements, and the error count plus
   * success count should equal total elements attempted.
   */

  describe('Property 5: Scanner Error Recovery', () => {
    it('error count plus success count equals total elements', async () => {
      await fc.assert(
        fc.asyncProperty(framerProjectArb, async (project) => {
          const result = await scanFontsWithDetails(project);

          // errorCount + successCount should always equal totalElements
          expect(result.errorCount + result.successCount).toBe(result.totalElements);
        }),
        { numRuns: 100 }
      );
    });

    it('scanner returns fonts for successfully processed elements even with mixed input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(elementWithTypographyArb, { minLength: 1, maxLength: 20 }),
          fc.array(elementWithoutTypographyArb, { minLength: 0, maxLength: 20 }),
          async (withTypography, withoutTypography) => {
            const allElements = [...withTypography, ...withoutTypography];
            const project: FramerProject = {
              id: 'test-project',
              elements: allElements,
            };

            const result = await scanFontsWithDetails(project);

            // All elements should be processed (success, not errors for valid elements)
            expect(result.successCount).toBe(allElements.length);
            expect(result.errorCount).toBe(0);

            // Count elements with valid typography (non-empty font family)
            const validTypographyCount = withTypography.filter(
              (el) => el.typography && el.typography.fontFamily.trim() !== ''
            ).length;

            // Get unique font families from elements with valid typography
            const uniqueFamilies = new Set(
              withTypography
                .filter((el) => el.typography && el.typography.fontFamily.trim() !== '')
                .map((el) => el.typography!.fontFamily.trim())
            );

            // Result should have fonts for unique families
            expect(result.fonts.length).toBe(uniqueFamilies.size);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('total elements in result matches project elements count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          async (elementCount) => {
            const elements: FramerElement[] = [];
            for (let i = 0; i < elementCount; i++) {
              elements.push({
                id: `element-${i}`,
                type: i % 2 === 0 ? 'text' : 'frame',
                ...(i % 2 === 0
                  ? {
                      typography: {
                        fontFamily: `Font-${i % 5}`,
                        fontSize: 16,
                        fontWeight: 400,
                        lineHeight: 1.5,
                        letterSpacing: 0,
                      },
                    }
                  : {}),
              });
            }

            const project: FramerProject = {
              id: 'test-project',
              elements,
            };

            const result = await scanFontsWithDetails(project);

            // Total elements should match input
            expect(result.totalElements).toBe(elementCount);

            // Success + error should equal total
            expect(result.successCount + result.errorCount).toBe(result.totalElements);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('errors array length matches errorCount', async () => {
      await fc.assert(
        fc.asyncProperty(framerProjectArb, async (project) => {
          const result = await scanFontsWithDetails(project);

          // The errors array length should match errorCount
          expect(result.errors.length).toBe(result.errorCount);
        }),
        { numRuns: 100 }
      );
    });
  });
});
