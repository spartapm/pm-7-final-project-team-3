import { NextResponse } from "next/server";

const MODEL = "gemini-2.0-flash";

function geminiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
  ].filter((k): k is string => Boolean(k?.trim()));
}

export async function POST(req: Request) {
  const keys = geminiKeys();
  if (keys.length === 0) return NextResponse.json({ ok: false, error: "missing-key" }, { status: 500 });
  const body = await req.json() as { images?: { mime: string; data: string }[]; kind?: string };
  const images = body.images ?? [];
  if (images.length === 0) return NextResponse.json({ ok: false, error: "no-image" }, { status: 400 });

  const prompt = body.kind === "event"
    ? '이 이미지에서 일정 제목과 날짜를 찾아 JSON만 답하세요. 형식: {"title":"","date":"YYYY-MM-DD"}'
    : '이 결제/구독 스크린샷에서 서비스명, 요금제, 금액(숫자만), 결제일을 찾아 JSON만 답하세요. 형식: {"name":"","plan":"","amount":"","day":1}';

  const parts: object[] = [{ text: prompt }];
  for (const img of images.slice(0, 4)) {
    parts.push({ inline_data: { mime_type: img.mime || "image/jpeg", data: img.data } });
  }

  let res: Response | null = null;
  for (const key of keys) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });
    if (res.ok) break;
    if (res.status !== 429 && res.status !== 403) break;
  }
  if (!res || !res.ok) {
    return NextResponse.json({ ok: false, error: "gemini" }, { status: 502 });
  }
  const json = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ ok: false, error: "parse" }, { status: 422 });
  try {
    return NextResponse.json({ ok: true, data: JSON.parse(match[0]) });
  } catch {
    return NextResponse.json({ ok: false, error: "parse" }, { status: 422 });
  }
}
