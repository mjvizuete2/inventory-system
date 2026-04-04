import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/http-error";

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  const token = authorization.replace("Bearer ", "").trim();

  try {
    req.user = verifyToken(token);
    next();
  } catch (_error) {
    next(new HttpError(401, "Invalid token"));
  }
};
