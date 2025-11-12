import pool from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET products
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let result;
    if (type) {
      const typeRes = await pool.query('SELECT id FROM types WHERE name = $1', [type]);
      if (typeRes.rowCount === 0) {
        return new Response(
          JSON.stringify({ error: 'Type not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const type_id = typeRes.rows[0].id;
      result = await pool.query('SELECT * FROM products WHERE type_id = $1', [type_id]);
    } else {
      result = await pool.query('SELECT * FROM products');
    }

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST create product
export async function POST(req: Request) {
  try {
    const { name, price, description, type_id, image_file_base64, image_filename } = await req.json();

    if (!name || !price || !type_id || !image_file_base64 || !image_filename) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Kiểm tra type_id tồn tại
    const typeRes = await pool.query('SELECT id FROM types WHERE id = $1', [type_id]);
    if (typeRes.rowCount === 0) {
      return new Response(
        JSON.stringify({ error: 'Type not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upload ảnh lên Supabase Storage
    const fileName = `${Date.now()}-${image_filename}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`products/${fileName}`, Buffer.from(image_file_base64, 'base64'), {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Image upload failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Lấy public URL
    const { data: publicData } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${fileName}`);

    const imageUrl = publicData.publicUrl; // chỉ khai báo 1 lần

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to get public URL' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Lưu vào DB
    await pool.query(
      'INSERT INTO products(name, price, image_url, description, type_id) VALUES($1, $2, $3, $4, $5)',
      [name, price, imageUrl, description || null, type_id]
    );

    return new Response(
      JSON.stringify({ message: 'Product created', image_url: imageUrl }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
