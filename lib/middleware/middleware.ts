import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getSecurityConfig } from "../utils/env-validation";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://cyber-athena.vercel.app",
];

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      const origin = req.headers.get("origin");
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return new NextResponse(null, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      }
      return new NextResponse(null, { status: 403 });
    }

    // CORS check
    const origin = req.headers.get("origin");
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse("CORS Forbidden", { status: 403 });
    }

    // Bearer Token validation
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    // JWT validation
    try {
      const securityConfig = getSecurityConfig();
      const decoded = jwt.verify(token, securityConfig.jwtSecret) as any;
      // You can add user info to req
      (req as any).user = decoded;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return new NextResponse("Invalid token", { status: 401 });
    }

    // Passed authentication, execute original handler
    const response = await handler(req);

    // Add CORS headers to response
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    return response;
  };
}
