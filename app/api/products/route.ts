import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pool from '@/lib/db';
import { QueryResult } from 'pg';

// --- Supabase client ---
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase env not defined');

  return createClient(supabaseUrl, supabaseKey);
}

// Typed row interfaces
interface ProductRow {
  id: number;
  name: string;
  price: number;
  description: string | null;
  type_id: number;
}

interface ProductImageRow {
  id: number;
  product_id: number;
  url: string;
}

// ====================== POST /products ======================
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get('name')?.toString();
    const priceRaw = formData.get('price')?.toString();
    const type_idRaw = formData.get('type_id')?.toString();
    const description = formData.get('description')?.toString() || null;
    const imageFiles = formData.getAll('image') as File[];

    // Validate
    if (!name || !priceRaw || !type_idRaw || !imageFiles.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const price = Number(priceRaw);
    const type_id = Number(type_idRaw);
    if (isNaN(price) || isNaN(type_id)) {
      return NextResponse.json({ error: 'Invalid number format' }, { status: 400 });
    }

    // Kiểm tra type tồn tại
    const typeRes: QueryResult<{ id: number }> = await pool.query('SELECT id FROM types WHERE id = $1', [type_id]);
    if (typeRes.rowCount === 0) return NextResponse.json({ error: 'Type not found' }, { status: 404 });

    // Kiểm tra tên sản phẩm trùng
    const nameCheck: QueryResult<ProductRow> = await pool.query('SELECT id FROM products WHERE name = $1', [name]);
    if ((nameCheck.rowCount || 0) > 0) {
      return NextResponse.json({ error: 'Product name already exists' }, { status: 400 });
    }


    const uploadedURLs: string[] = [];

    // Upload từng file lên Supabase
    for (const file of imageFiles) {
      const fileName = `${Date.now()}-${file.name}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`products/${fileName}`, buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
      }

      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${fileName}`);

      if (!publicData?.publicUrl) return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 });

      uploadedURLs.push(publicData.publicUrl);
    }

    // Lưu sản phẩm
    const productRes: QueryResult<ProductRow> = await pool.query(
      'INSERT INTO products(name, price, description, type_id) VALUES($1, $2, $3, $4) RETURNING id',
      [name, price, description, type_id]
    );

    const productId = productRes.rows[0].id;

    // Lưu ảnh vào product_images
    for (const url of uploadedURLs) {
      await pool.query(
        'INSERT INTO product_images(product_id, url) VALUES($1, $2)',
        [productId, url]
      );
    }

    return NextResponse.json({ message: 'Product created', image_urls: uploadedURLs }, { status: 201 });
  } catch (error: any) {
    console.error('POST /products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ====================== GET /products ======================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name"); // ?name=xxx

    let query = `
      SELECT p.*, ARRAY_AGG(pi.url) AS images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
    `;
    const params: any[] = [];

    if (name) {
      query += ` WHERE p.name ILIKE $1`;
      params.push(`%${name}%`);
    }

    query += ` GROUP BY p.id ORDER BY p.id DESC`;

    const res: QueryResult<ProductRow & { images: string[] }> = await pool.query(query, params);
    return NextResponse.json({ data: res.rows });
  } catch (error: any) {
    console.error("GET /products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
