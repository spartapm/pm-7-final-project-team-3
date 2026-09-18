import { getSupabase } from "./supabase";

export const CATALOG_ICON_BUCKET = "catalog-icons";

export function publicIcon(raw?: string | null) {
  const v = String(raw ?? "").trim();
  if (!v || v.startsWith("data:")) return "";
  return v;
}

function parseDataUrl(raw: string) {
  const m = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!m) return null;
  const mime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1];
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return { mime, ext, bytes: Buffer.from(m[2], "base64") };
}

export async function storeCatalogIcon(raw: string, folder: string, id: string | number) {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  if (!v.startsWith("data:image/")) return v;
  const parsed = parseDataUrl(v);
  const sb = getSupabase();
  if (!parsed) throw new Error("아이콘 이미지 형식을 읽지 못했어요.");
  if (!sb) throw new Error("아이콘 저장소를 쓸 수 없어요.");
  const path = `${folder}/${String(id).replace(/[^a-zA-Z0-9._-]+/g, "-")}.${parsed.ext}`;
  const up = await sb.storage.from(CATALOG_ICON_BUCKET).upload(path, parsed.bytes, {
    contentType: parsed.mime,
    upsert: true,
    cacheControl: "31536000",
  });
  if (up.error) throw new Error(up.error.message);
  return sb.storage.from(CATALOG_ICON_BUCKET).getPublicUrl(path).data.publicUrl;
}
