import "reflect-metadata";
import { DataSource } from "typeorm";
import { CashClosure } from "../entities/CashClosure";
import { CashClosurePayment } from "../entities/CashClosurePayment";
import { Client } from "../entities/Client";
import { DocumentSequence } from "../entities/DocumentSequence";
import { Product } from "../entities/Product";
import { Sale } from "../entities/Sale";
import { SaleItem } from "../entities/SaleItem";
import { SalePayment } from "../entities/SalePayment";
import { SRIInvoice } from "../entities/SRIInvoice";
import { User } from "../entities/User";
import { env } from "./env";

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: env.db.host,
  port: env.db.port,
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  synchronize: true,
  logging: false,
  entities: [
    User,
    Client,
    Product,
    Sale,
    SaleItem,
    SalePayment,
    SRIInvoice,
    DocumentSequence,
    CashClosure,
    CashClosurePayment
  ]
});
