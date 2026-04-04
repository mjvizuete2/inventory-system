import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Client } from "./Client";
import { SaleItem } from "./SaleItem";
import { SalePayment } from "./SalePayment";
import { SRIInvoice } from "./SRIInvoice";

@Entity("sales")
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Client, (client) => client.sales, { nullable: true })
  @JoinColumn({ name: "client_id" })
  client!: Client | null;

  @Column({ name: "client_id", type: "int", nullable: true })
  clientId!: number;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal!: string;

  @Column({ name: "iva_amount", type: "decimal", precision: 12, scale: 2 })
  ivaAmount!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total!: string;

  @Column({ name: "created_by", type: "varchar", length: 120, default: "system" })
  createdBy!: string;

  @Column({ type: "varchar", default: "COMPLETED", length: 30 })
  status!: string;

  @Column({ type: "text", nullable: true })
  notes!: string;

  @Column({ name: "sold_at", type: "datetime" })
  soldAt!: Date;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items!: SaleItem[];

  @OneToMany(() => SalePayment, (payment) => payment.sale, { cascade: true })
  payments!: SalePayment[];

  @OneToOne(() => SRIInvoice, (invoice) => invoice.sale)
  invoice!: SRIInvoice | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
