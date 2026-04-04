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

  @Column({ name: "end_date", type: "datetime" })
  endDate!: Date;

  @Column({ name: "filter_payment_method", type: "varchar", nullable: true, length: 30 })
  filterPaymentMethod!: string;

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
