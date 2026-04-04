import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Sale } from "./Sale";

@Entity("sri_invoices")
export class SRIInvoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Sale, (sale) => sale.invoice, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sale_id" })
  sale!: Sale;

  @Column({ name: "sale_id", type: "int", unique: true })
  saleId!: number;

  @Column({ length: 2, default: "01" })
  documentCode!: string;

  @Column({ length: 1 })
  environment!: string;

  @Column({ name: "emission_type", length: 1 })
  emissionType!: string;

  @Column({ name: "establishment_code", length: 3 })
  establishmentCode!: string;

  @Column({ name: "emission_point_code", length: 3 })
  emissionPointCode!: string;

  @Column({ length: 9 })
  sequential!: string;

  @Column({ name: "access_key", unique: true, length: 49 })
  accessKey!: string;

  @Column({ name: "xml_unsigned", type: "longtext" })
  xmlUnsigned!: string;

  @Column({ name: "xml_signed", type: "longtext" })
  xmlSigned!: string;

  @Column({ name: "receipt_status", default: "PENDING", length: 30 })
  receiptStatus!: string;

  @Column({ name: "receipt_message", type: "text", nullable: true })
  receiptMessage!: string;

  @Column({ name: "authorization_status", default: "PENDING", length: 30 })
  authorizationStatus!: string;

  @Column({ name: "authorization_number", type: "varchar", nullable: true, length: 60 })
  authorizationNumber!: string;

  @Column({ name: "authorization_date", nullable: true, type: "datetime" })
  authorizationDate!: Date;

  @Column({ name: "raw_response", type: "longtext", nullable: true })
  rawResponse!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
