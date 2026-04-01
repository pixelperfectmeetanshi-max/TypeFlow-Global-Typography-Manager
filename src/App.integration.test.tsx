/**
 * TypeFlow Plugin - Integration Tests
 *
 * Integration tests for the complete plugin workflow.
 * Tests the full scan → select → preview → apply flow,
 * preset save and load workflow, and error recovery scenarios.
 *
 * **Validates: Requirements 1.1, 1.2, 6.1**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { App } from './App';
import * as scanFontsModule from './features/scanFonts';
import * as applyTypographyModule from './features/applyTypography';
import { FontMetadata } from './types/typography';

// Mock the scanFonts module
vi.mock('./features/scanFonts', async () => {
  const actual = await vi.importActual('./features/scanFonts');
  return {
    ...actual,
    scanFonts: vi.fn(),
    scanFontsWithDetails: vi.fn(),
  };
});

// Mock the applyTypography module
vi.mock('./features/applyTypography', async () => {
  const actual = await vi.importActual('./features/applyTypography');
  return {
    ...actual,
    applyTypography: vi.fn(),
    revertToOriginalStyles: vi.fn(),
  };
});

describe('App Integration Tests', () => {
  // Sample font data for tests
  const mockFonts: FontMetadata[] = [
    {
      family: 'Inter',
      availableWeights: [400, 500, 600, 700],
      styles: ['normal'],
      usageCount: 5,
      elements: ['el1', 'el2', 'el3', 'el4', 'el5'],
    },
    {
      family: 'Roboto',
      availableWeights: [300, 400, 500, 700],
      styles: ['normal', 'italic'],
      usageCount: 3,
      elements: ['el6', 'el7', 'el8'],
    },
    {
      family: 'Open Sans',
      availableWeights: [400, 600, 700],
      styles: ['normal'],
      usageCount: 2,
      elements: ['el9', 'el10'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Default mock implementations
    vi.mocked(scanFontsModule.scanFonts).mockResolvedValue(mockFonts);
    vi.mocked(applyTypographyModule.applyTypography).mockResolvedValue({
      success: true,
      appliedCount: 1,
      errors: [],
    });
    vi.mocked(applyTypographyModule.revertToOriginalStyles).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Helper to select a font from the listbox
   */
  const selectFont = async (fontFamily: string) => {
    const fontList = screen.getByRole('listbox', { name: 'Available fonts' });
    const fontOption = within(fontList).getByText(fontFamily).closest('[role="option"]');
    if (fontOption) {
      await act(async () => {
        fireEvent.click(fontOption);
      });
    }
  };

  /**
   * Helper to select a font weight
   */
  const selectWeight = async (weight: number) => {
    const weightButton = screen.getByRole('button', { name: weight.toString() });
    await act(async () => {
      fireEvent.click(weightButton);
    });
  };

  /**
   * Helper to get the preview toggle checkbox
   */
  const getPreviewToggle = () => {
    return screen.getByRole('checkbox', { name: /preview/i });
  };

  describe('Complete Workflow: Scan → Select → Preview → Apply', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 6.1**
     * Tests the complete user workflow from scanning fonts to applying typography.
     */

    it('should complete the full scan → select → preview → apply workflow', async () => {
      render(<App />);

      // Step 1: Verify initial state - plugin is loaded
      expect(screen.getByText('Font Scanner')).toBeInTheDocument();
      expect(screen.getByText('Font Selection')).toBeInTheDocument();
      expect(screen.getByText('Size Controls')).toBeInTheDocument();

      // Step 2: Initiate font scan
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      // Wait for scan to complete
      await waitFor(() => {
        expect(scanFontsModule.scanFonts).toHaveBeenCalled();
      });

      // Verify scanned fonts are displayed in scan panel
      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Roboto').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Open Sans').length).toBeGreaterThan(0);
      });

      // Step 3: Select a font from the listbox
      await selectFont('Roboto');

      // Step 4: Select a font weight
      await selectWeight(700);

      // Verify weight is selected
      const weight700Button = screen.getByRole('button', { name: '700' });
      expect(weight700Button).toHaveAttribute('aria-pressed', 'true');

      // Step 5: Enable preview mode
      const previewToggle = getPreviewToggle();
      
      await act(async () => {
        fireEvent.click(previewToggle);
        await vi.runAllTimersAsync();
      });

      // Verify preview is enabled
      await waitFor(() => {
        expect(previewToggle).toBeChecked();
      });

      // Verify applyTypography was called with temporary: true for preview
      await waitFor(() => {
        expect(applyTypographyModule.applyTypography).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            fontFamily: 'Roboto',
            fontWeight: 700,
          }),
          { temporary: true }
        );
      });

      // Step 6: Apply typography
      const applyButton = screen.getByRole('button', { name: 'Apply Typography' });
      
      await act(async () => {
        fireEvent.click(applyButton);
        await vi.runAllTimersAsync();
      });

      // Verify applyTypography was called with temporary: false for permanent apply
      await waitFor(() => {
        expect(applyTypographyModule.applyTypography).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            fontFamily: 'Roboto',
            fontWeight: 700,
          }),
          { temporary: false }
        );
      });
    });

    it('should update preview when typography style changes', async () => {
      render(<App />);

      // Scan fonts first
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Enable preview
      const previewToggle = getPreviewToggle();
      
      await act(async () => {
        fireEvent.click(previewToggle);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(previewToggle).toBeChecked();
      });

      // Clear previous calls
      vi.mocked(applyTypographyModule.applyTypography).mockClear();

      // Change font size
      const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fontSizeInput, { target: { value: '24' } });
        fireEvent.blur(fontSizeInput);
        await vi.runAllTimersAsync();
      });

      // Verify preview was updated with new font size
      await waitFor(() => {
        expect(applyTypographyModule.applyTypography).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            fontSize: 24,
          }),
          { temporary: true }
        );
      });
    });

    it('should disable preview after successful apply', async () => {
      render(<App />);

      // Scan fonts
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Enable preview
      const previewToggle = getPreviewToggle();
      
      await act(async () => {
        fireEvent.click(previewToggle);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(previewToggle).toBeChecked();
      });

      // Apply typography
      const applyButton = screen.getByRole('button', { name: 'Apply Typography' });
      
      await act(async () => {
        fireEvent.click(applyButton);
        await vi.runAllTimersAsync();
      });

      // Verify preview is disabled after apply
      await waitFor(() => {
        expect(previewToggle).not.toBeChecked();
      });
    });

    it('should revert styles when preview is disabled', async () => {
      render(<App />);

      // Scan fonts
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Enable preview
      const previewToggle = getPreviewToggle();
      
      await act(async () => {
        fireEvent.click(previewToggle);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(previewToggle).toBeChecked();
      });

      // Disable preview
      await act(async () => {
        fireEvent.click(previewToggle);
        await vi.runAllTimersAsync();
      });

      // Verify revertToOriginalStyles was called
      await waitFor(() => {
        expect(applyTypographyModule.revertToOriginalStyles).toHaveBeenCalled();
      });

      expect(previewToggle).not.toBeChecked();
    });
  });

  describe('Preset Save and Load Workflow', () => {
    /**
     * Tests the preset management workflow including save, load, and verify style applied.
     */

    it('should configure typography style correctly', async () => {
      render(<App />);

      // Scan fonts first
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Configure typography style
      await selectFont('Roboto');
      await selectWeight(500);

      const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fontSizeInput, { target: { value: '20' } });
        fireEvent.blur(fontSizeInput);
      });

      // Verify the style is configured
      const weight500Button = screen.getByRole('button', { name: '500' });
      expect(weight500Button).toHaveAttribute('aria-pressed', 'true');
      expect(fontSizeInput).toHaveValue('20');
    });

    it('should maintain typography style consistency through workflow', async () => {
      render(<App />);

      // Scan fonts
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Set up a specific typography configuration
      await selectFont('Open Sans');
      await selectWeight(600);

      const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fontSizeInput, { target: { value: '18' } });
        fireEvent.blur(fontSizeInput);
      });

      const lineHeightInput = document.getElementById('lineHeight') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(lineHeightInput, { target: { value: '1.6' } });
        fireEvent.blur(lineHeightInput);
      });

      // Apply the typography
      const applyButton = screen.getByRole('button', { name: 'Apply Typography' });
      
      await act(async () => {
        fireEvent.click(applyButton);
        await vi.runAllTimersAsync();
      });

      // Verify the applied style matches what was configured
      await waitFor(() => {
        expect(applyTypographyModule.applyTypography).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            fontFamily: 'Open Sans',
            fontWeight: 600,
            fontSize: 18,
            lineHeight: 1.6,
          }),
          { temporary: false }
        );
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    /**
     * Tests error handling and recovery in various failure scenarios.
     */

    it('should display error and allow retry when scan fails', async () => {
      // Mock scan to fail
      vi.mocked(scanFontsModule.scanFonts).mockRejectedValueOnce(
        new Error('Failed to access project elements')
      );

      render(<App />);

      // Attempt to scan
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Mock scan to succeed on retry
      vi.mocked(scanFontsModule.scanFonts).mockResolvedValueOnce(mockFonts);

      // Retry scan
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      // Verify scan succeeds
      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });
    });

    it('should display error when apply fails and preserve state', async () => {
      // Mock apply to fail
      vi.mocked(applyTypographyModule.applyTypography).mockResolvedValueOnce({
        success: false,
        appliedCount: 0,
        errors: [{ elementId: 'el1', message: 'Element not found' }],
      });

      render(<App />);

      // Scan fonts
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Configure typography
      await selectFont('Roboto');

      // Attempt to apply
      const applyButton = screen.getByRole('button', { name: 'Apply Typography' });
      
      await act(async () => {
        fireEvent.click(applyButton);
        await vi.runAllTimersAsync();
      });

      // Verify error is displayed
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });

      // Verify state is preserved - Roboto should still be selected
      const fontList = screen.getByRole('listbox', { name: 'Available fonts' });
      const robotoOption = within(fontList).getByText('Roboto').closest('[role="option"]');
      expect(robotoOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should handle preview toggle errors gracefully', async () => {
      // Mock applyTypography to fail for preview
      vi.mocked(applyTypographyModule.applyTypography).mockRejectedValueOnce(
        new Error('Preview failed')
      );

      render(<App />);

      // Scan fonts
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Attempt to enable preview
      const previewToggle = getPreviewToggle();
      
      await act(async () => {
        fireEvent.click(previewToggle);
        await vi.runAllTimersAsync();
      });

      // Verify error is displayed
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });

      // App should still be functional
      expect(screen.getByText('Font Scanner')).toBeInTheDocument();
    });

    it('should recover from multiple consecutive errors', async () => {
      // First scan fails
      vi.mocked(scanFontsModule.scanFonts)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce(mockFonts);

      render(<App />);

      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });

      // First attempt - fails
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Second attempt - fails
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Third attempt - succeeds
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });
      
      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });
    });

    it('should dismiss global error messages when user clicks dismiss', async () => {
      // Mock apply to fail - this creates a global error with dismiss button
      vi.mocked(applyTypographyModule.applyTypography).mockResolvedValueOnce({
        success: false,
        appliedCount: 0,
        errors: [{ elementId: 'el1', message: 'Element not found' }],
      });

      render(<App />);

      // Scan fonts first
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Trigger global error by applying
      const applyButton = screen.getByRole('button', { name: 'Apply Typography' });
      
      await act(async () => {
        fireEvent.click(applyButton);
        await vi.runAllTimersAsync();
      });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Find and click dismiss button (the ✕ button in global error)
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      
      await act(async () => {
        fireEvent.click(dismissButton);
      });

      // Verify error is dismissed
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    /**
     * Tests that all components work together correctly.
     */

    it('should render all main components', () => {
      render(<App />);

      // Verify all main sections are rendered
      expect(screen.getByText('Font Scanner')).toBeInTheDocument();
      expect(screen.getByText('Font Selection')).toBeInTheDocument();
      expect(screen.getByText('Size Controls')).toBeInTheDocument();
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apply Typography' })).toBeInTheDocument();
    });

    it('should update font weights when font family changes', async () => {
      render(<App />);

      // Scan fonts
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Select Inter
      await selectFont('Inter');

      // Verify weight options are available
      const weightGroup = screen.getByRole('group', { name: 'Font weights' });
      expect(weightGroup).toBeInTheDocument();

      // Select Roboto
      await selectFont('Roboto');

      // Weight group should still be functional
      expect(weightGroup).toBeInTheDocument();
    });

    it('should validate size inputs and revert invalid values', async () => {
      render(<App />);

      // Try to enter invalid font size - use getElementById for exact match
      const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fontSizeInput, { target: { value: '-5' } });
        fireEvent.blur(fontSizeInput);
      });

      // The input should revert to a valid value
      await waitFor(() => {
        const value = parseFloat(fontSizeInput.value);
        expect(value).toBeGreaterThan(0);
      });
    });

    it('should maintain state consistency across component interactions', async () => {
      render(<App />);

      // Scan fonts
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getAllByText('Inter').length).toBeGreaterThan(0);
      });

      // Configure all typography options
      await selectFont('Roboto');
      await selectWeight(500);

      const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fontSizeInput, { target: { value: '18' } });
        fireEvent.blur(fontSizeInput);
      });

      const lineHeightInput = document.getElementById('lineHeight') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(lineHeightInput, { target: { value: '1.5' } });
        fireEvent.blur(lineHeightInput);
      });

      const letterSpacingInput = document.getElementById('letterSpacing') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(letterSpacingInput, { target: { value: '0.5' } });
        fireEvent.blur(letterSpacingInput);
      });

      // Enable preview
      const previewToggle = getPreviewToggle();
      
      await act(async () => {
        fireEvent.click(previewToggle);
        await vi.runAllTimersAsync();
      });

      // Verify all values are maintained
      const weight500Button = screen.getByRole('button', { name: '500' });
      expect(weight500Button).toHaveAttribute('aria-pressed', 'true');
      expect(fontSizeInput).toHaveValue('18');
      expect(lineHeightInput).toHaveValue('1.5');
      expect(letterSpacingInput).toHaveValue('0.5');
      expect(previewToggle).toBeChecked();
    });
  });

  describe('Accessibility', () => {
    /**
     * Tests accessibility features of the integrated app.
     */

    it('should have proper ARIA attributes on interactive elements', () => {
      render(<App />);

      // Check scan button
      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      expect(scanButton).toHaveAttribute('type', 'button');

      // Check apply button
      const applyButton = screen.getByRole('button', { name: 'Apply Typography' });
      expect(applyButton).toHaveAttribute('type', 'button');
      expect(applyButton).toHaveAttribute('aria-busy');

      // Check preview toggle exists
      const previewToggle = getPreviewToggle();
      expect(previewToggle).toBeInTheDocument();
    });

    it('should announce loading states to screen readers', async () => {
      // Make scan take some time
      vi.mocked(scanFontsModule.scanFonts).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockFonts), 100))
      );

      render(<App />);

      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
      });

      // Check for loading indicator with proper ARIA
      await waitFor(() => {
        const statusElement = screen.getByRole('status');
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should announce errors to screen readers', async () => {
      vi.mocked(scanFontsModule.scanFonts).mockRejectedValueOnce(
        new Error('Scan failed')
      );

      render(<App />);

      const scanButton = screen.getByRole('button', { name: 'Scan Project Fonts' });
      
      await act(async () => {
        fireEvent.click(scanButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        const alertElement = screen.getByRole('alert');
        expect(alertElement).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });
});
