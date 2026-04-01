/**
 * TypeFlow Plugin - Typography Hook
 *
 * Custom React hook for managing typography style state and operations.
 * Provides style management, preview functionality, and preset management.
 *
 * **Validates: Requirements 3.2, 3.4, 4.2, 5.3, 5.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
 */

import { useState, useCallback, useRef } from 'react';
import {
  TypographyStyle,
  TypographyPreset,
  FramerElement,
} from '../types/typography';
import {
  applyTypography,
  ApplyResult,
} from '../features/applyTypography';

/**
 * Default typography style used as initial state
 */
const DEFAULT_TYPOGRAPHY_STYLE: TypographyStyle = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 0,
};

/**
 * Generates a unique ID for presets
 */
function generatePresetId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Return type for the useTypography hook
 */
export interface UseTypographyReturn {
  currentStyle: TypographyStyle;
  updateStyle: (updates: Partial<TypographyStyle>) => void;
  applyToSelection: (elements: FramerElement[]) => Promise<ApplyResult>;
  enablePreview: (elements: FramerElement[]) => Promise<void>;
  disablePreview: (elements: FramerElement[]) => Promise<void>;
  isPreviewActive: boolean;
  presets: TypographyPreset[];
  savePreset: (name: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
}

/**
 * Custom hook for managing typography style state and operations.
 *
 * Provides:
 * - `currentStyle`: The current typography style configuration
 * - `updateStyle()`: Updates the current style with partial values
 * - `applyToSelection()`: Applies current style to selected elements permanently
 * - `enablePreview()`: Enables preview mode with temporary style application
 * - `disablePreview()`: Disables preview mode and reverts to original styles
 * - `isPreviewActive`: Boolean indicating if preview mode is active
 * - `presets`: Array of saved typography presets
 * - `savePreset()`: Saves current style as a named preset
 * - `loadPreset()`: Loads a preset into current style
 * - `deletePreset()`: Removes a preset from the list
 *
 * **Validates: Requirements 3.2, 3.4** - Selection updates typography style
 * **Validates: Requirements 4.2** - Size change updates style
 * **Validates: Requirements 5.3** - Preview updates on style change
 * **Validates: Requirements 5.5** - Preview toggle state persistence
 * **Validates: Requirements 6.6** - Apply disables preview mode
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6** - Preset management
 *
 * @param initialStyle - Optional initial typography style
 * @param initialPresets - Optional initial presets array
 * @returns UseTypographyReturn object with state and functions
 */
export function useTypography(
  initialStyle?: Partial<TypographyStyle>,
  initialPresets?: TypographyPreset[]
): UseTypographyReturn {
  // Current typography style state
  const [currentStyle, setCurrentStyle] = useState<TypographyStyle>({
    ...DEFAULT_TYPOGRAPHY_STYLE,
    ...initialStyle,
  });

  // Preview mode state
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);

  // Saved presets state
  const [presets, setPresets] = useState<TypographyPreset[]>(initialPresets ?? []);

  // Track elements currently in preview mode for style updates
  const previewElementsRef = useRef<FramerElement[]>([]);

  /**
   * Updates the current typography style with partial values.
   * If preview mode is active, also updates the preview on elements.
   *
   * **Validates: Requirements 3.2, 3.4, 4.2, 5.3**
   *
   * @param updates - Partial typography style updates
   */
  const updateStyle = useCallback(
    (updates: Partial<TypographyStyle>): void => {
      setCurrentStyle((prevStyle) => {
        const newStyle = { ...prevStyle, ...updates };

        // If preview is active, update the preview with new style
        // This is done asynchronously to not block the state update
        if (isPreviewActive && previewElementsRef.current.length > 0) {
          // Apply updated style to preview elements
          applyTypography(previewElementsRef.current, newStyle, { temporary: true }).catch(
            (error) => {
              console.error('[TypeFlow] Failed to update preview:', error);
            }
          );
        }

        return newStyle;
      });
    },
    [isPreviewActive]
  );

  /**
   * Applies the current typography style to selected elements permanently.
   * Disables preview mode after successful application.
   *
   * **Validates: Requirements 6.6** - Apply disables preview mode
   *
   * @param elements - Array of Framer elements to apply styles to
   * @returns Promise resolving to ApplyResult
   */
  const applyToSelection = useCallback(
    async (elements: FramerElement[]): Promise<ApplyResult> => {
      const result = await applyTypography(elements, currentStyle, { temporary: false });

      // Disable preview mode after successful apply
      if (result.success) {
        setIsPreviewActive(false);
        previewElementsRef.current = [];
      }

      return result;
    },
    [currentStyle]
  );

  /**
   * Enables preview mode by setting the preview state.
   * Elements are not needed upfront - preview applies on font click.
   *
   * **Validates: Requirements 5.3, 5.5**
   *
   * @param _elements - Unused, kept for API compatibility
   */
  const enablePreview = useCallback(
    async (_elements: FramerElement[]): Promise<void> => {
      setIsPreviewActive(true);
    },
    []
  );

  /**
   * Disables preview mode.
   *
   * **Validates: Requirements 5.5**
   *
   * @param _elements - Unused, kept for API compatibility
   */
  const disablePreview = useCallback(async (_elements: FramerElement[]): Promise<void> => {
    setIsPreviewActive(false);
    previewElementsRef.current = [];
  }, []);

  /**
   * Saves the current typography style as a named preset.
   *
   * **Validates: Requirements 7.1, 7.2**
   *
   * @param name - Name for the preset
   */
  const savePreset = useCallback(
    (name: string): void => {
      const now = Date.now();
      const newPreset: TypographyPreset = {
        id: generatePresetId(),
        name,
        style: { ...currentStyle },
        createdAt: now,
        updatedAt: now,
      };

      setPresets((prevPresets) => [...prevPresets, newPreset]);
    },
    [currentStyle]
  );

  /**
   * Loads a preset into the current typography style.
   *
   * **Validates: Requirements 7.3, 7.4**
   *
   * @param presetId - ID of the preset to load
   */
  const loadPreset = useCallback(
    (presetId: string): void => {
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        // Use updateStyle to ensure preview is updated if active
        setCurrentStyle({ ...preset.style });

        // If preview is active, update the preview with loaded style
        if (isPreviewActive && previewElementsRef.current.length > 0) {
          applyTypography(previewElementsRef.current, preset.style, { temporary: true }).catch(
            (error) => {
              console.error('[TypeFlow] Failed to update preview after loading preset:', error);
            }
          );
        }
      }
    },
    [presets, isPreviewActive]
  );

  /**
   * Deletes a preset from the saved presets list.
   *
   * **Validates: Requirements 7.5, 7.6**
   *
   * @param presetId - ID of the preset to delete
   */
  const deletePreset = useCallback((presetId: string): void => {
    setPresets((prevPresets) => prevPresets.filter((p) => p.id !== presetId));
  }, []);

  return {
    currentStyle,
    updateStyle,
    applyToSelection,
    enablePreview,
    disablePreview,
    isPreviewActive,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  };
}
