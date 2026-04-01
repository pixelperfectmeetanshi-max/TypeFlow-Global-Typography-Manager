/**
 * TypeFlow Plugin - Scan Panel Component
 *
 * Displays font scanning status, results, and provides scan initiation.
 *
 * **Validates: Requirements 2.5, 2.6**
 */

import React, { useCallback } from 'react';
import { FontMetadata } from '../types/typography';

/**
 * Props for the ScanPanel component
 */
export interface ScanPanelProps {
  isScanning: boolean;
  scannedFonts: FontMetadata[];
  onScanInitiate: () => void;
  error: string | null;
}

/**
 * ScanPanel component for font scanning operations.
 *
 * Features:
 * - Scan initiation button
 * - Loading indicator during scanning
 * - Scanned fonts list with usage counts
 * - Error display for scan failures
 *
 * @param props - ScanPanelProps
 */
export function ScanPanel({
  isScanning,
  scannedFonts,
  onScanInitiate,
  error,
}: ScanPanelProps): React.ReactElement {
  /**
   * Handles scan button click
   */
  const handleScanClick = useCallback(() => {
    if (!isScanning) {
      onScanInitiate();
    }
  }, [isScanning, onScanInitiate]);

  return (
    <div className="section">
      <h3 className="section-title">Font Scanner</h3>

      {/* Scan Button */}
      <button
        type="button"
        className="btn btn--secondary btn--full mb-md"
        onClick={handleScanClick}
        disabled={isScanning}
        aria-busy={isScanning}
      >
        {isScanning ? (
          <>
            <span className="spinner" aria-hidden="true" />
            <span>Scanning...</span>
          </>
        ) : (
          'Scan Project Fonts'
        )}
      </button>

      {/* Scanning Status */}
      {isScanning && (
        <div
          className="scan-status scan-status--scanning mb-sm"
          role="status"
          aria-live="polite"
        >
          <span className="spinner" aria-hidden="true" />
          <span>Scanning project for fonts...</span>
        </div>
      )}

      {/* Error Display */}
      {error && !isScanning && (
        <div
          className="error-message mb-sm"
          role="alert"
          aria-live="assertive"
        >
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Scan Results */}
      {!isScanning && !error && scannedFonts.length > 0 && (
        <>
          <div
            className="scan-status scan-status--complete mb-sm"
            role="status"
          >
            <span aria-hidden="true">✓</span>
            <span>Found {scannedFonts.length} font{scannedFonts.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="font-list" role="list" aria-label="Scanned fonts">
            {scannedFonts.map((font) => (
              <div
                key={font.family}
                className="font-item"
                role="listitem"
              >
                <span className="font-item-name">{font.family}</span>
                <span className="font-item-count">
                  {font.usageCount} {font.usageCount === 1 ? 'use' : 'uses'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!isScanning && !error && scannedFonts.length === 0 && (
        <div className="text-secondary text-sm p-md" role="status">
          Click "Scan Project Fonts" to discover fonts used in your project.
        </div>
      )}
    </div>
  );
}
