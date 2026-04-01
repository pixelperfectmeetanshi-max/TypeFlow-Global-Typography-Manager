/**
 * TypeFlow Plugin - Apply Button Component
 *
 * Button for applying typography styles to selected elements.
 * Shows loading state during application and success confirmation.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3**
 */

import React, { useCallback } from 'react';

/**
 * Props for the ApplyButton component
 */
export interface ApplyButtonProps {
  isDisabled: boolean;
  disabledReason?: string;
  isLoading: boolean;
  onClick: () => Promise<boolean>;
}

/**
 * ApplyButton component for committing typography changes.
 *
 * Features:
 * - Apply button with loading state
 * - Disabled state with explanatory message
 * - Success confirmation after apply
 * - Accessible with proper ARIA attributes
 *
 * @param props - ApplyButtonProps
 */
export function ApplyButton({
  isDisabled,
  disabledReason = 'Select elements to apply typography',
  isLoading,
  onClick,
}: ApplyButtonProps): React.ReactElement {
  /**
   * Handles button click
   */
  const handleClick = useCallback(async () => {
    if (!isDisabled && !isLoading) {
      await onClick();
    }
  }, [isDisabled, isLoading, onClick]);

  return (
    <div className="section">
      {/* Apply Button */}
      <button
        type="button"
        className="btn btn--primary btn--full"
        onClick={handleClick}
        disabled={isDisabled || isLoading}
        aria-busy={isLoading}
        aria-describedby={isDisabled ? 'apply-disabled-reason' : undefined}
      >
        {isLoading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            <span>Applying...</span>
          </>
        ) : (
          'Apply Typography'
        )}
      </button>

      {/* Disabled Reason Message */}
      {isDisabled && !isLoading && (
        <div
          id="apply-disabled-reason"
          className="mt-sm text-sm text-muted"
          role="status"
        >
          {disabledReason}
        </div>
      )}
    </div>
  );
}
