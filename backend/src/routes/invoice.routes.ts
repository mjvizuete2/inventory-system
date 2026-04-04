import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";
import { requireAuth } from "../middlewares/auth";

export const invoiceRoutes = Router();

invoiceRoutes.use(requireAuth);
invoiceRoutes.get("/", InvoiceController.list);
invoiceRoutes.get("/:id", InvoiceController.getById);
