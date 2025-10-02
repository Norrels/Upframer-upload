import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../../env";

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare module "fastify" {
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
      return reply.status(401).send({
        error: "Authorization header is required",
        code: "MISSING_TOKEN",
      });
    }

    const token = authHeader.replace(/^Bearer\s+/, "");

    if (!token) {
      return reply.status(401).send({
        error: "Token is required",
        code: "MISSING_TOKEN",
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    console.log("Token decoded successfully:", JSON.stringify(decoded, null, 2));

    // Mapeia diferentes formatos de payload
    const userId = decoded.userId || decoded.id || decoded.sub || decoded.user_id;
    const email = decoded.email || decoded.user_email;

    if (!userId || !email) {
      console.error("Invalid payload structure. Expected userId and email, got:", decoded);
      return reply.status(401).send({
        error: "Invalid token payload - missing userId or email",
        code: "INVALID_TOKEN",
      });
    }

    request.user = {
      userId,
      email,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    console.error("Error during token verification:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      reply.status(401).send({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      reply.status(401).send({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    reply.status(500).send({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
}
