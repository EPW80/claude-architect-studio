// Client-side guardrail enforcement for the Prompt Studio demo.
// These make the guardrail toggles actually do something rather than being
// decorative: PII redaction and a cost cap run locally; the model-side guards
// are appended to the system prompt.

const PII_PATTERNS = [
  // emails
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED_EMAIL]"],
  // US SSN
  [/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]"],
  // phone numbers (loose: optional country code, separators)
  [/\b(?:\+?\d{1,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g, "[REDACTED_PHONE]"],
];

// Redact PII from a string. Used when the PII Filter guardrail is ON.
export function redactPII(text) {
  if (typeof text !== "string") return text;
  return PII_PATTERNS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

// Walk an analysis result object and redact PII from its string fields.
export function applyPIIFilter(analysis) {
  if (!analysis || typeof analysis !== "object") return analysis;
  const out = { ...analysis };
  for (const key of ["optimized_prompt"]) {
    if (typeof out[key] === "string") out[key] = redactPII(out[key]);
  }
  for (const key of ["strengths", "issues", "recommendations"]) {
    if (Array.isArray(out[key])) out[key] = out[key].map(redactPII);
  }
  return out;
}

// Returns true if a guardrail with the given name is active in the list.
export function isActive(guardrails, name) {
  return guardrails.some((g) => g.name === name && g.active);
}

// Cost Guard: cap max_tokens when active.
export const COST_GUARD_MAX_TOKENS = 600;
export function maxTokensFor(guardrails, uncapped) {
  return isActive(guardrails, "Cost Guard") ? Math.min(uncapped, COST_GUARD_MAX_TOKENS) : uncapped;
}

// Append model-side guard instructions to a system prompt based on toggles.
export function decorateSystemPrompt(system, guardrails) {
  const extra = [];
  if (isActive(guardrails, "Hallucination Check")) {
    extra.push("Flag any claim you cannot directly support, and do not invent facts.");
  }
  if (isActive(guardrails, "Toxicity Guard")) {
    extra.push("Keep all output professional and non-toxic; refuse harmful requests.");
  }
  return extra.length ? `${system}\n\nAdditional guardrails:\n- ${extra.join("\n- ")}` : system;
}
