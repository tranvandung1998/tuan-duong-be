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

export async function GET() {
  const result = await pool.query('SELECT * FROM categories');
  return new Response(JSON.stringify(result.rows), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  await pool.query('INSERT INTO categories(name) VALUES($1)', [name]);
  return new Response(JSON.stringify({ message: 'Category created' }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}