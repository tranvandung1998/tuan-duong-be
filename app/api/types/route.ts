import pool from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  let result;

  if (category) {
    const categoryRes = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      [category]
    );
    if (categoryRes.rowCount === 0) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    const category_id = categoryRes.rows[0].id;
    result = await pool.query(
      'SELECT * FROM types WHERE category_id = $1',
      [category_id]
    );
  } else {
    result = await pool.query('SELECT * FROM types');
  }

  return Response.json(result.rows);
}

export async function POST(req: Request) {
  const { name, category_id } = await req.json();

  // Kiểm tra category_id hợp lệ
  const catRes = await pool.query(
    'SELECT id FROM categories WHERE id = $1',
    [category_id]
  );
  if (catRes.rowCount === 0) {
    return Response.json({ error: 'Category not found' }, { status: 404 });
  }

  // ✅ INSERT đúng cột category_id
  await pool.query(
    'INSERT INTO types(name, category_id) VALUES($1, $2)',
    [name, category_id]
  );

  return Response.json({ message: 'Type created' });
}
