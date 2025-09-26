/**
 * Prisma Database Client - Singleton database connection
 * Manages PostgreSQL connection with development hot-reload support
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
