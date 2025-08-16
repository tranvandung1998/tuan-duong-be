import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("name");

    if (!productName) {
      return new Response(
        JSON.stringify({ error: "Missing product name" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Lấy thông tin products: chỉ price + type_id
    const prodRes = await pool.query(
      "SELECT price, type_id FROM products WHERE name = $1",
      [productName]
    );

    if (prodRes.rowCount === 0) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const product = prodRes.rows[0];

    // Lấy toàn bộ thông tin từ product_details
    const detailRes = await pool.query(
      "SELECT * FROM product_details WHERE product_id = (SELECT id FROM products WHERE name = $1)",
      [productName]
    );

    const details = detailRes.rows; // trả về toàn bộ cột từ product_details

    return new Response(
      JSON.stringify({ ...product, details }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/full-detail:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
