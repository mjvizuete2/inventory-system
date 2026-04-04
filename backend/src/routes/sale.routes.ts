import { Router } from "express";
import { SaleController } from "../controllers/sale.controller";
import { GenerateInvoiceDto } from "../dto/invoice.dto";
import { CreateSaleDto } from "../dto/sale.dto";
import { requireAuth } from "../middlewares/auth";
import { validateDto } from "../middlewares/validate";

export const saleRoutes = Router();

saleRoutes.use(requireAuth);
saleRoutes.get("/", SaleController.list);
saleRoutes.get("/:id", SaleController.getById);
saleRoutes.post("/", validateDto(CreateSaleDto), SaleController.create);
saleRoutes.post("/:id/invoice", validateDto(GenerateInvoiceDto), SaleController.generateInvoice);
