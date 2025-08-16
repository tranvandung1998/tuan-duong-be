// app/api/product-details/route.ts
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { product_name, detail, images } = await req.json();

    const prodRes = await pool.query(
      'SELECT id FROM products WHERE name = $1',
      [product_name]
    );

    if (prodRes.rowCount === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const product_id = prodRes.rows[0].id;

    await pool.query(
      'INSERT INTO product_details(product_id, detail, images) VALUES($1, $2, $3)',
      [product_id, detail, images]
    );

    return Response.json({ message: 'Product detail created' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
