import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("school_stock_db", {
  migrations: "./migrations",
});
