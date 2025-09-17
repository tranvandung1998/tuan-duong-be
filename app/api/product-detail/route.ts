import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// Runtime nodejs
export const runtime = "nodejs";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // đổi thành domain FE cụ thể cho production
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS handler để preflight request
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const { product_name, detail, images } = await req.json();

    if (!product_name) {
      return NextResponse.json({ error: "Missing product_name" }, { status: 400, headers: corsHeaders });
    }

    // 1️⃣ Insert product
    const insertRes = await pool.query(
      "INSERT INTO products (name, description) VALUES ($1, $2) RETURNING *",
      [product_name, detail || null]
    );

    const product = insertRes.rows[0];

    // 2️⃣ Insert product_details nếu có images
    if (images && Array.isArray(images) && images.length > 0) {
      await pool.query(
        "INSERT INTO product_details (product_id, images) VALUES ($1, $2)",
        [product.id, images]
      );
    }

    return NextResponse.json({ ...product, images: images || [] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error("POST /api/products error:", err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

// GET /api/products?name=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("name");

    if (!productName) {
      return NextResponse.json({ error: "Missing product name" }, { status: 400, headers: corsHeaders });
    }

    // Lấy product
    const prodRes = await pool.query("SELECT * FROM products WHERE name = $1", [productName]);
    if (prodRes.rowCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404, headers: corsHeaders });
    }

    const product = prodRes.rows[0];

    // Lấy images từ product_details
    const detailRes = await pool.query(
      "SELECT images FROM product_details WHERE product_id = $1",
      [product.id]
    );

    const allImages: string[] = [];
    detailRes.rows.forEach(row => {
      if (row.images?.length) allImages.push(...row.images);
    });

    // Map ra slide_image 10 slot
    const slide_image: Record<string, string | null> = {};
    for (let i = 0; i < 10; i++) {
      slide_image[`image${i + 1}`] = allImages[i] || null;
    }

    return NextResponse.json({ ...product, slide_image }, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
