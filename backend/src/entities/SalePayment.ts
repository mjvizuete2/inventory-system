import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Sale } from "./Sale";

@Entity("sale_payments")
export class SalePayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sale_id" })
  sale!: Sale;

  @Column({ name: "sale_id", type: "int" })
  saleId!: number;

  @Column({ name: "payment_method", length: 30 })
  paymentMethod!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: "varchar", nullable: true, length: 120 })
  reference!: string;
}
