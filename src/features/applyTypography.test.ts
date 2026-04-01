/**
 * TypeFlow Plugin - Apply Typography Unit Tests
 *
 * Unit tests for the applyTypography module covering:
 * - applyTypography function with temporary and permanent modes
 * - revertTypography function for preview cancellation
 * - Error handling and state preservation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyTypography,
  revertTypography,
  revertToOriginalStyles,
  clearOriginalStyles,
  getOriginalStyles,
  ApplyOptions,
} from './applyTypography';
import { FramerElement, TypographyStyle } from '../types/typography';

// Helper to create a test element
function createTestElement(
  id: string,
  typography?: TypographyStyle
): FramerElement {
  return {
    id,
    type: 'text',
    typography,
  };
}

// Helper to create a test typography style
function createTestStyle(overrides?: Partial<TypographyStyle>): TypographyStyle {
  return {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    ...overrides,
  };
}

describe('applyTypography', () => {
  beforeEach(() => {
    clearOriginalStyles();
  });

  describe('permanent mode (temporary: false)', () => {
    const permanentOptions: ApplyOptions = { temporary: false };

    it('should apply typography to a single element', async () => {
      const element = createTestElement('el-1', createTestStyle());
      const newStyle = createTestStyle({ fontFamily: 'Roboto', fontSize: 24 });

      const result = await applyTypography([element], newStyle, permanentOptions);

      expect(result.success).toBe(true);
      expect(result.appliedCount).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(element.typography?.fontFamily).toBe('Roboto');
      expect(element.typography?.fontSize).toBe(24);
    });

    it('should apply typography to multiple elements', async () => {
      const elements = [
        createTestElement('el-1', createTestStyle()),
        createTestElement('el-2', createTestStyle({ fontFamily: 'Arial' })),
        createTestElement('el-3', createTestStyle({ fontSize: 12 })),
      ];
      const newStyle = createTestStyle({ fontFamily: 'Helvetica', fontWeight: 700 });

      const result = await applyTypography(elements, newStyle, permanentOptions);

      expect(result.success).toBe(true);
      expect(result.appliedCount).toBe(3);
      elements.forEach((el) => {
        expect(el.typography?.fontFamily).toBe('Helvetica');
        expect(el.typography?.fontWeight).toBe(700);
      });
    });


    it('should apply all typography properties', async () => {
      const element = createTestElement('el-1', createTestStyle());
      const newStyle: TypographyStyle = {
        fontFamily: 'Georgia',
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 2.0,
        letterSpacing: 1.5,
      };

      await applyTypography([element], newStyle, permanentOptions);

      expect(element.typography).toEqual(newStyle);
    });

    it('should clear original styles store after permanent apply', async () => {
      const element = createTestElement('el-1', createTestStyle());
      const newStyle = createTestStyle({ fontFamily: 'Roboto' });

      // First do a temporary apply to populate the store
      await applyTypography([element], newStyle, { temporary: true });
      expect(getOriginalStyles().size).toBeGreaterThan(0);

      // Then do a permanent apply
      await applyTypography([element], newStyle, permanentOptions);
      expect(getOriginalStyles().size).toBe(0);
    });

    it('should handle empty elements array', async () => {
      const newStyle = createTestStyle();

      const result = await applyTypography([], newStyle, permanentOptions);

      expect(result.success).toBe(true);
      expect(result.appliedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should apply to elements without existing typography', async () => {
      const element = createTestElement('el-1'); // No typography
      const newStyle = createTestStyle({ fontFamily: 'Roboto' });

      const result = await applyTypography([element], newStyle, permanentOptions);

      expect(result.success).toBe(true);
      expect(element.typography?.fontFamily).toBe('Roboto');
    });
  });

  describe('temporary mode (temporary: true)', () => {
    const temporaryOptions: ApplyOptions = { temporary: true };

    it('should apply typography temporarily', async () => {
      const originalStyle = createTestStyle({ fontFamily: 'Arial' });
      const element = createTestElement('el-1', originalStyle);
      const newStyle = createTestStyle({ fontFamily: 'Roboto' });

      const result = await applyTypography([element], newStyle, temporaryOptions);

      expect(result.success).toBe(true);
      expect(element.typography?.fontFamily).toBe('Roboto');
    });

    it('should store original styles for revert', async () => {
      const originalStyle = createTestStyle({ fontFamily: 'Arial', fontSize: 14 });
      const element = createTestElement('el-1', originalStyle);
      const newStyle = createTestStyle({ fontFamily: 'Roboto' });

      await applyTypography([element], newStyle, temporaryOptions);

      const storedStyles = getOriginalStyles();
      expect(storedStyles.has('el-1')).toBe(true);
      expect(storedStyles.get('el-1')?.fontFamily).toBe('Arial');
      expect(storedStyles.get('el-1')?.fontSize).toBe(14);
    });

    it('should preserve first original style on multiple temporary applies', async () => {
      const originalStyle = createTestStyle({ fontFamily: 'Arial' });
      const element = createTestElement('el-1', originalStyle);

      // First temporary apply
      await applyTypography(
        [element],
        createTestStyle({ fontFamily: 'Roboto' }),
        temporaryOptions
      );

      // Second temporary apply
      await applyTypography(
        [element],
        createTestStyle({ fontFamily: 'Helvetica' }),
        temporaryOptions
      );

      // Original should still be Arial, not Roboto
      const storedStyles = getOriginalStyles();
      expect(storedStyles.get('el-1')?.fontFamily).toBe('Arial');
    });

    it('should not store original for elements without typography', async () => {
      const element = createTestElement('el-1'); // No typography
      const newStyle = createTestStyle({ fontFamily: 'Roboto' });

      await applyTypography([element], newStyle, temporaryOptions);

      const storedStyles = getOriginalStyles();
      expect(storedStyles.has('el-1')).toBe(false);
    });
  });
});


describe('revertTypography', () => {
  beforeEach(() => {
    clearOriginalStyles();
  });

  it('should revert elements to original styles', async () => {
    const originalStyle = createTestStyle({ fontFamily: 'Arial', fontSize: 14 });
    const element = createTestElement('el-1', createTestStyle({ fontFamily: 'Roboto' }));
    const originalStyles = new Map<string, TypographyStyle>();
    originalStyles.set('el-1', originalStyle);

    await revertTypography([element], originalStyles);

    expect(element.typography?.fontFamily).toBe('Arial');
    expect(element.typography?.fontSize).toBe(14);
  });

  it('should revert multiple elements', async () => {
    const elements = [
      createTestElement('el-1', createTestStyle({ fontFamily: 'Roboto' })),
      createTestElement('el-2', createTestStyle({ fontFamily: 'Roboto' })),
    ];
    const originalStyles = new Map<string, TypographyStyle>();
    originalStyles.set('el-1', createTestStyle({ fontFamily: 'Arial' }));
    originalStyles.set('el-2', createTestStyle({ fontFamily: 'Helvetica' }));

    await revertTypography(elements, originalStyles);

    expect(elements[0].typography?.fontFamily).toBe('Arial');
    expect(elements[1].typography?.fontFamily).toBe('Helvetica');
  });

  it('should skip elements not in original styles map', async () => {
    const element = createTestElement('el-1', createTestStyle({ fontFamily: 'Roboto' }));
    const originalStyles = new Map<string, TypographyStyle>();
    // No entry for el-1

    await revertTypography([element], originalStyles);

    // Should remain unchanged
    expect(element.typography?.fontFamily).toBe('Roboto');
  });

  it('should clear original styles store after revert', async () => {
    const element = createTestElement('el-1', createTestStyle());
    const newStyle = createTestStyle({ fontFamily: 'Roboto' });

    // Do a temporary apply to populate the store
    await applyTypography([element], newStyle, { temporary: true });
    expect(getOriginalStyles().size).toBeGreaterThan(0);

    // Revert
    await revertTypography([element], getOriginalStyles());
    expect(getOriginalStyles().size).toBe(0);
  });
});

describe('revertToOriginalStyles', () => {
  beforeEach(() => {
    clearOriginalStyles();
  });

  it('should revert using internally stored original styles', async () => {
    const originalStyle = createTestStyle({ fontFamily: 'Arial', fontSize: 14 });
    const element = createTestElement('el-1', originalStyle);
    const newStyle = createTestStyle({ fontFamily: 'Roboto', fontSize: 24 });

    // Apply temporarily to store original
    await applyTypography([element], newStyle, { temporary: true });
    expect(element.typography?.fontFamily).toBe('Roboto');

    // Revert using internal store
    await revertToOriginalStyles([element]);

    expect(element.typography?.fontFamily).toBe('Arial');
    expect(element.typography?.fontSize).toBe(14);
  });

  it('should handle preview round-trip correctly', async () => {
    const originalStyle = createTestStyle({
      fontFamily: 'Georgia',
      fontSize: 18,
      fontWeight: 500,
      lineHeight: 1.8,
      letterSpacing: 0.5,
    });
    const element = createTestElement('el-1', originalStyle);

    // Enable preview (temporary apply)
    await applyTypography(
      [element],
      createTestStyle({ fontFamily: 'Roboto', fontSize: 24 }),
      { temporary: true }
    );

    // Disable preview (revert)
    await revertToOriginalStyles([element]);

    // Should be exactly the original
    expect(element.typography).toEqual(originalStyle);
  });
});


describe('clearOriginalStyles', () => {
  it('should clear all stored original styles', async () => {
    const elements = [
      createTestElement('el-1', createTestStyle()),
      createTestElement('el-2', createTestStyle()),
    ];
    const newStyle = createTestStyle({ fontFamily: 'Roboto' });

    await applyTypography(elements, newStyle, { temporary: true });
    expect(getOriginalStyles().size).toBe(2);

    clearOriginalStyles();
    expect(getOriginalStyles().size).toBe(0);
  });
});

describe('getOriginalStyles', () => {
  beforeEach(() => {
    clearOriginalStyles();
  });

  it('should return a copy of the original styles map', async () => {
    const element = createTestElement('el-1', createTestStyle());
    await applyTypography([element], createTestStyle({ fontFamily: 'Roboto' }), {
      temporary: true,
    });

    const styles1 = getOriginalStyles();
    const styles2 = getOriginalStyles();

    // Should be different map instances
    expect(styles1).not.toBe(styles2);
    // But with same content
    expect(styles1.get('el-1')).toEqual(styles2.get('el-1'));
  });

  it('should not allow mutation of internal store', async () => {
    const element = createTestElement('el-1', createTestStyle({ fontFamily: 'Arial' }));
    await applyTypography([element], createTestStyle({ fontFamily: 'Roboto' }), {
      temporary: true,
    });

    const styles = getOriginalStyles();
    styles.delete('el-1');

    // Internal store should be unaffected
    expect(getOriginalStyles().has('el-1')).toBe(true);
  });
});

describe('style immutability', () => {
  beforeEach(() => {
    clearOriginalStyles();
  });

  it('should not mutate original style object when applying', async () => {
    const originalStyle = createTestStyle({ fontFamily: 'Arial' });
    const element = createTestElement('el-1', originalStyle);
    const newStyle = createTestStyle({ fontFamily: 'Roboto' });

    await applyTypography([element], newStyle, { temporary: false });

    // Original style object should be unchanged
    expect(originalStyle.fontFamily).toBe('Arial');
  });

  it('should not mutate new style object when applying', async () => {
    const element = createTestElement('el-1', createTestStyle());
    const newStyle = createTestStyle({ fontFamily: 'Roboto' });

    await applyTypography([element], newStyle, { temporary: false });

    // Mutating element should not affect newStyle
    element.typography!.fontFamily = 'Changed';
    expect(newStyle.fontFamily).toBe('Roboto');
  });

  it('should store deep copy of original style', async () => {
    const originalStyle = createTestStyle({ fontFamily: 'Arial' });
    const element = createTestElement('el-1', originalStyle);

    await applyTypography(
      [element],
      createTestStyle({ fontFamily: 'Roboto' }),
      { temporary: true }
    );

    // Mutating original should not affect stored
    originalStyle.fontFamily = 'Changed';
    expect(getOriginalStyles().get('el-1')?.fontFamily).toBe('Arial');
  });
});
