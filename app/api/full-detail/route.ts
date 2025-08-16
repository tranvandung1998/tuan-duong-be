import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("name");

    if (!productName) {
      return new Response(JSON.stringify({ error: "Missing product name" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lấy sản phẩm theo tên
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("*")
      .eq("name", productName)
      .limit(1)
      .maybeSingle(); // trả về null nếu không tìm thấy

    if (prodError) throw prodError;
    if (!products) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lấy chi tiết + images từ product_details
    const { data: details, error: detailError } = await supabase
      .from("product_details")
      .select("detail, images")
      .eq("product_id", products.id);

    if (detailError) throw detailError;

    return new Response(
      JSON.stringify({ ...products, details: details || [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/full-detail:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
