/**
 * TypeFlow Plugin - Typography Type Definitions
 *
 * Core type definitions for typography management in the TypeFlow Framer plugin.
 * These types are used across all modules for type safety and consistency.
 */

/**
 * Complete typography style configuration
 */
export interface TypographyStyle {
  fontFamily: string;
  fontSize: number; // in pixels
  fontWeight: number; // 100-900
  lineHeight: number; // multiplier (e.g., 1.5)
  letterSpacing: number; // in pixels
}

/**
 * Font style variants
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * Metadata about a discovered font
 */
export interface FontMetadata {
  family: string;
  availableWeights: number[];
  styles: FontStyle[];
  usageCount: number;
  elements: string[]; // Element IDs using this font
}

/**
 * Saved typography preset
 */
export interface TypographyPreset {
  id: string;
  name: string;
  style: TypographyStyle;
  createdAt: number;
  updatedAt: number;
}

/**
 * Error codes for application errors
 */
export enum ErrorCode {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  SCAN_FAILED = 'SCAN_FAILED',
  APPLY_FAILED = 'APPLY_FAILED',
  FRAMER_API_UNAVAILABLE = 'FRAMER_API_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PRESET_SAVE_FAILED = 'PRESET_SAVE_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Application error structure
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

/**
 * Framer element representation (simplified)
 */
export interface FramerElement {
  id: string;
  type: string;
  typography?: TypographyStyle;
}

/**
 * Framer project representation
 */
export interface FramerProject {
  id: string;
  elements: FramerElement[];
}
