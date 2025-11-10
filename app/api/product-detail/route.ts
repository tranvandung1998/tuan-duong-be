import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}


export async function POST(req: Request) {
  
  try {
    const { product_name, detail, images } = await req.json();

    if (!product_name || !detail) {
      return new Response(JSON.stringify({ error: "Missing product_name or detail" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const prodRes = await pool.query("SELECT id FROM products WHERE name = $1", [product_name]);
    if (prodRes.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const product_id = prodRes.rows[0].id;

    await pool.query(
      "INSERT INTO product_details (product_id, description, images) VALUES ($1, $2, $3)",
      [product_id, detail, images || []]
    );


    return new Response(JSON.stringify({ message: "Product detail saved", images: images || [] }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("POST /api/product-details error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("name");

    if (!productName) {
      return NextResponse.json({ error: "Missing product name" }, { status: 400 });
    }

    // Lấy product
    const prodRes = await pool.query("SELECT * FROM products WHERE name = $1", [productName]);
    if (prodRes.rowCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = prodRes.rows[0];

    // Lấy images từ product_images
    const imgRes = await pool.query(
      "SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY id ASC",
      [product.id]
    );
    const allImages = imgRes.rows.map(r => r.image_url);

    // Map ra slide_image 10 slot
    const slide_image: Record<string, string | null> = {};
    for (let i = 0; i < 10; i++) {
      slide_image[`image${i + 1}`] = allImages[i] || null;
    }

    return NextResponse.json({ ...product, slide_image }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
