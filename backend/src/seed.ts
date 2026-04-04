import bcrypt from "bcryptjs";
import { AppDataSource } from "./config/data-source";
import { Client } from "./entities/Client";
import { Product } from "./entities/Product";
import { User } from "./entities/User";

export const seedDatabase = async (): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);
  const clientRepository = AppDataSource.getRepository(Client);
  const productRepository = AppDataSource.getRepository(Product);

  if ((await userRepository.count()) === 0) {
    await userRepository.save(
      userRepository.create({
        name: "Administrador",
        email: "admin@inventar.local",
        passwordHash: await bcrypt.hash("Admin123*", 10),
        role: "admin"
      })
    );
  }

  if ((await clientRepository.count()) === 0) {
    await clientRepository.save([
      clientRepository.create({
        documentType: "CEDULA",
        identification: "1717171717",
        name: "Mariana Torres",
        email: "mariana@example.com",
        phone: "0991112233",
        address: "Quito Norte"
      }),
      clientRepository.create({
        documentType: "RUC",
        identification: "1790012345001",
        name: "Distribuidora Sierra SA",
        email: "compras@sierra.example.com",
        phone: "022334455",
        address: "Av. Amazonas y Colon"
      })
    ]);
  }

  if ((await productRepository.count()) === 0) {
    await productRepository.save([
      productRepository.create({
        sku: "PROD-001",
        name: "Laptop 14",
        description: "Equipo portatil 14 pulgadas",
        price: "799.00",
        stock: 10,
        ivaRate: "12.00",
        active: true
      }),
      productRepository.create({
        sku: "PROD-002",
        name: "Mouse inalambrico",
        description: "Mouse ergonomico",
        price: "25.00",
        stock: 50,
        ivaRate: "12.00",
        active: true
      }),
      productRepository.create({
        sku: "PROD-003",
        name: "Servicio instalacion",
        description: "Instalacion en sitio",
        price: "40.00",
        stock: 999,
        ivaRate: "12.00",
        active: true
      })
    ]);
  }
};

if (require.main === module) {
  AppDataSource.initialize()
    .then(seedDatabase)
    .then(async () => {
      await AppDataSource.destroy();
      console.log("Seed complete");
    })
    .catch(async (error) => {
      console.error("Seed failed", error);
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
      process.exit(1);
    });
}
