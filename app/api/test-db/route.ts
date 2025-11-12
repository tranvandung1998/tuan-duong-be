import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await pool.query('SELECT NOW() as now');
    return NextResponse.json({ postgres: res.rows[0].now });
  } catch (err) {
    
    console.error('Postgres connection error:', err);
    return NextResponse.json({ error: 'Postgres connection failed' }, { status: 500 });
  }
}
