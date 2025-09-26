/**
 * Security Headers Module - HTTP security headers middleware
 * Implements CSP, HSTS, and anti-clickjacking protection
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Security Headers Configuration
// ============================================================================

// CSP configuration for Next.js development
const CSP_HEADERS = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requirements
  "style-src 'self' 'unsafe-inline'", // CSS-in-JS support
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

/**
 * Get basic security headers
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy
    "Content-Security-Policy": CSP_HEADERS,

    // HTTP Strict Transport Security (HTTPS only)
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // XSS Protection (legacy browsers)
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy (basic)
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * General API security headers middleware
 */
export function withApiSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest) => {
    const response = await handler(req);
    return applySecurityHeaders(response);
  };
}

/**
 * FIDO-specific security headers middleware
 */
export function withFidoSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
) {
  return async (req: NextRequest) => {
    const response = await handler(req);

    // Apply basic security headers
    applySecurityHeaders(response);

    // FIDO-specific headers
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    response.headers.set("Sec-Fetch-Site", "same-origin");

    return response;
  };
}
