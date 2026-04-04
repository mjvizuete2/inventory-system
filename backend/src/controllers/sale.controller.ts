import { NextFunction, Request, Response } from "express";
import { SaleService } from "../services/sale.service";
import { SRIService } from "../services/sri.service";

const saleService = new SaleService();
const sriService = new SRIService();

export const SaleController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await saleService.list());
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await saleService.getById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      req.body.createdBy = req.user?.email ?? req.body.createdBy;
      res.status(201).json(await saleService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  async generateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await saleService.getEntityForInvoice(Number(req.params.id));
      const invoice = await sriService.generateAndSendInvoice(
        sale,
        req.body.establishmentCode,
        req.body.emissionPointCode
      );
      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  }
};
