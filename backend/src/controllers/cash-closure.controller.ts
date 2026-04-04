import { NextFunction, Request, Response } from "express";
import { CashClosureService } from "../services/cash-closure.service";

const cashClosureService = new CashClosureService();

export const CashClosureController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await cashClosureService.list());
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json(await cashClosureService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(
        await cashClosureService.summarize({
          startDate: String(req.query.startDate ?? ""),
          endDate: String(req.query.endDate ?? ""),
          paymentMethod: req.query.paymentMethod ? String(req.query.paymentMethod) : undefined
        })
      );
    } catch (error) {
      next(error);
    }
  }
};
