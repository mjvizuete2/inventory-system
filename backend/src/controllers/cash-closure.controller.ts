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
      res.status(201).json(await cashClosureService.open(req.body, req.user?.email ?? "system"));
    } catch (error) {
      next(error);
    }
  },

  async current(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentClosure = await cashClosureService.getCurrent();
      if (!currentClosure) {
        res.status(404).json({ message: "There is no open cash box" });
        return;
      }

      res.json(currentClosure);
    } catch (error) {
      next(error);
    }
  },

  async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await cashClosureService.close(req.body, req.user?.email ?? "system"));
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
