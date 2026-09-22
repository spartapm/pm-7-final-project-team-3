import { NextResponse } from "next/server";

export const maxDuration = 10;

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter((k): k is string => Boolean(k?.trim()));

const NVIDIA_MODEL = process.env.NVIDIA_VISION_MODEL?.trim() || "meta/llama-3.2-11b-vision-instruct";

type ImageIn = { mime?: string; data?: string };

function geminiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
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

function prompts(kind: string | undefined, spoken: string) {
  const year = new Date().getFullYear();
  const eventPrompt = spoken
    ? `다음 말에서 캘린더 일정만 찾아 JSON 배열만 답하세요. 구독·결제·요금제 이야기는 일정이 아니므로 빈 배열 []만 답하세요. 올해는 ${year}년입니다. 월·일이 있으면 date를 ${year}-MM-DD로 채우세요. 시각은 24시간 HH:MM. 없는 값만 빈 문자열. 추측으로 일정을 만들지 마세요. 하루 종일이면 start와 end는 빈 문자열로 두세요. 제목은 서비스명·행사명처럼 짧게만 적고, 말한 내용 전체를 제목에 넣지 마세요. [{"title":"","date":"YYYY-MM-DD","endDate":"","start":"HH:MM","end":"HH:MM"}]\n\n사용자 발화:\n${spoken}`
    : `이 이미지가 구독 영수증, 결제 내역, 구독 앱 화면, 요금제 안내라면 빈 배열 []만 답하세요. 캘린더에 넣을 일정(회의, 약속, 공연, 예약, 수업, 행사)만 추출하세요. 서비스명·요금·결제일은 일정이 아닙니다. 올해는 ${year}년입니다. 월·일이 있으면 date를 ${year}-MM-DD로 채우세요. 시각은 24시간 HH:MM. 없는 값만 빈 문자열. 추측으로 일정을 만들지 마세요. 하루 종일이면 start와 end는 빈 문자열로 두세요. [{"title":"","date":"YYYY-MM-DD","endDate":"","start":"HH:MM","end":"HH:MM"}]`;
  const subPrompt = spoken
    ? `다음 말에서 구독을 모두 찾아 JSON 배열만 답하세요. name은 서비스명만 짧게 적고, 말한 내용 전체를 name에 넣지 마세요. 결제일이 불명확하면 day는 null, 금액이 불명확하면 amount는 빈 문자열. 추측하지 마세요. [{"name":"","plan":"","amount":"","day":1}]\n\n사용자 발화:\n${spoken}`
    : '이 이미지들에서 구독을 모두 찾아 JSON 배열만 답하세요. 결제일이 불명확하면 day는 null, 금액이 불명확하면 amount는 빈 문자열. 추측하지 마세요. [{"name":"","plan":"","amount":"","day":1}]';
  return kind === "event" ? eventPrompt : subPrompt;
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
    : items;
  if (cleaned.length === 0) return NextResponse.json({ ok: false, error: "parse" }, { status: 422 });
  return NextResponse.json({ ok: true, items: cleaned, data: cleaned[0] });
}

function messageText(content: unknown) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => {
    if (typeof part === "string") return part;
    if (part && typeof part === "object" && "text" in part) return String((part as { text?: string }).text ?? "");
    return "";
  }).join("");
}

async function fromNvidia(kind: string | undefined, prompt: string, images: ImageIn[]) {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) return NextResponse.json({ ok: false, error: "missing-key" }, { status: 500 });
  const content = [
    { type: "text", text: prompt },
    ...images.slice(0, 4).filter((img) => img.data).map((img) => ({
      type: "image_url",
      image_url: { url: `data:${img.mime || "image/jpeg"};base64,${img.data}` },
    })),
  ];
  let res: Response;
  try {
    res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: "user", content }],
        temperature: 0,
        max_tokens: 1024,
        stream: false,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "nvidia" }, { status: 502 });
  }
  if (!res.ok) return NextResponse.json({ ok: false, error: "nvidia" }, { status: 502 });
  const json = await res.json() as { choices?: { message?: { content?: unknown } }[] };
  return reply(kind, messageText(json.choices?.[0]?.message?.content));
}

async function fromGemini(kind: string | undefined, prompt: string) {
  const keys = geminiKeys();
  if (keys.length === 0) return NextResponse.json({ ok: false, error: "missing-key" }, { status: 500 });
  let res: Response | null = null;
  const started = Date.now();
  const budget = 9000;
  outer: for (const model of GEMINI_MODELS) {
    for (const key of keys) {
      const left = budget - (Date.now() - started);
      if (left < 2000) break outer;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 1024,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(Math.min(8000, left)),
        });
      } catch {
        continue;
      }
      if (res.ok) break outer;
      if (res.status === 404 || res.status === 400) break;
      if (res.status !== 429 && res.status !== 403) break outer;
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
  const prompt = prompts(body.kind, images.length ? "" : spoken);
  if (images.length > 0) return fromNvidia(body.kind, prompt, images);
  return fromGemini(body.kind, prompt);
}
