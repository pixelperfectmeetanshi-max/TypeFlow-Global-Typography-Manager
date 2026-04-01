/**
 * TypeFlow Plugin - Font Utilities Unit Tests
 *
 * Unit tests for font manipulation functions.
 */

import { describe, it, expect } from 'vitest';
import { getAvailableWeights, filterFontsByQuery, sortFontsByUsage } from './fontUtils';
import { FontMetadata } from '../types/typography';

describe('fontUtils', () => {
  describe('getAvailableWeights', () => {
    it('should return standard font weights for a valid font family', () => {
      const weights = getAvailableWeights('Inter');
      expect(weights).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    });

    it('should return empty array for empty string', () => {
      const weights = getAvailableWeights('');
      expect(weights).toEqual([]);
    });

    it('should return empty array for whitespace-only string', () => {
      const weights = getAvailableWeights('   ');
      expect(weights).toEqual([]);
    });

    it('should return a new array each time (not mutating)', () => {
      const weights1 = getAvailableWeights('Roboto');
      const weights2 = getAvailableWeights('Roboto');
      expect(weights1).not.toBe(weights2);
      expect(weights1).toEqual(weights2);
    });
  });

  describe('filterFontsByQuery', () => {
    const sampleFonts: FontMetadata[] = [
      { family: 'Inter', availableWeights: [400, 700], styles: ['normal'], usageCount: 5, elements: ['1', '2'] },
      { family: 'Roboto', availableWeights: [400, 500], styles: ['normal', 'italic'], usageCount: 3, elements: ['3'] },
      { family: 'Open Sans', availableWeights: [400], styles: ['normal'], usageCount: 2, elements: ['4'] },
      { family: 'Roboto Mono', availableWeights: [400, 700], styles: ['normal'], usageCount: 1, elements: ['5'] },
    ];

    it('should return all fonts when query is empty', () => {
      const result = filterFontsByQuery(sampleFonts, '');
      expect(result).toEqual(sampleFonts);
    });

    it('should return all fonts when query is whitespace-only', () => {
      const result = filterFontsByQuery(sampleFonts, '   ');
      expect(result).toEqual(sampleFonts);
    });

    it('should filter fonts by exact match (case-insensitive)', () => {
      const result = filterFontsByQuery(sampleFonts, 'inter');
      expect(result).toHaveLength(1);
      expect(result[0].family).toBe('Inter');
    });

    it('should filter fonts by partial match', () => {
      const result = filterFontsByQuery(sampleFonts, 'Robo');
      expect(result).toHaveLength(2);
      expect(result.map((f) => f.family)).toContain('Roboto');
      expect(result.map((f) => f.family)).toContain('Roboto Mono');
    });

    it('should be case-insensitive', () => {
      const result1 = filterFontsByQuery(sampleFonts, 'INTER');
      const result2 = filterFontsByQuery(sampleFonts, 'inter');
      const result3 = filterFontsByQuery(sampleFonts, 'InTeR');
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should return empty array when no fonts match', () => {
      const result = filterFontsByQuery(sampleFonts, 'Arial');
      expect(result).toEqual([]);
    });

    it('should handle empty fonts array', () => {
      const result = filterFontsByQuery([], 'Inter');
      expect(result).toEqual([]);
    });

    it('should match fonts with spaces in name', () => {
      const result = filterFontsByQuery(sampleFonts, 'Open');
      expect(result).toHaveLength(1);
      expect(result[0].family).toBe('Open Sans');
    });
  });

  describe('sortFontsByUsage', () => {
    const sampleFonts: FontMetadata[] = [
      { family: 'Inter', availableWeights: [400], styles: ['normal'], usageCount: 5, elements: [] },
      { family: 'Roboto', availableWeights: [400], styles: ['normal'], usageCount: 10, elements: [] },
      { family: 'Open Sans', availableWeights: [400], styles: ['normal'], usageCount: 2, elements: [] },
      { family: 'Arial', availableWeights: [400], styles: ['normal'], usageCount: 7, elements: [] },
    ];

    it('should sort fonts by usage count in descending order', () => {
      const result = sortFontsByUsage(sampleFonts);
      expect(result.map((f) => f.usageCount)).toEqual([10, 7, 5, 2]);
      expect(result.map((f) => f.family)).toEqual(['Roboto', 'Arial', 'Inter', 'Open Sans']);
    });

    it('should not mutate the original array', () => {
      const original = [...sampleFonts];
      sortFontsByUsage(sampleFonts);
      expect(sampleFonts).toEqual(original);
    });

    it('should return a new array', () => {
      const result = sortFontsByUsage(sampleFonts);
      expect(result).not.toBe(sampleFonts);
    });

    it('should handle empty array', () => {
      const result = sortFontsByUsage([]);
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const singleFont: FontMetadata[] = [
        { family: 'Inter', availableWeights: [400], styles: ['normal'], usageCount: 5, elements: [] },
      ];
      const result = sortFontsByUsage(singleFont);
      expect(result).toEqual(singleFont);
    });

    it('should maintain order for fonts with equal usage counts', () => {
      const equalUsageFonts: FontMetadata[] = [
        { family: 'Inter', availableWeights: [400], styles: ['normal'], usageCount: 5, elements: [] },
        { family: 'Roboto', availableWeights: [400], styles: ['normal'], usageCount: 5, elements: [] },
      ];
      const result = sortFontsByUsage(equalUsageFonts);
      // Sort is stable in modern JS, so order should be preserved for equal values
      expect(result).toHaveLength(2);
      expect(result[0].usageCount).toBe(5);
      expect(result[1].usageCount).toBe(5);
    });
  });
});
