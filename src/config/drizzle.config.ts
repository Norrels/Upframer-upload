import "dotenv/config";
import { config } from "../../env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/infrastructure/adapters/out/persistence/drizzle",
  schema: "./src/infrastructure/adapters/out/persistence/schemas/*",
  dialect: "postgresql",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
