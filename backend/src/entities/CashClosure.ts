import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { CashClosurePayment } from "./CashClosurePayment";

@Entity("cash_closures")
export class CashClosure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "start_date", type: "datetime" })
  startDate!: Date;

  @Column({ name: "end_date", type: "datetime", nullable: true })
  endDate!: Date | null;

  @Column({ type: "varchar", length: 20, default: "OPEN" })
  status!: string;

  @Column({ name: "opened_by", type: "varchar", length: 120, default: "system" })
  openedBy!: string;

  @Column({ name: "closed_by", type: "varchar", length: 120, nullable: true })
  closedBy!: string | null;

  @Column({ name: "opening_amount", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  openingAmount!: string;

  @Column({ name: "closing_amount", type: "decimal", precision: 12, scale: 2, default: "0.00" })
  closingAmount!: string;

  @Column({ name: "filter_payment_method", type: "varchar", nullable: true, length: 30 })
  filterPaymentMethod!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal!: string;

  @Column({ name: "iva_amount", type: "decimal", precision: 12, scale: 2 })
  ivaAmount!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total!: string;

  @Column({ name: "sales_count", type: "int" })
  salesCount!: number;

  @OneToMany(() => CashClosurePayment, (payment) => payment.cashClosure, { cascade: true })
  payments!: CashClosurePayment[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
