// lib/db.ts
import { Pool } from "pg";

declare global {
  // Thêm khai báo này để TS hiểu global._pgPool là gì
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

let pool: Pool;

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

pool = global._pgPool;

export default pool;
