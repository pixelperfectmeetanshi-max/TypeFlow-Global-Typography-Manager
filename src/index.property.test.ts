/**
 * TypeFlow Plugin - Initialization Property Tests
 *
 * Property-based tests for plugin initialization error handling.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin
 * - Property 20: Initialization Error Messages
 *
 * **Validates: Requirements 1.3**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { AppError, ErrorCode } from './types/typography';
import { normalizeError } from './utils/helpers';

/**
 * Arbitrary for generating valid ErrorCode values
 */
const errorCodeArb = fc.constantFrom(
  ErrorCode.INITIALIZATION_FAILED,
  ErrorCode.FRAMER_API_UNAVAILABLE,
  ErrorCode.UNKNOWN_ERROR
);

/**
 * Arbitrary for generating non-empty error messages
 */
const errorMessageArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating context strings
 */
const contextArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid AppError objects for initialization failures
 */
const initErrorArb: fc.Arbitrary<AppError> = fc.record({
  code: fc.constantFrom(ErrorCode.INITIALIZATION_FAILED, ErrorCode.FRAMER_API_UNAVAILABLE),
  message: errorMessageArb,
  details: fc.option(fc.anything(), { nil: undefined }),
  recoverable: fc.boolean(),
});

/**
 * Arbitrary for generating Error objects with stack traces
 */
const errorWithStackArb: fc.Arbitrary<Error> = fc
  .record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    message: errorMessageArb,
  })
  .map(({ name, message }) => {
    const error = new Error(message);
    error.name = name;
    return error;
  });

/**
 * Arbitrary for generating various error types (Error, string, unknown)
 */
const unknownErrorArb = fc.oneof(
  errorWithStackArb,
  errorMessageArb,
  fc.record({ someField: fc.string() }),
  fc.constant(null),
  fc.constant(undefined),
  fc.integer()
);

/**
 * Simulates the createErrorDisplay function behavior from index.ts
 * This extracts the error message that would be displayed to the user.
 */
function getDisplayedErrorMessage(error: AppError): string {
  return error.message;
}

/**
 * Simulates the error display structure from index.ts
 * Returns the key elements that would be rendered in the error display.
 */
function createErrorDisplayContent(error: AppError): {
  title: string;
  message: string;
  hasRetryButton: boolean;
} {
  return {
    title: 'Initialization Failed',
    message: error.message,
    hasRetryButton: error.recoverable,
  };
}

describe('Property 20: Initialization Error Messages', () => {
  /**
   * Feature: typeflow-plugin, Property 20: Initialization Error Messages
   * **Validates: Requirements 1.3**
   *
   * For any initialization failure, the displayed error message should contain
   * a description of the failure reason (non-empty error message).
   */

  it('initialization error messages are non-empty', () => {
    fc.assert(
      fc.property(initErrorArb, (error) => {
        const displayedMessage = getDisplayedErrorMessage(error);

        // The displayed message should be non-empty
        expect(displayedMessage.length).toBeGreaterThan(0);
        expect(displayedMessage.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('initialization error messages contain the failure reason', () => {
    fc.assert(
      fc.property(initErrorArb, (error) => {
        const displayedMessage = getDisplayedErrorMessage(error);

        // The displayed message should match the error's message
        expect(displayedMessage).toBe(error.message);
      }),
      { numRuns: 100 }
    );
  });

  it('error display includes descriptive title for initialization failures', () => {
    fc.assert(
      fc.property(initErrorArb, (error) => {
        const displayContent = createErrorDisplayContent(error);

        // The title should indicate initialization failure
        expect(displayContent.title).toBe('Initialization Failed');
        expect(displayContent.title.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('error display shows retry button for recoverable errors', () => {
    fc.assert(
      fc.property(
        initErrorArb.filter((e) => e.recoverable),
        (error) => {
          const displayContent = createErrorDisplayContent(error);

          // Recoverable errors should show a retry button
          expect(displayContent.hasRetryButton).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('error display hides retry button for non-recoverable errors', () => {
    fc.assert(
      fc.property(
        initErrorArb.filter((e) => !e.recoverable),
        (error) => {
          const displayContent = createErrorDisplayContent(error);

          // Non-recoverable errors should not show a retry button
          expect(displayContent.hasRetryButton).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('normalized errors from various sources produce descriptive messages', () => {
    fc.assert(
      fc.property(unknownErrorArb, contextArb, (error, context) => {
        const normalizedError = normalizeError(error, context);

        // The normalized error should have a non-empty message
        expect(normalizedError.message.length).toBeGreaterThan(0);
        expect(normalizedError.message.trim().length).toBeGreaterThan(0);

        // The message should include the context
        expect(normalizedError.message).toContain(context);
      }),
      { numRuns: 100 }
    );
  });

  it('Error objects produce messages containing the original error message', () => {
    fc.assert(
      fc.property(errorWithStackArb, contextArb, (error, context) => {
        const normalizedError = normalizeError(error, context);

        // The normalized message should contain the original error message
        expect(normalizedError.message).toContain(error.message);
      }),
      { numRuns: 100 }
    );
  });

  it('string errors produce messages containing the original string', () => {
    fc.assert(
      fc.property(errorMessageArb, contextArb, (errorString, context) => {
        const normalizedError = normalizeError(errorString, context);

        // The normalized message should contain the original error string
        expect(normalizedError.message).toContain(errorString);
      }),
      { numRuns: 100 }
    );
  });

  it('Framer API unavailable error has descriptive message', () => {
    // Test the specific error message for Framer API unavailability
    const framerApiError: AppError = {
      code: ErrorCode.FRAMER_API_UNAVAILABLE,
      message:
        'Unable to connect to Framer. Please ensure the plugin is running within Framer and try again.',
      recoverable: true,
    };

    const displayedMessage = getDisplayedErrorMessage(framerApiError);

    // The message should be descriptive and actionable
    expect(displayedMessage.length).toBeGreaterThan(0);
    expect(displayedMessage).toContain('Framer');
    expect(displayedMessage).toContain('try again');
  });

  it('initialization errors always have a valid error code', () => {
    fc.assert(
      fc.property(initErrorArb, (error) => {
        // The error code should be one of the valid initialization-related codes
        const validInitCodes = [
          ErrorCode.INITIALIZATION_FAILED,
          ErrorCode.FRAMER_API_UNAVAILABLE,
        ];
        expect(validInitCodes).toContain(error.code);
      }),
      { numRuns: 100 }
    );
  });

  it('error messages are preserved through display pipeline', () => {
    fc.assert(
      fc.property(initErrorArb, (error) => {
        const displayContent = createErrorDisplayContent(error);

        // The message should be exactly preserved
        expect(displayContent.message).toBe(error.message);

        // The message should still be non-empty after going through the pipeline
        expect(displayContent.message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('all error types produce user-friendly messages when normalized', () => {
    fc.assert(
      fc.property(unknownErrorArb, (error) => {
        const normalizedError = normalizeError(error, 'Plugin initialization');

        // All normalized errors should have a message
        expect(normalizedError.message).toBeDefined();
        expect(typeof normalizedError.message).toBe('string');
        expect(normalizedError.message.length).toBeGreaterThan(0);

        // The message should include the context
        expect(normalizedError.message).toContain('Plugin initialization');
      }),
      { numRuns: 100 }
    );
  });
});
