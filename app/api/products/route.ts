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

// POST create product (nhận FormData)
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const formData = await req.formData();

    const name = formData.get('name')?.toString();
    const price = formData.get('price')?.toString();
    const description = formData.get('description')?.toString() || null;
    const type_id = Number(formData.get('type_id'));
    const imageFile = formData.get('image_file') as File | null;

    if (!name || !price || !type_id || !imageFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Kiểm tra type_id tồn tại
    const typeRes = await pool.query('SELECT id FROM types WHERE id = $1', [type_id]);
    if (typeRes.rowCount === 0) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }

    // Upload ảnh lên Supabase Storage
    const fileName = `${Date.now()}-${imageFile.name}`;
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`products/${fileName}`, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type,
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
      [name, price, publicURL, description, type_id]
    );

    return NextResponse.json({ message: 'Product created', image_url: publicURL }, { status: 201 });
  } catch (error: any) {
    console.error('POST /products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
