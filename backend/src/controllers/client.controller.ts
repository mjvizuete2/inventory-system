import { NextFunction, Request, Response } from "express";
import { ClientService } from "../services/client.service";

const clientService = new ClientService();

export const ClientController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await clientService.list());
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await clientService.getById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json(await clientService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await clientService.update(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await clientService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
