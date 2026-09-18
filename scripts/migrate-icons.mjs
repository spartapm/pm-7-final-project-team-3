import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("missing supabase env");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const BUCKET = "catalog-icons";

function parseDataUrl(raw) {
  const m = String(raw ?? "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) return null;
  const mime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1];
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { mime, ext, bytes: Buffer.from(m[2], "base64") };
}

async function store(raw, folder, id) {
  const v = String(raw ?? "").trim();
  if (!v.startsWith("data:image/")) return null;
  const parsed = parseDataUrl(v);
  if (!parsed) throw new Error("bad data url");
  const objectPath = `${folder}/${String(id).replace(/[^a-zA-Z0-9._-]+/g, "-")}.${parsed.ext}`;
  const up = await sb.storage.from(BUCKET).upload(objectPath, parsed.bytes, {
    contentType: parsed.mime,
    upsert: true,
    cacheControl: "31536000",
  });
  if (up.error) throw new Error(up.error.message);
  return sb.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function migrate(table, idCol, iconCol, folder) {
  const res = await sb.from(table).select(`${idCol}, ${iconCol}`);
  if (res.error) throw new Error(res.error.message);
  let moved = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of res.data ?? []) {
    const id = row[idCol];
    const icon = row[iconCol];
    if (!String(icon ?? "").startsWith("data:image/")) {
      skipped += 1;
      continue;
    }
    try {
      const next = await store(icon, folder, id);
      if (!next) {
        skipped += 1;
        continue;
      }
      const upd = await sb.from(table).update({ [iconCol]: next }).eq(idCol, id);
      if (upd.error) throw new Error(upd.error.message);
      moved += 1;
      process.stdout.write(`  ${table} ${id}\n`);
    } catch (err) {
      failed += 1;
      process.stderr.write(`  fail ${table} ${id}: ${err.message}\n`);
    }
  }
  return { table, moved, skipped, failed, total: (res.data ?? []).length };
}

const results = [];
results.push(await migrate("provider", "provider_id", "logo_url", "provider"));
results.push(await migrate("product", "product_id", "icon", "product"));
results.push(await migrate("bundle_product", "bundle_id", "icon", "bundle"));
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => r.failed)) process.exit(1);
