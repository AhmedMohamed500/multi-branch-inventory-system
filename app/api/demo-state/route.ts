import {NextResponse} from "next/server";

const KEY = "inventory-demo-state";
const MOJIBAKE_MARKER = /[ÃÂØÙ][\u0080-\u00ff]/;

type DemoGlobal = typeof globalThis & {
  __inventoryDemoState?: unknown;
};

function memoryStore() {
  return globalThis as DemoGlobal;
}

function redisConfig() {
  const url =
    process.env.KV_REST_API_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.STORAGE_KV_REST_API_URL ??
    process.env.STORAGE_UPSTASH_REDIS_REST_URL ??
    process.env.STORAGE_REST_API_URL;
  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.STORAGE_KV_REST_API_TOKEN ??
    process.env.STORAGE_UPSTASH_REDIS_REST_TOKEN ??
    process.env.STORAGE_REST_API_TOKEN;
  return url && token ? {url, token} : null;
}

function repairText(value: string) {
  let fixed = value;
  for (let index = 0; index < 3 && MOJIBAKE_MARKER.test(fixed); index++) {
    const next = Buffer.from(fixed, "latin1").toString("utf8");
    if (next === fixed) break;
    fixed = next;
  }
  return fixed;
}

function repairMojibake(value: unknown): unknown {
  if (typeof value === "string") return repairText(value);
  if (Array.isArray(value)) return value.map(repairMojibake);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairMojibake(item)]));
  }
  return value;
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
  if (!result) {
    return NextResponse.json(
      {enabled: true, storage: "memory", data: memoryStore().__inventoryDemoState ?? null},
      {status: 200}
    );
  }
  const value = typeof result.result === "string" ? JSON.parse(result.result) : null;
  return NextResponse.json({enabled: true, storage: "redis", data: value});
}

export async function POST(request: Request) {
  const body = repairMojibake(await request.json());
  const result = await command(["SET", KEY, JSON.stringify(body)]);
  if (!result) {
    memoryStore().__inventoryDemoState = body;
    return NextResponse.json({enabled: true, storage: "memory"}, {status: 200});
  }
  return NextResponse.json({enabled: true, storage: "redis"});
}
