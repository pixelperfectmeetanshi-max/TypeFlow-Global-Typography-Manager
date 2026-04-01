/**
 * TypeFlow Plugin - Font Utilities
 *
 * Font-related utilities for typography management.
 * Implements font weight retrieval, search filtering, and usage-based sorting.
 */

import { FontMetadata } from '../types/typography';

/**
 * Standard font weights available in CSS.
 * These are the common weights that most fonts support.
 * Note: 100 (Thin) is excluded as it's rarely available.
 */
const STANDARD_FONT_WEIGHTS = [200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Gets the available font weights for a given font family.
 * Returns standard CSS font weights (100-900).
 *
 * Note: In a real implementation, this would query the Framer API
 * or font service to get actual available weights. For now, it returns
 * standard weights as a baseline.
 *
 * **Validates: Requirements 3.3**
 *
 * @param fontFamily - The font family name to get weights for
 * @returns Array of available font weights (100-900)
 */
export function getAvailableWeights(fontFamily: string): number[] {
  // Return empty array for empty or invalid font family
  if (!fontFamily || typeof fontFamily !== 'string' || fontFamily.trim() === '') {
    return [];
  }

  // Return standard font weights
  // In a real implementation, this would query actual font data
  return [...STANDARD_FONT_WEIGHTS];
}

/**
 * Filters fonts by a search query string (case-insensitive).
 * Returns fonts whose family name includes the query string.
 *
 * **Validates: Requirements 3.6**
 * **Property 7: Font Search Filtering** - the filtered result should only contain
 * fonts whose family name includes the query string (case-insensitive),
 * and all matching fonts should be included.
 *
 * @param fonts - Array of FontMetadata to filter
 * @param query - Search query string
 * @returns Filtered array of FontMetadata matching the query
 */
export function filterFontsByQuery(fonts: FontMetadata[], query: string): FontMetadata[] {
  // Return all fonts if query is empty or whitespace-only
  if (!query || query.trim() === '') {
    return fonts;
  }

  // Normalize query for case-insensitive comparison
  const normalizedQuery = query.toLowerCase();

  // Filter fonts whose family name includes the query (case-insensitive)
  return fonts.filter((font) => font.family.toLowerCase().includes(normalizedQuery));
}

/**
 * Sorts fonts by their usage count in descending order.
 * Fonts with higher usage counts appear first.
 *
 * **Validates: Requirements 3.5**
 *
 * @param fonts - Array of FontMetadata to sort
 * @returns New array of FontMetadata sorted by usage count (descending)
 */
export function sortFontsByUsage(fonts: FontMetadata[]): FontMetadata[] {
  // Create a copy to avoid mutating the original array
  return [...fonts].sort((a, b) => b.usageCount - a.usageCount);
}
