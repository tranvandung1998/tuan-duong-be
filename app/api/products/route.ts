import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    let result;
    if (type) {
      const typeRes = await pool.query('SELECT id FROM types WHERE name = $1', [type]);
      if (typeRes.rowCount === 0) {
        return new Response(JSON.stringify({ error: 'Type not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      const type_id = typeRes.rows[0].id;
      result = await pool.query('SELECT * FROM products WHERE type_id = $1', [type_id]);
    } else {
      result = await pool.query('SELECT * FROM products');
    }
    return new Response(JSON.stringify(result.rows), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('GET error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(req: Request) {
  try {
    const { name, price, image, description, type_id } = await req.json();

    // Validate bắt buộc
    if (!name || !price || !type_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, price or type_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Kiểm tra type_id tồn tại
    const typeRes = await pool.query('SELECT id FROM types WHERE id = $1', [type_id]);
    if (typeRes.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Type not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    await pool.query(
      'INSERT INTO products(name, price, image, description, type_id) VALUES($1, $2, $3, $4, $5)',
      [name, price, image || null, description || null, type_id]
    );

    return new Response(JSON.stringify({ message: 'Product created' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('POST error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
