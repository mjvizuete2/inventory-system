import { app } from "./app";
import { AppDataSource } from "./config/data-source";
import { env } from "./config/env";
import { prepareLegacySchema } from "./config/prepare-legacy-schema";
import { seedDatabase } from "./seed";

const bootstrap = async (): Promise<void> => {
  await prepareLegacySchema();
  await AppDataSource.initialize();
  await seedDatabase();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
