// app/api/products/route.ts
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeName = searchParams.get('type');

    let products;
    if (typeName) {
      // Lấy type_id theo name
      const { data: typeData, error: typeError } = await supabase
        .from('types')
        .select('id')
        .eq('name', typeName)
        .maybeSingle();

      if (typeError) throw typeError;
      if (!typeData) {
        return new Response(JSON.stringify({ error: 'Type not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Lấy sản phẩm theo type_id
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('type_id', typeData.id);

      if (prodError) throw prodError;
      products = prodData;
    } else {
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*');

      if (prodError) throw prodError;
      products = prodData;
    }

    return new Response(JSON.stringify(products || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('GET /api/products error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: Request) {
  try {
    const { name, price, image, description, type_id } = await req.json();

    if (!name || !price || !type_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, price or type_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Kiểm tra type_id tồn tại
    const { data: typeData, error: typeError } = await supabase
      .from('types')
      .select('id')
      .eq('id', type_id)
      .maybeSingle();

    if (typeError) throw typeError;
    if (!typeData) {
      return new Response(JSON.stringify({ error: 'Type not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Thêm sản phẩm
    const { error: insertError } = await supabase
      .from('products')
      .insert([{ name, price, image: image || null, description: description || null, type_id }]);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: 'Product created' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('POST /api/products error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
