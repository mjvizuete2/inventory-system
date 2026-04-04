import express from "express";
import { authRoutes } from "./routes/auth.routes";
import { cashClosureRoutes } from "./routes/cash-closure.routes";
import { clientRoutes } from "./routes/client.routes";
import { invoiceRoutes } from "./routes/invoice.routes";
import { productRoutes } from "./routes/product.routes";
import { saleRoutes } from "./routes/sale.routes";
import { errorHandler } from "./middlewares/error-handler";

export const app = express();

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/cash-closures", cashClosureRoutes);

app.use(errorHandler);
