import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { CreateProductDto, UpdateProductDto } from "../dto/product.dto";
import { requireAuth } from "../middlewares/auth";
import { validateDto } from "../middlewares/validate";

export const productRoutes = Router();

productRoutes.use(requireAuth);
productRoutes.get("/", ProductController.list);
productRoutes.get("/:id", ProductController.getById);
productRoutes.post("/", validateDto(CreateProductDto), ProductController.create);
productRoutes.put("/:id", validateDto(UpdateProductDto), ProductController.update);
productRoutes.delete("/:id", ProductController.remove);
