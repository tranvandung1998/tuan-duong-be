// app/api/product-images/route.ts
export const runtime = 'nodejs';

import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    console.log("▶️ Hit POST /api/product-images");

    const { product_name, image_url } = await req.json();

    if (!product_name || !image_url) {
      return new Response(
        JSON.stringify({ error: 'Missing product_name or image_url' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Lấy product_id theo tên
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id')
      .eq('name', product_name)
      .maybeSingle();

    if (prodError) throw prodError;
    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Thêm ảnh sản phẩm
    const { error: insertError } = await supabase
      .from('product_images')
      .insert([{ product_id: product.id, url: image_url }]);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ message: 'Product image added successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error adding product image:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
