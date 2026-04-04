import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";

@Entity("document_sequences")
@Unique(["documentCode", "establishmentCode", "emissionPointCode"])
export class DocumentSequence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "document_code", length: 4 })
  documentCode!: string;

  @Column({ name: "establishment_code", length: 3 })
  establishmentCode!: string;

  @Column({ name: "emission_point_code", length: 3 })
  emissionPointCode!: string;

  @Column({ name: "current_number", type: "int", default: 0 })
  currentNumber!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
