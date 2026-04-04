import { Router } from "express";
import { ClientController } from "../controllers/client.controller";
import { CreateClientDto, UpdateClientDto } from "../dto/client.dto";
import { requireAuth } from "../middlewares/auth";
import { validateDto } from "../middlewares/validate";

export const clientRoutes = Router();

clientRoutes.use(requireAuth);
clientRoutes.get("/", ClientController.list);
clientRoutes.get("/:id", ClientController.getById);
clientRoutes.post("/", validateDto(CreateClientDto), ClientController.create);
clientRoutes.put("/:id", validateDto(UpdateClientDto), ClientController.update);
clientRoutes.delete("/:id", ClientController.remove);
