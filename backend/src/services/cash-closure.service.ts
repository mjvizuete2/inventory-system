import { AppDataSource } from "../config/data-source";
import { CreateCashClosureDto } from "../dto/cash-closure.dto";
import { CashClosure } from "../entities/CashClosure";
import { CashClosurePayment } from "../entities/CashClosurePayment";
import { SaleService } from "./sale.service";
import { HttpError } from "../utils/http-error";
import { money, roundMoney } from "../utils/math";

export class CashClosureService {
  private readonly repository = AppDataSource.getRepository(CashClosure);
  private readonly paymentRepository = AppDataSource.getRepository(CashClosurePayment);
  private readonly saleService = new SaleService();

  private async buildSummary(dto: CreateCashClosureDto): Promise<{
    startDate: Date;
    endDate: Date;
    filterPaymentMethod: string | null;
    subtotal: string;
    ivaAmount: string;
    total: string;
    salesCount: number;
    payments: Array<{ paymentMethod: string; total: string; salesCount: number }>;
  }> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new HttpError(400, "Invalid startDate or endDate");
    }

    const sales = await this.saleService.getSalesInRange(startDate, endDate);
    const filteredSales = dto.paymentMethod
      ? sales.filter((sale) =>
          sale.payments.some((payment) => payment.paymentMethod === dto.paymentMethod?.toUpperCase())
        )
      : sales;

    const subtotal = roundMoney(filteredSales.reduce((sum, sale) => sum + Number(sale.subtotal), 0));
    const ivaAmount = roundMoney(filteredSales.reduce((sum, sale) => sum + Number(sale.ivaAmount), 0));
    const total = roundMoney(filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0));

    const paymentTotals = new Map<string, { total: number; salesCount: number }>();

    for (const sale of filteredSales) {
      for (const payment of sale.payments) {
        if (dto.paymentMethod && payment.paymentMethod !== dto.paymentMethod.toUpperCase()) {
          continue;
        }

        const current = paymentTotals.get(payment.paymentMethod) ?? { total: 0, salesCount: 0 };
        current.total = roundMoney(current.total + Number(payment.amount));
        current.salesCount += 1;
        paymentTotals.set(payment.paymentMethod, current);
      }
    }

    return {
      startDate,
      endDate,
      filterPaymentMethod: dto.paymentMethod?.toUpperCase() ?? null,
      subtotal: money(subtotal),
      ivaAmount: money(ivaAmount),
      total: money(total),
      salesCount: filteredSales.length,
      payments: Array.from(paymentTotals.entries()).map(([paymentMethod, values]) => ({
        paymentMethod,
        total: money(values.total),
        salesCount: values.salesCount
      }))
    };
  }

  async summarize(dto: CreateCashClosureDto): Promise<{
    startDate: Date;
    endDate: Date;
    filterPaymentMethod: string | null;
    subtotal: string;
    ivaAmount: string;
    total: string;
    salesCount: number;
    payments: Array<{ paymentMethod: string; total: string; salesCount: number }>;
  }> {
    return this.buildSummary(dto);
  }

  async create(dto: CreateCashClosureDto): Promise<CashClosure> {
    const summary = await this.buildSummary(dto);

    const closure = this.repository.create();
    closure.startDate = summary.startDate;
    closure.endDate = summary.endDate;
    closure.filterPaymentMethod = (summary.filterPaymentMethod ?? null) as unknown as string;
    closure.subtotal = summary.subtotal;
    closure.ivaAmount = summary.ivaAmount;
    closure.total = summary.total;
    closure.salesCount = summary.salesCount;

    const savedClosure = await this.repository.save(closure);

    const payments = summary.payments.map((payment) => {
      const paymentEntity = this.paymentRepository.create();
      paymentEntity.cashClosure = savedClosure;
      paymentEntity.cashClosureId = savedClosure.id;
      paymentEntity.paymentMethod = payment.paymentMethod;
      paymentEntity.total = payment.total;
      paymentEntity.salesCount = payment.salesCount;
      return paymentEntity;
    });

    await this.paymentRepository.save(payments);

    return this.repository.findOneOrFail({
      where: { id: savedClosure.id },
      relations: { payments: true }
    });
  }

  async list(): Promise<CashClosure[]> {
    return this.repository.find({
      relations: { payments: true },
      order: { id: "DESC" }
    });
  }
}
