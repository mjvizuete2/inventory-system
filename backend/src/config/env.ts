import dotenv from "dotenv";

dotenv.config();

const requiredKeys = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "JWT_SECRET",
  "SRI_RUC",
  "SRI_BUSINESS_NAME",
  "SRI_ESTABLISHMENT_ADDRESS",
  "SRI_ESTABLISHMENT_CODE",
  "SRI_EMISSION_POINT",
  "SRI_HEADQUARTERS_ADDRESS"
] as const;

for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT!),
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "12h"
  },
  sri: {
    environment: process.env.SRI_ENVIRONMENT ?? "1",
    emissionType: process.env.SRI_EMISSION_TYPE ?? "1",
    ruc: process.env.SRI_RUC!,
    businessName: process.env.SRI_BUSINESS_NAME!,
    commercialName: process.env.SRI_COMMERCIAL_NAME ?? process.env.SRI_BUSINESS_NAME!,
    establishmentAddress: process.env.SRI_ESTABLISHMENT_ADDRESS!,
    establishmentCode: process.env.SRI_ESTABLISHMENT_CODE!,
    emissionPoint: process.env.SRI_EMISSION_POINT!,
    headquartersAddress: process.env.SRI_HEADQUARTERS_ADDRESS!,
    certificatePemBase64: process.env.SRI_CERTIFICATE_PEM_BASE64 ?? "",
    privateKeyPemBase64: process.env.SRI_PRIVATE_KEY_PEM_BASE64 ?? "",
    receiptWsdl: process.env.SRI_SOAP_RECEIPT_URL ?? "",
    authorizationWsdl: process.env.SRI_SOAP_AUTH_URL ?? ""
  }
};
