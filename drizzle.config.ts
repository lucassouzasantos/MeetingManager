import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",   // caminho para os schemas
  out: "./drizzle",               // pasta onde vão ficar as migrações
  dialect: "sqlite",              // usando SQLite
  dbCredentials: {
    url: "file:./sqlite.db",      // banco será criado aqui na raiz do projeto
  },
});

