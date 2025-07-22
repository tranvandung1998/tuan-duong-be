import pool from '@/lib/db';

export async function GET() {
  const result = await pool.query('SELECT * FROM categories');
  return Response.json(result.rows);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  await pool.query('INSERT INTO categories(name) VALUES($1)', [name]);
  return Response.json({ message: 'Category created' });
}