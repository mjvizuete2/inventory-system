import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { CashClosure } from "./CashClosure";

@Entity("cash_closure_payments")
export class CashClosurePayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CashClosure, (cashClosure) => cashClosure.payments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cash_closure_id" })
  cashClosure!: CashClosure;

  @Column({ name: "cash_closure_id", type: "int" })
  cashClosureId!: number;

  @Column({ name: "payment_method", length: 30 })
  paymentMethod!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total!: string;

  @Column({ name: "sales_count", type: "int" })
  salesCount!: number;
}
