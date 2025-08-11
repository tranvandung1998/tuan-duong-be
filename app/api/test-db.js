import pool from '@/lib/db';

export async function GET() {
  try {
    const res = await pool.query('SELECT NOW()');
    return new Response(JSON.stringify({ now: res.rows[0].now }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DB connection error:', error);
    return new Response(JSON.stringify({ error: 'DB connection failed', detail: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
