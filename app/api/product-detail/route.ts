// import { NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';
// import pool from '@/lib/db';
// import { QueryResult } from 'pg';

// // --- Supabase client ---
// function getSupabaseClient() {
//   const supabaseUrl = process.env.SUPABASE_URL;
//   const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

//   if (!supabaseUrl || !supabaseKey) throw new Error('Supabase env not defined');

//   return createClient(supabaseUrl, supabaseKey);
// }

// // Typed row interfaces
// interface ProductDetailRow {
//   id: number;
//   product_id: number;
//   description: string | null;
//   images: string[] | null;
// }

// // ====================== POST /product-detail ======================
// export async function POST(req: Request) {
//   try {
//     const supabase = getSupabaseClient();

//     const contentType = req.headers.get('content-type') || '';
//     if (!contentType.includes('multipart/form-data')) {
//       return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
//     }

//     const formData = await req.formData();
//     const productIdRaw = formData.get('product_id')?.toString();
//     const description = formData.get('description')?.toString() || '';
//     const files = formData.getAll('images') as File[];

//     if (!productIdRaw) {
//       return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });
//     }

//     const product_id = Number(productIdRaw);
//     if (isNaN(product_id)) {
//       return NextResponse.json({ error: 'Invalid product_id' }, { status: 400 });
//     }

//     if (!files.length) {
//       return NextResponse.json({ error: 'No images uploaded' }, { status: 400 });
//     }

//     // Upload tối đa 10 ảnh
//     const uploadedURLs: (string | null)[] = Array(10).fill(null);

//     for (let i = 0; i < Math.min(files.length, 10); i++) {
//       const file = files[i];
//       const fileName = `detail-${Date.now()}-${file.name}`;
//       const buffer = Buffer.from(await file.arrayBuffer());

//       const { error: uploadError } = await supabase.storage
//         .from('product-images')
//         .upload(`details/${fileName}`, buffer, {
//           cacheControl: '3600',
//           upsert: false,
//           contentType: file.type,
//         });

//       if (uploadError) {
//         console.error('Supabase upload error:', uploadError);
//         return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
//       }

//       const { data: publicData } = supabase.storage
//         .from('product-images')
//         .getPublicUrl(`details/${fileName}`);

//       uploadedURLs[i] = publicData?.publicUrl || null;
//     }

//     // Lưu vào product_detail
//     const res: QueryResult<ProductDetailRow> = await pool.query(
//       `INSERT INTO product_detail (product_id, description, images)
//        VALUES ($1, $2, $3) RETURNING *`,
//       [product_id, description, JSON.stringify(uploadedURLs)]
//     );

//     return NextResponse.json({ message: 'Product detail created', data: res.rows[0] }, { status: 201 });
//   } catch (err) {
//     console.error('POST /product-detail error:', err);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }

// // ====================== GET /product-detail ======================
// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const productIdRaw = searchParams.get('product_id');
//     const params: any[] = [];
//     let query = `SELECT * FROM product_detail`;

//     if (productIdRaw) {
//       query += ` WHERE product_id = $1`;
//       params.push(Number(productIdRaw));
//     }

//     query += ` ORDER BY id DESC`;

//     const res: QueryResult<ProductDetailRow> = await pool.query(query, params);
//     return NextResponse.json({ data: res.rows });
//   } catch (err) {
//     console.error('GET /product-detail error:', err);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }
