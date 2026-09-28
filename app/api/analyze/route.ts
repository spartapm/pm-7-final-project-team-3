import { NextResponse } from "next/server";

export const maxDuration = 10;

function modelsOf(kind: "stt" | "ocr") {
  const extra = kind === "stt"
    ? [process.env.GEMINI_STT_MODEL, "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"]
    : [process.env.GEMINI_OCR_MODEL, process.env.GEMINI_MODEL, "gemini-2.0-flash", "gemini-2.5-flash"];
  return extra
    .filter((k): k is string => Boolean(k?.trim()))
    .filter((k) => kind !== "ocr" || !/lite/i.test(k));
}

type ImageIn = { mime?: string; data?: string };

function voiceKeys() {
  return [process.env.GEMINI_API_KEY].filter((k): k is string => Boolean(k?.trim()));
}

function ocrKeys() {
  return [
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter((k): k is string => Boolean(k?.trim()));
}

function parseItems(text: string) {
  const cleaned = String(text ?? "").replace(/```(?:json)?/gi, "").trim();
  const arr = cleaned.match(/\[[\s\S]*\]/);
  if (arr) {
    try {
      const v = JSON.parse(arr[0]);
      if (Array.isArray(v)) return v;
    } catch { /* try object */ }
  }
  const obj = cleaned.match(/\{[\s\S]*\}/);
  if (!obj) return null;
  try {
    const v = JSON.parse(obj[0]);
    return Array.isArray(v) ? v : [v];
  } catch {
    return null;
  }
}

function prompts(kind: string | undefined, spoken: string, hasImage: boolean) {
  const year = new Date().getFullYear();
  if (kind === "event") {
    return spoken
      ? `다음 말에서 캘린더 일정만 찾아 JSON 배열만 답하세요. 구독·결제·요금제 이야기는 일정이 아니므로 빈 배열 []만 답하세요. 올해는 ${year}년입니다. 월·일이 있으면 date를 ${year}-MM-DD로 채우세요. 시각은 24시간 HH:MM. 없는 값만 빈 문자열. 추측으로 일정을 만들지 마세요. 하루 종일이면 start와 end는 빈 문자열로 두세요. 제목은 서비스명·행사명처럼 짧게만 적고, 말한 내용 전체를 제목에 넣지 마세요. [{"title":"","date":"YYYY-MM-DD","endDate":"","start":"HH:MM","end":"HH:MM"}]\n\n사용자 발화:\n${spoken}`
      : `이 이미지가 구독 영수증, 결제 내역, 구독 앱 화면, 요금제 안내라면 빈 배열 []만 답하세요. 캘린더에 넣을 일정(회의, 약속, 공연, 예약, 수업, 행사)만 추출하세요. 서비스명·요금·결제일은 일정이 아닙니다. 올해는 ${year}년입니다. 월·일이 있으면 date를 ${year}-MM-DD로 채우세요. 시각은 24시간 HH:MM. 없는 값만 빈 문자열. 추측으로 일정을 만들지 마세요. 하루 종일이면 start와 end는 빈 문자열로 두세요. [{"title":"","date":"YYYY-MM-DD","endDate":"","start":"HH:MM","end":"HH:MM"}]`;
  }
  if (spoken) {
    return `다음 말에서 구독을 모두 찾아 JSON 배열만 답하세요. name은 서비스명만 짧게 적고, 말한 내용 전체를 name에 넣지 마세요. 결제일이 불명확하면 day는 null, 금액이 불명확하면 amount는 빈 문자열. 추측하지 마세요. [{"name":"","plan":"","amount":"","day":1}]\n\n사용자 발화:\n${spoken}`;
  }
  if (hasImage) {
    return `이 이미지는 구독 결제 영수증·멤버십 영수증·앱 결제 화면·브랜드 결제 포스터입니다. 포스터처럼 디자인된 영수증도 실제 구독으로 추출하세요. JSON 배열만 답하세요.
라벨 힌트: "서비스명", "결제금액", "정기 결제일"/"매월 N일", "상품명".
규칙:
- name: 서비스명만. 예: 넷플릭스, 배민클럽, 티빙
- plan: 요금제/상품명이 보이면 짧게(프리미엄 등), 없으면 빈 문자열
- amount: "결제금액" 숫자만. 쉼표·원 없이. 공급가액·부가세는 무시
- day: "정기 결제일"의 일(1-31). "매월 15일"이면 15. 없으면 null
- 여러 장이거나 여러 구독이면 모두 넣고, 하나도 없으면 []
[{"name":"넷플릭스","plan":"프리미엄","amount":"17000","day":15}]`;
  }
  return '이 이미지들에서 구독을 모두 찾아 JSON 배열만 답하세요. 결제일이 불명확하면 day는 null, 금액이 불명확하면 amount는 빈 문자열. 추측하지 마세요. [{"name":"","plan":"","amount":"","day":1}]';
}

function reply(kind: string | undefined, text: string) {
  const items = parseItems(text);
  if (!items || items.length === 0) return NextResponse.json({ ok: false, error: "parse" }, { status: 422 });
  const cleaned = kind === "event"
    ? items.filter((it: { title?: string; name?: string; date?: string; amount?: string; day?: number | null; plan?: string }) => {
        if (it.amount || it.plan || (it.day != null && !it.date && !it.title)) return false;
        const title = String(it.title || it.name || "").trim();
        const date = String(it.date || "").trim();
        return Boolean(title || date);
      })
    : items.filter((it: { name?: string; title?: string; amount?: string }) => {
        return Boolean(String(it.name || it.title || "").trim() || String(it.amount || "").trim());
      });
  if (cleaned.length === 0) return NextResponse.json({ ok: false, error: "parse" }, { status: 422 });
  return NextResponse.json({ ok: true, items: cleaned, data: cleaned[0] });
}

async function fromGemini(
  kind: string | undefined,
  prompt: string,
  keys: string[],
  images: ImageIn[] = [],
  models: string[] = modelsOf("ocr"),
) {
  if (keys.length === 0) return NextResponse.json({ ok: false, error: "missing-key" }, { status: 500 });
  const parts: object[] = [{ text: prompt }];
  for (const img of images.slice(0, 4)) {
    if (!img.data) continue;
    parts.push({ inline_data: { mime_type: img.mime || "image/jpeg", data: img.data } });
  }
  let res: Response | null = null;
  const started = Date.now();
  const budget = 9000;
  outer: for (const model of models) {
    for (const key of keys) {
      const left = budget - (Date.now() - started);
      if (left < 1800) break outer;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(Math.min(7500, left)),
        });
      } catch {
        continue;
      }
      if (res.ok) break outer;
      if (res.status === 404) break;
      if (res.status === 400) continue;
      if (res.status !== 429 && res.status !== 403) continue;
    }
  }
  if (!res || !res.ok) return NextResponse.json({ ok: false, error: "gemini" }, { status: 502 });
  const json = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return reply(kind, text);
}

export async function POST(req: Request) {
  const body = await req.json() as { images?: ImageIn[]; text?: string; kind?: string };
  const images = (body.images ?? []).filter((img) => img?.data);
  const spoken = body.text?.trim() ?? "";
  if (images.length === 0 && !spoken) return NextResponse.json({ ok: false, error: "no-input" }, { status: 400 });
  const prompt = prompts(body.kind, spoken, images.length > 0);
  if (images.length > 0) return fromGemini(body.kind, prompt, ocrKeys(), images, modelsOf("ocr"));
  return fromGemini(body.kind, prompt, voiceKeys(), [], modelsOf("stt"));
}
