import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import pool from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase env not defined");
  return createClient(supabaseUrl, supabaseKey);
}

// ===== POST /api/products-full =====
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, type_id, description, product_images, detail_description, detail_images } = body;

    // Validation
    if (!name || !price || !type_id || !product_images || !detail_description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const insertRes = await pool.query(
      `INSERT INTO products_full (name, price, description, type_id, product_images, detail_description, detail_images)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, price, description, type_id, product_images, detail_description, `{${detail_images.map((url: any) => `"${url}"`).join(",")}}`]
    );

    return NextResponse.json({ message: "Product + Detail created", product: insertRes.rows[0] }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// ===== GET /api/products-full =====
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nameRaw = searchParams.get("name"); // nhận tên
    const params = [];
    let query = "SELECT * FROM products_full";

    if (nameRaw) {
      query += " WHERE name ILIKE $1"; // tìm kiếm theo tên (không phân biệt hoa thường)
      params.push(`%${nameRaw}%`);
    }

    query += " ORDER BY id DESC";

    const res = await pool.query(query, params);
    return NextResponse.json({ data: res.rows });
  } catch (err) {
    console.error("GET /products-full error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// ===== Next.js App Router config =====
export const config = {
  api: {
    bodyParser: true, // bắt buộc khi dùng req.formData()
  },
};
