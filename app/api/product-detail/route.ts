// app/api/product-details/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// ✅ POST: Tạo chi tiết sản phẩm
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_name, detail, images } = body;

    if (!product_name || !detail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Tìm product theo tên
    const prodRes = await pool.query(
      "SELECT id FROM products WHERE name = $1",
      [product_name]
    );

    if (prodRes.rowCount === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const product_id = prodRes.rows[0].id;

    // Thêm chi tiết sản phẩm
    await pool.query(
      "INSERT INTO product_details(product_id, detail, images) VALUES($1, $2, $3)",
      [product_id, detail, images]
    );

    return NextResponse.json({ message: "Product detail created" });
  } catch (err: any) {
    console.error("Error creating product detail:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ GET: Test route hoạt động
export async function GET() {
  return NextResponse.json({ message: "GET ok" });
}
