import { JWT } from "google-auth-library";

export type VertexImage = { mime?: string; data?: string };

type VertexCreds = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

let cached: { token: string; exp: number } | null = null;

function credsOf(): VertexCreds | null {
  const raw = process.env.GOOGLE_VERTEX_CREDENTIALS?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VertexCreds;
  } catch {
    return null;
  }
}

export function vertexReady() {
  const project = process.env.GOOGLE_VERTEX_PROJECT?.trim() || credsOf()?.project_id;
  const creds = credsOf();
  return Boolean(project && creds?.client_email && creds?.private_key);
}

function vertexProject() {
  return process.env.GOOGLE_VERTEX_PROJECT?.trim() || credsOf()?.project_id || "";
}

function vertexLocation() {
  return process.env.GOOGLE_VERTEX_LOCATION?.trim() || "global";
}

function vertexHost(location: string) {
  return location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
}

async function accessToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const creds = credsOf();
  if (!creds?.client_email || !creds.private_key) return null;
  const jwt = new JWT({
    email: creds.client_email,
    key: creds.private_key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const { token } = await jwt.getAccessToken();
  if (!token) return null;
  cached = { token, exp: Date.now() + 50 * 60 * 1000 };
  return token;
}

export async function vertexGenerate(opts: {
  model: string;
  prompt: string;
  images?: VertexImage[];
  timeoutMs: number;
}) {
  const project = vertexProject();
  const location = vertexLocation();
  const token = await accessToken();
  if (!project || !token) return { ok: false as const, status: 0, text: "" };
  const parts: object[] = [{ text: opts.prompt }];
  for (const img of (opts.images ?? []).slice(0, 4)) {
    if (!img.data) continue;
    parts.push({ inlineData: { mimeType: img.mime || "image/jpeg", data: img.data } });
  }
  const url = `https://${vertexHost(location)}/v1/projects/${project}/locations/${location}/publishers/google/models/${opts.model}:generateContent`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          ...(/lite/i.test(opts.model) ? {} : { thinkingConfig: { thinkingBudget: 0 } }),
        },
      }),
      signal: AbortSignal.timeout(opts.timeoutMs),
    });
  } catch {
    return { ok: false as const, status: 0, text: "" };
  }
  const json = await res.json().catch(() => ({})) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return { ok: res.ok, status: res.status, text };
}
