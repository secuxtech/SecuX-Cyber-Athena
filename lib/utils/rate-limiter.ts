/**
 * Rate Limiting Module - In-memory request throttling
 * Prevents API abuse and brute force attacks with IP-based tracking
 */

import { NextRequest, NextResponse } from "next/server";
import { RATE } from "@/config";

// Simple in-memory store (use Redis in production)
const requestCounts: Record<string, { count: number; resetTime: number }> = {};

// Rate limit settings
const GENERAL_LIMIT = { requests: RATE.GENERAL, windowMs: RATE.WINDOW };
const STRICT_LIMIT = { requests: RATE.STRICT, windowMs: RATE.WINDOW };

// Extract client IP for rate limit tracking
function getClientKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
            req.headers.get("x-real-ip") ||
            "unknown";
  return `rate_limit_${ip}`;
}

// Check and update request count for rate limiting
function isRateLimited(key: string, limit: { requests: number; windowMs: number }): boolean {
  const now = Date.now();
  const record = requestCounts[key];

  // Reset if window expired
  if (!record || now > record.resetTime) {
    requestCounts[key] = { count: 1, resetTime: now + limit.windowMs };
    return false;
  }

  // Check if limit exceeded
  if (record.count >= limit.requests) {
    return true;
  }

  // Increment count
  record.count++;
  return false;
}

// Create rate limiting middleware with custom limit configuration
function createRateLimiter(limit: { requests: number; windowMs: number }) {
  return async (req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) => {
    const key = getClientKey(req);

    if (isRateLimited(key, limit)) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return handler(req);
  };
}

// Export rate limiters
export const unifiedRateLimiter = createRateLimiter(GENERAL_LIMIT);
export const strictRateLimiter = createRateLimiter(STRICT_LIMIT);
