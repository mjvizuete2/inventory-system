import { Router } from "express";
import { CashClosureController } from "../controllers/cash-closure.controller";
import { CashClosureSummaryDto, CloseCashClosureDto, OpenCashClosureDto } from "../dto/cash-closure.dto";
import { requireAuth } from "../middlewares/auth";
import { validateDto } from "../middlewares/validate";

export const cashClosureRoutes = Router();

cashClosureRoutes.use(requireAuth);
cashClosureRoutes.get("/", CashClosureController.list);
cashClosureRoutes.get("/current", CashClosureController.current);
cashClosureRoutes.get("/summary", CashClosureController.summary);
cashClosureRoutes.post("/", validateDto(OpenCashClosureDto), CashClosureController.create);
cashClosureRoutes.post("/close", validateDto(CloseCashClosureDto), CashClosureController.close);
