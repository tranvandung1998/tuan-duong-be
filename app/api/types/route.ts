import type { NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    let result;

    if (category) {
      const categoryRes = await pool.query(
        'SELECT id FROM categories WHERE name = $1',
        [category]
      );
      if (categoryRes.rowCount === 0) {
        return new Response(JSON.stringify({ error: 'Category not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const category_id = categoryRes.rows[0].id;
      result = await pool.query('SELECT * FROM types WHERE category_id = $1', [category_id]);
    } else {
      result = await pool.query('SELECT * FROM types');
    }

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('GET error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, category_id } = await req.json();

    if (!name || !category_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: name or category_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const catRes = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (catRes.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await pool.query('INSERT INTO types(name, category_id) VALUES($1, $2)', [name, category_id]);

    return new Response(JSON.stringify({ message: 'Type created' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('POST error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
