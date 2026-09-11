import { NextResponse } from "next/server";

const MODEL = "gemini-3.5-flash-lite";

function geminiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
  ].filter((k): k is string => Boolean(k?.trim()));
}

function parseItems(text: string) {
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) {
    try {
      const v = JSON.parse(arr[0]);
      if (Array.isArray(v)) return v;
    } catch { /* try object */ }
  }
  const obj = text.match(/\{[\s\S]*\}/);
  if (!obj) return null;
  try {
    const v = JSON.parse(obj[0]);
    return Array.isArray(v) ? v : [v];
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const keys = geminiKeys();
  if (keys.length === 0) return NextResponse.json({ ok: false, error: "missing-key" }, { status: 500 });
  const body = await req.json() as { images?: { mime: string; data: string }[]; text?: string; kind?: string };
  const images = body.images ?? [];
  const spoken = body.text?.trim() ?? "";
  if (images.length === 0 && !spoken) return NextResponse.json({ ok: false, error: "no-input" }, { status: 400 });

  const year = new Date().getFullYear();
  const eventPrompt = spoken
    ? `다음 말에서 일정을 모두 찾아 JSON 배열만 답하세요. 올해는 ${year}년입니다. 월·일이 있으면 date를 ${year}-MM-DD로 채우세요. 시각은 24시간 HH:MM. 없는 값만 빈 문자열. 추측으로 일정을 만들지 마세요. [{"title":"","date":"YYYY-MM-DD","endDate":"","start":"HH:MM","end":"HH:MM"}]\n\n사용자 발화:\n`
    : `이 이미지들에서 일정을 모두 찾아 JSON 배열만 답하세요. 올해는 ${year}년입니다. 월·일이 있으면 date를 ${year}-MM-DD로 채우세요. 시각은 24시간 HH:MM. 없는 값만 빈 문자열. 추측으로 일정을 만들지 마세요. [{"title":"","date":"YYYY-MM-DD","endDate":"","start":"HH:MM","end":"HH:MM"}]`;
  const subPrompt = spoken
    ? '다음 말에서 구독을 모두 찾아 JSON 배열만 답하세요. 결제일이 불명확하면 day는 null, 금액이 불명확하면 amount는 빈 문자열. 추측하지 마세요. [{"name":"","plan":"","amount":"","day":1}]\n\n사용자 발화:\n'
    : '이 이미지들에서 구독을 모두 찾아 JSON 배열만 답하세요. 결제일이 불명확하면 day는 null, 금액이 불명확하면 amount는 빈 문자열. 추측하지 마세요. [{"name":"","plan":"","amount":"","day":1}]';

  const prompt = (body.kind === "event" ? eventPrompt : subPrompt) + spoken;
  const parts: object[] = [{ text: prompt }];
  for (const img of images.slice(0, 4)) {
    parts.push({ inline_data: { mime_type: img.mime || "image/jpeg", data: img.data } });
  }

  let res: Response | null = null;
  const started = Date.now();
  for (const key of keys) {
    const left = 16000 - (Date.now() - started);
    if (left < 2000) break;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(Math.min(12000, left)),
      });
    } catch {
      continue;
    }
    if (res.ok) break;
    if (res.status !== 429 && res.status !== 403 && res.status !== 404) break;
  }
  if (!res || !res.ok) {
    return NextResponse.json({ ok: false, error: "gemini" }, { status: 502 });
  }
  const json = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const items = parseItems(text);
  if (!items || items.length === 0) return NextResponse.json({ ok: false, error: "parse" }, { status: 422 });
  return NextResponse.json({ ok: true, items, data: items[0] });
}
