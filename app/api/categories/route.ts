import pool from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // có thể đổi thành domain FE cụ thể cho an toàn
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
    // In ra connection string (ẩn password) để chắc chắn env đang tồn tại
    console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL?.replace(/:.+@/, ':****@'));

    const result = await pool.query('SELECT * FROM categories ORDER BY id DESC');
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('❌ GET categories error:', err); // log full error
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// POST create category
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await pool.query(
      'INSERT INTO categories(name) VALUES($1) RETURNING *',
      [name]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('❌ POST category error:', err); // log full error
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
