import pool from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  let result;
  if (type) {
    const typeRes = await pool.query('SELECT id FROM types WHERE name = $1', [type]);
    if (typeRes.rowCount === 0) return Response.json({ error: 'Type not found' }, { status: 404 });
    const type_id = typeRes.rows[0].id;
    result = await pool.query('SELECT * FROM products WHERE type_id = $1', [type_id]);
  } else {
    result = await pool.query('SELECT * FROM products');
  }
  return Response.json(result.rows);
}

export async function POST(req: Request) {
  const { name, price, image, description, type_name } = await req.json();
  const typeRes = await pool.query('SELECT id FROM types WHERE name = $1', [type_name]);
  if (typeRes.rowCount === 0) return Response.json({ error: 'Type not found' }, { status: 404 });
  const type_id = typeRes.rows[0].id;
await pool.query(
  'INSERT INTO products(name, price, image, type_id) VALUES($1, $2, $3, $4)',
  [name, price, image, type_id]
);

  return Response.json({ message: 'Product created' });
}

