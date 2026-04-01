/**
 * TypeFlow Plugin - Preview Toggle Component
 *
 * Toggle switch for enabling/disabling live typography preview.
 * Shows tooltip when disabled due to no element selection.
 *
 * **Validates: Requirements 5.1, 5.2, 5.4, 5.5**
 */

import React, { useCallback, useId } from 'react';

/**
 * Props for the PreviewToggle component
 */
export interface PreviewToggleProps {
  isEnabled: boolean;
  isDisabled: boolean;
  disabledReason?: string;
  onToggle: (enabled: boolean) => void;
  compact?: boolean;
}

/**
 * PreviewToggle component for controlling live preview mode.
 *
 * Features:
 * - Toggle switch for preview on/off
 * - Disabled state with tooltip explanation
 * - Maintains toggle state during session
 * - Accessible with proper ARIA attributes
 * - Compact mode for header placement
 *
 * @param props - PreviewToggleProps
 */
export function PreviewToggle({
  isEnabled,
  isDisabled,
  disabledReason = 'Select elements to enable preview',
  onToggle,
  compact = false,
}: PreviewToggleProps): React.ReactElement {
  const toggleId = useId();

  /**
   * Handles toggle change
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDisabled) {
        onToggle(event.target.checked);
      }
    },
    [isDisabled, onToggle]
  );

  /**
   * Handles keyboard interaction for accessibility
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLLabelElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!isDisabled) {
          onToggle(!isEnabled);
        }
      }
    },
    [isDisabled, isEnabled, onToggle]
  );

  // Compact mode - just the toggle with label
  if (compact) {
    return (
      <div className="preview-toggle-compact">
        <div className="preview-tooltip-wrapper">
          <span className="preview-toggle-label">
            {isEnabled ? '👁 Live' : 'Live Preview'}
          </span>
          <span className="preview-tooltip">Hover over fonts to preview them on your selection</span>
        </div>
        <label
          htmlFor={toggleId}
          className={`toggle ${isDisabled ? 'toggle--disabled' : ''}`}
          onKeyDown={handleKeyDown}
          tabIndex={isDisabled ? -1 : 0}
        >
          <input
            id={toggleId}
            type="checkbox"
            className="toggle-input"
            checked={isEnabled}
            onChange={handleChange}
            disabled={isDisabled}
          />
          <span className="toggle-track" aria-hidden="true" />
          <span className="toggle-thumb" aria-hidden="true" />
          <span className="sr-only">
            {isEnabled ? 'Disable live preview' : 'Enable live preview - hover fonts to preview'}
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="flex items-center justify-between">
        <h3 className="section-title m-0">Live Preview</h3>

        <div className={`tooltip ${isDisabled ? '' : 'tooltip--hidden'}`}>
          <label
            htmlFor={toggleId}
            className={`toggle ${isDisabled ? 'toggle--disabled' : ''}`}
            onKeyDown={handleKeyDown}
            tabIndex={isDisabled ? -1 : 0}
          >
            <input
              id={toggleId}
              type="checkbox"
              className="toggle-input"
              checked={isEnabled}
              onChange={handleChange}
              disabled={isDisabled}
              aria-describedby={isDisabled ? `${toggleId}-tooltip` : undefined}
            />
            <span className="toggle-track" aria-hidden="true" />
            <span className="toggle-thumb" aria-hidden="true" />
            <span className="sr-only">
              {isEnabled ? 'Disable preview' : 'Enable preview'}
            </span>
          </label>

          {/* Tooltip for disabled state */}
          {isDisabled && (
            <span
              id={`${toggleId}-tooltip`}
              className="tooltip-content"
              role="tooltip"
            >
              {disabledReason}
            </span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-sm text-sm text-secondary">
        {isDisabled ? (
          <span className="text-muted">{disabledReason}</span>
        ) : isEnabled ? (
          <span className="text-success">Preview active - changes shown in real-time</span>
        ) : (
          <span>Enable to see changes before applying</span>
        )}
      </div>
    </div>
  );
}
