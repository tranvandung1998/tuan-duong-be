// import { Pool } from 'pg';

// const isProduction = process.env.NODE_ENV === 'production';

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: isProduction
//     ? { rejectUnauthorized: false }
//     : false,
// });

// export default pool;

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export default pool;

