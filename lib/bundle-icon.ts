export const DEFAULT_BUNDLE_ICON = "/brand/logo-mark.png";

export function isImageIcon(icon?: string | null) {
  const v = (icon ?? "").trim();
  return /^(data:image\/[a-zA-Z0-9.+-]+;base64,|https?:\/\/|\/(?!\/))/.test(v);
}

export function bundleIconSrc(icon?: string | null) {
  const v = (icon ?? "").trim();
  return isImageIcon(v) ? v : DEFAULT_BUNDLE_ICON;
}

export function sanitizeBundleIcon(icon: unknown) {
  if (icon == null) return "";
  const v = String(icon).trim();
  if (!v) return "";
  if (!isImageIcon(v)) return "";
  if (v.length > 500_000) throw new Error("아이콘 이미지가 너무 커요. 더 작은 사진으로 올려주세요.");
  return v;
}

export async function fileToBundleIcon(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 올릴 수 있어요.");
  if (file.size > 5 * 1024 * 1024) throw new Error("이미지는 5MB 이하만 가능해요.");
  const bmp = await createImageBitmap(file);
  const max = 256;
  const scale = Math.min(max / bmp.width, max / bmp.height, 1);
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 읽지 못했어요.");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const png = canvas.toDataURL("image/png");
  if (png.length < 180_000) return png;
  return canvas.toDataURL("image/jpeg", 0.82);
}
