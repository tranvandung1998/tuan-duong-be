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

// POST /api/products-full
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();

    // ===== Product fields =====
    const name = formData.get("name")?.toString();
    const price = Number(formData.get("price"));
    const type_id = Number(formData.get("type_id"));
    const description = formData.get("description")?.toString() || "";
    const productFiles = formData.getAll("product_images") as File[];

    // ===== Product Detail fields =====
    const detailDesc = formData.get("detail_description")?.toString() || "";
    const detailFiles = formData.getAll("detail_images") as File[];

    // ===== Validation =====
    if (!name || isNaN(price) || isNaN(type_id) || !productFiles.length) {
      return NextResponse.json({ error: "Missing product fields" }, { status: 400 });
    }
    if (!detailDesc || !detailFiles.length) {
      return NextResponse.json({ error: "Missing detail fields" }, { status: 400 });
    }

    // Check type exists
    const typeRes = await pool.query("SELECT id FROM types WHERE id = $1", [type_id]);
    if (typeRes.rowCount === 0) return NextResponse.json({ error: "Type not found" }, { status: 404 });

    // Check product name trùng
    const nameCheck = await pool.query("SELECT id FROM products WHERE name = $1", [name]);
    if ((nameCheck.rowCount as number) > 0) {
  return NextResponse.json({ error: "Product name exists" }, { status: 400 });
}


    // ===== Upload images =====
    const uploadedProductURLs: string[] = [];
    const uploadedDetailURLs: string[] = [];

    const uploadFiles = async (files: File[], folder: string, targetArr: string[]) => {
      for (const file of files) {
        const fileName = `${uuidv4()}-${file.name}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error } = await supabase.storage
          .from("product-images")
          .upload(`${folder}/${fileName}`, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (error) throw new Error(`Upload ${file.name} failed`);

        const { data } = supabase.storage.from("product-images").getPublicUrl(`${folder}/${fileName}`);
        targetArr.push(data.publicUrl);
      }
    };

    await uploadFiles(productFiles, "products", uploadedProductURLs);
    await uploadFiles(detailFiles, "details", uploadedDetailURLs);

    // ===== Transaction DB =====
    await pool.query("BEGIN");
    try {
      // 1. Insert product
      const prodRes = await pool.query(
        "INSERT INTO products(name, price, description, type_id) VALUES($1,$2,$3,$4) RETURNING id",
        [name, price, description, type_id]
      );
      const productId = prodRes.rows[0].id;

      // 2. Insert product images
      for (const url of uploadedProductURLs) {
        await pool.query("INSERT INTO product_images(product_id, url) VALUES($1,$2)", [productId, url]);
      }

      // 3. Insert product detail
      await pool.query(
        "INSERT INTO product_detail(product_id, description, images) VALUES($1,$2,$3)",
        [productId, detailDesc, uploadedDetailURLs]
      );

      await pool.query("COMMIT");
      return NextResponse.json({ message: "Product + Detail created", product_id: productId }, { status: 201 });
    } catch (err) {
      await pool.query("ROLLBACK");

      // Cleanup Supabase images
      const removePaths = (arr: string[]) =>
        arr.forEach(async (url) => {
          const path = url.split("/product-images/")[1];
          await supabase.storage.from("product-images").remove([path]);
        });
      removePaths(uploadedProductURLs);
      removePaths(uploadedDetailURLs);

      throw err;
    }
  } catch (err: any) {
    console.error("POST /products-full error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
