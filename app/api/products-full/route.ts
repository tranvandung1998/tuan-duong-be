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
    const supabase = getSupabaseClient();

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();

    // ----- Product fields -----
    const name = formData.get("name")?.toString();
    const price = Number(formData.get("price"));
    const type_id = Number(formData.get("type_id"));
    const description = formData.get("description")?.toString() || "";
    const productFiles = formData.getAll("product_images");

    // ----- Product Detail fields -----
    const detailDesc = formData.get("detail_description")?.toString() || "";
    const detailFiles = formData.getAll("detail_images");

    // ----- Validation -----
    if (!name || isNaN(price) || isNaN(type_id) || productFiles.length === 0) {
      return NextResponse.json({ error: "Missing product fields" }, { status: 400 });
    }
    if (!detailDesc) {
      return NextResponse.json({ error: "Missing detail description" }, { status: 400 });
    }

    // Check type exists
    const typeRes = await pool.query("SELECT id FROM types WHERE id=$1", [type_id]);
    if (!typeRes.rowCount || typeRes.rowCount === 0) return NextResponse.json({ error: "Type not found" }, { status: 404 });

    // Check product name
    const nameCheck = await pool.query("SELECT id FROM products_full WHERE name=$1", [name]);
    if (nameCheck.rowCount && nameCheck.rowCount > 0) return NextResponse.json({ error: "Product name exists" }, { status: 400 });

    // ===== Upload images =====
    const uploadedProductURLs: any[] = [];
    const uploadedDetailURLs: any[] = [];

    const uploadFiles = async (files: string | any[], folder: string, targetArr: any[], limit: number) => {
      for (let i = 0; i < Math.min(files.length, limit); i++) {
        const file = files[i];
        const fileName = `${uuidv4()}-${file.name}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error } = await supabase.storage.from("product-images").upload(`${folder}/${fileName}`, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
        if (error) throw new Error(`Upload ${file.name} failed`);

        const { data } = supabase.storage.from("product-images").getPublicUrl(`${folder}/${fileName}`);
        targetArr.push(data.publicUrl);
      }
    };

    await uploadFiles(productFiles, "products", uploadedProductURLs, 1); // 1 ảnh product
    await uploadFiles(detailFiles, "details", uploadedDetailURLs, 10);   // max 10 ảnh detail

    // Fill detail array 10 phần tử
    const detailArray = Array(10).fill(null);
    uploadedDetailURLs.forEach((url, idx) => {
      detailArray[idx] = url;
    });

    // Convert detailArray sang PostgreSQL text[] literal
    const pgDetailArray = `{${detailArray.map(u => (u ? `"${u}"` : "NULL")).join(",")}}`;

    // Insert
    const insertRes = await pool.query(
      `INSERT INTO products_full
      (name, price, description, type_id, product_images, detail_description, detail_images)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, name, price, type_id, product_images, detail_description, detail_images`,
      [
        name,
        price,
        description,
        type_id,
        uploadedProductURLs[0] || null, // ảnh chính
        detailDesc,
        pgDetailArray
      ]
    );

    return NextResponse.json({ message: "Product + Detail created", product: insertRes.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /products-full error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ===== GET /api/products-full =====
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productIdRaw = searchParams.get("product_id");
    const params = [];
    let query = "SELECT * FROM products_full";

    if (productIdRaw) {
      query += " WHERE id = $1";
      params.push(Number(productIdRaw));
    }

    query += " ORDER BY id DESC";

    const res = await pool.query(query, params);
    return NextResponse.json({ data: res.rows });
  } catch (err) {
    console.error("GET /products-full error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
