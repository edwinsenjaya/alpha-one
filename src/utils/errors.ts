// Error handling utilities for Firestore operations
export class FirestoreError extends Error {
  code: string;
  originalError?: Error;

  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = "FirestoreError";
    this.code = code;
    this.originalError = originalError;
  }
}

export const handleFirestoreError = (error: any): FirestoreError => {
  const errorMessage = error.message || "An unknown error occurred";
  const errorCode = error.code || "UNKNOWN_ERROR";

  // Map Firebase errors to user-friendly messages
  const errorMessages: Record<string, string> = {
    "permission-denied": "You do not have permission to perform this action",
    "not-found": "The requested document was not found",
    "already-exists": "A document with this ID already exists",
    aborted: "The operation was aborted due to a conflict",
    "out-of-range": "The operation was attempted past the valid range",
    unimplemented: "This operation is not implemented",
    internal: "An internal server error occurred",
    unavailable: "The service is currently unavailable",
    unauthenticated: "You are not authenticated to perform this action",
    "resource-exhausted": "The service is temporarily overloaded",
    "failed-precondition": "The operation failed due to invalid preconditions",
    "invalid-argument": "Invalid data was provided",
    "deadline-exceeded": "The operation timed out",
  };

  const userFriendlyMessage = errorMessages[errorCode] || errorMessage;

  return new FirestoreError(userFriendlyMessage, errorCode, error);
};

export const logError = (error: FirestoreError, context?: string) => {
  console.error(`[${context || "Firestore"}] ${error.code}: ${error.message}`, {
    originalError: error.originalError,
    stack: error.stack,
  });
};

// Response wrapper for consistent API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: FirestoreError;
  message?: string;
}

export const createSuccessResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const createErrorResponse = (
  error: FirestoreError
): ApiResponse<never> => ({
  success: false,
  error,
  message: error.message,
});
