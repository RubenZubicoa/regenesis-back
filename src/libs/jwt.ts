import jwt, { type SignOptions } from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "client" | "trainer";
};

const JWT_SECRET = process.env.JWT_SECRET || "regenesis-dev-secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
