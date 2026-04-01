/**
 * Unit tests for typography type definitions
 * 
 * Validates: Requirements 10.2
 * - Test type exports are accessible
 * - Test type compatibility with expected shapes
 */

import { describe, it, expect } from 'vitest';
import {
  TypographyStyle,
  FontStyle,
  FontMetadata,
  TypographyPreset,
  ErrorCode,
  AppError,
  FramerElement,
  FramerProject,
} from './typography';

describe('Typography Type Definitions', () => {
  describe('TypographyStyle', () => {
    it('should accept valid typography style objects', () => {
      const style: TypographyStyle = {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: 0,
      };

      expect(style.fontFamily).toBe('Inter');
      expect(style.fontSize).toBe(16);
      expect(style.fontWeight).toBe(400);
      expect(style.lineHeight).toBe(1.5);
      expect(style.letterSpacing).toBe(0);
    });

    it('should accept various font weight values', () => {
      const lightStyle: TypographyStyle = {
        fontFamily: 'Roboto',
        fontSize: 14,
        fontWeight: 100,
        lineHeight: 1.4,
        letterSpacing: 0.5,
      };

      const boldStyle: TypographyStyle = {
        fontFamily: 'Roboto',
        fontSize: 14,
        fontWeight: 900,
        lineHeight: 1.4,
        letterSpacing: 0.5,
      };

      expect(lightStyle.fontWeight).toBe(100);
      expect(boldStyle.fontWeight).toBe(900);
    });
  });

  describe('FontStyle', () => {
    it('should accept valid font style values', () => {
      const normalStyle: FontStyle = 'normal';
      const italicStyle: FontStyle = 'italic';
      const obliqueStyle: FontStyle = 'oblique';

      expect(normalStyle).toBe('normal');
      expect(italicStyle).toBe('italic');
      expect(obliqueStyle).toBe('oblique');
    });
  });


  describe('FontMetadata', () => {
    it('should accept valid font metadata objects', () => {
      const metadata: FontMetadata = {
        family: 'Inter',
        availableWeights: [400, 500, 600, 700],
        styles: ['normal', 'italic'],
        usageCount: 5,
        elements: ['element-1', 'element-2'],
      };

      expect(metadata.family).toBe('Inter');
      expect(metadata.availableWeights).toEqual([400, 500, 600, 700]);
      expect(metadata.styles).toContain('normal');
      expect(metadata.styles).toContain('italic');
      expect(metadata.usageCount).toBe(5);
      expect(metadata.elements).toHaveLength(2);
    });

    it('should accept empty arrays for weights, styles, and elements', () => {
      const metadata: FontMetadata = {
        family: 'CustomFont',
        availableWeights: [],
        styles: [],
        usageCount: 0,
        elements: [],
      };

      expect(metadata.availableWeights).toHaveLength(0);
      expect(metadata.styles).toHaveLength(0);
      expect(metadata.elements).toHaveLength(0);
    });
  });

  describe('TypographyPreset', () => {
    it('should accept valid typography preset objects', () => {
      const now = Date.now();
      const preset: TypographyPreset = {
        id: 'preset-1',
        name: 'Heading Style',
        style: {
          fontFamily: 'Montserrat',
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: -0.5,
        },
        createdAt: now,
        updatedAt: now,
      };

      expect(preset.id).toBe('preset-1');
      expect(preset.name).toBe('Heading Style');
      expect(preset.style.fontFamily).toBe('Montserrat');
      expect(preset.createdAt).toBe(now);
      expect(preset.updatedAt).toBe(now);
    });
  });


  describe('ErrorCode', () => {
    it('should have all expected error code values', () => {
      expect(ErrorCode.INITIALIZATION_FAILED).toBe('INITIALIZATION_FAILED');
      expect(ErrorCode.SCAN_FAILED).toBe('SCAN_FAILED');
      expect(ErrorCode.APPLY_FAILED).toBe('APPLY_FAILED');
      expect(ErrorCode.FRAMER_API_UNAVAILABLE).toBe('FRAMER_API_UNAVAILABLE');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.PRESET_SAVE_FAILED).toBe('PRESET_SAVE_FAILED');
      expect(ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });

    it('should be usable as object keys', () => {
      const errorMessages: Record<ErrorCode, string> = {
        [ErrorCode.INITIALIZATION_FAILED]: 'Failed to initialize',
        [ErrorCode.SCAN_FAILED]: 'Failed to scan',
        [ErrorCode.APPLY_FAILED]: 'Failed to apply',
        [ErrorCode.FRAMER_API_UNAVAILABLE]: 'Framer API unavailable',
        [ErrorCode.VALIDATION_ERROR]: 'Validation error',
        [ErrorCode.PRESET_SAVE_FAILED]: 'Failed to save preset',
        [ErrorCode.UNKNOWN_ERROR]: 'Unknown error',
      };

      expect(errorMessages[ErrorCode.INITIALIZATION_FAILED]).toBe('Failed to initialize');
    });
  });

  describe('AppError', () => {
    it('should accept valid app error objects', () => {
      const error: AppError = {
        code: ErrorCode.SCAN_FAILED,
        message: 'Failed to scan project fonts',
        recoverable: true,
      };

      expect(error.code).toBe(ErrorCode.SCAN_FAILED);
      expect(error.message).toBe('Failed to scan project fonts');
      expect(error.recoverable).toBe(true);
    });

    it('should accept app error with optional details', () => {
      const error: AppError = {
        code: ErrorCode.APPLY_FAILED,
        message: 'Failed to apply typography',
        details: { elementId: 'elem-1', reason: 'Element not found' },
        recoverable: false,
      };

      expect(error.details).toEqual({ elementId: 'elem-1', reason: 'Element not found' });
      expect(error.recoverable).toBe(false);
    });
  });


  describe('FramerElement', () => {
    it('should accept valid framer element objects', () => {
      const element: FramerElement = {
        id: 'element-123',
        type: 'text',
        typography: {
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 500,
          lineHeight: 1.6,
          letterSpacing: 0.2,
        },
      };

      expect(element.id).toBe('element-123');
      expect(element.type).toBe('text');
      expect(element.typography?.fontFamily).toBe('Arial');
    });

    it('should accept framer element without typography', () => {
      const element: FramerElement = {
        id: 'element-456',
        type: 'frame',
      };

      expect(element.id).toBe('element-456');
      expect(element.type).toBe('frame');
      expect(element.typography).toBeUndefined();
    });
  });

  describe('FramerProject', () => {
    it('should accept valid framer project objects', () => {
      const project: FramerProject = {
        id: 'project-abc',
        elements: [
          { id: 'elem-1', type: 'text' },
          { id: 'elem-2', type: 'frame' },
        ],
      };

      expect(project.id).toBe('project-abc');
      expect(project.elements).toHaveLength(2);
    });

    it('should accept framer project with empty elements array', () => {
      const project: FramerProject = {
        id: 'empty-project',
        elements: [],
      };

      expect(project.id).toBe('empty-project');
      expect(project.elements).toHaveLength(0);
    });
  });

  describe('Type Exports', () => {
    it('should export all required types', () => {
      // Verify types are importable by using them
      const style: TypographyStyle = {
        fontFamily: 'Test',
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: 0,
      };
      const fontStyle: FontStyle = 'normal';
      const metadata: FontMetadata = {
        family: 'Test',
        availableWeights: [],
        styles: [],
        usageCount: 0,
        elements: [],
      };
      const preset: TypographyPreset = {
        id: '1',
        name: 'Test',
        style,
        createdAt: 0,
        updatedAt: 0,
      };
      const error: AppError = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Test',
        recoverable: true,
      };
      const element: FramerElement = { id: '1', type: 'text' };
      const project: FramerProject = { id: '1', elements: [] };

      // All types should be usable without TypeScript errors
      expect(style).toBeDefined();
      expect(fontStyle).toBeDefined();
      expect(metadata).toBeDefined();
      expect(preset).toBeDefined();
      expect(error).toBeDefined();
      expect(element).toBeDefined();
      expect(project).toBeDefined();
    });
  });
});
