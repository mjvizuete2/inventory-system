import { CashClosure } from "../entities/CashClosure";
import { Product } from "../entities/Product";
import { Sale } from "../entities/Sale";

const toNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

export const serializeProduct = (product: Product) => ({
  ...product,
  price: toNumber(product.price),
  ivaRate: toNumber(product.ivaRate)
});

export const serializeSale = (sale: Sale) => ({
  ...sale,
  subtotal: toNumber(sale.subtotal),
  ivaAmount: toNumber(sale.ivaAmount),
  total: toNumber(sale.total),
  items: sale.items.map((item) => ({
    ...item,
    unitPrice: toNumber(item.unitPrice),
    subtotal: toNumber(item.subtotal),
    ivaAmount: toNumber(item.ivaAmount),
    total: toNumber(item.total),
    product: item.product
      ? {
          ...item.product,
          price: toNumber(item.product.price),
          ivaRate: toNumber(item.product.ivaRate)
        }
      : item.product
  })),
  payments: sale.payments.map((payment) => ({
    ...payment,
    amount: toNumber(payment.amount),
    receivedAmount: toNumber(payment.receivedAmount),
    changeAmount: toNumber(payment.changeAmount)
  }))
});

export const serializeCashClosure = (closure: CashClosure) => ({
  ...closure,
  subtotal: toNumber(closure.subtotal),
  ivaAmount: toNumber(closure.ivaAmount),
  total: toNumber(closure.total),
  payments: closure.payments.map((payment) => ({
    ...payment,
    total: toNumber(payment.total)
  }))
});

export const serializeCashClosureSummary = (summary: {
  startDate: Date;
  endDate: Date;
  filterPaymentMethod: string | null;
  subtotal: string;
  ivaAmount: string;
  total: string;
  salesCount: number;
  payments: Array<{ paymentMethod: string; total: string; salesCount: number }>;
}) => ({
  ...summary,
  subtotal: toNumber(summary.subtotal),
  ivaAmount: toNumber(summary.ivaAmount),
  total: toNumber(summary.total),
  payments: summary.payments.map((payment) => ({
    ...payment,
    total: toNumber(payment.total)
  }))
});
