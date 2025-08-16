import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  return NextResponse.json({ message: "API product-details working" });
}

export async function POST(req: Request) {
  try {
    const { product_name, detail, images } = await req.json();

    if (!product_name || !detail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
