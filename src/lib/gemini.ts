// Production-grade Gemini wrapper.
// Single entry point: geminiRequest()
// - Primary model: gemini-flash-latest
// - Retries on 503 (and other transient 5xx/429): 3 attempts
// - Exponential backoff: 1s, 2s, 4s
// - Falls back to gemini-2.5-flash-lite after primary exhausts retries
// - Never throws raw network errors to the frontend; surfaces a friendly
//   Error message that TanStack server-fn relays to the UI toast.
// - Logs the complete Gemini error payload server-side.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const PRIMARY_MODEL = "gemini-flash-latest";
const FALLBACK_MODEL = "gemini-2.5-flash-lite";

// Exponential backoff schedule for 503 retries: 1s, 2s, 4s.
const BACKOFF_MS = [1000, 2000, 4000];

type Body = Record<string, unknown> & { model?: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callOnce(apiKey: string, payload: Body) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text };
}

/**
 * Single canonical Gemini caller.
 * - 3 attempts per model with exponential backoff (1s, 2s, 4s) on 503/429/5xx.
 * - Falls back to a lighter model if the primary keeps failing.
 * - Throws a short, user-friendly Error if everything fails (the frontend
 *   catches it via TanStack serverFn error envelope and shows a toast —
 *   it does NOT crash).
 */
export async function geminiRequest(apiKey: string, body: Body): Promise<any> {
  const requested = typeof body.model === "string" ? body.model : PRIMARY_MODEL;
  const models = [requested];
  if (requested !== FALLBACK_MODEL) models.push(FALLBACK_MODEL);

  let lastStatus = 0;
  let lastBody = "";

  for (const model of models) {
    const payload = { ...body, model };

    for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
      let status = 0;
      let okBody = "";
      try {
        const r = await callOnce(apiKey, payload);
        status = r.status;
        okBody = r.text;

        if (r.ok) {
          try {
            return JSON.parse(r.text);
          } catch (parseErr) {
            console.error(
              `[gemini] failed to parse success body (model=${model}):`,
              parseErr,
              r.text.slice(0, 1000),
            );
            throw new Error("Resposta inválida da IA. Tenta de novo.");
          }
        }

        lastStatus = r.status;
        lastBody = r.text;

        // Log the COMPLETE Gemini error payload (no truncation).
        console.error(
          `[gemini] error model=${model} attempt=${attempt + 1}/${BACKOFF_MS.length} status=${r.status} body=${r.text}`,
        );

        // Non-retryable: payment required, auth, bad request.
        if (r.status === 402) {
          throw new Error("Sem créditos de IA. Adicione créditos.");
        }
        if (r.status === 401 || r.status === 403) {
          throw new Error("Chave da IA inválida. Verifica a configuração.");
        }
        if (r.status === 400) {
          // bad request — move to next model, no point retrying same payload.
          break;
        }

        const retryable = r.status === 503 || r.status === 429 || r.status >= 500;
        if (!retryable) break;
      } catch (netErr) {
        // Network/transport-level error — treat as retryable.
        console.error(
          `[gemini] network error model=${model} attempt=${attempt + 1}:`,
          netErr,
        );
        lastStatus = status || 0;
        lastBody = okBody || String(netErr);
      }

      // Backoff before next retry on the same model (skip after final attempt).
      if (attempt < BACKOFF_MS.length - 1) {
        await sleep(BACKOFF_MS[attempt]);
      }
    }
  }

  // All retries exhausted across all models.
  console.error(
    `[gemini] all retries exhausted. lastStatus=${lastStatus} lastBody=${lastBody}`,
  );

  if (lastStatus === 429) {
    throw new Error("Muitas leituras de uma vez. Espera um pouco e tenta de novo.");
  }
  if (lastStatus === 503) {
    throw new Error("IA tá sobrecarregada agora. Tenta de novo em alguns segundos.");
  }
  throw new Error("A IA não respondeu agora. Tenta de novo.");
}

// Back-compat alias — existing callers can keep importing geminiChat.
export const geminiChat = geminiRequest;
