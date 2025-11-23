import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pool from "@/lib/db";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env not defined");
  return createClient(supabaseUrl, supabaseKey);
}

// --- OPTIONS ---
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// --- POST: tạo product detail + upload ảnh ---
export async function POST(req: Request) {
  try {
    const { product_name, detail, images } = await req.json();

    if (!product_name || !detail) {
      return NextResponse.json({ error: "Missing product_name or detail" }, { status: 400 });
    }

    // Lấy product_id
    const prodRes = await pool.query("SELECT id FROM products WHERE name=$1", [product_name]);
    if (prodRes.rowCount === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const product_id = prodRes.rows[0].id;

    const supabase = getSupabaseClient();
    const uploadedURLs: string[] = [];

    // Upload images (tối đa 10 ảnh)
    if (images && Array.isArray(images)) {
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        const imgData = images[i]; // base64 string
        const fileName = `product-details/${product_id}/${Date.now()}-${i}.png`;
        const buffer = Buffer.from(imgData, "base64");

        const { error } = await supabase.storage
          .from("product-images")
          .upload(fileName, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/png",
          });

        if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });

        const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        uploadedURLs.push(publicData.publicUrl);
      }
    }

    // Map 10 ảnh
    const slideImages = [];
    for (let i = 0; i < 10; i++) slideImages.push(uploadedURLs[i] || null);

    // Lưu vào product_details
    await pool.query(
      `INSERT INTO product_details
       (product_id, description,image1,image2,image3,image4,image5,image6,image7,image8,image9,image10)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [product_id, detail, ...slideImages]
    );

    return NextResponse.json({ message: "Product detail saved", slideImages }, { status: 201 });
  } catch (err: any) {
    console.error("POST /product-details error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- GET: lấy product detail + slide_image ---
// --- GET: lấy product detail + slide_image ---
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("name");

    if (!productName) {
      return NextResponse.json({ error: "Missing product name" }, { status: 400 });
    }

    // Lấy tất cả product có tên trùng
    const prodRes = await pool.query("SELECT * FROM products WHERE name = $1", [productName]);
    if (prodRes.rowCount === 0) {
      return NextResponse.json({ data: [], message: "No products found" }, { status: 200 });
    }

    const products = await Promise.all(prodRes.rows.map(async (product) => {
      // Lấy images từ product_images
      const imgRes = await pool.query(
        "SELECT url FROM product_images WHERE product_id = $1 ORDER BY id ASC",
        [product.id]
      );
      const allImages = imgRes.rows.map(r => r.url);

      // Map ra slide_image 10 slot
      const slide_image: Record<string, string | null> = {};
      for (let i = 0; i < 10; i++) {
        slide_image[`image${i + 1}`] = allImages[i] || null;
      }

      return { ...product, slide_image };
    }));

    return NextResponse.json({ data: products }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/product-details error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
