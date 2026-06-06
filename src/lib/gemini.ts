// Shared Gemini chat-completions caller with retry + model fallback.
// Uses Google's OpenAI-compatible endpoint so the request/response shape
// matches what the existing functions already build.

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Order of attempts: primary, then progressively cheaper/lighter aliases.
const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-2.5-flash-lite"] as const;

type Body = Record<string, unknown> & { model?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Calls Gemini's OpenAI-compatible chat-completions endpoint.
 * Retries on 503/429/5xx with model fallback so transient capacity
 * issues on one model don't kill the request.
 *
 * Returns the parsed JSON response on success.
 * Throws a user-facing Error on:
 *  - 429 (final): "Muitas leituras de uma vez. Espera um pouco."
 *  - 402: "Sem créditos de IA. ..."
 *  - other failures: "A IA não respondeu agora. Tenta de novo."
 */
export async function geminiChat(apiKey: string, body: Body): Promise<any> {
  const requestedModel = typeof body.model === "string" ? body.model : FALLBACK_MODELS[0];
  // Try requested model first, then any fallbacks not already tried.
  const attempts = [requestedModel, ...FALLBACK_MODELS.filter((m) => m !== requestedModel)];

  let lastStatus = 0;
  let lastText = "";

  for (let i = 0; i < attempts.length; i++) {
    const model = attempts[i];
    const payload = { ...body, model };

    // Up to 2 tries per model (handles transient 503s on the same model).
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json();
      }

      lastStatus = res.status;
      lastText = await res.text().catch(() => "");
      console.error(`Gemini error (model=${model}, attempt=${attempt + 1}):`, res.status, lastText.slice(0, 500));

      if (res.status === 402) {
        throw new Error("Sem créditos de IA. Adicione créditos.");
      }

      // Retryable: 429 (rate limit), 5xx (capacity/transient)
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) break; // 4xx other than 429 → don't retry, try next model

      // small backoff before retrying same model
      if (attempt === 0) await sleep(800);
    }
  }

  if (lastStatus === 429) {
    throw new Error("Muitas leituras de uma vez. Espera um pouco.");
  }
  throw new Error("A IA não respondeu agora. Tenta de novo.");
}
