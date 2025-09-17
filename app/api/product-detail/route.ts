import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("name");

    if (!productName) {
      return new Response(JSON.stringify({ error: "Missing product name" }), { status: 400 });
    }

    // Lấy sản phẩm
    const prodRes = await pool.query("SELECT * FROM products WHERE name = $1", [productName]);
    if (prodRes.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
    }

    const product = prodRes.rows[0];

    // Lấy chi tiết + images
    const detailRes = await pool.query(
      "SELECT images FROM product_details WHERE product_id = $1",
      [product.id]
    );

    // Ghép tất cả images vào 1 mảng
    const allImages: string[] = [];
    detailRes.rows.forEach(row => {
      if (row.images?.length) allImages.push(...row.images);
    });

    // Map ra slide_image object 10 slot
    const slide_image: Record<string, string | null> = {};
    for (let i = 0; i < 10; i++) {
      slide_image[`image${i + 1}`] = allImages[i] || null;
    }

    const result = { ...product, slide_image };

    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, description } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const insertRes = await pool.query(
      "INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING *",
      [name, price, description || null]
    );

    const product = insertRes.rows[0];

    // Tạo slide_image rỗng (chưa có ảnh)
    const slide_image: Record<string, string | null> = {};
    for (let i = 0; i < 10; i++) {
      slide_image[`image${i + 1}`] = null;
    }

    return NextResponse.json({ ...product, slide_image }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}