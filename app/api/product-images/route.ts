export const runtime = 'nodejs';

import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    console.log("▶️ Hit POST /api/product-images");

    const { product_name, image_url } = await req.json();

    if (!product_name || !image_url) {
      return Response.json({ error: 'Missing product_name or image_url' }, { status: 400 });
    }

    const prodRes = await pool.query('SELECT id FROM products WHERE name = $1', [product_name]);
    if (prodRes.rowCount === 0) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const product_id = prodRes.rows[0].id;

    await pool.query(
      'INSERT INTO product_images(product_id, url) VALUES($1, $2)',
      [product_id, image_url]
    );


    return Response.json({ message: 'Product image added successfully' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error adding product image:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
