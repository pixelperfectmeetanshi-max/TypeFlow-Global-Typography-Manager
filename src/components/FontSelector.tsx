/**
 * TypeFlow Plugin - Font Selector Component
 *
 * Displays available fonts with search functionality and weight selection.
 * Supports keyboard navigation for accessibility.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.5**
 */

import React, { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { FontMetadata } from '../types/typography';
import { filterFontsByQuery, getAvailableWeights } from '../features/fontUtils';

/**
 * Props for the FontSelector component
 */
export interface FontSelectorProps {
  fonts: FontMetadata[];
  selectedFont: string | null;
  selectedWeight: number;
  onFontSelect: (fontFamily: string) => void;
  onWeightSelect: (weight: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFontHover?: (fontFamily: string | null) => void;
  onWeightHover?: (weight: number | null) => void;
  hideTitle?: boolean;
}

/**
 * FontSelector component for browsing and selecting fonts.
 *
 * Features:
 * - Searchable font list with case-insensitive filtering
 * - Weight selection pills for the selected font
 * - Keyboard navigation support (Arrow keys, Enter, Escape)
 * - Accessible with proper ARIA attributes
 * - Hover preview support when Live Preview is enabled
 *
 * @param props - FontSelectorProps
 */
export function FontSelector({
  fonts,
  selectedFont,
  selectedWeight,
  onFontSelect,
  onWeightSelect,
  searchQuery,
  onSearchChange,
  onFontHover,
  onWeightHover,
  hideTitle = false,
}: FontSelectorProps): React.ReactElement {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter fonts based on search query
  const filteredFonts = filterFontsByQuery(fonts, searchQuery);

  // Get available weights for selected font
  const availableWeights = selectedFont ? getAvailableWeights(selectedFont) : [];

  /**
   * Handles search input changes
   */
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
      setFocusedIndex(-1);
    },
    [onSearchChange]
  );

  /**
   * Handles font item click
   */
  const handleFontClick = useCallback(
    (fontFamily: string) => {
      onFontSelect(fontFamily);
    },
    [onFontSelect]
  );

  /**
   * Handles font item hover
   */
  const handleFontMouseEnter = useCallback(
    (fontFamily: string) => {
      onFontHover?.(fontFamily);
    },
    [onFontHover]
  );

  /**
   * Handles font list mouse leave
   */
  const handleFontListMouseLeave = useCallback(() => {
    onFontHover?.(null);
  }, [onFontHover]);

  /**
   * Handles weight pill click
   */
  const handleWeightClick = useCallback(
    (weight: number) => {
      onWeightSelect(weight);
    },
    [onWeightSelect]
  );

  /**
   * Handles weight pill hover
   */
  const handleWeightMouseEnter = useCallback(
    (weight: number) => {
      onWeightHover?.(weight);
    },
    [onWeightHover]
  );

  /**
   * Handles weight list mouse leave
   */
  const handleWeightListMouseLeave = useCallback(() => {
    onWeightHover?.(null);
  }, [onWeightHover]);

  /**
   * Handles keyboard navigation in the font list
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const { key } = event;

      switch (key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredFonts.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;

        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredFonts.length) {
            const focusedFont = filteredFonts[focusedIndex];
            if (focusedFont) {
              onFontSelect(focusedFont.family);
            }
          }
          break;

        case 'Escape':
          event.preventDefault();
          searchInputRef.current?.focus();
          setFocusedIndex(-1);
          break;

        default:
          break;
      }
    },
    [filteredFonts, focusedIndex, onFontSelect]
  );

  /**
   * Scrolls focused item into view
   */
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const focusedItem = items[focusedIndex] as HTMLElement;
      focusedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  return (
    <div className="section">
      {!hideTitle && <h3 className="section-title">Font Selection</h3>}

      {/* Search Input */}
      <div className="mb-sm">
        <label htmlFor="font-search" className="sr-only">
          Search fonts
        </label>
        <input
          ref={searchInputRef}
          id="font-search"
          type="text"
          className="input"
          placeholder="Search fonts..."
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search fonts"
          aria-controls="font-list"
        />
      </div>

      {/* Font List */}
      <div
        ref={listRef}
        id="font-list"
        className="font-list"
        role="listbox"
        aria-label="Available fonts"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseLeave={handleFontListMouseLeave}
      >
        {filteredFonts.length === 0 ? (
          <div className="p-md text-secondary text-sm">
            {searchQuery ? 'No fonts match your search' : 'No fonts available'}
          </div>
        ) : (
          filteredFonts.map((font, index) => (
            <div
              key={font.family}
              role="option"
              aria-selected={selectedFont === font.family}
              className={`font-item ${
                selectedFont === font.family ? 'font-item--selected' : ''
              } ${focusedIndex === index ? 'font-item--focused' : ''}`}
              onClick={() => handleFontClick(font.family)}
              onMouseEnter={() => handleFontMouseEnter(font.family)}
              tabIndex={-1}
              style={focusedIndex === index ? { backgroundColor: 'var(--color-surface-hover)' } : undefined}
            >
              <span className="font-item-name">{font.family}</span>
              <span className="font-item-count">{font.usageCount} uses</span>
            </div>
          ))
        )}
      </div>

      {/* Weight Selection */}
      {selectedFont && availableWeights.length > 0 && (
        <div className="mt-md">
          <label className="label">Font Weight</label>
          <div 
            className="weight-list" 
            role="group" 
            aria-label="Font weights"
            onMouseLeave={handleWeightListMouseLeave}
          >
            {availableWeights.map((weight) => (
              <button
                key={weight}
                type="button"
                className={`weight-pill ${
                  selectedWeight === weight ? 'weight-pill--selected' : ''
                }`}
                onClick={() => handleWeightClick(weight)}
                onMouseEnter={() => handleWeightMouseEnter(weight)}
                aria-pressed={selectedWeight === weight}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
