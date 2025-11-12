import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    return NextResponse.json({ buckets });
  } catch (error) {
    console.error('Supabase connection error:', error);
    return NextResponse.json({ error: 'Supabase connection failed' }, { status: 500 });
  }
}
