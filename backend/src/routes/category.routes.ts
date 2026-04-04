import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { requireAuth } from "../middlewares/auth";
import { validateDto } from "../middlewares/validate";

export const categoryRoutes = Router();

categoryRoutes.use(requireAuth);
categoryRoutes.get("/", CategoryController.list);
categoryRoutes.get("/:id", CategoryController.getById);
categoryRoutes.post("/", validateDto(CreateCategoryDto), CategoryController.create);
categoryRoutes.put("/:id", validateDto(UpdateCategoryDto), CategoryController.update);
categoryRoutes.delete("/:id", CategoryController.remove);
