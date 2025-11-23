import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");
    const productName = searchParams.get("name");

    let query = "SELECT * FROM products";
    const params: any[] = [];

    if (productId) {
      query += " WHERE id = $1";
      params.push(Number(productId));
    } else if (productName) {
      query += " WHERE name ILIKE $1";
      params.push(`%${productName}%`);
    }

    const prodRes = await pool.query(query, params);

    if (!prodRes.rows.length) {
      return new Response(JSON.stringify({ error: "No products found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lấy chi tiết + images
    const productsWithDetails = await Promise.all(
      prodRes.rows.map(async (product) => {
        const detailRes = await pool.query(
          "SELECT description, images FROM product_details WHERE product_id = $1",
          [product.id]
        );

        const details = detailRes.rows.map((row) => ({
          description: row.description,
          images: Array.isArray(row.images) ? row.images : [],
        }));

        // slide_image 10 slot
        const slide_image: Record<string, string | null> = {};
        const firstImages = details[0]?.images || [];
        for (let i = 0; i < 10; i++) {
          slide_image[`image${i + 1}`] = firstImages[i] || null;
        }

        return {
          ...product,
          details,
          slide_image,
        };
      })
    );

    return new Response(JSON.stringify(productsWithDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/full-detail:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
