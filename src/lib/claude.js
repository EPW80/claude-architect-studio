// Shared Claude API helpers. All Claude calls in the app route through here.
// Requests go to the /api/messages proxy, which injects auth server-side
// (vite.config.js in dev, api/messages.js Edge Function in prod).

// Current models (see docs/reference.md). PRIMARY drives RAG / Agent / Prompt;
// FAST is used for the lightweight prompt-scoring path.
export const MODELS = {
  PRIMARY: "claude-sonnet-4-6",
  FAST: "claude-haiku-4-5",
  OPUS: "claude-opus-4-8",
};

// Backwards-compatible default for callers that don't specify a model.
export const CLAUDE_MODEL = MODELS.PRIMARY;

// Turn a fetch failure or non-OK response into an actionable message.
function describeHttpError(status, body) {
  const apiMsg = body?.error?.message;
  switch (status) {
    case 401:
      return "Authentication failed (401). Set ANTHROPIC_API_KEY in your environment / Vercel project.";
    case 403:
      return "Permission denied (403). The API key lacks access to this model.";
    case 404:
      return "Not found (404). Check the model ID and the /api/messages proxy.";
    case 429:
      return "Rate limited (429). Too many requests — wait a moment and retry.";
    default:
      if (status >= 500) {
        return `Anthropic service error (${status}). ${apiMsg || "Retry shortly."}`;
      }
      return apiMsg || `Request failed (${status}).`;
  }
}

async function postMessages(payload) {
  let res;
  try {
    res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error — could not reach /api/messages. Is the dev server / proxy running?");
  }
  return res;
}

// Read a response body as JSON, tolerating non-JSON error bodies (e.g. an
// upstream 500 returning HTML) instead of throwing on res.json().
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 300) || `HTTP ${res.status}` } };
  }
}

export async function callClaude(system, userMsg, maxTokens = 1000, model = MODELS.PRIMARY) {
  const res = await postMessages({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMsg }],
  });
  const data = await safeJson(res);
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || describeHttpError(res.status, data));
  }
  return data.content?.[0]?.text || "";
}

export async function streamClaude(system, userMsg, maxTokens = 1000, onChunk, model = MODELS.PRIMARY) {
  const res = await postMessages({
    model,
    max_tokens: maxTokens,
    stream: true,
    system,
    messages: [{ role: "user", content: userMsg }],
  });
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err.error?.message || describeHttpError(res.status, err));
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
          full += ev.delta.text;
          onChunk(full);
        }
      } catch {}
    }
  }
  return full;
}

// Parse a JSON object Claude returned, stripping any markdown code fences first.
export function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
