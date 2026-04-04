import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Category } from "./Category";
import { SaleItem } from "./SaleItem";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 40 })
  sku!: string;

  @Column({ length: 150 })
  name!: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @Column({ name: "category_id", type: "int" })
  categoryId!: number;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "varchar", nullable: true, length: 150 })
  provider!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price!: string;

  @Column({ type: "int", default: 0 })
  stock!: number;

  @Column({ name: "iva_rate", type: "decimal", precision: 5, scale: 2, default: "12.00" })
  ivaRate!: string;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.product)
  saleItems!: SaleItem[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
