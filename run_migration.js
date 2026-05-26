const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

const connectionString = 'postgresql://postgres:Selfdiscovery0680!@@db.wzwqtgcoezkblkhsggbg.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database!");

    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '00000000000000_init.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log("Running migration script...");
    await client.query(sql);

    console.log("Migration applied successfully! Tables created.");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

runMigration();
