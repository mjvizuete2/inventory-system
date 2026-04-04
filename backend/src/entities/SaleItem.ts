import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Product } from "./Product";
import { Sale } from "./Sale";

@Entity("sale_items")
export class SaleItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sale_id" })
  sale!: Sale;

  @Column({ name: "sale_id", type: "int" })
  saleId!: number;

  @ManyToOne(() => Product, (product) => product.saleItems)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "product_id", type: "int" })
  productId!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "has_iva", type: "boolean", default: true })
  hasIva!: boolean;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal!: string;

  @Column({ name: "iva_amount", type: "decimal", precision: 12, scale: 2 })
  ivaAmount!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total!: string;
}
