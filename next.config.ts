import { supabase } from "@/lib/supabaseClient";


const allowedOrigins = ['http://localhost:3000', 'https://app-fe-tuan-duong.vercel.app/'];

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET() {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigins[0],
    },
  });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const { error } = await supabase.from('categories').insert([{ name }]);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ message: 'Category created' }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigins[0],
    },
  });
}
