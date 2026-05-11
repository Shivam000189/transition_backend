import { NextFunction, Response } from "express";
import prisma from "../db/db.config";
import { extractTokenFromRequest, isTokenBlacklisted } from "../utils/auth-token";
import { verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types/auth-request";

async function resolveUserFromToken(req: AuthenticatedRequest) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    throw new Error("Unauthorized access, token is missing");
  }

  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    throw new Error("Unauthorized access, token is invalid");
  }

  const userId = verifyToken(token);
  if (!userId) {
    throw new Error("Unauthorized access, token is invalid");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      systemUser: true,
    },
  });

  if (!user) {
    throw new Error("Unauthorized access, token is invalid");
  }

  req.user = user;
  return user;
}

function handleAuthFailure(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized access, token is invalid";
  const statusCode = message === "Forbidden access, not a system user" ? 403 : 401;
  return res.status(statusCode).json({ success: false, error: message });
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await resolveUserFromToken(req);
    next();
  } catch (error) {
    handleAuthFailure(res, error);
  }
}

export async function authSystemUserMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await resolveUserFromToken(req);

    if (!user.systemUser) {
      throw new Error("Forbidden access, not a system user");
    }

    next();
  } catch (error) {
    handleAuthFailure(res, error);
  }
}
