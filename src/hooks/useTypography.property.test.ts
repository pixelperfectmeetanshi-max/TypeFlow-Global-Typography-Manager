/**
 * TypeFlow Plugin - useTypography Hook Property Tests
 *
 * Property-based tests for the useTypography hook.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin
 * - Property 6: Selection Updates Typography Style
 * - Property 10: Size Change Updates Style
 * - Property 12: Preview Updates on Style Change
 * - Property 13: Preview Toggle State Persistence
 * - Property 16: Apply Disables Preview Mode
 * - Property 17: Preset Save/Load Round-Trip
 * - Property 18: Preset Deletion Removes from List
 *
 * **Validates: Requirements 3.2, 3.4, 4.2, 5.3, 5.5, 6.6, 7.2, 7.4, 7.6**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTypography } from './useTypography';
import { FramerElement, TypographyStyle, TypographyPreset } from '../types/typography';
import { clearOriginalStyles } from '../features/applyTypography';

/**
 * Arbitrary for generating valid font family names
 */
const fontFamilyArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid font weights (100-900 in increments of 100)
 */
const fontWeightArb = fc.constantFrom(100, 200, 300, 400, 500, 600, 700, 800, 900);

/**
 * Arbitrary for generating valid font sizes (positive integers)
 */
const fontSizeArb = fc.integer({ min: 1, max: 200 });

/**
 * Arbitrary for generating valid line heights (positive numbers)
 */
const lineHeightArb = fc.double({ min: 0.5, max: 3, noNaN: true });

/**
 * Arbitrary for generating valid letter spacing values
 */
const letterSpacingArb = fc.double({ min: -5, max: 10, noNaN: true });

/**
 * Arbitrary for generating valid TypographyStyle objects
 */
const typographyStyleArb: fc.Arbitrary<TypographyStyle> = fc.record({
  fontFamily: fontFamilyArb,
  fontSize: fontSizeArb,
  fontWeight: fontWeightArb,
  lineHeight: lineHeightArb,
  letterSpacing: letterSpacingArb,
});

/**
 * Arbitrary for generating FramerElement with typography
 */
const elementWithTypographyArb: fc.Arbitrary<FramerElement> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('text', 'heading', 'paragraph'),
  typography: typographyStyleArb,
});

/**
 * Arbitrary for generating arrays of FramerElements with typography
 */
const elementsArrayArb = fc.array(elementWithTypographyArb, {
  minLength: 1,
  maxLength: 10,
});

/**
 * Arbitrary for generating valid preset names
 */
const presetNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/**
 * Helper to compare two typography styles for equality
 */
function stylesEqual(a: TypographyStyle, b: TypographyStyle): boolean {
  return (
    a.fontFamily === b.fontFamily &&
    a.fontSize === b.fontSize &&
    a.fontWeight === b.fontWeight &&
    a.lineHeight === b.lineHeight &&
    a.letterSpacing === b.letterSpacing
  );
}

/**
 * Helper to deep clone a typography style
 */
function cloneStyle(style: TypographyStyle): TypographyStyle {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
  };
}


describe('Property 6 & 10: Style Updates', () => {
  /**
   * Feature: typeflow-plugin, Property 6: Selection Updates Typography Style
   * **Validates: Requirements 3.2, 3.4**
   *
   * For any font family or weight selection, the current TypographyStyle should be
   * updated with exactly the selected value.
   */

  beforeEach(() => {
    clearOriginalStyles();
  });

  it('font family selection updates currentStyle with exactly the selected value', () => {
    fc.assert(
      fc.property(fontFamilyArb, (newFontFamily) => {
        const { result } = renderHook(() => useTypography());

        act(() => {
          result.current.updateStyle({ fontFamily: newFontFamily });
        });

        expect(result.current.currentStyle.fontFamily).toBe(newFontFamily);
      }),
      { numRuns: 100 }
    );
  });

  it('font weight selection updates currentStyle with exactly the selected value', () => {
    fc.assert(
      fc.property(fontWeightArb, (newFontWeight) => {
        const { result } = renderHook(() => useTypography());

        act(() => {
          result.current.updateStyle({ fontWeight: newFontWeight });
        });

        expect(result.current.currentStyle.fontWeight).toBe(newFontWeight);
      }),
      { numRuns: 100 }
    );
  });

  it('combined font family and weight selection updates both values correctly', () => {
    fc.assert(
      fc.property(fontFamilyArb, fontWeightArb, (newFontFamily, newFontWeight) => {
        const { result } = renderHook(() => useTypography());

        act(() => {
          result.current.updateStyle({ fontFamily: newFontFamily, fontWeight: newFontWeight });
        });

        expect(result.current.currentStyle.fontFamily).toBe(newFontFamily);
        expect(result.current.currentStyle.fontWeight).toBe(newFontWeight);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: typeflow-plugin, Property 10: Size Change Updates Style
   * **Validates: Requirements 4.2**
   *
   * For any valid size value change, the current TypographyStyle should be
   * updated with exactly the new value.
   */

  it('fontSize change updates currentStyle with exactly the new value', () => {
    fc.assert(
      fc.property(fontSizeArb, (newFontSize) => {
        const { result } = renderHook(() => useTypography());

        act(() => {
          result.current.updateStyle({ fontSize: newFontSize });
        });

        expect(result.current.currentStyle.fontSize).toBe(newFontSize);
      }),
      { numRuns: 100 }
    );
  });

  it('lineHeight change updates currentStyle with exactly the new value', () => {
    fc.assert(
      fc.property(lineHeightArb, (newLineHeight) => {
        const { result } = renderHook(() => useTypography());

        act(() => {
          result.current.updateStyle({ lineHeight: newLineHeight });
        });

        expect(result.current.currentStyle.lineHeight).toBe(newLineHeight);
      }),
      { numRuns: 100 }
    );
  });

  it('letterSpacing change updates currentStyle with exactly the new value', () => {
    fc.assert(
      fc.property(letterSpacingArb, (newLetterSpacing) => {
        const { result } = renderHook(() => useTypography());

        act(() => {
          result.current.updateStyle({ letterSpacing: newLetterSpacing });
        });

        expect(result.current.currentStyle.letterSpacing).toBe(newLetterSpacing);
      }),
      { numRuns: 100 }
    );
  });

  it('multiple size changes in sequence result in the final values', () => {
    fc.assert(
      fc.property(
        fc.array(typographyStyleArb, { minLength: 2, maxLength: 5 }),
        (styles) => {
          const { result } = renderHook(() => useTypography());

          for (const style of styles) {
            act(() => {
              result.current.updateStyle(style);
            });
          }

          const lastStyle = styles[styles.length - 1];
          expect(result.current.currentStyle.fontSize).toBe(lastStyle.fontSize);
          expect(result.current.currentStyle.lineHeight).toBe(lastStyle.lineHeight);
          expect(result.current.currentStyle.letterSpacing).toBe(lastStyle.letterSpacing);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('partial style updates preserve other style properties', () => {
    fc.assert(
      fc.property(typographyStyleArb, fontSizeArb, (initialStyle, newFontSize) => {
        const { result } = renderHook(() => useTypography(initialStyle));

        act(() => {
          result.current.updateStyle({ fontSize: newFontSize });
        });

        // fontSize should be updated
        expect(result.current.currentStyle.fontSize).toBe(newFontSize);
        // Other properties should be preserved
        expect(result.current.currentStyle.fontFamily).toBe(initialStyle.fontFamily);
        expect(result.current.currentStyle.fontWeight).toBe(initialStyle.fontWeight);
        expect(result.current.currentStyle.lineHeight).toBe(initialStyle.lineHeight);
        expect(result.current.currentStyle.letterSpacing).toBe(initialStyle.letterSpacing);
      }),
      { numRuns: 100 }
    );
  });
});


describe('Property 12, 13, 16: Preview State', () => {
  /**
   * Feature: typeflow-plugin, Property 12: Preview Updates on Style Change
   * **Validates: Requirements 5.3**
   *
   * For any style change while preview mode is active, the temporarily applied
   * styles should reflect the new values.
   */

  beforeEach(() => {
    clearOriginalStyles();
  });

  it('style changes while preview is active update the preview elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        typographyStyleArb,
        async (elements, initialStyle, newStyle) => {
          const { result } = renderHook(() => useTypography(initialStyle));

          // Enable preview mode
          await act(async () => {
            await result.current.enablePreview(elements);
          });

          expect(result.current.isPreviewActive).toBe(true);

          // Update style while preview is active
          await act(async () => {
            result.current.updateStyle(newStyle);
          });

          // Wait for async preview update
          await waitFor(() => {
            // The currentStyle should reflect the new values
            expect(result.current.currentStyle.fontFamily).toBe(newStyle.fontFamily);
            expect(result.current.currentStyle.fontSize).toBe(newStyle.fontSize);
            expect(result.current.currentStyle.fontWeight).toBe(newStyle.fontWeight);
          });

          // Elements should have the new style applied (preview update)
          for (const element of elements) {
            expect(element.typography).toBeDefined();
            expect(element.typography!.fontFamily).toBe(newStyle.fontFamily);
            expect(element.typography!.fontSize).toBe(newStyle.fontSize);
            expect(element.typography!.fontWeight).toBe(newStyle.fontWeight);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('multiple style changes during preview all reflect in elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        fc.array(typographyStyleArb, { minLength: 2, maxLength: 4 }),
        async (elements, styles) => {
          const { result } = renderHook(() => useTypography());

          // Enable preview mode
          await act(async () => {
            await result.current.enablePreview(elements);
          });

          // Apply multiple style changes
          for (const style of styles) {
            await act(async () => {
              result.current.updateStyle(style);
            });
          }

          const lastStyle = styles[styles.length - 1];

          // Wait for async updates
          await waitFor(() => {
            expect(result.current.currentStyle.fontFamily).toBe(lastStyle.fontFamily);
          });

          // Elements should have the last style applied
          for (const element of elements) {
            expect(element.typography!.fontFamily).toBe(lastStyle.fontFamily);
            expect(element.typography!.fontSize).toBe(lastStyle.fontSize);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: typeflow-plugin, Property 13: Preview Toggle State Persistence
   * **Validates: Requirements 5.5**
   *
   * The Preview_Toggle state should remain consistent unless explicitly toggled
   * or reset by apply.
   */

  it('preview state remains false until explicitly enabled', () => {
    fc.assert(
      fc.property(
        fc.array(typographyStyleArb, { minLength: 1, maxLength: 5 }),
        (styles) => {
          const { result } = renderHook(() => useTypography());

          // Apply multiple style changes without enabling preview
          for (const style of styles) {
            act(() => {
              result.current.updateStyle(style);
            });
          }

          // Preview should still be false
          expect(result.current.isPreviewActive).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preview state remains true after style changes until explicitly disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        fc.array(typographyStyleArb, { minLength: 1, maxLength: 5 }),
        async (elements, styles) => {
          const { result } = renderHook(() => useTypography());

          // Enable preview
          await act(async () => {
            await result.current.enablePreview(elements);
          });

          expect(result.current.isPreviewActive).toBe(true);

          // Apply multiple style changes
          for (const style of styles) {
            await act(async () => {
              result.current.updateStyle(style);
            });
          }

          // Preview should still be true
          expect(result.current.isPreviewActive).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preview state becomes false after explicit disable', async () => {
    await fc.assert(
      fc.asyncProperty(elementsArrayArb, async (elements) => {
        const { result } = renderHook(() => useTypography());

        // Enable preview
        await act(async () => {
          await result.current.enablePreview(elements);
        });

        expect(result.current.isPreviewActive).toBe(true);

        // Disable preview
        await act(async () => {
          await result.current.disablePreview(elements);
        });

        expect(result.current.isPreviewActive).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: typeflow-plugin, Property 16: Apply Disables Preview Mode
   * **Validates: Requirements 6.6**
   *
   * For any successful apply operation, preview mode should be disabled.
   */

  it('successful apply operation disables preview mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, style) => {
          const { result } = renderHook(() => useTypography(style));

          // Enable preview
          await act(async () => {
            await result.current.enablePreview(elements);
          });

          expect(result.current.isPreviewActive).toBe(true);

          // Apply to selection
          await act(async () => {
            const applyResult = await result.current.applyToSelection(elements);
            expect(applyResult.success).toBe(true);
          });

          // Preview should be disabled after successful apply
          expect(result.current.isPreviewActive).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('apply without prior preview keeps preview mode disabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        elementsArrayArb,
        typographyStyleArb,
        async (elements, style) => {
          const { result } = renderHook(() => useTypography(style));

          // Preview should be false initially
          expect(result.current.isPreviewActive).toBe(false);

          // Apply to selection without enabling preview
          await act(async () => {
            const applyResult = await result.current.applyToSelection(elements);
            expect(applyResult.success).toBe(true);
          });

          // Preview should still be false
          expect(result.current.isPreviewActive).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preview enable with empty elements does not activate preview', async () => {
    await fc.assert(
      fc.asyncProperty(typographyStyleArb, async (style) => {
        const { result } = renderHook(() => useTypography(style));

        // Try to enable preview with empty elements
        await act(async () => {
          await result.current.enablePreview([]);
        });

        // Preview should remain false
        expect(result.current.isPreviewActive).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});


describe('Property 17 & 18: Preset Management', () => {
  /**
   * Feature: typeflow-plugin, Property 17: Preset Save/Load Round-Trip
   * **Validates: Requirements 7.2, 7.4**
   *
   * For any TypographyStyle saved as a preset, loading that preset should
   * restore the exact same values.
   */

  beforeEach(() => {
    clearOriginalStyles();
  });

  it('saving and loading a preset restores exact typography style values', () => {
    fc.assert(
      fc.property(typographyStyleArb, presetNameArb, (style, presetName) => {
        const { result } = renderHook(() => useTypography(style));

        // Save current style as preset
        act(() => {
          result.current.savePreset(presetName);
        });

        // Get the saved preset
        const savedPreset = result.current.presets.find((p) => p.name === presetName);
        expect(savedPreset).toBeDefined();

        // Change the current style to something different
        act(() => {
          result.current.updateStyle({
            fontFamily: 'DifferentFont',
            fontSize: 999,
            fontWeight: 100,
            lineHeight: 0.5,
            letterSpacing: -5,
          });
        });

        // Load the preset
        act(() => {
          result.current.loadPreset(savedPreset!.id);
        });

        // Verify the style is restored exactly
        expect(result.current.currentStyle.fontFamily).toBe(style.fontFamily);
        expect(result.current.currentStyle.fontSize).toBe(style.fontSize);
        expect(result.current.currentStyle.fontWeight).toBe(style.fontWeight);
        expect(result.current.currentStyle.lineHeight).toBe(style.lineHeight);
        expect(result.current.currentStyle.letterSpacing).toBe(style.letterSpacing);
      }),
      { numRuns: 100 }
    );
  });

  it('preset stores a deep copy of the style (mutations do not affect preset)', () => {
    fc.assert(
      fc.property(typographyStyleArb, presetNameArb, (style, presetName) => {
        const { result } = renderHook(() => useTypography(style));

        // Save preset
        act(() => {
          result.current.savePreset(presetName);
        });

        const savedPreset = result.current.presets.find((p) => p.name === presetName);
        const originalFontFamily = style.fontFamily;

        // Mutate the current style
        act(() => {
          result.current.updateStyle({ fontFamily: 'MutatedFont' });
        });

        // The preset should still have the original value
        expect(savedPreset!.style.fontFamily).toBe(originalFontFamily);
      }),
      { numRuns: 100 }
    );
  });

  it('multiple presets can be saved and loaded independently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        (count) => {
          const { result } = renderHook(() => useTypography());

          // Create distinct styles with unique font families
          const savedPresetIds: string[] = [];
          const savedStyles: TypographyStyle[] = [];
          
          for (let index = 0; index < count; index++) {
            const style: TypographyStyle = {
              fontFamily: `UniqueFont_${index}`,
              fontSize: 10 + index * 5,
              fontWeight: (100 + index * 100) as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
              lineHeight: 1.0 + index * 0.2,
              letterSpacing: index,
            };
            const name = `Preset_${index}`;
            
            // Update style and save preset
            act(() => {
              result.current.updateStyle(style);
            });
            
            // Save the preset in a separate act
            act(() => {
              result.current.savePreset(name);
            });
            
            // Store the preset ID and style for later lookup
            const savedPreset = result.current.presets[result.current.presets.length - 1];
            savedPresetIds.push(savedPreset.id);
            savedStyles.push(cloneStyle(style));
          }

          // Verify all presets exist
          expect(result.current.presets.length).toBe(count);

          // Load each preset and verify it restores the correct style
          for (let i = 0; i < count; i++) {
            const presetId = savedPresetIds[i];
            const expectedStyle = savedStyles[i];

            act(() => {
              result.current.loadPreset(presetId);
            });

            expect(result.current.currentStyle.fontFamily).toBe(expectedStyle.fontFamily);
            expect(result.current.currentStyle.fontSize).toBe(expectedStyle.fontSize);
            expect(result.current.currentStyle.fontWeight).toBe(expectedStyle.fontWeight);
            expect(result.current.currentStyle.lineHeight).toBe(expectedStyle.lineHeight);
            expect(result.current.currentStyle.letterSpacing).toBe(expectedStyle.letterSpacing);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('loading a preset preserves all five typography properties', () => {
    fc.assert(
      fc.property(typographyStyleArb, presetNameArb, (style, presetName) => {
        const { result } = renderHook(() => useTypography(style));

        // Save preset
        act(() => {
          result.current.savePreset(presetName);
        });

        const savedPreset = result.current.presets.find((p) => p.name === presetName);

        // Change to completely different style
        act(() => {
          result.current.updateStyle({
            fontFamily: 'CompletelyDifferent',
            fontSize: 1,
            fontWeight: 900,
            lineHeight: 3,
            letterSpacing: 10,
          });
        });

        // Load preset
        act(() => {
          result.current.loadPreset(savedPreset!.id);
        });

        // Check each property individually
        expect(result.current.currentStyle.fontFamily).toBe(style.fontFamily);
        expect(result.current.currentStyle.fontSize).toBe(style.fontSize);
        expect(result.current.currentStyle.fontWeight).toBe(style.fontWeight);
        expect(result.current.currentStyle.lineHeight).toBe(style.lineHeight);
        expect(result.current.currentStyle.letterSpacing).toBe(style.letterSpacing);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: typeflow-plugin, Property 18: Preset Deletion Removes from List
   * **Validates: Requirements 7.6**
   *
   * For any deleted preset, querying the saved presets list should not include
   * that preset.
   */

  it('deleted preset is removed from the presets list', () => {
    fc.assert(
      fc.property(typographyStyleArb, presetNameArb, (style, presetName) => {
        const { result } = renderHook(() => useTypography(style));

        // Save preset
        act(() => {
          result.current.savePreset(presetName);
        });

        const savedPreset = result.current.presets.find((p) => p.name === presetName);
        expect(savedPreset).toBeDefined();
        const presetId = savedPreset!.id;

        // Delete the preset
        act(() => {
          result.current.deletePreset(presetId);
        });

        // Verify preset is no longer in the list
        const deletedPreset = result.current.presets.find((p) => p.id === presetId);
        expect(deletedPreset).toBeUndefined();

        // Also verify by name
        const presetByName = result.current.presets.find((p) => p.name === presetName);
        expect(presetByName).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('deleting one preset does not affect other presets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            style: typographyStyleArb,
            name: presetNameArb,
          }),
          { minLength: 2, maxLength: 5 }
        ),
        fc.integer({ min: 0 }),
        (presetConfigs, deleteIndexSeed) => {
          const { result } = renderHook(() => useTypography());

          // Save multiple presets
          for (const config of presetConfigs) {
            act(() => {
              result.current.updateStyle(config.style);
              result.current.savePreset(config.name);
            });
          }

          const initialCount = result.current.presets.length;
          const deleteIndex = deleteIndexSeed % initialCount;
          const presetToDelete = result.current.presets[deleteIndex];
          const otherPresets = result.current.presets.filter((p) => p.id !== presetToDelete.id);

          // Delete one preset
          act(() => {
            result.current.deletePreset(presetToDelete.id);
          });

          // Verify count decreased by 1
          expect(result.current.presets.length).toBe(initialCount - 1);

          // Verify other presets still exist
          for (const otherPreset of otherPresets) {
            const found = result.current.presets.find((p) => p.id === otherPreset.id);
            expect(found).toBeDefined();
            expect(stylesEqual(found!.style, otherPreset.style)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deleting a non-existent preset does not affect the list', () => {
    fc.assert(
      fc.property(typographyStyleArb, presetNameArb, (style, presetName) => {
        const { result } = renderHook(() => useTypography(style));

        // Save a preset
        act(() => {
          result.current.savePreset(presetName);
        });

        const initialCount = result.current.presets.length;

        // Try to delete a non-existent preset
        act(() => {
          result.current.deletePreset('non-existent-id');
        });

        // Count should remain the same
        expect(result.current.presets.length).toBe(initialCount);
      }),
      { numRuns: 100 }
    );
  });

  it('preset list is empty after deleting all presets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            style: typographyStyleArb,
            name: presetNameArb,
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (presetConfigs) => {
          const { result } = renderHook(() => useTypography());

          // Save multiple presets
          for (const config of presetConfigs) {
            act(() => {
              result.current.updateStyle(config.style);
              result.current.savePreset(config.name);
            });
          }

          // Delete all presets
          const presetIds = result.current.presets.map((p) => p.id);
          for (const id of presetIds) {
            act(() => {
              result.current.deletePreset(id);
            });
          }

          // Presets list should be empty
          expect(result.current.presets.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
