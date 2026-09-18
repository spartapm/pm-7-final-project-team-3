import type { Notice } from "./types";

export const CS_CATEGORIES = [
  "구독 등록·인식",
  "결제·알림",
  "계정·로그인",
  "혜택·이벤트",
  "오류 신고",
  "기타",
] as const;

export type CsCategory = (typeof CS_CATEGORIES)[number];
export type CsStatus = "WAITING" | "ANSWERED" | "CLOSED";

export type Inquiry = {
  id: string;
  account_id: string;
  email?: string;
  category: string;
  title: string;
  body: string;
  images: string[];
  status: CsStatus;
  answer_body: string;
  created_at: string;
  answered_at: string | null;
  closed_at: string | null;
  read_at: string | null;
};

export function csNoticeId(inquiryId: string) {
  return `cs_${inquiryId}`;
}

export function isCsCategory(v: string): v is CsCategory {
  return (CS_CATEGORIES as readonly string[]).includes(v);
}

export function isCsStatus(v: string): v is CsStatus {
  return v === "WAITING" || v === "ANSWERED" || v === "CLOSED";
}

export function statusLabel(status: string) {
  if (status === "WAITING") return "답변대기";
  if (status === "CLOSED") return "종료";
  return "답변완료";
}

export function canDeleteInquiry(createdAt: string, now = Date.now()) {
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return false;
  return now - t <= 10 * 60 * 1000;
}

export function ellipsisTitle(title: string, max = 20) {
  const t = title.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function csDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function csDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${csDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${(local || "").slice(0, 2)}*@${domain}`;
}

export function extraInquiryTitle(title: string) {
  return `[추가문의] ${title.trim()}`.slice(0, 40);
}

export function sanitizeCsImages(raw: unknown): string[] | Error {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return new Error("이미지 형식이 올바르지 않아요.");
  const out: string[] = [];
  for (const item of raw) {
    const v = String(item ?? "").trim();
    if (!v) continue;
    if (!/^data:image\/(jpeg|jpg|png);base64,/i.test(v) && !/^https?:\/\//i.test(v) && !v.startsWith("/")) {
      return new Error("JPG/PNG 이미지만 첨부할 수 있어요");
    }
    if (v.length > 1_200_000) return new Error("10MB 이하 이미지만 첨부할 수 있어요");
    out.push(v);
  }
  if (out.length > 3) return new Error("이미지는 3장까지 첨부할 수 있어요");
  return out;
}

export function validateInquiryInput(input: { category?: string; title?: string; body?: string }) {
  const category = String(input.category ?? "").trim();
  const title = String(input.title ?? "").trim();
  const body = String(input.body ?? "").trim();
  if (!isCsCategory(category)) return "카테고리를 선택해주세요.";
  if (!title) return "제목을 입력해주세요.";
  if (title.length > 40) return "제목은 40자까지 입력할 수 있어요.";
  if (body.length < 10) return "10자 이상 입력해주세요";
  if (body.length > 1000) return "내용은 1000자까지 입력할 수 있어요.";
  return null;
}

export function inquiryNotice(row: Pick<Inquiry, "id" | "title" | "answered_at" | "read_at">): Notice {
  return {
    id: csNoticeId(row.id),
    title: "문의하신 내용에 답변이 도착했어요",
    body: row.title,
    at: row.answered_at ? Date.parse(row.answered_at) || Date.now() : Date.now(),
    read: Boolean(row.read_at),
    href: `/me/cs/${row.id}`,
    icon: "gift",
    brand: "틈",
  };
}

export function rowToInquiry(row: Record<string, unknown>, email?: string): Inquiry {
  const images = Array.isArray(row.images) ? row.images.map((x) => String(x)) : [];
  const status = String(row.status ?? "WAITING");
  return {
    id: String(row.id),
    account_id: String(row.account_id),
    email,
    category: String(row.category ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    images,
    status: isCsStatus(status) ? status : "WAITING",
    answer_body: String(row.answer_body ?? ""),
    created_at: String(row.created_at ?? ""),
    answered_at: row.answered_at ? String(row.answered_at) : null,
    closed_at: row.closed_at ? String(row.closed_at) : null,
    read_at: row.read_at ? String(row.read_at) : null,
  };
}

export function inlineFromDataUrl(dataUrl: string) {
  const i = dataUrl.indexOf(",");
  const header = i >= 0 ? dataUrl.slice(0, i) : "";
  const mime = header.match(/data:(image\/[a-zA-Z0-9.+-]+)/i)?.[1] || "image/jpeg";
  return { mime, data: i >= 0 ? dataUrl.slice(i + 1) : dataUrl };
}

export async function compressImageBlob(source: Blob, max = 1280, quality = 0.82) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 읽지 못했어요.");
  try {
    const bmp = await createImageBitmap(source);
    const scale = Math.min(max / bmp.width, max / bmp.height, 1);
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
  } catch {
    const url = URL.createObjectURL(source);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
        el.src = url;
      });
      const scale = Math.min(max / img.width, max / img.height, 1);
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return canvas.toDataURL("image/jpeg", quality);
}

export async function fileToCsImage(file: File) {
  if (!/^image\/(jpeg|jpg|png)$/i.test(file.type) && !/\.(jpe?g|png)$/i.test(file.name)) {
    throw new Error("JPG/PNG 이미지만 첨부할 수 있어요");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("10MB 이하 이미지만 첨부할 수 있어요");
  return compressImageBlob(file);
}
