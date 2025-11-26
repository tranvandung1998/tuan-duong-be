import pool from "@/lib/db";

const allowedOrigins = [
  "http://localhost:5173",
  "https://app-fe-tuan-duong.vercel.app",
];

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin", // 👌 quan trọng khi deploy
  };
}

function getOrigin(req: Request) {
  const origin = req.headers.get("origin") || "";
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

// ================== OPTIONS ==================
export function OPTIONS(req: Request) {
  const origin = getOrigin(req);
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

// ================== GET ==================
export async function GET(req: Request) {
  const origin = getOrigin(req);

  const result = await pool.query("SELECT * FROM categories");

  return new Response(JSON.stringify(result.rows), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

// ================== POST ==================
export async function POST(req: Request) {
  const origin = getOrigin(req);

  const body = await req.json();
  const name = body.name;

  if (!name) {
    return new Response(JSON.stringify({ error: "Missing name" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(origin),
      },
    });
  }

  await pool.query("INSERT INTO categories(name) VALUES($1)", [name]);

  return new Response(JSON.stringify({ message: "Category created" }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}
