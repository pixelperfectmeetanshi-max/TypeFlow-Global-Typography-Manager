/**
 * TypeFlow Plugin - useFontScanner Hook Tests
 *
 * Unit tests for the useFontScanner custom hook.
 * Tests scanning state transitions and error handling.
 *
 * **Validates: Requirements 2.5, 2.6**
 * - 2.5: WHILE scanning is in progress, display a loading indicator (isScanning state)
 * - 2.6: WHEN scanning completes, display the list of discovered fonts (scannedFonts state)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFontScanner } from './useFontScanner';
import { FramerProject, FontMetadata } from '../types/typography';

// Mock the scanFonts module
vi.mock('../features/scanFonts', () => ({
  scanFonts: vi.fn(),
}));

import { scanFonts } from '../features/scanFonts';

const mockScanFonts = vi.mocked(scanFonts);

describe('useFontScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty scannedFonts array', () => {
      const { result } = renderHook(() => useFontScanner());

      expect(result.current.scannedFonts).toEqual([]);
    });

    it('should initialize with isScanning as false', () => {
      const { result } = renderHook(() => useFontScanner());

      expect(result.current.isScanning).toBe(false);
    });

    it('should initialize with error as null', () => {
      const { result } = renderHook(() => useFontScanner());

      expect(result.current.error).toBeNull();
    });
  });

  describe('scanning state transitions', () => {
    /**
     * **Validates: Requirement 2.5**
     * WHILE scanning is in progress, display a loading indicator
     */
    it('should set isScanning to true when scan starts', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: FontMetadata[]) => void;
      const scanPromise = new Promise<FontMetadata[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockScanFonts.mockReturnValue(scanPromise);

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      // Start the scan but don't await it
      act(() => {
        result.current.scan(project);
      });

      // isScanning should be true while scan is in progress
      expect(result.current.isScanning).toBe(true);

      // Resolve the promise to complete the scan
      await act(async () => {
        resolvePromise!([]);
      });

      // isScanning should be false after scan completes
      expect(result.current.isScanning).toBe(false);
    });

    it('should set isScanning to false when scan completes successfully', async () => {
      const mockFonts: FontMetadata[] = [
        {
          family: 'Inter',
          availableWeights: [400, 700],
          styles: ['normal'],
          usageCount: 3,
          elements: ['el1', 'el2', 'el3'],
        },
      ];
      mockScanFonts.mockResolvedValue(mockFonts);

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.isScanning).toBe(false);
    });

    it('should set isScanning to false when scan fails', async () => {
      mockScanFonts.mockRejectedValue(new Error('Scan failed'));

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.isScanning).toBe(false);
    });

    /**
     * **Validates: Requirement 2.6**
     * WHEN scanning completes, display the list of discovered fonts
     */
    it('should update scannedFonts with results when scan completes', async () => {
      const mockFonts: FontMetadata[] = [
        {
          family: 'Inter',
          availableWeights: [400, 700],
          styles: ['normal'],
          usageCount: 3,
          elements: ['el1', 'el2', 'el3'],
        },
        {
          family: 'Roboto',
          availableWeights: [300, 400, 500],
          styles: ['normal', 'italic'],
          usageCount: 2,
          elements: ['el4', 'el5'],
        },
      ];
      mockScanFonts.mockResolvedValue(mockFonts);

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.scannedFonts).toEqual(mockFonts);
      expect(result.current.scannedFonts).toHaveLength(2);
    });

    it('should clear previous error when starting a new scan', async () => {
      // First scan fails
      mockScanFonts.mockRejectedValueOnce(new Error('First scan failed'));

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.error).toBe('First scan failed');

      // Second scan succeeds
      mockScanFonts.mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error message when scan throws an Error', async () => {
      const errorMessage = 'Failed to access project elements';
      mockScanFonts.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should set generic error message for non-Error exceptions', async () => {
      mockScanFonts.mockRejectedValue('string error');

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.error).toBe('An unknown error occurred during font scanning');
    });

    it('should not update scannedFonts when scan fails', async () => {
      // First successful scan
      const mockFonts: FontMetadata[] = [
        {
          family: 'Inter',
          availableWeights: [400],
          styles: ['normal'],
          usageCount: 1,
          elements: ['el1'],
        },
      ];
      mockScanFonts.mockResolvedValueOnce(mockFonts);

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.scannedFonts).toEqual(mockFonts);

      // Second scan fails
      mockScanFonts.mockRejectedValueOnce(new Error('Scan failed'));

      await act(async () => {
        await result.current.scan(project);
      });

      // scannedFonts should still have the previous results
      expect(result.current.scannedFonts).toEqual(mockFonts);
    });

    it('should log error to console when scan fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Scan error');
      mockScanFonts.mockRejectedValue(error);

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(consoleSpy).toHaveBeenCalledWith('[TypeFlow] Font scan error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('reset functionality', () => {
    it('should clear scannedFonts when reset is called', async () => {
      const mockFonts: FontMetadata[] = [
        {
          family: 'Inter',
          availableWeights: [400],
          styles: ['normal'],
          usageCount: 1,
          elements: ['el1'],
        },
      ];
      mockScanFonts.mockResolvedValue(mockFonts);

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.scannedFonts).toHaveLength(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.scannedFonts).toEqual([]);
    });

    it('should clear error when reset is called', async () => {
      mockScanFonts.mockRejectedValue(new Error('Scan failed'));

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = { id: 'test-project', elements: [] };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(result.current.error).toBe('Scan failed');

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set isScanning to false when reset is called', () => {
      const { result } = renderHook(() => useFontScanner());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isScanning).toBe(false);
    });
  });

  describe('scan function stability', () => {
    it('should maintain stable scan function reference across renders', () => {
      const { result, rerender } = renderHook(() => useFontScanner());

      const scanFn1 = result.current.scan;
      rerender();
      const scanFn2 = result.current.scan;

      expect(scanFn1).toBe(scanFn2);
    });

    it('should maintain stable reset function reference across renders', () => {
      const { result, rerender } = renderHook(() => useFontScanner());

      const resetFn1 = result.current.reset;
      rerender();
      const resetFn2 = result.current.reset;

      expect(resetFn1).toBe(resetFn2);
    });
  });

  describe('scan with project data', () => {
    it('should pass project to scanFonts function', async () => {
      mockScanFonts.mockResolvedValue([]);

      const { result } = renderHook(() => useFontScanner());
      const project: FramerProject = {
        id: 'my-project',
        elements: [
          { id: 'el1', type: 'text', typography: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 } },
          { id: 'el2', type: 'frame' },
        ],
      };

      await act(async () => {
        await result.current.scan(project);
      });

      expect(mockScanFonts).toHaveBeenCalledWith(project);
      expect(mockScanFonts).toHaveBeenCalledTimes(1);
    });
  });
});
