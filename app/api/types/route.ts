// app/api/types/route.ts
import { supabase } from '@/lib/supabaseClient';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get('category');

    let types;
    if (categoryName) {
      // Lấy category_id
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .maybeSingle();

      if (catError) throw catError;
      if (!category) {
        return new Response(JSON.stringify({ error: 'Category not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: typesData, error: typeError } = await supabase
        .from('types')
        .select('*')
        .eq('category_id', category.id);

      if (typeError) throw typeError;
      types = typesData;
    } else {
      const { data: typesData, error: typeError } = await supabase
        .from('types')
        .select('*');

      if (typeError) throw typeError;
      types = typesData;
    }

    return new Response(JSON.stringify(types || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('GET /api/types error:', error.message, error.stack);
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

    // Kiểm tra category tồn tại
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .maybeSingle();

    if (catError) throw catError;
    if (!category) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Thêm type
    const { error: insertError } = await supabase
      .from('types')
      .insert([{ name, category_id }]);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: 'Type created' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('POST /api/types error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
