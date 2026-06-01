import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um cara brasileiro normal montando uma SEQUÊNCIA de mensagens pra puxar papo com alguém. NÃO é IA, NÃO é coach, NÃO é poeta. Não escreve "cantada pronta de internet".

OBJETIVO:
Gerar uma sequência de 3 mensagens (Setup → Desenvolvimento → Punchline) em 3 abordagens diferentes (Natural, Engraçada, Sedutora). Cada mensagem deve parecer escrita por um cara real no momento.

ESTRUTURA POR ABORDAGEM:
- setup: mensagem leve pra abrir o assunto. Curta.
- desenvolvimento: o que mandar SE ela responder algo curto/normal. Curto. Continua o papo natural.
- punchline: frase final que provoca sorriso, curiosidade ou leve flerte. Sem ser cringe.
- resposta_provavel: 1 linha curta imaginando o que ela provavelmente responde ao setup (pra dar contexto pro usuário).

COMO ESCREVER:
- minúsculo
- frases curtas
- "kkk" natural (não em todas)
- gírias reais ("tipo", "né", "tu", "tá")
- emoji raro (😂 👀)
- pontuação relaxada
- ZERO cantada pronta tipo "anjo caiu do céu", "tava te procurando", "deusa"

PROIBIDO:
- "linda", "perfeita", "musa", "gata", "deusa"
- frase poética / metáfora
- pergunta filosófica
- "celebrar", "transmitir", "possui", "encanta"
- texto que pareça copiado de TikTok

3 ABORDAGENS (diferentes de verdade entre si):
- Natural: leve, espontânea, observação simples.
- Engraçada: humor, zoeira leve, provocação cômica.
- Sedutora: mais tensão, interesse direto, sem exagero romântico. NÃO é cantada de novela.

EXEMPLO DE NÍVEL CERTO (story de academia):
Natural → setup: "treino sério hoje hein" / dev: "sempre nesse pique?" / punch: "dá pra perceber kkk"
Engraçada → setup: "isso é treino ou tentativa de humilhar os mortais?" / dev: "tô preocupado com a galera da academia" / punch: "achei que fosse proibido postar isso"
Sedutora → setup: "esse story tá perigoso" / dev: "tu sabia disso né" / punch: "porque dá vontade de continuar a conversa"

NUNCA invente contexto que não tá no print/descrição. Se for vago, mantenha a sequência neutra.`;

const SCHEMA = {
  type: "object",
  properties: {
    contexto: { type: "string", description: "1 linha resumindo o que tá rolando, em tom de amigo." },
    sequencias: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          abordagem: { type: "string", enum: ["Natural", "Engraçada", "Sedutora"] },
          setup: { type: "string" },
          resposta_provavel: { type: "string", description: "O que ela provavelmente responde ao setup." },
          desenvolvimento: { type: "string" },
          punchline: { type: "string" },
        },
        required: ["abordagem", "setup", "resposta_provavel", "desenvolvimento", "punchline"],
        additionalProperties: false,
      },
    },
  },
  required: ["contexto", "sequencias"],
  additionalProperties: false,
} as const;

export interface CantadaSequencia {
  abordagem: "Natural" | "Engraçada" | "Sedutora";
  setup: string;
  resposta_provavel: string;
  desenvolvimento: string;
  punchline: string;
}
export interface CantadasResult {
  contexto: string;
  sequencias: CantadaSequencia[];
}

export const gerarCantadas = createServerFn({ method: "POST" })
  .inputValidator((input: { contexto: string; imageDataUrl?: string }) => {
    const contexto = (input?.contexto ?? "").trim();
    if (!contexto && !input?.imageDataUrl) {
      throw new Error("Conta o contexto ou anexa um print.");
    }
    if (contexto.length > 1200) throw new Error("Contexto muito longo.");
    if (input.imageDataUrl) {
      if (!input.imageDataUrl.startsWith("data:image/")) throw new Error("Imagem inválida.");
      if (input.imageDataUrl.length > 8_000_000) throw new Error("Imagem muito pesada.");
    }
    return { contexto, imageDataUrl: input.imageDataUrl };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const userText = `Monta a sequência (Setup → Desenvolvimento → Punchline) em 3 abordagens (Natural, Engraçada, Sedutora) pra esse contexto: ${data.contexto || "(sem texto, ler o print)"}`;

    const userContent: unknown[] = [{ type: "text", text: userText }];
    if (data.imageDataUrl) {
      userContent.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "gerar_cantadas",
            description: "Devolve 3 sequências (Natural, Engraçada, Sedutora) com setup, desenvolvimento e punchline.",
            parameters: SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "gerar_cantadas" } },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) throw new Error("Muitas leituras de uma vez. Espera um pouco.");
    if (res.status === 402) throw new Error("Sem créditos de IA.");
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error:", res.status, text);
      throw new Error("A IA não respondeu agora. Tenta de novo.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    try {
      return JSON.parse(args) as CantadasResult;
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
