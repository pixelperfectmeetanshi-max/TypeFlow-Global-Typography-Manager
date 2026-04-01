/**
 * TypeFlow Plugin - ScanPanel Component Tests
 *
 * Unit tests for the ScanPanel component.
 * Tests loading state display, font list rendering, and error display.
 *
 * **Validates: Requirements 2.5, 2.6**
 * - 2.5: WHILE scanning is in progress, THE Scan_Panel SHALL display a loading indicator
 * - 2.6: WHEN scanning completes, THE Scan_Panel SHALL display the list of discovered fonts with their usage counts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScanPanel, ScanPanelProps } from './ScanPanel';
import { FontMetadata } from '../types/typography';

describe('ScanPanel', () => {
  // Sample font data for tests
  const mockFonts: FontMetadata[] = [
    {
      family: 'Inter',
      availableWeights: [400, 700],
      styles: ['normal'],
      usageCount: 5,
      elements: ['el1', 'el2', 'el3', 'el4', 'el5'],
    },
    {
      family: 'Roboto',
      availableWeights: [300, 400, 500],
      styles: ['normal', 'italic'],
      usageCount: 3,
      elements: ['el6', 'el7', 'el8'],
    },
    {
      family: 'Open Sans',
      availableWeights: [400, 600],
      styles: ['normal'],
      usageCount: 1,
      elements: ['el9'],
    },
  ];

  // Default props for tests
  const defaultProps: ScanPanelProps = {
    isScanning: false,
    scannedFonts: [],
    onScanInitiate: vi.fn(),
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state display', () => {
    /**
     * **Validates: Requirement 2.5**
     * WHILE scanning is in progress, THE Scan_Panel SHALL display a loading indicator
     */
    it('should display loading indicator when scanning is in progress', () => {
      render(<ScanPanel {...defaultProps} isScanning={true} />);

      // Check for scanning status message
      expect(screen.getByText('Scanning...')).toBeInTheDocument();
      expect(screen.getByText('Scanning project for fonts...')).toBeInTheDocument();
    });

    it('should display spinner during scanning', () => {
      render(<ScanPanel {...defaultProps} isScanning={true} />);

      // Check for spinner elements (aria-hidden spinners)
      const spinners = document.querySelectorAll('.spinner');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('should disable scan button while scanning', () => {
      render(<ScanPanel {...defaultProps} isScanning={true} />);

      const scanButton = screen.getByRole('button');
      expect(scanButton).toBeDisabled();
    });

    it('should set aria-busy on button while scanning', () => {
      render(<ScanPanel {...defaultProps} isScanning={true} />);

      const scanButton = screen.getByRole('button');
      expect(scanButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should display scanning status with proper role for accessibility', () => {
      render(<ScanPanel {...defaultProps} isScanning={true} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should not display loading indicator when not scanning', () => {
      render(<ScanPanel {...defaultProps} isScanning={false} />);

      expect(screen.queryByText('Scanning...')).not.toBeInTheDocument();
      expect(screen.queryByText('Scanning project for fonts...')).not.toBeInTheDocument();
    });
  });

  describe('font list rendering', () => {
    /**
     * **Validates: Requirement 2.6**
     * WHEN scanning completes, THE Scan_Panel SHALL display the list of discovered fonts with their usage counts
     */
    it('should render all scanned fonts in the list', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={mockFonts} />);

      expect(screen.getByText('Inter')).toBeInTheDocument();
      expect(screen.getByText('Roboto')).toBeInTheDocument();
      expect(screen.getByText('Open Sans')).toBeInTheDocument();
    });

    it('should display usage count for each font', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={mockFonts} />);

      expect(screen.getByText('5 uses')).toBeInTheDocument();
      expect(screen.getByText('3 uses')).toBeInTheDocument();
      expect(screen.getByText('1 use')).toBeInTheDocument();
    });

    it('should display singular "use" for fonts with usage count of 1', () => {
      const singleUseFonts: FontMetadata[] = [
        {
          family: 'Arial',
          availableWeights: [400],
          styles: ['normal'],
          usageCount: 1,
          elements: ['el1'],
        },
      ];

      render(<ScanPanel {...defaultProps} scannedFonts={singleUseFonts} />);

      expect(screen.getByText('1 use')).toBeInTheDocument();
    });

    it('should display plural "uses" for fonts with usage count greater than 1', () => {
      const multiUseFonts: FontMetadata[] = [
        {
          family: 'Arial',
          availableWeights: [400],
          styles: ['normal'],
          usageCount: 10,
          elements: ['el1', 'el2', 'el3', 'el4', 'el5', 'el6', 'el7', 'el8', 'el9', 'el10'],
        },
      ];

      render(<ScanPanel {...defaultProps} scannedFonts={multiUseFonts} />);

      expect(screen.getByText('10 uses')).toBeInTheDocument();
    });

    it('should display total font count in completion message', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={mockFonts} />);

      expect(screen.getByText('Found 3 fonts')).toBeInTheDocument();
    });

    it('should display singular "font" when only one font is found', () => {
      const singleFont: FontMetadata[] = [mockFonts[0]];

      render(<ScanPanel {...defaultProps} scannedFonts={singleFont} />);

      expect(screen.getByText('Found 1 font')).toBeInTheDocument();
    });

    it('should render font list with proper accessibility attributes', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={mockFonts} />);

      const fontList = screen.getByRole('list', { name: 'Scanned fonts' });
      expect(fontList).toBeInTheDocument();
    });

    it('should render each font as a list item', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={mockFonts} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('should display empty state when no fonts are scanned', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={[]} />);

      expect(
        screen.getByText('Click "Scan Project Fonts" to discover fonts used in your project.')
      ).toBeInTheDocument();
    });

    it('should not display font list while scanning', () => {
      render(<ScanPanel {...defaultProps} isScanning={true} scannedFonts={mockFonts} />);

      expect(screen.queryByRole('list', { name: 'Scanned fonts' })).not.toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('should display error message when error is present', () => {
      const errorMessage = 'Failed to scan project fonts';
      render(<ScanPanel {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display error with alert role for accessibility', () => {
      render(<ScanPanel {...defaultProps} error="Scan failed" />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });

    it('should display warning icon with error message', () => {
      render(<ScanPanel {...defaultProps} error="Scan failed" />);

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer.textContent).toContain('⚠');
    });

    it('should not display error while scanning', () => {
      render(<ScanPanel {...defaultProps} isScanning={true} error="Previous error" />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not display font list when error is present', () => {
      render(<ScanPanel {...defaultProps} error="Scan failed" scannedFonts={mockFonts} />);

      expect(screen.queryByRole('list', { name: 'Scanned fonts' })).not.toBeInTheDocument();
    });

    it('should not display empty state when error is present', () => {
      render(<ScanPanel {...defaultProps} error="Scan failed" />);

      expect(
        screen.queryByText('Click "Scan Project Fonts" to discover fonts used in your project.')
      ).not.toBeInTheDocument();
    });
  });

  describe('scan initiation', () => {
    it('should call onScanInitiate when scan button is clicked', () => {
      const onScanInitiate = vi.fn();
      render(<ScanPanel {...defaultProps} onScanInitiate={onScanInitiate} />);

      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      fireEvent.click(scanButton);

      expect(onScanInitiate).toHaveBeenCalledTimes(1);
    });

    it('should not call onScanInitiate when button is clicked while scanning', () => {
      const onScanInitiate = vi.fn();
      render(<ScanPanel {...defaultProps} isScanning={true} onScanInitiate={onScanInitiate} />);

      const scanButton = screen.getByRole('button');
      fireEvent.click(scanButton);

      expect(onScanInitiate).not.toHaveBeenCalled();
    });

    it('should display "Scan Project Fonts" text when not scanning', () => {
      render(<ScanPanel {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Scan Project Fonts' })).toBeInTheDocument();
    });

    it('should enable scan button when not scanning', () => {
      render(<ScanPanel {...defaultProps} isScanning={false} />);

      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      expect(scanButton).not.toBeDisabled();
    });
  });

  describe('section rendering', () => {
    it('should render section title', () => {
      render(<ScanPanel {...defaultProps} />);

      expect(screen.getByText('Font Scanner')).toBeInTheDocument();
    });

    it('should render within a section container', () => {
      render(<ScanPanel {...defaultProps} />);

      const section = document.querySelector('.section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('completion status', () => {
    it('should display checkmark icon when scan is complete with results', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={mockFonts} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toContain('✓');
    });

    it('should display completion status with proper role', () => {
      render(<ScanPanel {...defaultProps} scannedFonts={mockFonts} />);

      const statusElements = screen.getAllByRole('status');
      const completionStatus = statusElements.find((el) =>
        el.textContent?.includes('Found')
      );
      expect(completionStatus).toBeInTheDocument();
    });
  });
});
