import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../../env";

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      reply.status(401).send({
        error: "Authorization header is required",
        code: "MISSING_TOKEN"
      });
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/, "");

    if (!token) {
      reply.status(401).send({
        error: "Token is required",
        code: "MISSING_TOKEN"
      });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    if (!decoded.userId || !decoded.email) {
      reply.status(401).send({
        error: "Invalid token payload",
        code: "INVALID_TOKEN"
      });
      return;
    }

    request.user = decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      reply.status(401).send({
        error: "Invalid token",
        code: "INVALID_TOKEN"
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      reply.status(401).send({
        error: "Token expired",
        code: "TOKEN_EXPIRED"
      });
      return;
    }

    reply.status(500).send({
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
}