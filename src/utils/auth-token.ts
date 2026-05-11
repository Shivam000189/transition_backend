import { Request } from "express";
import prisma from "../db/db.config";
import { decodeTokenExpiry } from "./jwt";

const prismaClient = prisma as typeof prisma & {
  tokenBlacklist: any;
};

function parseCookieHeader(cookieHeader?: string) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, cookiePart) => {
    const [rawKey, ...rawValue] = cookiePart.trim().split("=");
    if (!rawKey) {
      return acc;
    }

    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

export function extractTokenFromRequest(req: Request) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies.token ?? null;
}

export async function addTokenToBlacklist(token: string, userId: number) {
  const expiresAt = decodeTokenExpiry(token) ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prismaClient.tokenBlacklist.upsert({
    where: { token },
    update: { expiresAt, userId },
    create: {
      token,
      userId,
      expiresAt,
    },
  });
}

export async function isTokenBlacklisted(token: string) {
  const blacklistedToken = await prismaClient.tokenBlacklist.findUnique({
    where: { token },
    select: { expiresAt: true },
  });

  if (!blacklistedToken) {
    return false;
  }

  return blacklistedToken.expiresAt > new Date();
}
