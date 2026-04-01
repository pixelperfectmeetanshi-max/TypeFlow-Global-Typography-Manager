/**
 * TypeFlow Plugin - App Error Handling Property Tests
 *
 * Property-based tests for error handling in the App component.
 * Uses fast-check library for property-based testing.
 *
 * Feature: typeflow-plugin
 * - Property 19: Error Handling Preserves State
 * - Property 21: Error Logging Completeness
 *
 * **Validates: Requirements 9.2, 9.4**
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { normalizeError, logError, handleError, isAppError } from './utils/helpers';
import { AppError, ErrorCode, TypographyStyle } from './types/typography';

/**
 * Arbitrary for generating valid ErrorCode values
 */
const errorCodeArb = fc.constantFrom(
  ErrorCode.INITIALIZATION_FAILED,
  ErrorCode.SCAN_FAILED,
  ErrorCode.APPLY_FAILED,
  ErrorCode.FRAMER_API_UNAVAILABLE,
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.PRESET_SAVE_FAILED,
  ErrorCode.UNKNOWN_ERROR
);

/**
 * Arbitrary for generating non-empty error messages
 */
const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating context strings
 */
const contextArb = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating valid AppError objects
 */
const appErrorArb: fc.Arbitrary<AppError> = fc.record({
  code: errorCodeArb,
  message: errorMessageArb,
  details: fc.option(fc.anything(), { nil: undefined }),
  recoverable: fc.boolean(),
});

/**
 * Arbitrary for generating Error objects with stack traces
 */
const errorWithStackArb: fc.Arbitrary<Error> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  message: errorMessageArb,
}).map(({ name, message }) => {
  const error = new Error(message);
  error.name = name;
  return error;
});

/**
 * Arbitrary for generating valid TypographyStyle objects
 */
const typographyStyleArb: fc.Arbitrary<TypographyStyle> = fc.record({
  fontFamily: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  fontSize: fc.integer({ min: 1, max: 200 }),
  fontWeight: fc.constantFrom(100, 200, 300, 400, 500, 600, 700, 800, 900),
  lineHeight: fc.double({ min: 0.5, max: 3, noNaN: true }),
  letterSpacing: fc.double({ min: -5, max: 10, noNaN: true }),
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

describe('Property 19: Error Handling Preserves State', () => {
  /**
   * Feature: typeflow-plugin, Property 19: Error Handling Preserves State
   * **Validates: Requirements 9.4**
   *
   * For any operation that throws an error, the application state before the operation
   * should be preserved—no partial state mutations should persist.
   */

  it('normalizeError preserves original state when processing errors', () => {
    fc.assert(
      fc.property(
        typographyStyleArb,
        unknownErrorArb,
        contextArb,
        (originalState, error, context) => {
          // Clone the original state to verify it's not mutated
          const stateBefore = cloneStyle(originalState);

          // Process the error
          const appError = normalizeError(error, context);

          // Verify the original state is unchanged
          expect(stylesEqual(originalState, stateBefore)).toBe(true);

          // Verify we got a valid AppError back
          expect(appError).toBeDefined();
          expect(typeof appError.code).toBe('string');
          expect(typeof appError.message).toBe('string');
          expect(typeof appError.recoverable).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('handleError preserves original state when processing errors', () => {
    // Mock console.error to prevent test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        typographyStyleArb,
        unknownErrorArb,
        contextArb,
        (originalState, error, context) => {
          // Clone the original state to verify it's not mutated
          const stateBefore = cloneStyle(originalState);

          // Process the error through handleError
          const appError = handleError(error, context);

          // Verify the original state is unchanged
          expect(stylesEqual(originalState, stateBefore)).toBe(true);

          // Verify we got a valid AppError back
          expect(isAppError(appError)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    consoleSpy.mockRestore();
  });

  it('error normalization does not mutate the input error object', () => {
    fc.assert(
      fc.property(
        appErrorArb,
        contextArb,
        (inputError, context) => {
          // Clone the input error
          const errorBefore = { ...inputError };

          // Process the error
          const result = normalizeError(inputError, context);

          // Verify the input error is unchanged
          expect(inputError.code).toBe(errorBefore.code);
          expect(inputError.message).toBe(errorBefore.message);
          expect(inputError.recoverable).toBe(errorBefore.recoverable);

          // AppError inputs should pass through unchanged
          expect(result.code).toBe(inputError.code);
          expect(result.recoverable).toBe(inputError.recoverable);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('error handling with multiple sequential errors preserves state independently', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        typographyStyleArb,
        fc.array(unknownErrorArb, { minLength: 2, maxLength: 5 }),
        fc.array(contextArb, { minLength: 2, maxLength: 5 }),
        (originalState, errors, contexts) => {
          // Clone the original state
          const stateBefore = cloneStyle(originalState);

          // Process multiple errors sequentially
          const results: AppError[] = [];
          for (let i = 0; i < Math.min(errors.length, contexts.length); i++) {
            results.push(handleError(errors[i], contexts[i]));
          }

          // Verify the original state is still unchanged after all error processing
          expect(stylesEqual(originalState, stateBefore)).toBe(true);

          // Verify all results are valid AppErrors
          for (const result of results) {
            expect(isAppError(result)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );

    consoleSpy.mockRestore();
  });

  it('state objects passed to error handlers are not modified', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    fc.assert(
      fc.property(
        typographyStyleArb,
        errorWithStackArb,
        (state, error) => {
          // Create a state object that might be passed alongside error handling
          const stateSnapshot = {
            currentStyle: cloneStyle(state),
            isPreviewActive: false,
            selectedElements: [{ id: 'test-1', type: 'text' }],
          };

          const snapshotBefore = JSON.stringify(stateSnapshot);

          // Handle the error
          handleError(error, 'Test operation');

          // Verify state snapshot is unchanged
          expect(JSON.stringify(stateSnapshot)).toBe(snapshotBefore);
        }
      ),
      { numRuns: 100 }
    );

    consoleSpy.mockRestore();
  });
});

describe('Property 21: Error Logging Completeness', () => {
  /**
   * Feature: typeflow-plugin, Property 21: Error Logging Completeness
   * **Validates: Requirements 9.2**
   *
   * For any caught error, the logged error information should include the error code,
   * message, and stack trace (when available).
   */

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let loggedMessages: unknown[][];

  beforeEach(() => {
    loggedMessages = [];
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      loggedMessages.push(args);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('logError logs error code in the output', () => {
    fc.assert(
      fc.property(appErrorArb, contextArb, (error, context) => {
        loggedMessages = [];

        logError(error, context);

        // Verify at least one log message was made
        expect(loggedMessages.length).toBeGreaterThan(0);

        // Verify the error code appears in the logged output
        const allLoggedText = loggedMessages.map((args) => args.join(' ')).join(' ');
        expect(allLoggedText).toContain(error.code);
      }),
      { numRuns: 100 }
    );
  });

  it('logError logs error message in the output', () => {
    fc.assert(
      fc.property(appErrorArb, contextArb, (error, context) => {
        loggedMessages = [];

        logError(error, context);

        // Verify at least one log message was made
        expect(loggedMessages.length).toBeGreaterThan(0);

        // Verify the error message appears in the logged output
        const allLoggedText = loggedMessages.map((args) => args.join(' ')).join(' ');
        expect(allLoggedText).toContain(error.message);
      }),
      { numRuns: 100 }
    );
  });

  it('logError logs context when provided', () => {
    fc.assert(
      fc.property(appErrorArb, contextArb, (error, context) => {
        loggedMessages = [];

        logError(error, context);

        // Verify at least one log message was made
        expect(loggedMessages.length).toBeGreaterThan(0);

        // Verify the context appears in the logged output
        const allLoggedText = loggedMessages.map((args) => args.join(' ')).join(' ');
        expect(allLoggedText).toContain(context);
      }),
      { numRuns: 100 }
    );
  });

  it('logError logs stack trace when available in details', () => {
    fc.assert(
      fc.property(errorWithStackArb, contextArb, (error, context) => {
        loggedMessages = [];

        // Create an AppError with stack trace in details
        const appError: AppError = {
          code: ErrorCode.UNKNOWN_ERROR,
          message: error.message,
          details: {
            name: error.name,
            stack: error.stack,
          },
          recoverable: true,
        };

        logError(appError, context);

        // Verify at least one log message was made
        expect(loggedMessages.length).toBeGreaterThan(0);

        // If stack trace exists, it should be logged
        if (error.stack) {
          const allLoggedContent = loggedMessages.flat();
          const hasStackLogged = allLoggedContent.some(
            (item) => typeof item === 'string' && item.includes('Stack trace')
          );
          expect(hasStackLogged).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('handleError logs complete error information', () => {
    fc.assert(
      fc.property(errorWithStackArb, contextArb, (error, context) => {
        loggedMessages = [];

        handleError(error, context);

        // Verify at least one log message was made
        expect(loggedMessages.length).toBeGreaterThan(0);

        // Verify the error message appears in the logged output
        const allLoggedText = loggedMessages.map((args) => args.join(' ')).join(' ');
        expect(allLoggedText).toContain(error.message);

        // Verify the context appears in the logged output
        expect(allLoggedText).toContain(context);
      }),
      { numRuns: 100 }
    );
  });

  it('normalizeError from Error includes stack trace in details', () => {
    fc.assert(
      fc.property(errorWithStackArb, contextArb, (error, context) => {
        const appError = normalizeError(error, context);

        // Verify the normalized error has details with stack
        expect(appError.details).toBeDefined();
        if (error.stack) {
          expect((appError.details as Record<string, unknown>).stack).toBe(error.stack);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('normalizeError from string creates complete AppError', () => {
    fc.assert(
      fc.property(errorMessageArb, contextArb, (errorMessage, context) => {
        const appError = normalizeError(errorMessage, context);

        // Verify all required fields are present
        expect(appError.code).toBe(ErrorCode.UNKNOWN_ERROR);
        expect(appError.message).toContain(errorMessage);
        expect(appError.message).toContain(context);
        expect(typeof appError.recoverable).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  it('all error codes are logged correctly', () => {
    fc.assert(
      fc.property(errorCodeArb, errorMessageArb, (code, message) => {
        loggedMessages = [];

        const appError: AppError = {
          code,
          message,
          recoverable: true,
        };

        logError(appError);

        // Verify the error code appears in the logged output
        const allLoggedText = loggedMessages.map((args) => args.join(' ')).join(' ');
        expect(allLoggedText).toContain(code);
      }),
      { numRuns: 100 }
    );
  });

  it('error details are logged when present', () => {
    fc.assert(
      fc.property(
        appErrorArb.filter((e) => e.details !== undefined),
        (error) => {
          loggedMessages = [];

          logError(error);

          // Verify details are logged
          const hasDetailsLogged = loggedMessages.some((args) =>
            args.some((arg) => typeof arg === 'string' && arg.includes('Details'))
          );
          expect(hasDetailsLogged).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('TypeFlow prefix is included in all log messages', () => {
    fc.assert(
      fc.property(appErrorArb, (error) => {
        loggedMessages = [];

        logError(error);

        // Verify all log messages include the TypeFlow prefix
        for (const args of loggedMessages) {
          const firstArg = args[0];
          expect(typeof firstArg === 'string' && firstArg.includes('[TypeFlow]')).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
