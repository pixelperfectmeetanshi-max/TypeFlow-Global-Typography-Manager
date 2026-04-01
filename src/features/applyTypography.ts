/**
 * TypeFlow Plugin - Apply Typography
 *
 * Implements typography style application functionality with support for
 * temporary (preview) and permanent modes. Handles apply failures with
 * state preservation and provides revert capability for preview cancellation.
 *
 * **Validates: Requirements 5.1, 5.2, 6.1, 6.4, 6.5**
 */

import { FramerElement, TypographyStyle } from '../types/typography';

/**
 * Options for applying typography styles
 */
export interface ApplyOptions {
  /** If true, applies styles temporarily for preview mode */
  temporary: boolean;
}

/**
 * Error information for failed apply operations
 */
export interface ApplyError {
  elementId: string;
  message: string;
}

/**
 * Result of an apply typography operation
 */
export interface ApplyResult {
  success: boolean;
  appliedCount: number;
  errors: ApplyError[];
}

/**
 * Storage for original styles to enable revert functionality.
 * Maps element ID to its original typography style.
 */
const originalStylesStore = new Map<string, TypographyStyle>();

/**
 * Clears the original styles store.
 * Used after permanent apply or when resetting state.
 */
export function clearOriginalStyles(): void {
  originalStylesStore.clear();
}

/**
 * Gets the stored original styles map.
 * Useful for testing and debugging.
 */
export function getOriginalStyles(): Map<string, TypographyStyle> {
  return new Map(originalStylesStore);
}


/**
 * Deep clones a typography style to prevent mutation.
 */
function cloneTypographyStyle(style: TypographyStyle): TypographyStyle {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
  };
}

/**
 * Stores the original typography style of an element for later revert.
 * Only stores if not already stored (preserves the true original).
 *
 * @param element - The element whose style should be stored
 */
function storeOriginalStyle(element: FramerElement): void {
  if (!originalStylesStore.has(element.id) && element.typography) {
    originalStylesStore.set(element.id, cloneTypographyStyle(element.typography));
  }
}

/**
 * Applies a typography style to a single element.
 * Mutates the element's typography property.
 *
 * @param element - The element to apply style to
 * @param style - The typography style to apply
 */
function applyStyleToElement(element: FramerElement, style: TypographyStyle): void {
  element.typography = cloneTypographyStyle(style);
}


/**
 * Applies typography styles to selected elements with support for
 * temporary (preview) and permanent modes.
 *
 * **Validates: Requirements 5.1, 6.1, 6.4, 6.5**
 * **Property 14: Apply Typography to All Selected Elements** - for any apply
 * operation with N selected elements, all N elements should have their
 * typography updated to match the TypographyStyle.
 * **Property 15: Failed Apply Preserves Original Styles** - for any apply
 * operation that fails, all affected elements should retain their original
 * typography styles.
 *
 * @param elements - Array of Framer elements to apply styles to
 * @param style - The typography style to apply
 * @param options - Apply options (temporary for preview mode)
 * @returns Promise resolving to ApplyResult with success status and counts
 */
export async function applyTypography(
  elements: FramerElement[],
  style: TypographyStyle,
  options: ApplyOptions
): Promise<ApplyResult> {
  const errors: ApplyError[] = [];
  let appliedCount = 0;

  // Store original styles before any modifications for revert capability
  // This is done upfront to ensure we can fully revert on failure
  const elementsToProcess: FramerElement[] = [];
  const preApplyStyles = new Map<string, TypographyStyle | undefined>();

  for (const element of elements) {
    // Store the current state before any changes
    preApplyStyles.set(
      element.id,
      element.typography ? cloneTypographyStyle(element.typography) : undefined
    );

    // For temporary mode, store original styles for later revert
    if (options.temporary) {
      storeOriginalStyle(element);
    }

    elementsToProcess.push(element);
  }

  // Apply styles to all elements
  for (const element of elementsToProcess) {
    try {
      applyStyleToElement(element, style);
      appliedCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({
        elementId: element.id,
        message: errorMessage,
      });
    }
  }

  // Check if we had any failures
  const hasFailures = errors.length > 0;

  // Property 15: Failed Apply Preserves Original Styles
  // If any element failed to apply, revert ALL elements to their pre-apply state
  if (hasFailures) {
    for (const element of elementsToProcess) {
      const originalStyle = preApplyStyles.get(element.id);
      if (originalStyle) {
        element.typography = cloneTypographyStyle(originalStyle);
      } else {
        element.typography = undefined;
      }
    }

    // Clear the stored original styles since we reverted
    if (options.temporary) {
      for (const element of elementsToProcess) {
        originalStylesStore.delete(element.id);
      }
    }

    return {
      success: false,
      appliedCount: 0,
      errors,
    };
  }

  // For permanent apply, clear the original styles store
  if (!options.temporary) {
    clearOriginalStyles();
  }

  return {
    success: true,
    appliedCount,
    errors: [],
  };
}


/**
 * Reverts elements to their original typography styles.
 * Used when preview mode is disabled to restore original appearance.
 *
 * **Validates: Requirements 5.2**
 * **Property 11: Preview Mode Round-Trip** - for any set of selected elements
 * with original typography, enabling preview mode and then disabling it
 * should restore all elements to their exact original typography styles.
 *
 * @param elements - Array of Framer elements to revert
 * @param originalStyles - Map of element IDs to their original typography styles
 * @returns Promise that resolves when revert is complete
 */
export async function revertTypography(
  elements: FramerElement[],
  originalStyles: Map<string, TypographyStyle>
): Promise<void> {
  for (const element of elements) {
    const originalStyle = originalStyles.get(element.id);
    if (originalStyle) {
      element.typography = cloneTypographyStyle(originalStyle);
    }
  }

  // Clear the stored original styles after revert
  clearOriginalStyles();
}

/**
 * Reverts elements using the internally stored original styles.
 * Convenience function that uses the module's internal store.
 *
 * **Validates: Requirements 5.2**
 *
 * @param elements - Array of Framer elements to revert
 * @returns Promise that resolves when revert is complete
 */
export async function revertToOriginalStyles(elements: FramerElement[]): Promise<void> {
  return revertTypography(elements, originalStylesStore);
}
