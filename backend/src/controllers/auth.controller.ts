import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
