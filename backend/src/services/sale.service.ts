import { Between, In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { CreateSaleDto } from "../dto/sale.dto";
import { Client } from "../entities/Client";
import { Product } from "../entities/Product";
import { Sale } from "../entities/Sale";
import { SaleItem } from "../entities/SaleItem";
import { SalePayment } from "../entities/SalePayment";
import { HttpError } from "../utils/http-error";
import { money, roundMoney } from "../utils/math";

export class SaleService {
  private readonly saleRepository = AppDataSource.getRepository(Sale);

  async list(): Promise<Sale[]> {
    return this.saleRepository.find({
      relations: {
        client: true,
        items: { product: true },
        payments: true,
        invoice: true
      },
      order: { id: "DESC" }
    });
  }

  async getById(id: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: {
        client: true,
        items: { product: true },
        payments: true,
        invoice: true
      }
    });

    if (!sale) {
      throw new HttpError(404, "Sale not found");
    }

    return sale;
  }

  async create(dto: CreateSaleDto): Promise<Sale> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let client: Client | null = null;
      if (dto.clientId) {
        client = await queryRunner.manager.findOne(Client, {
          where: { id: dto.clientId }
        });
        if (!client) {
          throw new HttpError(404, "Client not found");
        }
      }
      if (!client) {
        throw new HttpError(400, "Client is required");
      }

      const productIds = dto.items.map((item) => item.productId);
      if (new Set(productIds).size !== productIds.length) {
        throw new HttpError(400, "Duplicate products are not allowed in the same sale");
      }
      const products = await queryRunner.manager.find(Product, {
        where: { id: In(productIds) },
        relations: { category: true }
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      const items: SaleItem[] = [];
      let subtotal = 0;
      let ivaAmount = 0;
      let total = 0;

      for (const itemDto of dto.items) {
        const product = productMap.get(itemDto.productId);
        if (!product) {
          throw new HttpError(404, `Product ${itemDto.productId} not found`);
        }
        if (!product.active) {
          throw new HttpError(400, `Product ${product.name} is inactive`);
        }
        if (product.stock < itemDto.quantity) {
          throw new HttpError(400, `Insufficient stock for ${product.name}`);
        }

        const hasIva = typeof itemDto.hasIva === "boolean"
          ? itemDto.hasIva
          : Number(product.ivaRate) > 0;
        const unitPrice = roundMoney(itemDto.finalPrice);
        const lineTotal = roundMoney(unitPrice * itemDto.quantity);
        const lineSubtotal = hasIva
          ? roundMoney(lineTotal / 1.12)
          : lineTotal;
        const lineIva = hasIva
          ? roundMoney(lineTotal - lineSubtotal)
          : 0;

        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        subtotal += lineSubtotal;
        ivaAmount += lineIva;
        total += lineTotal;

        const saleItem = queryRunner.manager.create(SaleItem);
        saleItem.product = product;
        saleItem.productId = product.id;
        saleItem.quantity = itemDto.quantity;
        saleItem.unitPrice = money(unitPrice);
        saleItem.hasIva = hasIva;
        saleItem.subtotal = money(lineSubtotal);
        saleItem.ivaAmount = money(lineIva);
        saleItem.total = money(lineTotal);
        items.push(saleItem);
      }

      subtotal = roundMoney(subtotal);
      ivaAmount = roundMoney(ivaAmount);
      total = roundMoney(total);

      const paidAmount = roundMoney(
        dto.payments.reduce((sum, payment) => sum + payment.amount, 0)
      );
      if (paidAmount !== total) {
        throw new HttpError(400, "Payment total does not match sale total");
      }

      const payments = dto.payments.map((payment) => {
        const normalizedMethod = payment.paymentMethod.toUpperCase();
        if (normalizedMethod === "TRANSFER" && !payment.reference?.trim()) {
          throw new HttpError(400, "Transfer payment requires a reference number");
        }

        const receivedAmount = normalizedMethod === "CASH"
          ? roundMoney(payment.receivedAmount ?? 0)
          : null;
        const changeAmount = normalizedMethod === "CASH"
          ? roundMoney(receivedAmount! - payment.amount)
          : null;

        if (normalizedMethod === "CASH") {
          if (!receivedAmount || receivedAmount < payment.amount) {
            throw new HttpError(400, "Cash payment requires received amount greater than or equal to total");
          }
        }

        const salePayment = queryRunner.manager.create(SalePayment);
        salePayment.paymentMethod = normalizedMethod;
        salePayment.amount = money(payment.amount);
        salePayment.reference = (payment.reference ?? null) as unknown as string;
        salePayment.receivedAmount = (receivedAmount !== null ? money(receivedAmount) : null) as unknown as string;
        salePayment.changeAmount = (changeAmount !== null ? money(changeAmount) : null) as unknown as string;
        return salePayment;
      });

      const sale = queryRunner.manager.create(Sale);
      sale.client = client;
      sale.clientId = (client?.id ?? null) as unknown as number;
      sale.subtotal = money(subtotal);
      sale.ivaAmount = money(ivaAmount);
      sale.total = money(total);
      sale.createdBy = dto.createdBy ?? "system";
      sale.status = "COMPLETED";
      sale.notes = (dto.notes ?? null) as unknown as string;
      sale.soldAt = dto.soldAt ? new Date(dto.soldAt) : new Date();
      sale.items = items;
      sale.payments = payments;

      const savedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();

      return this.getById(savedSale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSalesInRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return this.saleRepository.find({
      where: {
        soldAt: Between(startDate, endDate)
      },
      relations: {
        payments: true
      }
    });
  }
}
