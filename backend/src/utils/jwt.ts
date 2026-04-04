import jwt, { JwtPayload as JwtBasePayload } from "jsonwebtoken";
import { env } from "../config/env";

export type CustomJwtPayload = {
  sub: number;
  email: string;
  role: string;
};

export const signToken = (payload: CustomJwtPayload): string =>
  jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });

export const verifyToken = (token: string): CustomJwtPayload => {
  const decoded = jwt.verify(token, env.jwt.secret);

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const payload = decoded as JwtBasePayload & Partial<CustomJwtPayload>;

  if (!payload.sub || !payload.email || !payload.role) {
    throw new Error("Invalid token structure");
  }

  return payload as CustomJwtPayload;
};