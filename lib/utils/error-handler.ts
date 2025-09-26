/**
 * Unified Error Handler Middleware
 *
 * This module provides enterprise-grade error handling for API endpoints:
 * 1. Unified error logging format - enables better tracking and debugging
 * 2. Standardized error responses - provides consistent client experience
 * 3. Secure error handling - prevents sensitive information leakage
 * 4. Structured logging - supports monitoring and alerting systems
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized error response format
 *
 * Design principles:
 * - Consistent error structure for easy frontend handling
 * - Include error codes for internationalization support
 * - Provide sufficient error information without exposing internal details
 */
interface StandardErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

/**
 * Error type classification
 * Different error types require different handling strategies
 */
enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTH_ERROR",
  AUTHORIZATION = "AUTHZ_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  BUSINESS_LOGIC = "BUSINESS_ERROR",
  EXTERNAL_SERVICE = "EXTERNAL_ERROR",
  INTERNAL = "INTERNAL_ERROR"
}

/**
 * Business Logic Error Class
 *
 * Used to distinguish between system errors and business errors
 * - Business errors: user-understandable errors like insufficient balance
 * - System errors: technical issues like database connection failures
 */
export class BusinessLogicError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = "BusinessLogicError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Categorize errors based on error type
 *
 * Error identification and classification strategy
 */
function categorizeError(error: Error): { type: ErrorType; statusCode: number; shouldLog: boolean } {
  // Zod validation errors - client input issues
  if (error instanceof ZodError) {
    return { type: ErrorType.VALIDATION, statusCode: 400, shouldLog: false };
  }

  // Custom business logic errors
  if (error instanceof BusinessLogicError) {
    return { type: ErrorType.BUSINESS_LOGIC, statusCode: error.statusCode, shouldLog: false };
  }

  // Authentication errors - usually thrown by middleware
  if (error.message.includes("Unauthorized") || error.message.includes("Invalid token")) {
    return { type: ErrorType.AUTHENTICATION, statusCode: 401, shouldLog: false };
  }

  // Authorization errors - user lacks permission to perform operation
  if (error.message.includes("Forbidden") || error.message.includes("Access denied")) {
    return { type: ErrorType.AUTHORIZATION, statusCode: 403, shouldLog: false };
  }

  // Resource not found
  if (error.message.includes("Not found") || error.message.includes("does not exist")) {
    return { type: ErrorType.NOT_FOUND, statusCode: 404, shouldLog: false };
  }

  // External service errors - HSM, blockchain nodes, etc.
  if (error.message.includes("HSM") || error.message.includes("Bitcoin") || error.message.includes("fetch failed")) {
    return { type: ErrorType.EXTERNAL_SERVICE, statusCode: 502, shouldLog: true };
  }

  // Default to internal error - requires logging for debugging
  return { type: ErrorType.INTERNAL, statusCode: 500, shouldLog: true };
}

/**
 * Create standardized error response
 *
 * Security principle: avoid exposing detailed error information in production
 */
function createErrorResponse(
  error: Error,
  type: ErrorType,
  statusCode: number,
  requestId?: string,
): StandardErrorResponse {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Development provides detailed info, production protects sensitive data
  const errorMessage = isDevelopment ? error.message : getPublicErrorMessage(type, statusCode);

  const response: StandardErrorResponse = {
    error: errorMessage,
    code: type,
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Validation errors provide detailed information for debugging
  if (error instanceof ZodError) {
    response.details = error.issues.map(issue => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
  }

  // Business logic errors provide error codes
  if (error instanceof BusinessLogicError) {
    response.code = error.code;
  }

  return response;
}

/**
 * Provide user-friendly error messages based on error type
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getPublicErrorMessage(type: ErrorType, statusCode: number): string {
  switch (type) {
    case ErrorType.VALIDATION:
      return "Request validation failed. Please check your input.";
    case ErrorType.AUTHENTICATION:
      return "Authentication required. Please log in.";
    case ErrorType.AUTHORIZATION:
      return "Access denied. Insufficient permissions.";
    case ErrorType.NOT_FOUND:
      return "Requested resource not found.";
    case ErrorType.BUSINESS_LOGIC:
      return "Operation cannot be completed due to business rules.";
    case ErrorType.EXTERNAL_SERVICE:
      return "External service temporarily unavailable. Please try again later.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

/**
 * Structured error logging
 *
 * Production-grade application logging best practices:
 * - Include sufficient context information
 * - Support log aggregation and search
 * - Avoid logging sensitive information
 */
function logError(error: Error, req: NextRequest, type: ErrorType, requestId?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    level: "error",
    message: error.message,
    errorType: type,
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent"),
    // Avoid logging sensitive headers like Authorization
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  };

  // In production, this should integrate with professional logging systems like Winston, Pino, or cloud logging services
  console.error("[API Error]", JSON.stringify(logData, null, 2));
}

/**
 * Error Handling Middleware
 *
 * Usage:
 * ```typescript
 * export const POST = withErrorHandler(async (req: NextRequest) => {
 *   // Your business logic
 *   return NextResponse.json({ success: true });
 * });
 * ```
 *
 * Key concepts:
 * 1. Higher-Order Function pattern practical application
 * 2. Error handling separation of concerns principle
 * 3. Middleware composition patterns
 */
export function withErrorHandler<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    // Generate request ID for tracking
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    try {
      // Execute the original handler function
      return await handler(req, ...args);
    } catch (error) {
      // Ensure error is Error type
      const actualError = error instanceof Error ? error : new Error(String(error));

      // Categorize error and determine handling strategy
      const { type, statusCode, shouldLog } = categorizeError(actualError);

      // Log errors that require logging
      if (shouldLog) {
        logError(actualError, req, type, requestId);
      }

      // Generate standardized error response
      const errorResponse = createErrorResponse(actualError, type, statusCode, requestId);

      return NextResponse.json(errorResponse, {
        status: statusCode,
        headers: {
          "x-request-id": requestId,
        },
      });
    }
  };
}

/**
 * Convenient error throwing function
 *
 * Usage example:
 * ```typescript
 * throwBusinessError("Insufficient balance for transaction", "INSUFFICIENT_BALANCE", 400);
 * ```
 */
export function throwBusinessError(message: string, code: string, statusCode: number = 400): never {
  throw new BusinessLogicError(message, code, statusCode);
}

/**
 * Export common error types for use in other modules
 */
export { ErrorType };