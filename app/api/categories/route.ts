import pool from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // hoặc domain cụ thể
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Xử lý preflight request
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// GET all categories
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id DESC');
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('❌ GET categories error:', err.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// POST create category
export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await pool.query('INSERT INTO categories(name) VALUES($1)', [name]);

    return new Response(JSON.stringify({ message: 'Category created' }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('❌ POST category error:', err.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
