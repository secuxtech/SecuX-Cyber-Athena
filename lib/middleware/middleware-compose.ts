/**
 * Middleware Composition Utilities
 *
 * This module provides utilities to compose multiple middlewares into a single,
 * clean function call, improving code readability and maintainability.
 *
 * Benefits:
 * 1. Eliminates deep nesting of middleware calls
 * 2. Provides clear, declarative middleware composition
 * 3. Makes middleware order explicit and easy to modify
 * 4. Improves code readability and maintenance
 *
 * Usage patterns supported:
 * - Standard middleware composition for API routes
 * - Rate-limited middleware composition
 * - FIDO-specific middleware composition
 */

import { NextRequest, NextResponse } from "next/server";

// Type definitions for middleware functions
export type Middleware = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => (req: NextRequest) => Promise<NextResponse>;

export type RateLimitedHandler = (
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) => Promise<NextResponse>;

/**
 * Compose multiple middlewares into a single function
 *
 * Takes an array of middleware functions and composes them from right to left
 * (similar to function composition in functional programming).
 *
 * @param middlewares - Array of middleware functions to compose
 * @returns A composed middleware function
 *
 * @example
 * // Instead of:
 * withErrorHandler(withApiSecurityHeaders(withAuth(handler)))
 *
 * // Use:
 * compose(withErrorHandler, withApiSecurityHeaders, withAuth)(handler)
 */
export function compose(...middlewares: Middleware[]) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((composed, middleware) => {
      return middleware(composed);
    }, handler);
  };
}

/**
 * Compose middlewares with a rate limiter function
 *
 * Special composition for middlewares that include rate limiting,
 * where the rate limiter takes both request and handler as parameters.
 *
 * @param rateLimiter - Rate limiting function
 * @param middlewares - Array of middleware functions to compose
 * @returns A composed middleware function with rate limiting
 *
 * @example
 * // Instead of:
 * withErrorHandler(withApiSecurityHeaders(withAuth(
 *   async (req) => unifiedRateLimiter(req, handler)
 * )))
 *
 * // Use:
 * composeWithRateLimit(unifiedRateLimiter, withErrorHandler, withApiSecurityHeaders, withAuth)(handler)
 */
export function composeWithRateLimit(
  rateLimiter: RateLimitedHandler,
  ...middlewares: Middleware[]
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    const rateLimitedHandler = async (req: NextRequest) => {
      return rateLimiter(req, handler);
    };

    return compose(...middlewares)(rateLimitedHandler);
  };
}

/**
 * Compose middlewares without authentication
 *
 * For public endpoints that don't require authentication but still need
 * error handling, security headers, and rate limiting.
 *
 * @param rateLimiter - Rate limiting function
 * @param middlewares - Array of middleware functions to compose (excluding auth)
 * @returns A composed middleware function for public endpoints
 *
 * @example
 * // For FIDO endpoints that don't need auth:
 * composePublic(strictRateLimiter, withErrorHandler, withFidoSecurityHeaders)(handler)
 */
export function composePublic(
  rateLimiter: RateLimitedHandler,
  ...middlewares: Middleware[]
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    const rateLimitedHandler = async (req: NextRequest) => {
      return rateLimiter(req, handler);
    };

    return compose(...middlewares)(rateLimitedHandler);
  };
}

/**
 * Pre-configured middleware compositions for common patterns
 *
 * These are convenience functions for the most common middleware combinations
 * used throughout the application.
 */

/**
 * Standard authenticated API endpoint composition
 * Includes: Error handling + Security headers + Authentication + Rate limiting
 */
export function composeAuthenticatedAPI(
  rateLimiter: RateLimitedHandler,
  errorHandler: Middleware,
  securityHeaders: Middleware,
  auth: Middleware,
) {
  return composeWithRateLimit(rateLimiter, errorHandler, securityHeaders, auth);
}

/**
 * FIDO endpoint composition (no authentication required)
 * Includes: Error handling + FIDO security headers + Rate limiting
 */
export function composeFidoAPI(
  rateLimiter: RateLimitedHandler,
  errorHandler: Middleware,
  fidoSecurityHeaders: Middleware,
) {
  return composePublic(rateLimiter, errorHandler, fidoSecurityHeaders);
}