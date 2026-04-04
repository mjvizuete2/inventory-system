import { NextFunction, Request, Response } from "express";
import { SRIService } from "../services/sri.service";

const sriService = new SRIService();

export const InvoiceController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await sriService.list());
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await sriService.getById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  }
};
