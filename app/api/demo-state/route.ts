import {NextResponse} from "next/server";

const KEY = "inventory-demo-state";

function redisConfig() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? {url, token} : null;
}

async function command(args: unknown[]) {
  const config = redisConfig();
  if (!config) return null;
  const response = await fetch(config.url, {
    method: "POST",
    headers: {Authorization: `Bearer ${config.token}`, "Content-Type": "application/json"},
    body: JSON.stringify(args),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Redis command failed: ${response.status}`);
  return response.json() as Promise<{result?: unknown}>;
}

export async function GET() {
  const result = await command(["GET", KEY]);
  if (!result) return NextResponse.json({enabled: false, data: null}, {status: 200});
  const value = typeof result.result === "string" ? JSON.parse(result.result) : null;
  return NextResponse.json({enabled: true, data: value});
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await command(["SET", KEY, JSON.stringify(body)]);
  if (!result) return NextResponse.json({enabled: false}, {status: 200});
  return NextResponse.json({enabled: true});
}
