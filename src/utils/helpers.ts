/**
 * TypeFlow Plugin - Utility Helpers
 *
 * Common utility functions for error handling and logging.
 */

import { AppError, ErrorCode } from '../types/typography';

/**
 * Normalizes unknown errors to the AppError format.
 * Converts various error types (Error, string, unknown) into a consistent AppError structure.
 *
 * @param error - The unknown error to normalize
 * @param context - Optional context describing where the error occurred
 * @returns A normalized AppError object
 */
export function normalizeError(error: unknown, context?: string): AppError {
  // Handle Error instances
  if (error instanceof Error) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: context ? `${context}: ${error.message}` : error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
      recoverable: true,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: context ? `${context}: ${error}` : error,
      details: undefined,
      recoverable: true,
    };
  }

  // Handle AppError objects (pass through)
  if (isAppError(error)) {
    return error;
  }

  // Handle unknown error types
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: context ? `${context}: An unknown error occurred` : 'An unknown error occurred',
    details: error,
    recoverable: true,
  };
}

/**
 * Type guard to check if an object is an AppError.
 *
 * @param error - The object to check
 * @returns True if the object is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const obj = error as Record<string, unknown>;
  return (
    typeof obj.code === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.recoverable === 'boolean'
  );
}

/**
 * Logs an error with code, message, and stack trace when available.
 * Implements Property 21: Error Logging Completeness.
 *
 * @param error - The AppError to log
 * @param context - Optional context describing where the error occurred
 */
export function logError(error: AppError, context?: string): void {
  const prefix = '[TypeFlow]';
  const contextStr = context ? ` ${context}:` : '';

  // Log error code and message
  console.error(`${prefix}${contextStr} [${error.code}] ${error.message}`);

  // Log stack trace when available
  if (error.details && typeof error.details === 'object') {
    const details = error.details as Record<string, unknown>;
    if (details.stack && typeof details.stack === 'string') {
      console.error(`${prefix} Stack trace:`, details.stack);
    }
  }

  // Log additional details if present
  if (error.details !== undefined) {
    console.error(`${prefix} Details:`, error.details);
  }
}

/**
 * Centralized error handler that normalizes and logs errors.
 * Combines normalizeError and logError for convenience.
 *
 * @param error - The unknown error to handle
 * @param context - Context describing where the error occurred
 * @returns A normalized AppError object
 */
export function handleError(error: unknown, context: string): AppError {
  const appError = normalizeError(error, context);
  logError(appError, context);
  return appError;
}
