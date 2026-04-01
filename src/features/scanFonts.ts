/**
 * TypeFlow Plugin - Font Scanning
 *
 * Implements font scanning functionality to traverse Framer project elements
 * and extract typography metadata. Handles elements without typography gracefully
 * and implements error recovery for failed element processing.
 */

import { FontMetadata, FontStyle, FramerElement, FramerProject } from '../types/typography';

/**
 * Result of scanning a single element
 */
interface ElementScanResult {
  success: boolean;
  fontMetadata: FontMetadata | null;
  elementId: string;
  error?: string;
}

/**
 * Result of the complete font scan operation
 */
export interface ScanResult {
  fonts: FontMetadata[];
  totalElements: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ elementId: string; error: string }>;
}

/**
 * Extracts font metadata from a single Framer element.
 * Returns null for elements without typography properties.
 *
 * **Validates: Requirements 2.3, 2.4**
 * **Property 3: Typography Extraction Completeness** - for any element with typography,
 * the resulting FontMetadata should contain a non-empty font family, at least one
 * available weight, and a usage count of at least 1.
 * **Property 4: Scanner Resilience to Non-Typography Elements** - for any element
 * without typography, this function returns null without throwing an error.
 *
 * @param element - The Framer element to extract font metadata from
 * @returns FontMetadata if element has typography, null otherwise
 */
export function extractFontFromElement(element: FramerElement): FontMetadata | null {
  // Handle elements without typography gracefully (Property 4)
  if (!element.typography) {
    return null;
  }

  const { fontFamily, fontWeight } = element.typography;

  // Validate that we have a valid font family
  if (!fontFamily || typeof fontFamily !== 'string' || fontFamily.trim() === '') {
    return null;
  }

  // Create FontMetadata with extracted information (Property 3)
  // Ensure non-empty family, at least one weight, and usageCount >= 1
  const metadata: FontMetadata = {
    family: fontFamily.trim(),
    availableWeights: [fontWeight || 400], // Default to 400 if no weight specified
    styles: ['normal' as FontStyle], // Default style
    usageCount: 1,
    elements: [element.id],
  };

  return metadata;
}

/**
 * Deduplicates font metadata by merging entries with the same font family.
 * Combines available weights, styles, usage counts, and element IDs.
 *
 * **Validates: Requirements 2.2**
 * **Property 2: Scanned Fonts Are Unique** - for any completed font scan result,
 * there should be no duplicate font family entries.
 *
 * @param fonts - Array of FontMetadata that may contain duplicates
 * @returns Array of FontMetadata with unique font families
 */
export function deduplicateFonts(fonts: FontMetadata[]): FontMetadata[] {
  const fontMap = new Map<string, FontMetadata>();

  for (const font of fonts) {
    const existingFont = fontMap.get(font.family);

    if (existingFont) {
      // Merge with existing font entry
      // Combine weights (deduplicated)
      const combinedWeights = new Set([...existingFont.availableWeights, ...font.availableWeights]);
      existingFont.availableWeights = Array.from(combinedWeights).sort((a, b) => a - b);

      // Combine styles (deduplicated)
      const combinedStyles = new Set([...existingFont.styles, ...font.styles]);
      existingFont.styles = Array.from(combinedStyles) as FontStyle[];

      // Sum usage counts
      existingFont.usageCount += font.usageCount;

      // Combine element IDs (deduplicated)
      const combinedElements = new Set([...existingFont.elements, ...font.elements]);
      existingFont.elements = Array.from(combinedElements);
    } else {
      // Add new font entry (create a copy to avoid mutation)
      fontMap.set(font.family, {
        family: font.family,
        availableWeights: [...font.availableWeights],
        styles: [...font.styles],
        usageCount: font.usageCount,
        elements: [...font.elements],
      });
    }
  }

  return Array.from(fontMap.values());
}

/**
 * Scans a Framer project for all fonts used in its elements.
 * Traverses all elements, extracts font metadata, and returns deduplicated results.
 * Implements error recovery - continues scanning even if individual elements fail.
 *
 * **Validates: Requirements 2.1, 2.2, 2.7**
 * **Property 1: Font Scanner Traverses All Elements** - for any project with N elements,
 * the scanner visits exactly N elements.
 * **Property 2: Scanned Fonts Are Unique** - the result contains no duplicate font families.
 * **Property 5: Scanner Error Recovery** - if some elements fail to process, the scanner
 * still returns FontMetadata for successfully processed elements.
 *
 * @param project - The Framer project to scan
 * @returns Promise resolving to array of unique FontMetadata
 */
export async function scanFonts(project: FramerProject): Promise<FontMetadata[]> {
  const result = await scanFontsWithDetails(project);
  return result.fonts;
}

/**
 * Scans a Framer project for all fonts with detailed results including error information.
 * This is the internal implementation that provides full scan details.
 *
 * **Validates: Requirements 2.1, 2.2, 2.7**
 *
 * @param project - The Framer project to scan
 * @returns Promise resolving to ScanResult with fonts and scan statistics
 */
export async function scanFontsWithDetails(project: FramerProject): Promise<ScanResult> {
  const extractedFonts: FontMetadata[] = [];
  const errors: Array<{ elementId: string; error: string }> = [];
  let successCount = 0;
  let errorCount = 0;

  // Traverse all elements in the project (Property 1)
  for (const element of project.elements) {
    const scanResult = scanElement(element);

    if (scanResult.success) {
      successCount++;
      if (scanResult.fontMetadata) {
        extractedFonts.push(scanResult.fontMetadata);
      }
    } else {
      errorCount++;
      if (scanResult.error) {
        errors.push({
          elementId: scanResult.elementId,
          error: scanResult.error,
        });
      }
    }
  }

  // Deduplicate fonts (Property 2)
  const uniqueFonts = deduplicateFonts(extractedFonts);

  return {
    fonts: uniqueFonts,
    totalElements: project.elements.length,
    successCount,
    errorCount,
    errors,
  };
}

/**
 * Scans a single element with error recovery.
 * Wraps extractFontFromElement with try-catch for resilience.
 *
 * **Validates: Requirements 2.7**
 * **Property 5: Scanner Error Recovery** - errors in individual elements
 * don't stop the overall scan.
 *
 * @param element - The element to scan
 * @returns ElementScanResult with success status and optional font metadata
 */
function scanElement(element: FramerElement): ElementScanResult {
  try {
    const fontMetadata = extractFontFromElement(element);
    return {
      success: true,
      fontMetadata,
      elementId: element.id,
    };
  } catch (error) {
    // Error recovery - log and continue (Property 5)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[TypeFlow] Error scanning element ${element.id}:`, errorMessage);

    return {
      success: false,
      fontMetadata: null,
      elementId: element.id,
      error: errorMessage,
    };
  }
}
