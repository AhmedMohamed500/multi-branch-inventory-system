import {NextResponse} from "next/server";

const KEY = "inventory-demo-state";
const BACKUPS_KEY = "inventory-demo-state-backups";
const MAX_BACKUPS = 10;
const MOJIBAKE_MARKER = /[ÃÂØÙ][\u0080-\u00ff]/;

type DemoGlobal = typeof globalThis & {
  __inventoryDemoState?: unknown;
};

type StateRecord = Record<string, unknown>;
type DeletedMap = Record<string, string[]>;

function memoryStore() {
  return globalThis as DemoGlobal;
}

function isRecord(value: unknown): value is StateRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

function itemKey(item: unknown, index: number) {
  if (!isRecord(item)) return `row-${index}`;
  if (typeof item.id === "string") return item.id;
  if (typeof item.number === "string") return item.number;
  if (typeof item.reference === "string") return item.reference;
  if (typeof item.branchId === "string" && typeof item.productId === "string") return `${item.branchId}|${item.productId}`;
  return `row-${index}`;
}

function readDeleted(state: unknown) {
  const deleted = isRecord(state) && isRecord(state.deleted) ? state.deleted : {};
  const result: DeletedMap = {};
  for (const [key, value] of Object.entries(deleted)) {
    if (Array.isArray(value)) result[key] = value.filter((item): item is string => typeof item === "string");
  }
  return result;
}

function mergeDeleted(remote: unknown, incoming: unknown) {
  const result: DeletedMap = {};
  for (const source of [readDeleted(remote), readDeleted(incoming)]) {
    for (const [key, ids] of Object.entries(source)) result[key] = [...new Set([...(result[key] ?? []), ...ids])];
  }
  return result;
}

function isDeleted(key: string, item: unknown, deleted: DeletedMap) {
  if (!isRecord(item)) return false;
  const direct = typeof item.id === "string" && deleted[key]?.includes(item.id);
  const byProduct = typeof item.productId === "string" && deleted.products?.includes(item.productId);
  return Boolean(direct || byProduct);
}

function mergeArray(key: string, remote: unknown, incoming: unknown, deleted: DeletedMap) {
  const map = new Map<string, unknown>();
  if (Array.isArray(remote)) remote.forEach((item, index) => map.set(itemKey(item, index), item));
  if (Array.isArray(incoming)) incoming.forEach((item, index) => map.set(itemKey(item, index), item));
  return [...map.values()].filter(item => !isDeleted(key, item, deleted));
}

function mergeDemoState(remote: unknown, incoming: unknown) {
  if (!isRecord(remote)) return incoming;
  if (!isRecord(incoming)) return remote;
  const deleted = mergeDeleted(remote, incoming);
  const merged: StateRecord = {...remote, ...incoming};
  for (const key of [
    "branches",
    "users",
    "products",
    "inventory",
    "movements",
    "transfers",
    "suppliers",
    "stockIssues",
    "barters",
    "packages",
    "packageIssues",
    "custodies"
  ]) {
    merged[key] = mergeArray(key, remote[key], incoming[key], deleted);
  }
  merged.deleted = deleted;
  return merged;
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
  const currentResult = await command(["GET", KEY]);
  const current = typeof currentResult?.result === "string" ? repairMojibake(JSON.parse(currentResult.result)) : null;
  const next = mergeDemoState(current, body);
  const result = await command(["SET", KEY, JSON.stringify(next)]);
  if (!result) {
    memoryStore().__inventoryDemoState = mergeDemoState(memoryStore().__inventoryDemoState, body);
    return NextResponse.json({enabled: true, storage: "memory"}, {status: 200});
  }
  return NextResponse.json({enabled: true, storage: "redis", data: next});
}
