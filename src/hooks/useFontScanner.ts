/**
 * TypeFlow Plugin - Font Scanner Hook
 *
 * Custom React hook for managing font scanning state and operations.
 * Provides scanning functionality, state management, and error handling.
 *
 * **Validates: Requirements 2.5, 2.6**
 * - 2.5: WHILE scanning is in progress, display a loading indicator (isScanning state)
 * - 2.6: WHEN scanning completes, display the list of discovered fonts (scannedFonts state)
 */

import { useState, useCallback } from 'react';
import { FontMetadata, FramerProject } from '../types/typography';
import { scanFonts } from '../features/scanFonts';

/**
 * Return type for the useFontScanner hook
 */
export interface UseFontScannerReturn {
  scannedFonts: FontMetadata[];
  isScanning: boolean;
  error: string | null;
  scan: (project: FramerProject) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing font scanning operations.
 *
 * Provides:
 * - `scannedFonts`: Array of discovered font metadata
 * - `isScanning`: Boolean indicating if a scan is in progress
 * - `error`: Error message if scan failed, null otherwise
 * - `scan()`: Async function to initiate a font scan
 * - `reset()`: Function to clear scan results and errors
 *
 * @returns UseFontScannerReturn object with state and functions
 */
export function useFontScanner(): UseFontScannerReturn {
  const [scannedFonts, setScannedFonts] = useState<FontMetadata[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiates a font scan on the provided Framer project.
   * Updates scanning state and handles errors gracefully.
   *
   * @param project - The Framer project to scan for fonts
   */
  const scan = useCallback(async (project: FramerProject): Promise<void> => {
    // Clear previous error and set scanning state
    setError(null);
    setIsScanning(true);

    try {
      const fonts = await scanFonts(project);
      setScannedFonts(fonts);
    } catch (err) {
      // Handle scan errors gracefully
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during font scanning';
      setError(errorMessage);
      console.error('[TypeFlow] Font scan error:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Resets the scanner state to initial values.
   * Clears scanned fonts, errors, and scanning state.
   */
  const reset = useCallback((): void => {
    setScannedFonts([]);
    setIsScanning(false);
    setError(null);
  }, []);

  return {
    scannedFonts,
    isScanning,
    error,
    scan,
    reset,
  };
}
