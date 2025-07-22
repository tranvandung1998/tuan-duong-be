import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get('name');

    if (!productName) {
      return new Response(JSON.stringify({ error: 'Missing product name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prodRes = await pool.query('SELECT * FROM products WHERE name = $1', [productName]);

    if (prodRes.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const product = prodRes.rows[0];

    // ✅ Đổi "image" thành đúng tên cột là "url"
    const imgRes = await pool.query('SELECT url FROM product_images WHERE product_id = $1', [
      product.id,
    ]);

    const images = imgRes.rows.map((row) => row.url);

    return new Response(JSON.stringify({ ...product, images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in GET /api/full-detail:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
