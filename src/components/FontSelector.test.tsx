/**
 * TypeFlow Plugin - FontSelector Component Tests
 *
 * Unit tests for the FontSelector component.
 * Tests font list rendering, search filtering, and selection callbacks.
 *
 * **Validates: Requirements 3.1, 3.5**
 * - 3.1: THE Font_Selector SHALL display a list of available fonts
 * - 3.5: THE Font_Selector SHALL support searching fonts by name
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FontSelector, FontSelectorProps } from './FontSelector';
import { FontMetadata } from '../types/typography';

// Mock the fontUtils module
vi.mock('../features/fontUtils', () => ({
  filterFontsByQuery: vi.fn((fonts: FontMetadata[], query: string) => {
    if (!query || query.trim() === '') {
      return fonts;
    }
    const normalizedQuery = query.toLowerCase();
    return fonts.filter((font) => font.family.toLowerCase().includes(normalizedQuery));
  }),
  getAvailableWeights: vi.fn((fontFamily: string) => {
    if (!fontFamily) return [];
    return [100, 200, 300, 400, 500, 600, 700, 800, 900];
  }),
}));

describe('FontSelector', () => {
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
      usageCount: 2,
      elements: ['el9', 'el10'],
    },
  ];

  // Default props for tests
  const defaultProps: FontSelectorProps = {
    fonts: mockFonts,
    selectedFont: null,
    selectedWeight: 400,
    onFontSelect: vi.fn(),
    onWeightSelect: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('font list rendering', () => {
    /**
     * **Validates: Requirement 3.1**
     * THE Font_Selector SHALL display a list of available fonts
     */
    it('should render all fonts in the list', () => {
      render(<FontSelector {...defaultProps} />);

      expect(screen.getByText('Inter')).toBeInTheDocument();
      expect(screen.getByText('Roboto')).toBeInTheDocument();
      expect(screen.getByText('Open Sans')).toBeInTheDocument();
    });

    it('should display usage count for each font', () => {
      render(<FontSelector {...defaultProps} />);

      expect(screen.getByText('5 uses')).toBeInTheDocument();
      expect(screen.getByText('3 uses')).toBeInTheDocument();
      expect(screen.getByText('2 uses')).toBeInTheDocument();
    });

    it('should render empty state when no fonts are available', () => {
      render(<FontSelector {...defaultProps} fonts={[]} />);

      expect(screen.getByText('No fonts available')).toBeInTheDocument();
    });

    it('should render search input with placeholder', () => {
      render(<FontSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search fonts...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render font list with proper accessibility attributes', () => {
      render(<FontSelector {...defaultProps} />);

      const fontList = screen.getByRole('listbox', { name: 'Available fonts' });
      expect(fontList).toBeInTheDocument();
    });

    it('should mark selected font with aria-selected', () => {
      render(<FontSelector {...defaultProps} selectedFont="Inter" />);

      const fontItems = screen.getAllByRole('option');
      const interItem = fontItems.find((item) => item.textContent?.includes('Inter'));
      expect(interItem).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('search filtering', () => {
    /**
     * **Validates: Requirement 3.5**
     * THE Font_Selector SHALL support searching fonts by name
     */
    it('should display search input with current query value', () => {
      render(<FontSelector {...defaultProps} searchQuery="inter" />);

      const searchInput = screen.getByPlaceholderText('Search fonts...');
      expect(searchInput).toHaveValue('inter');
    });

    it('should call onSearchChange when typing in search input', () => {
      const onSearchChange = vi.fn();
      render(<FontSelector {...defaultProps} onSearchChange={onSearchChange} />);

      const searchInput = screen.getByPlaceholderText('Search fonts...');
      fireEvent.change(searchInput, { target: { value: 'rob' } });

      expect(onSearchChange).toHaveBeenCalledWith('rob');
    });

    it('should filter fonts based on search query', () => {
      render(<FontSelector {...defaultProps} searchQuery="inter" />);

      // Only Inter should be visible (case-insensitive match)
      expect(screen.getByText('Inter')).toBeInTheDocument();
      expect(screen.queryByText('Roboto')).not.toBeInTheDocument();
      expect(screen.queryByText('Open Sans')).not.toBeInTheDocument();
    });

    it('should show "No fonts match your search" when no results', () => {
      render(<FontSelector {...defaultProps} searchQuery="nonexistent" />);

      expect(screen.getByText('No fonts match your search')).toBeInTheDocument();
    });

    it('should perform case-insensitive search', () => {
      render(<FontSelector {...defaultProps} searchQuery="INTER" />);

      expect(screen.getByText('Inter')).toBeInTheDocument();
    });

    it('should show all fonts when search query is empty', () => {
      render(<FontSelector {...defaultProps} searchQuery="" />);

      expect(screen.getByText('Inter')).toBeInTheDocument();
      expect(screen.getByText('Roboto')).toBeInTheDocument();
      expect(screen.getByText('Open Sans')).toBeInTheDocument();
    });
  });

  describe('selection callbacks', () => {
    it('should call onFontSelect when a font is clicked', () => {
      const onFontSelect = vi.fn();
      render(<FontSelector {...defaultProps} onFontSelect={onFontSelect} />);

      const interFont = screen.getByText('Inter');
      fireEvent.click(interFont.closest('[role="option"]')!);

      expect(onFontSelect).toHaveBeenCalledWith('Inter');
    });

    it('should call onFontSelect with correct font family', () => {
      const onFontSelect = vi.fn();
      render(<FontSelector {...defaultProps} onFontSelect={onFontSelect} />);

      const robotoFont = screen.getByText('Roboto');
      fireEvent.click(robotoFont.closest('[role="option"]')!);

      expect(onFontSelect).toHaveBeenCalledWith('Roboto');
    });

    it('should display weight pills when a font is selected', () => {
      render(<FontSelector {...defaultProps} selectedFont="Inter" />);

      // Weight pills should be visible
      expect(screen.getByText('400')).toBeInTheDocument();
      expect(screen.getByText('700')).toBeInTheDocument();
    });

    it('should call onWeightSelect when a weight pill is clicked', () => {
      const onWeightSelect = vi.fn();
      render(
        <FontSelector
          {...defaultProps}
          selectedFont="Inter"
          onWeightSelect={onWeightSelect}
        />
      );

      const weight700 = screen.getByText('700');
      fireEvent.click(weight700);

      expect(onWeightSelect).toHaveBeenCalledWith(700);
    });

    it('should mark selected weight pill with aria-pressed', () => {
      render(
        <FontSelector {...defaultProps} selectedFont="Inter" selectedWeight={400} />
      );

      const weight400Button = screen.getByRole('button', { name: '400' });
      expect(weight400Button).toHaveAttribute('aria-pressed', 'true');

      const weight700Button = screen.getByRole('button', { name: '700' });
      expect(weight700Button).toHaveAttribute('aria-pressed', 'false');
    });

    it('should not display weight pills when no font is selected', () => {
      render(<FontSelector {...defaultProps} selectedFont={null} />);

      expect(screen.queryByText('Font Weight')).not.toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should navigate down with ArrowDown key', () => {
      render(<FontSelector {...defaultProps} />);

      const fontList = screen.getByRole('listbox');
      fireEvent.keyDown(fontList, { key: 'ArrowDown' });

      // First item should be focused (visual indication via style)
      const fontItems = screen.getAllByRole('option');
      expect(fontItems[0]).toHaveStyle({ backgroundColor: 'var(--color-surface-hover)' });
    });

    it('should navigate up with ArrowUp key', () => {
      render(<FontSelector {...defaultProps} />);

      const fontList = screen.getByRole('listbox');
      
      // Navigate down twice
      fireEvent.keyDown(fontList, { key: 'ArrowDown' });
      fireEvent.keyDown(fontList, { key: 'ArrowDown' });
      
      // Navigate up once
      fireEvent.keyDown(fontList, { key: 'ArrowUp' });

      const fontItems = screen.getAllByRole('option');
      expect(fontItems[0]).toHaveStyle({ backgroundColor: 'var(--color-surface-hover)' });
    });

    it('should select focused font with Enter key', () => {
      const onFontSelect = vi.fn();
      render(<FontSelector {...defaultProps} onFontSelect={onFontSelect} />);

      const fontList = screen.getByRole('listbox');
      
      // Navigate to first item and select
      fireEvent.keyDown(fontList, { key: 'ArrowDown' });
      fireEvent.keyDown(fontList, { key: 'Enter' });

      expect(onFontSelect).toHaveBeenCalledWith('Inter');
    });

    it('should not go below the last item with ArrowDown', () => {
      render(<FontSelector {...defaultProps} />);

      const fontList = screen.getByRole('listbox');
      
      // Navigate down more times than there are items
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(fontList, { key: 'ArrowDown' });
      }

      // Last item should be focused
      const fontItems = screen.getAllByRole('option');
      expect(fontItems[2]).toHaveStyle({ backgroundColor: 'var(--color-surface-hover)' });
    });

    it('should not go above the first item with ArrowUp', () => {
      render(<FontSelector {...defaultProps} />);

      const fontList = screen.getByRole('listbox');
      
      // Navigate down once, then up multiple times
      fireEvent.keyDown(fontList, { key: 'ArrowDown' });
      fireEvent.keyDown(fontList, { key: 'ArrowUp' });
      fireEvent.keyDown(fontList, { key: 'ArrowUp' });
      fireEvent.keyDown(fontList, { key: 'ArrowUp' });

      // First item should still be focused
      const fontItems = screen.getAllByRole('option');
      expect(fontItems[0]).toHaveStyle({ backgroundColor: 'var(--color-surface-hover)' });
    });
  });

  describe('accessibility', () => {
    it('should have accessible search input with label', () => {
      render(<FontSelector {...defaultProps} />);

      const searchInput = screen.getByLabelText('Search fonts');
      expect(searchInput).toBeInTheDocument();
    });

    it('should have aria-controls linking search to font list', () => {
      render(<FontSelector {...defaultProps} />);

      const searchInput = screen.getByLabelText('Search fonts');
      expect(searchInput).toHaveAttribute('aria-controls', 'font-list');
    });

    it('should have weight pills in a group with label', () => {
      render(<FontSelector {...defaultProps} selectedFont="Inter" />);

      const weightGroup = screen.getByRole('group', { name: 'Font weights' });
      expect(weightGroup).toBeInTheDocument();
    });
  });
});
