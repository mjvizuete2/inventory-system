import { NextFunction, Request, Response } from "express";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export const ProductController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await productService.list());
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await productService.getById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json(await productService.create(req.body));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(await productService.update(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
