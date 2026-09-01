import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    seed: "ts-node prisma/seed.ts",
  },

  datasource: {
    // `prisma generate` does not connect to the database. Reading the value
    // directly lets clean CI/Vercel installs generate the client even before
    // runtime secrets are injected. Commands such as `db push` still require
    // DATABASE_URL and report that requirement themselves.
    url: process.env.DATABASE_URL ?? "",
  },
});
