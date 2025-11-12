// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pool from '@/lib/db';

// Hàm helper tạo Supabase client tại runtime
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase env not defined');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET products
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let result;
    if (type) {
      const typeRes = await pool.query('SELECT id FROM types WHERE name = $1', [type]);
      if (typeRes.rowCount === 0) {
        return NextResponse.json({ error: 'Type not found' }, { status: 404 });
      }
      const type_id = typeRes.rows[0].id;
      result = await pool.query('SELECT * FROM products WHERE type_id = $1', [type_id]);
    } else {
      result = await pool.query('SELECT * FROM products');
    }

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('GET /products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create product
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const { name, price, description, type_id, image_file_base64, image_filename } = await req.json();

    if (!name || !price || !type_id || !image_file_base64 || !image_filename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Kiểm tra type_id tồn tại
    const typeRes = await pool.query('SELECT id FROM types WHERE id = $1', [type_id]);
    if (typeRes.rowCount === 0) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }

    // Upload ảnh lên Supabase Storage
    const fileName = `${Date.now()}-${image_filename}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`products/${fileName}`, Buffer.from(image_file_base64, 'base64'), {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }

    // Lấy public URL
    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(`products/${fileName}`);
    const publicURL = publicData?.publicUrl;
    if (!publicURL) {
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });
    }

    // Insert vào DB
    await pool.query(
      'INSERT INTO products(name, price, image_url, description, type_id) VALUES($1, $2, $3, $4, $5)',
      [name, price, publicURL, description || null, type_id]
    );

    return NextResponse.json({ message: 'Product created', image_url: publicURL }, { status: 201 });
  } catch (error: any) {
    console.error('POST /products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
