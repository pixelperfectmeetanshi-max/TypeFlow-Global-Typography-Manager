/**
 * TypeFlow Plugin - Size Controls Component
 *
 * Provides numeric inputs for font size, line height, and letter spacing
 * with increment/decrement buttons and validation.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 4.7**
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  validateFontSize,
  validateLineHeight,
  validateLetterSpacing,
  incrementSize,
  decrementSize,
} from '../features/sizeUtils';

/**
 * Validation errors for size controls
 */
export interface SizeValidationErrors {
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

/**
 * Props for the SizeControls component
 */
export interface SizeControlsProps {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  onFontSizeChange: (size: number) => void;
  onLineHeightChange: (height: number) => void;
  onLetterSpacingChange: (spacing: number) => void;
  validationErrors: SizeValidationErrors;
}

/**
 * Step values for increment/decrement operations
 */
const STEP_VALUES = {
  fontSize: 1,
  lineHeight: 0.1,
  letterSpacing: 0.1,
};

/**
 * Minimum values for each size property
 */
const MIN_VALUES = {
  fontSize: 1,
  lineHeight: 0.1,
  letterSpacing: 0.01,
};

/**
 * Individual size input with stepper buttons
 */
interface SizeInputProps {
  id: string;
  label: string;
  value: number;
  step: number;
  min: number;
  onChange: (value: number) => void;
  error?: string;
  unit?: string;
}

function SizeInput({
  id,
  label,
  value,
  step,
  min,
  onChange,
  error,
  unit = '',
}: SizeInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState<string>(value.toString());
  const previousValidValue = useRef<number>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value when prop changes externally
  useEffect(() => {
    setInputValue(value.toString());
    previousValidValue.current = value;
  }, [value]);

  /**
   * Handles input change - updates local state only
   */
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value);
    },
    []
  );

  /**
   * Handles input blur - validates and commits or reverts
   */
  const handleInputBlur = useCallback(() => {
    const numericValue = parseFloat(inputValue);

    // Check if it's a valid number
    if (isNaN(numericValue)) {
      // Revert to previous valid value
      setInputValue(previousValidValue.current.toString());
      return;
    }

    // Validate based on the field type
    let validationResult;
    if (id === 'fontSize') {
      validationResult = validateFontSize(numericValue);
    } else if (id === 'lineHeight') {
      validationResult = validateLineHeight(numericValue);
    } else {
      validationResult = validateLetterSpacing(numericValue);
    }

    if (validationResult.isValid) {
      previousValidValue.current = numericValue;
      onChange(numericValue);
    } else {
      // Revert to previous valid value on invalid input
      setInputValue(previousValidValue.current.toString());
    }
  }, [inputValue, id, onChange]);

  /**
   * Handles Enter key to commit value
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        inputRef.current?.blur();
      }
    },
    []
  );

  /**
   * Handles increment button click
   */
  const handleIncrement = useCallback(() => {
    const newValue = incrementSize(value, step);
    onChange(newValue);
  }, [value, step, onChange]);

  /**
   * Handles decrement button click
   */
  const handleDecrement = useCallback(() => {
    const newValue = decrementSize(value, step, min);
    onChange(newValue);
  }, [value, step, min, onChange]);

  return (
    <div className="mb-sm">
      <label htmlFor={id} className="label">
        {label}
        {unit && <span className="text-muted"> ({unit})</span>}
      </label>
      <div className="input-group">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          className={`input ${error ? 'input--error' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <div className="input-stepper">
          <button
            type="button"
            className="input-stepper-btn"
            onClick={handleIncrement}
            aria-label={`Increase ${label}`}
          >
            ▲
          </button>
          <button
            type="button"
            className="input-stepper-btn"
            onClick={handleDecrement}
            aria-label={`Decrease ${label}`}
          >
            ▼
          </button>
        </div>
      </div>
      {error && (
        <div id={`${id}-error`} className="validation-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * SizeControls component for managing typography dimensions.
 *
 * Features:
 * - Numeric inputs for font size, line height, and letter spacing
 * - Increment/decrement stepper buttons
 * - Validation with error display
 * - Reverts to previous valid value on invalid input
 *
 * @param props - SizeControlsProps
 */
export function SizeControls({
  fontSize,
  lineHeight,
  letterSpacing,
  onFontSizeChange,
  onLineHeightChange,
  onLetterSpacingChange,
  validationErrors,
}: SizeControlsProps): React.ReactElement {
  return (
    <div className="section">
      <h3 className="section-title">Size Controls</h3>

      <SizeInput
        id="fontSize"
        label="Font Size"
        value={fontSize}
        step={STEP_VALUES.fontSize}
        min={MIN_VALUES.fontSize}
        onChange={onFontSizeChange}
        error={validationErrors.fontSize}
        unit="px"
      />

      <SizeInput
        id="lineHeight"
        label="Line Height"
        value={lineHeight}
        step={STEP_VALUES.lineHeight}
        min={MIN_VALUES.lineHeight}
        onChange={onLineHeightChange}
        error={validationErrors.lineHeight}
      />

      <SizeInput
        id="letterSpacing"
        label="Letter Spacing"
        value={letterSpacing}
        step={STEP_VALUES.letterSpacing}
        min={MIN_VALUES.letterSpacing}
        onChange={onLetterSpacingChange}
        error={validationErrors.letterSpacing}
        unit="px"
      />
    </div>
  );
}
