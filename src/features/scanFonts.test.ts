/**
 * TypeFlow Plugin - Font Scanning Unit Tests
 *
 * Unit tests for the scanFonts module covering:
 * - extractFontFromElement function
 * - deduplicateFonts function
 * - scanFonts function
 * - Error handling and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractFontFromElement,
  deduplicateFonts,
  scanFonts,
  scanFontsWithDetails,
} from './scanFonts';
import { FramerElement, FramerProject, FontMetadata } from '../types/typography';

describe('extractFontFromElement', () => {
  describe('elements with typography', () => {
    it('should extract font metadata from element with typography', () => {
      const element: FramerElement = {
        id: 'element-1',
        type: 'text',
        typography: {
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: 0,
        },
      };

      const result = extractFontFromElement(element);

      expect(result).not.toBeNull();
      expect(result!.family).toBe('Inter');
      expect(result!.availableWeights).toContain(400);
      expect(result!.usageCount).toBe(1);
      expect(result!.elements).toContain('element-1');
    });

    it('should use default weight 400 when fontWeight is not specified', () => {
      const element: FramerElement = {
        id: 'element-2',
        type: 'text',
        typography: {
          fontFamily: 'Roboto',
          fontSize: 14,
          fontWeight: 0, // Falsy value
          lineHeight: 1.4,
          letterSpacing: 0,
        },
      };

      const result = extractFontFromElement(element);

      expect(result).not.toBeNull();
      expect(result!.availableWeights).toContain(400);
    });

    it('should trim whitespace from font family name', () => {
      const element: FramerElement = {
        id: 'element-3',
        type: 'text',
        typography: {
          fontFamily: '  Open Sans  ',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.5,
          letterSpacing: 0,
        },
      };

      const result = extractFontFromElement(element);

      expect(result).not.toBeNull();
      expect(result!.family).toBe('Open Sans');
    });

    it('should include default normal style', () => {
      const element: FramerElement = {
        id: 'element-4',
        type: 'text',
        typography: {
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: 1,
        },
      };

      const result = extractFontFromElement(element);

      expect(result).not.toBeNull();
      expect(result!.styles).toContain('normal');
    });
  });

  describe('elements without typography', () => {
    it('should return null for element without typography property', () => {
      const element: FramerElement = {
        id: 'element-5',
        type: 'frame',
      };

      const result = extractFontFromElement(element);

      expect(result).toBeNull();
    });

    it('should return null for element with undefined typography', () => {
      const element: FramerElement = {
        id: 'element-6',
        type: 'image',
        typography: undefined,
      };

      const result = extractFontFromElement(element);

      expect(result).toBeNull();
    });
  });

  describe('invalid typography data', () => {
    it('should return null for empty font family', () => {
      const element: FramerElement = {
        id: 'element-7',
        type: 'text',
        typography: {
          fontFamily: '',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: 0,
        },
      };

      const result = extractFontFromElement(element);

      expect(result).toBeNull();
    });

    it('should return null for whitespace-only font family', () => {
      const element: FramerElement = {
        id: 'element-8',
        type: 'text',
        typography: {
          fontFamily: '   ',
          fontSize: 16,
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: 0,
        },
      };

      const result = extractFontFromElement(element);

      expect(result).toBeNull();
    });
  });
});

describe('deduplicateFonts', () => {
  it('should return empty array for empty input', () => {
    const result = deduplicateFonts([]);

    expect(result).toEqual([]);
  });

  it('should return single font unchanged', () => {
    const fonts: FontMetadata[] = [
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-1'],
      },
    ];

    const result = deduplicateFonts(fonts);

    expect(result).toHaveLength(1);
    expect(result[0].family).toBe('Inter');
  });

  it('should merge fonts with same family', () => {
    const fonts: FontMetadata[] = [
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-1'],
      },
      {
        family: 'Inter',
        availableWeights: [700],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-2'],
      },
    ];

    const result = deduplicateFonts(fonts);

    expect(result).toHaveLength(1);
    expect(result[0].family).toBe('Inter');
    expect(result[0].availableWeights).toContain(400);
    expect(result[0].availableWeights).toContain(700);
    expect(result[0].usageCount).toBe(2);
    expect(result[0].elements).toContain('el-1');
    expect(result[0].elements).toContain('el-2');
  });

  it('should keep different font families separate', () => {
    const fonts: FontMetadata[] = [
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-1'],
      },
      {
        family: 'Roboto',
        availableWeights: [500],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-2'],
      },
    ];

    const result = deduplicateFonts(fonts);

    expect(result).toHaveLength(2);
    const families = result.map((f) => f.family);
    expect(families).toContain('Inter');
    expect(families).toContain('Roboto');
  });

  it('should deduplicate weights within merged fonts', () => {
    const fonts: FontMetadata[] = [
      {
        family: 'Inter',
        availableWeights: [400, 500],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-1'],
      },
      {
        family: 'Inter',
        availableWeights: [400, 700],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-2'],
      },
    ];

    const result = deduplicateFonts(fonts);

    expect(result).toHaveLength(1);
    expect(result[0].availableWeights).toEqual([400, 500, 700]); // Sorted and deduplicated
  });

  it('should deduplicate styles within merged fonts', () => {
    const fonts: FontMetadata[] = [
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal', 'italic'],
        usageCount: 1,
        elements: ['el-1'],
      },
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal', 'oblique'],
        usageCount: 1,
        elements: ['el-2'],
      },
    ];

    const result = deduplicateFonts(fonts);

    expect(result).toHaveLength(1);
    expect(result[0].styles).toContain('normal');
    expect(result[0].styles).toContain('italic');
    expect(result[0].styles).toContain('oblique');
  });

  it('should deduplicate element IDs within merged fonts', () => {
    const fonts: FontMetadata[] = [
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-1', 'el-2'],
      },
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-2', 'el-3'],
      },
    ];

    const result = deduplicateFonts(fonts);

    expect(result).toHaveLength(1);
    expect(result[0].elements).toHaveLength(3);
    expect(result[0].elements).toContain('el-1');
    expect(result[0].elements).toContain('el-2');
    expect(result[0].elements).toContain('el-3');
  });

  it('should not mutate original font array', () => {
    const fonts: FontMetadata[] = [
      {
        family: 'Inter',
        availableWeights: [400],
        styles: ['normal'],
        usageCount: 1,
        elements: ['el-1'],
      },
    ];
    const originalLength = fonts.length;
    const originalFamily = fonts[0].family;

    deduplicateFonts(fonts);

    expect(fonts).toHaveLength(originalLength);
    expect(fonts[0].family).toBe(originalFamily);
  });
});

describe('scanFonts', () => {
  it('should return empty array for project with no elements', async () => {
    const project: FramerProject = {
      id: 'project-1',
      elements: [],
    };

    const result = await scanFonts(project);

    expect(result).toEqual([]);
  });

  it('should scan all elements and return unique fonts', async () => {
    const project: FramerProject = {
      id: 'project-2',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-2',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-3',
          type: 'text',
          typography: {
            fontFamily: 'Roboto',
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: 0,
          },
        },
      ],
    };

    const result = await scanFonts(project);

    expect(result).toHaveLength(2);
    const families = result.map((f) => f.family);
    expect(families).toContain('Inter');
    expect(families).toContain('Roboto');
  });

  it('should skip elements without typography', async () => {
    const project: FramerProject = {
      id: 'project-3',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-2',
          type: 'frame',
          // No typography
        },
        {
          id: 'el-3',
          type: 'image',
          // No typography
        },
      ],
    };

    const result = await scanFonts(project);

    expect(result).toHaveLength(1);
    expect(result[0].family).toBe('Inter');
  });

  it('should handle project with only non-typography elements', async () => {
    const project: FramerProject = {
      id: 'project-4',
      elements: [
        { id: 'el-1', type: 'frame' },
        { id: 'el-2', type: 'image' },
        { id: 'el-3', type: 'rectangle' },
      ],
    };

    const result = await scanFonts(project);

    expect(result).toEqual([]);
  });
});

describe('scanFontsWithDetails', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return detailed scan results', async () => {
    const project: FramerProject = {
      id: 'project-5',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-2',
          type: 'frame',
        },
      ],
    };

    const result = await scanFontsWithDetails(project);

    expect(result.totalElements).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.fonts).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should track success and error counts correctly', async () => {
    const project: FramerProject = {
      id: 'project-6',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-2',
          type: 'text',
          typography: {
            fontFamily: 'Roboto',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-3',
          type: 'frame',
        },
      ],
    };

    const result = await scanFontsWithDetails(project);

    expect(result.totalElements).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.errorCount).toBe(0);
    expect(result.fonts).toHaveLength(2);
  });

  it('should merge usage counts for same font family', async () => {
    const project: FramerProject = {
      id: 'project-7',
      elements: [
        {
          id: 'el-1',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-2',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: 0,
          },
        },
        {
          id: 'el-3',
          type: 'text',
          typography: {
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.6,
            letterSpacing: 0.5,
          },
        },
      ],
    };

    const result = await scanFontsWithDetails(project);

    expect(result.fonts).toHaveLength(1);
    expect(result.fonts[0].family).toBe('Inter');
    expect(result.fonts[0].usageCount).toBe(3);
    expect(result.fonts[0].elements).toHaveLength(3);
    expect(result.fonts[0].availableWeights).toContain(300);
    expect(result.fonts[0].availableWeights).toContain(400);
    expect(result.fonts[0].availableWeights).toContain(700);
  });
});
