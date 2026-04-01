/**
 * TypeFlow Plugin - PreviewToggle Component Tests
 *
 * Unit tests for the PreviewToggle component.
 * Tests toggle state changes, disabled state with tooltip, and accessibility.
 *
 * **Validates: Requirements 5.4**
 * - 5.4: WHEN no elements are selected, THE Preview_Toggle SHALL be disabled with a tooltip explaining the requirement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewToggle, PreviewToggleProps } from './PreviewToggle';

describe('PreviewToggle', () => {
  // Default props for tests
  const defaultProps: PreviewToggleProps = {
    isEnabled: false,
    isDisabled: false,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggle state changes', () => {
    it('should render toggle in unchecked state when isEnabled is false', () => {
      render(<PreviewToggle {...defaultProps} isEnabled={false} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should render toggle in checked state when isEnabled is true', () => {
      render(<PreviewToggle {...defaultProps} isEnabled={true} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should call onToggle with true when toggling from off to on', () => {
      const onToggle = vi.fn();
      render(<PreviewToggle {...defaultProps} isEnabled={false} onToggle={onToggle} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should call onToggle with false when toggling from on to off', () => {
      const onToggle = vi.fn();
      render(<PreviewToggle {...defaultProps} isEnabled={true} onToggle={onToggle} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should display "Preview active" status when enabled', () => {
      render(<PreviewToggle {...defaultProps} isEnabled={true} />);

      expect(screen.getByText('Preview active - changes shown in real-time')).toBeInTheDocument();
    });

    it('should display "Enable to see changes" status when disabled but not locked', () => {
      render(<PreviewToggle {...defaultProps} isEnabled={false} isDisabled={false} />);

      expect(screen.getByText('Enable to see changes before applying')).toBeInTheDocument();
    });
  });

  describe('disabled state with tooltip', () => {
    /**
     * **Validates: Requirement 5.4**
     * WHEN no elements are selected, THE Preview_Toggle SHALL be disabled with a tooltip explaining the requirement
     */
    it('should disable the checkbox when isDisabled is true', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={true} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('should show default tooltip message when disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={true} />);

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('Select elements to enable preview');
    });

    it('should show custom disabled reason in tooltip', () => {
      render(
        <PreviewToggle
          {...defaultProps}
          isDisabled={true}
          disabledReason="No text layers selected"
        />
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveTextContent('No text layers selected');
    });

    it('should not call onToggle when clicking disabled toggle', () => {
      const onToggle = vi.fn();
      render(<PreviewToggle {...defaultProps} isDisabled={true} onToggle={onToggle} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should display disabled reason in status area when disabled', () => {
      render(
        <PreviewToggle
          {...defaultProps}
          isDisabled={true}
          disabledReason="Select elements to enable preview"
        />
      );

      // Status area should show the disabled reason
      const statusTexts = screen.getAllByText('Select elements to enable preview');
      expect(statusTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('should not show tooltip when toggle is not disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={false} />);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should have aria-describedby linking to tooltip when disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={true} />);

      const checkbox = screen.getByRole('checkbox');
      const tooltip = screen.getByRole('tooltip');

      expect(checkbox).toHaveAttribute('aria-describedby', tooltip.id);
    });

    it('should not have aria-describedby when not disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={false} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('keyboard navigation', () => {
    it('should toggle with Enter key when not disabled', () => {
      const onToggle = vi.fn();
      render(<PreviewToggle {...defaultProps} isEnabled={false} onToggle={onToggle} />);

      const label = screen.getByText('Enable preview').closest('label')!;
      fireEvent.keyDown(label, { key: 'Enter' });

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should toggle with Space key when not disabled', () => {
      const onToggle = vi.fn();
      render(<PreviewToggle {...defaultProps} isEnabled={true} onToggle={onToggle} />);

      const label = screen.getByText('Disable preview').closest('label')!;
      fireEvent.keyDown(label, { key: ' ' });

      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should not toggle with Enter key when disabled', () => {
      const onToggle = vi.fn();
      render(<PreviewToggle {...defaultProps} isDisabled={true} onToggle={onToggle} />);

      const label = screen.getByText('Enable preview').closest('label')!;
      fireEvent.keyDown(label, { key: 'Enter' });

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should not toggle with Space key when disabled', () => {
      const onToggle = vi.fn();
      render(<PreviewToggle {...defaultProps} isDisabled={true} onToggle={onToggle} />);

      const label = screen.getByText('Enable preview').closest('label')!;
      fireEvent.keyDown(label, { key: ' ' });

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should have tabIndex 0 when not disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={false} />);

      const label = screen.getByText('Enable preview').closest('label')!;
      expect(label).toHaveAttribute('tabIndex', '0');
    });

    it('should have tabIndex -1 when disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={true} />);

      const label = screen.getByText('Enable preview').closest('label')!;
      expect(label).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('accessibility', () => {
    it('should render with "Live Preview" heading', () => {
      render(<PreviewToggle {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Live Preview' })).toBeInTheDocument();
    });

    it('should have screen reader text for enable state', () => {
      render(<PreviewToggle {...defaultProps} isEnabled={false} />);

      expect(screen.getByText('Enable preview')).toBeInTheDocument();
    });

    it('should have screen reader text for disable state', () => {
      render(<PreviewToggle {...defaultProps} isEnabled={true} />);

      expect(screen.getByText('Disable preview')).toBeInTheDocument();
    });

    it('should apply disabled class to toggle label when disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={true} />);

      const label = screen.getByText('Enable preview').closest('label')!;
      expect(label).toHaveClass('toggle--disabled');
    });

    it('should not apply disabled class to toggle label when not disabled', () => {
      render(<PreviewToggle {...defaultProps} isDisabled={false} />);

      const label = screen.getByText('Enable preview').closest('label')!;
      expect(label).not.toHaveClass('toggle--disabled');
    });
  });
});
