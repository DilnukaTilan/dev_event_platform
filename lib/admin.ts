import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

const ADMIN_TOKEN_HEADER = "x-admin-token";

function safeCompare(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

export function isAdminRequest(req: NextRequest): boolean {
  const configuredToken = process.env.ADMIN_CREATE_EVENT_TOKEN;
  const providedToken = req.headers.get(ADMIN_TOKEN_HEADER);

  if (!configuredToken || !providedToken) {
    return false;
  }

  return safeCompare(providedToken, configuredToken);
}
