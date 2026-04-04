import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { env } from "./env";

const categoriesTableSql = `
  CREATE TABLE IF NOT EXISTS categories (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    active TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY IDX_categories_name (name)
  )
`;

export const prepareLegacySchema = async (): Promise<void> => {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.username,
    password: env.db.password,
    database: env.db.database
  });

  try {
    await connection.query(categoriesTableSql);

    const [existingGeneralCategories] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM categories WHERE name = ? LIMIT 1",
      ["General"]
    );

    let fallbackCategoryId = Number(existingGeneralCategories[0]?.id ?? 0);

    if (!fallbackCategoryId) {
      const [insertResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO categories (name, description, active) VALUES (?, ?, ?)",
        ["General", "Categoria generica para productos existentes", 1]
      );

      fallbackCategoryId = Number(insertResult.insertId);
    }

    const [productTables] = await connection.query<RowDataPacket[]>(
      `
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
        LIMIT 1
      `,
      [env.db.database]
    );

    if (!productTables[0]) {
      return;
    }

    const [categoryColumns] = await connection.query<RowDataPacket[]>(
      `
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'category_id'
        LIMIT 1
      `,
      [env.db.database]
    );

    if (!categoryColumns[0]) {
      return;
    }

    await connection.query(
      `
        UPDATE products p
        LEFT JOIN categories c ON c.id = p.category_id
        SET p.category_id = ?
        WHERE p.category_id IS NULL OR p.category_id <= 0 OR c.id IS NULL
      `,
      [fallbackCategoryId]
    );
  } finally {
    await connection.end();
  }
};
