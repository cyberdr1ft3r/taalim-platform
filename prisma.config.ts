import "dotenv/config";
import { defineConfig } from "prisma/config";

const localGenerateUrl = "postgresql://taalim:taalim@127.0.0.1:5432/taalim_dev";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || localGenerateUrl,
  },
});
