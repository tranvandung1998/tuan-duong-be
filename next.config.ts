import pool from '@/lib/db';

const allowedOrigins = ['http://localhost:3000', 'https://yourdomain.com'];

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins[0], // hoặc '*'
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET() {
  const result = await pool.query('SELECT * FROM categories');
  return new Response(JSON.stringify(result.rows), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigins[0], // hoặc '*'
    },
  });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  await pool.query('INSERT INTO categories(name) VALUES($1)', [name]);

  return new Response(JSON.stringify({ message: 'Category created' }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigins[0], // hoặc '*'
    },
  });
}
