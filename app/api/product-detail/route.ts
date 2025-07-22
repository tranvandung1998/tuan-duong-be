import pool from '@/lib/db';
export async function POST(req: Request) {
  const { product_name, detail } = await req.json();
  const prodRes = await pool.query('SELECT id FROM products WHERE name = $1', [product_name]);
  if (prodRes.rowCount === 0) return Response.json({ error: 'Product not found' }, { status: 404 });
  const product_id = prodRes.rows[0].id;
  await pool.query('INSERT INTO product_details(product_id, detail) VALUES($1, $2)', [product_id, detail]);
  return Response.json({ message: 'Product detail created' });
}