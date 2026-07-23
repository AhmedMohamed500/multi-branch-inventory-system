import {NextResponse} from "next/server";

const KEY = "inventory-demo-state";
const BACKUPS_KEY = "inventory-demo-state-backups";
const MAX_BACKUPS = 10;
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
  const backupsResult = await command(["LRANGE", BACKUPS_KEY, 0, MAX_BACKUPS - 1]);
  const backups = Array.isArray(backupsResult?.result)
    ? backupsResult.result
        .filter((item): item is string => typeof item === "string")
        .map(item => {
          try {
            const parsed = JSON.parse(item) as {id: string; createdAt: string; label: string; summary?: unknown};
            return {id: parsed.id, createdAt: parsed.createdAt, label: parsed.label, summary: parsed.summary};
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    : [];
  const result = await command(["GET", KEY]);
  if (!result) {
    return NextResponse.json(
      {enabled: true, storage: "memory", data: memoryStore().__inventoryDemoState ?? null, backups: []},
      {status: 200}
    );
  }
  const value = typeof result.result === "string" ? JSON.parse(result.result) : null;
  return NextResponse.json({enabled: true, storage: "redis", data: value, backups});
}

export async function POST(request: Request) {
  const body = repairMojibake(await request.json());
  if (body && typeof body === "object" && "action" in body) {
    const actionBody = body as {action?: string; data?: unknown; label?: string; backupId?: string};
    if (actionBody.action === "backup") {
      const data = actionBody.data ?? null;
      const backup = {
        id: `backup-${Date.now()}`,
        createdAt: new Date().toISOString(),
        label: actionBody.label?.trim() || `Backup ${new Date().toLocaleString("en-GB")}`,
        summary: data && typeof data === "object" ? {
          products: Array.isArray((data as {products?: unknown}).products) ? (data as {products: unknown[]}).products.length : 0,
          inventory: Array.isArray((data as {inventory?: unknown}).inventory) ? (data as {inventory: unknown[]}).inventory.length : 0,
          movements: Array.isArray((data as {movements?: unknown}).movements) ? (data as {movements: unknown[]}).movements.length : 0,
          packages: Array.isArray((data as {packages?: unknown}).packages) ? (data as {packages: unknown[]}).packages.length : 0
        } : undefined,
        data
      };
      const result = await command(["LPUSH", BACKUPS_KEY, JSON.stringify(backup)]);
      await command(["LTRIM", BACKUPS_KEY, 0, MAX_BACKUPS - 1]);
      if (!result) return NextResponse.json({enabled: false}, {status: 200});
      return NextResponse.json({enabled: true, storage: "redis", backup});
    }
    if (actionBody.action === "restore" && actionBody.backupId) {
      const backupsResult = await command(["LRANGE", BACKUPS_KEY, 0, MAX_BACKUPS - 1]);
      const backupItem = Array.isArray(backupsResult?.result)
        ? backupsResult.result.find(item => {
            if (typeof item !== "string") return false;
            try {
              return (JSON.parse(item) as {id?: string}).id === actionBody.backupId;
            } catch {
              return false;
            }
          })
        : null;
      if (typeof backupItem !== "string") return NextResponse.json({enabled: true, restored: false}, {status: 404});
      const backup = JSON.parse(backupItem) as {data: unknown};
      const data = repairMojibake(backup.data);
      await command(["SET", KEY, JSON.stringify(data)]);
      return NextResponse.json({enabled: true, storage: "redis", restored: true, data});
    }
  }
  const result = await command(["SET", KEY, JSON.stringify(body)]);
  if (!result) {
    memoryStore().__inventoryDemoState = body;
    return NextResponse.json({enabled: true, storage: "memory"}, {status: 200});
  }
  return NextResponse.json({enabled: true, storage: "redis"});
}
