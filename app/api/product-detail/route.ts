// app/api/product-details/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  return NextResponse.json({ message: "API product-details working" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_name, detail, images } = body;

    if (!product_name || !detail || !images) {
      return NextResponse.json(
        { error: "Missing required fields (product_name, detail, images)" },
        { status: 400 }
      );
    }

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: "Images must be an array of strings" },
        { status: 400 }
      );
    }

    // Lấy product_id theo tên sản phẩm
    const { data: product, error: prodError } = await supabase
      .from("products")
      .select("id")
      .eq("name", product_name)
      .maybeSingle();

    if (prodError) throw prodError;
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Thêm chi tiết sản phẩm
    const { error: insertError } = await supabase
      .from("product_details")
      .insert([{ product_id: product.id, detail, images }]);

    if (insertError) throw insertError;

    return NextResponse.json({ message: "Product detail created successfully" });
  } catch (err: any) {
    console.error("Error creating product detail:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
