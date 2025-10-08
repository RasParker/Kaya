
import { storage } from "./storage";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
  try {
    console.log("Running delivery_addresses table migration...");
    
    const migrationSQL = readFileSync(
      join(__dirname, "migrations", "001_create_delivery_addresses.sql"),
      "utf-8"
    );
    
    // Access the pool directly to run raw SQL
    const pool = (storage as any).pool;
    await pool.query(migrationSQL);
    
    console.log("✓ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
