import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase luôn cần SSL
});

export default pool;
