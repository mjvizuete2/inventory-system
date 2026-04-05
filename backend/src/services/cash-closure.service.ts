import { AppDataSource } from "../config/data-source";
import { CashClosureSummaryDto, CloseCashClosureDto, OpenCashClosureDto } from "../dto/cash-closure.dto";
import { CashClosure } from "../entities/CashClosure";
import { CashClosurePayment } from "../entities/CashClosurePayment";
import { HttpError } from "../utils/http-error";
import { money, roundMoney } from "../utils/math";
import { serializeCashClosure, serializeCashClosureSummary } from "../utils/serializers";
import { SaleService } from "./sale.service";

type CashClosureSummary = {
  startDate: Date;
  endDate: Date;
  filterPaymentMethod: string | null;
  subtotal: string;
  ivaAmount: string;
  total: string;
  salesCount: number;
  payments: Array<{ paymentMethod: string; total: string; salesCount: number }>;
};

export class CashClosureService {
  private readonly repository = AppDataSource.getRepository(CashClosure);
  private readonly paymentRepository = AppDataSource.getRepository(CashClosurePayment);
  private readonly saleService = new SaleService();

  private async acquireStateLock(): Promise<ReturnType<typeof AppDataSource.createQueryRunner>> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    const result = await queryRunner.query("SELECT GET_LOCK('cash_box_state', 10) AS acquired");
    if (!result?.[0]?.acquired) {
      await queryRunner.release();
      throw new HttpError(409, "Cash box is busy");
    }

    return queryRunner;
  }

  private async releaseStateLock(queryRunner: ReturnType<typeof AppDataSource.createQueryRunner>): Promise<void> {
    try {
      await queryRunner.query("DO RELEASE_LOCK('cash_box_state')");
    } finally {
      await queryRunner.release();
    }
  }

  private async buildSummary(dto: CashClosureSummaryDto): Promise<CashClosureSummary> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new HttpError(400, "Invalid startDate or endDate");
    }

    const sales = await this.saleService.getSalesInRange(startDate, endDate);
    const normalizedPaymentMethod = dto.paymentMethod?.toUpperCase();
    const filteredSales = normalizedPaymentMethod
      ? sales.filter((sale) =>
          sale.payments.some((payment) => payment.paymentMethod === normalizedPaymentMethod)
        )
      : sales;

    const subtotal = roundMoney(filteredSales.reduce((sum, sale) => sum + Number(sale.subtotal), 0));
    const ivaAmount = roundMoney(filteredSales.reduce((sum, sale) => sum + Number(sale.ivaAmount), 0));
    const total = roundMoney(filteredSales.reduce((sum, sale) => sum + Number(sale.total), 0));

    const paymentTotals = new Map<string, { total: number; salesCount: number }>();

    for (const sale of filteredSales) {
      for (const payment of sale.payments) {
        if (normalizedPaymentMethod && payment.paymentMethod !== normalizedPaymentMethod) {
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
      filterPaymentMethod: normalizedPaymentMethod ?? null,
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

  private getCashTotal(summary: CashClosureSummary): number {
    return roundMoney(Number(summary.payments.find((payment) => payment.paymentMethod === "CASH")?.total ?? 0));
  }

  async summarize(dto: CashClosureSummaryDto): Promise<ReturnType<typeof serializeCashClosureSummary>> {
    return serializeCashClosureSummary(await this.buildSummary(dto));
  }

  async getCurrent(): Promise<(
    Omit<ReturnType<typeof serializeCashClosureSummary>, "startDate" | "endDate"> & {
      id: number;
      startDate: Date;
      endDate: Date | null;
    }
  ) | null> {
    const currentClosure = await this.repository.findOne({
      where: { status: "OPEN" },
      relations: { payments: true },
      order: { id: "DESC" }
    });

    if (!currentClosure) {
      return null;
    }

    const summary = await this.buildSummary({
      startDate: currentClosure.startDate.toISOString(),
      endDate: new Date().toISOString()
    });
    const serializedSummary = serializeCashClosureSummary({
      ...summary,
      openingAmount: currentClosure.openingAmount,
      closingAmount: money(roundMoney(Number(currentClosure.openingAmount) + this.getCashTotal(summary))),
      status: currentClosure.status,
      openedBy: currentClosure.openedBy,
      closedBy: currentClosure.closedBy
    });

    return {
      id: currentClosure.id,
      filterPaymentMethod: serializedSummary.filterPaymentMethod,
      openingAmount: serializedSummary.openingAmount,
      closingAmount: serializedSummary.closingAmount,
      status: serializedSummary.status,
      openedBy: serializedSummary.openedBy,
      closedBy: serializedSummary.closedBy,
      subtotal: serializedSummary.subtotal,
      ivaAmount: serializedSummary.ivaAmount,
      total: serializedSummary.total,
      salesCount: serializedSummary.salesCount,
      payments: serializedSummary.payments,
      startDate: currentClosure.startDate,
      endDate: currentClosure.endDate
    };
  }

  async open(dto: OpenCashClosureDto, openedBy: string): Promise<ReturnType<typeof serializeCashClosure>> {
    const queryRunner = await this.acquireStateLock();
    await queryRunner.startTransaction();

    try {
      const existingOpen = await queryRunner.manager.findOne(CashClosure, {
        where: { status: "OPEN" },
        order: { id: "DESC" }
      });
      if (existingOpen) {
        throw new HttpError(409, "There is already an open cash box");
      }

      const openingAmount = money(roundMoney(dto.openingAmount));
      const closure = queryRunner.manager.create(CashClosure);
      closure.startDate = new Date();
      closure.endDate = null;
      closure.status = "OPEN";
      closure.openedBy = openedBy;
      closure.closedBy = null;
      closure.openingAmount = openingAmount;
      closure.closingAmount = openingAmount;
      closure.filterPaymentMethod = null;
      closure.subtotal = money(0);
      closure.ivaAmount = money(0);
      closure.total = money(0);
      closure.salesCount = 0;

      const savedClosure = await queryRunner.manager.save(closure);
      await queryRunner.commitTransaction();

      const populatedClosure = await this.repository.findOneOrFail({
        where: { id: savedClosure.id },
        relations: { payments: true }
      });

      return serializeCashClosure(populatedClosure);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await this.releaseStateLock(queryRunner);
    }
  }

  async close(
    dto: CloseCashClosureDto,
    closedBy: string
  ): Promise<{
    closedClosure: ReturnType<typeof serializeCashClosure>;
    currentClosure: (ReturnType<typeof serializeCashClosure> | null);
  }> {
    const queryRunner = await this.acquireStateLock();
    await queryRunner.startTransaction();

    try {
      const openClosure = await queryRunner.manager.findOne(CashClosure, {
        where: { status: "OPEN" },
        relations: { payments: true },
        order: { id: "DESC" }
      });

      if (!openClosure) {
        throw new HttpError(404, "There is no open cash box");
      }

      const endDate = new Date();
      const summary = await this.buildSummary({
        startDate: openClosure.startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      openClosure.endDate = endDate;
      openClosure.status = "CLOSED";
      openClosure.closedBy = closedBy;
      openClosure.filterPaymentMethod = null;
      openClosure.subtotal = summary.subtotal;
      openClosure.ivaAmount = summary.ivaAmount;
      openClosure.total = summary.total;
      openClosure.salesCount = summary.salesCount;
      openClosure.closingAmount = money(roundMoney(Number(openClosure.openingAmount) + this.getCashTotal(summary)));

      await queryRunner.manager.save(openClosure);
      await queryRunner.manager.delete(CashClosurePayment, { cashClosureId: openClosure.id });

      if (summary.payments.length > 0) {
        const payments = summary.payments.map((payment) =>
          queryRunner.manager.create(CashClosurePayment, {
            cashClosure: openClosure,
            cashClosureId: openClosure.id,
            paymentMethod: payment.paymentMethod,
            total: payment.total,
            salesCount: payment.salesCount
          })
        );
        await queryRunner.manager.save(payments);
      }

      let newOpenClosure: CashClosure | null = null;
      if (dto.reopen) {
        const nextOpeningAmount = money(roundMoney(dto.nextOpeningAmount ?? 0));
        newOpenClosure = queryRunner.manager.create(CashClosure);
        newOpenClosure.startDate = endDate;
        newOpenClosure.endDate = null;
        newOpenClosure.status = "OPEN";
        newOpenClosure.openedBy = closedBy;
        newOpenClosure.closedBy = null;
        newOpenClosure.openingAmount = nextOpeningAmount;
        newOpenClosure.closingAmount = nextOpeningAmount;
        newOpenClosure.filterPaymentMethod = null;
        newOpenClosure.subtotal = money(0);
        newOpenClosure.ivaAmount = money(0);
        newOpenClosure.total = money(0);
        newOpenClosure.salesCount = 0;
        newOpenClosure = await queryRunner.manager.save(newOpenClosure);
      }

      await queryRunner.commitTransaction();

      const populatedClosedClosure = await this.repository.findOneOrFail({
        where: { id: openClosure.id },
        relations: { payments: true }
      });

      const populatedOpenClosure = newOpenClosure
        ? await this.repository.findOneOrFail({
            where: { id: newOpenClosure.id },
            relations: { payments: true }
          })
        : null;

      return {
        closedClosure: serializeCashClosure(populatedClosedClosure),
        currentClosure: populatedOpenClosure ? serializeCashClosure(populatedOpenClosure) : null
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await this.releaseStateLock(queryRunner);
    }
  }

  async list(): Promise<Array<ReturnType<typeof serializeCashClosure>>> {
    const closures = await this.repository.find({
      where: { status: "CLOSED" },
      relations: { payments: true },
      order: { id: "DESC" }
    });

    return closures.map(serializeCashClosure);
  }
}
