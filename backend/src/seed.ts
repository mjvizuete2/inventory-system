import { AppDataSource } from "./config/data-source";
import { Category } from "./entities/Category";
import { Client } from "./entities/Client";
import { Product } from "./entities/Product";
import { User } from "./entities/User";

export const seedDatabase = async (): Promise<void> => {
  const userRepository = AppDataSource.getRepository(User);
  const categoryRepository = AppDataSource.getRepository(Category);
  const clientRepository = AppDataSource.getRepository(Client);
  const productRepository = AppDataSource.getRepository(Product);
  const adminPasswordHash = "$2a$10$y2ZAZz4W2b/YlhbHBqsvM.QWao4kOR94qPWFur0lVBXN.oPr62r5.";

  const adminUser = await userRepository.findOne({
    where: { email: "admin@inventar.local" }
  });

  if (!adminUser) {
    await userRepository.save(
      userRepository.create({
        name: "Administrador",
        email: "admin@inventar.local",
        passwordHash: adminPasswordHash,
        role: "admin"
      })
    );
  } else {
    adminUser.name = "Administrador";
    adminUser.passwordHash = adminPasswordHash;
    adminUser.role = "admin";
    await userRepository.save(adminUser);
  }

  const seedCategories = [
    { name: "General", description: "Categoria generica para productos existentes", active: true },
    { name: "Tecnologia", description: "Equipos y accesorios", active: true },
    { name: "Accesorios", description: "Perifericos y consumibles", active: true },
    { name: "Servicios", description: "Servicios facturables", active: true }
  ];

  for (const categoryData of seedCategories) {
    const existingCategory = await categoryRepository.findOne({
      where: { name: categoryData.name }
    });

    if (existingCategory) {
      Object.assign(existingCategory, categoryData);
      await categoryRepository.save(existingCategory);
      continue;
    }

    await categoryRepository.save(categoryRepository.create(categoryData));
  }

  const categories = await categoryRepository.find();
  const general = categories.find((category) => category.name === "General");
  const tecnologia = categories.find((category) => category.name === "Tecnologia");
  const accesorios = categories.find((category) => category.name === "Accesorios");
  const servicios = categories.find((category) => category.name === "Servicios");

  const seedClients = [
    {
      documentType: "CEDULA",
      identification: "1717171717",
      name: "Mariana Torres",
      email: "mariana@example.com",
      phone: "0991112233",
      address: "Quito Norte"
    },
    {
      documentType: "RUC",
      identification: "1790012345001",
      name: "Distribuidora Sierra SA",
      email: "compras@sierra.example.com",
      phone: "0223344556",
      address: "Av. Amazonas y Colon"
    }
  ];

  for (const clientData of seedClients) {
    const existingClient = await clientRepository.findOne({
      where: { identification: clientData.identification }
    });

    if (existingClient) {
      Object.assign(existingClient, clientData);
      await clientRepository.save(existingClient);
      continue;
    }

    await clientRepository.save(clientRepository.create(clientData));
  }

  const seedProducts = [
    {
      sku: "PROD-001",
      name: "Laptop 14",
      category: tecnologia ?? general!,
      categoryId: (tecnologia ?? general!)!.id,
      description: "Equipo portatil 14 pulgadas",
      provider: "Inventar",
      price: "799.00",
      stock: 10,
      ivaRate: "12.00",
      active: true
    },
    {
      sku: "PROD-002",
      name: "Mouse inalambrico",
      category: accesorios ?? general!,
      categoryId: (accesorios ?? general!)!.id,
      description: "Mouse ergonomico",
      provider: "Inventar",
      price: "25.00",
      stock: 50,
      ivaRate: "12.00",
      active: true
    },
    {
      sku: "PROD-003",
      name: "Servicio instalacion",
      category: servicios ?? general!,
      categoryId: (servicios ?? general!)!.id,
      description: "Instalacion en sitio",
      provider: "Inventar",
      price: "40.00",
      stock: 999,
      ivaRate: "12.00",
      active: true
    }
  ];

  for (const productData of seedProducts) {
    const existingProduct = await productRepository.findOne({
      where: { sku: productData.sku },
      relations: { category: true }
    });

    if (existingProduct) {
      Object.assign(existingProduct, productData);
      await productRepository.save(existingProduct);
      continue;
    }

    await productRepository.save(productRepository.create(productData));
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
