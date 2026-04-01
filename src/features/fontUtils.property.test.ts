/**
 * TypeFlow Plugin - Font Utilities Property Tests
 *
 * Property-based tests for font filtering functions.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin, Property 7: Font Search Filtering
 * **Validates: Requirements 3.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterFontsByQuery } from './fontUtils';
import { FontMetadata, FontStyle } from '../types/typography';

/**
 * Arbitrary for generating valid FontMetadata objects
 */
const fontMetadataArb = fc.record({
  family: fc.string({ minLength: 1, maxLength: 50 }),
  availableWeights: fc.array(
    fc.integer({ min: 100, max: 900 }),
    { minLength: 1, maxLength: 9 }
  ),
  styles: fc.array(
    fc.constantFrom<FontStyle>('normal', 'italic', 'oblique'),
    { minLength: 1, maxLength: 3 }
  ),
  usageCount: fc.integer({ min: 0, max: 1000 }),
  elements: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
});

/**
 * Arbitrary for generating arrays of FontMetadata
 */
const fontListArb = fc.array(fontMetadataArb, { minLength: 0, maxLength: 20 });

/**
 * Arbitrary for generating search query strings
 */
const searchQueryArb = fc.string({ minLength: 0, maxLength: 30 });

describe('fontUtils property tests', () => {
  describe('Property 7: Font Search Filtering', () => {
    /**
     * Feature: typeflow-plugin, Property 7: Font Search Filtering
     * **Validates: Requirements 3.6**
     *
     * For any search query string and list of fonts, the filtered result should
     * only contain fonts whose family name includes the query string (case-insensitive),
     * and all matching fonts should be included.
     */

    it('filtered result only contains fonts whose family name includes the query (case-insensitive)', () => {
      fc.assert(
        fc.property(fontListArb, searchQueryArb, (fonts, query) => {
          const result = filterFontsByQuery(fonts, query);

          // All fonts in result should have family names that include the query (case-insensitive)
          const normalizedQuery = query.toLowerCase().trim();
          
          // If query is empty or whitespace, all fonts should be returned
          if (normalizedQuery === '') {
            expect(result).toEqual(fonts);
            return;
          }

          // Every font in result must contain the query in its family name
          for (const font of result) {
            expect(font.family.toLowerCase()).toContain(normalizedQuery);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('all matching fonts should be included in the result', () => {
      fc.assert(
        fc.property(fontListArb, searchQueryArb, (fonts, query) => {
          const result = filterFontsByQuery(fonts, query);
          
          // If query is empty or whitespace-only, all fonts should be returned
          if (!query || query.trim() === '') {
            expect(result.length).toBe(fonts.length);
            return;
          }

          // The implementation uses the query as-is (lowercased but not trimmed) for matching
          const normalizedQuery = query.toLowerCase();

          // Count how many fonts should match
          const expectedMatches = fonts.filter((font) =>
            font.family.toLowerCase().includes(normalizedQuery)
          );

          // Result should contain exactly the matching fonts
          expect(result.length).toBe(expectedMatches.length);

          // Every matching font from original list should be in result
          for (const expectedFont of expectedMatches) {
            expect(result).toContainEqual(expectedFont);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('filtering is case-insensitive', () => {
      fc.assert(
        fc.property(fontListArb, searchQueryArb, (fonts, query) => {
          // Skip empty queries
          fc.pre(query.trim().length > 0);

          const lowerResult = filterFontsByQuery(fonts, query.toLowerCase());
          const upperResult = filterFontsByQuery(fonts, query.toUpperCase());
          const mixedResult = filterFontsByQuery(fonts, query);

          // All case variations should produce the same result
          expect(lowerResult).toEqual(upperResult);
          expect(lowerResult).toEqual(mixedResult);
        }),
        { numRuns: 100 }
      );
    });

    it('empty query returns all fonts', () => {
      fc.assert(
        fc.property(fontListArb, (fonts) => {
          const resultEmpty = filterFontsByQuery(fonts, '');
          const resultWhitespace = filterFontsByQuery(fonts, '   ');

          expect(resultEmpty).toEqual(fonts);
          expect(resultWhitespace).toEqual(fonts);
        }),
        { numRuns: 100 }
      );
    });

    it('result is a subset of the original font list', () => {
      fc.assert(
        fc.property(fontListArb, searchQueryArb, (fonts, query) => {
          const result = filterFontsByQuery(fonts, query);

          // Result length should never exceed original list length
          expect(result.length).toBeLessThanOrEqual(fonts.length);

          // Every font in result should exist in original list
          for (const font of result) {
            expect(fonts).toContainEqual(font);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('filtering preserves font order from original list', () => {
      fc.assert(
        fc.property(fontListArb, searchQueryArb, (fonts, query) => {
          const result = filterFontsByQuery(fonts, query);

          // Get indices of result fonts in original list
          const resultIndices = result.map((font) =>
            fonts.findIndex(
              (f) =>
                f.family === font.family &&
                f.usageCount === font.usageCount &&
                JSON.stringify(f.elements) === JSON.stringify(font.elements)
            )
          );

          // Indices should be in ascending order (preserves original order)
          for (let i = 1; i < resultIndices.length; i++) {
            expect(resultIndices[i]).toBeGreaterThan(resultIndices[i - 1]);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('query substring matching works correctly', () => {
      fc.assert(
        fc.property(
          fontListArb,
          fc.string({ minLength: 1, maxLength: 10 }),
          (fonts, substring) => {
            // Create a font with a known family name containing the substring
            const knownFont: FontMetadata = {
              family: `Prefix${substring}Suffix`,
              availableWeights: [400],
              styles: ['normal'],
              usageCount: 1,
              elements: [],
            };

            const fontsWithKnown = [...fonts, knownFont];
            const result = filterFontsByQuery(fontsWithKnown, substring);

            // The known font should always be in the result
            expect(result).toContainEqual(knownFont);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
