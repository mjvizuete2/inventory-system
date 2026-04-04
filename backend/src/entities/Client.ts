import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Sale } from "./Sale";

@Entity("clients")
export class Client {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "document_type", length: 20 })
  documentType!: string;

  @Column({ unique: true, length: 20 })
  identification!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: "varchar", nullable: true, length: 150 })
  email!: string;

  @Column({ type: "varchar", nullable: true, length: 30 })
  phone!: string;

  @Column({ type: "varchar", nullable: true, length: 255 })
  address!: string;

  @OneToMany(() => Sale, (sale) => sale.client)
  sales!: Sale[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
