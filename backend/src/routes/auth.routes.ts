import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { LoginDto } from "../dto/auth.dto";
import { validateDto } from "../middlewares/validate";

export const authRoutes = Router();

authRoutes.post("/login", validateDto(LoginDto), AuthController.login);
