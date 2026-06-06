import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um cara brasileiro normal montando uma SEQUÊNCIA de mensagens pra puxar papo. NÃO é IA, NÃO é coach, NÃO é poeta. Zero cantada pronta da internet.

OBJETIVO:
Gerar 3 abordagens (Natural, Engraçada, Flertando). Em cada uma, montar a CONVERSA INTEIRA em 4 etapas:
1) setup: primeira mensagem pra abrir.
2) resposta_provavel: o que ela provavelmente responde ao setup (1 linha curta).
3) punchline: a sua segunda mensagem, reagindo à resposta dela. Curta, com sorriso/curiosidade/flerte leve conforme a abordagem.
4) continuacao: a sua próxima mensagem depois da punchline, pra manter o papo vivo (mudar de assunto leve, perguntar algo, ou aumentar o flerte conforme a abordagem).

A sensação tem que ser "conversa real acontecendo", não "cantada copiada".

COMO ESCREVER:
- minúsculo
- frases curtas
- "kkk" natural (não em todas)
- gírias reais ("tipo", "né", "tu", "tá", "po")
- emoji raro (😂 👀)
- pontuação relaxada

PROIBIDO:
- "linda", "perfeita", "musa", "gata", "deusa", "anjo"
- frase poética, metáfora literária
- pergunta filosófica
- "celebrar", "transmitir", "possui", "encanta"
- qualquer texto que pareça cantada de TikTok ou print de Pinterest

3 ABORDAGENS (diferentes de verdade):
- Natural: leve, espontânea, observação simples.
- Engraçada: humor, zoeira leve, provocação cômica.
- Flertando: tensão sutil, interesse claro mas calmo. NÃO é cantada de novela.

EXEMPLO DE NÍVEL CERTO (story de academia):
Natural → setup: "treina sério ou só tira foto boa?" / ela: "os dois kkk" / punch: "então tá explicado" / cont: "qual academia que dá esse resultado?"
Engraçada → setup: "quantas fotos foram rejeitadas antes dessa?" / ela: "várias" / punch: "eu sabia kkk" / cont: "manda as rejeitadas que eu julgo"
Flertando → setup: "essa foto tá perigosa" / ela: "por quê?" / punch: "porque faz a pessoa perder o foco" / cont: "tá testando ou foi sem querer?"

NUNCA invente contexto que não tá no print/descrição. Se for vago, mantenha neutro.` + IA_HONESTA;

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
          abordagem: { type: "string", enum: ["Natural", "Engraçada", "Flertando"] },
          setup: { type: "string" },
          resposta_provavel: { type: "string", description: "O que ela provavelmente responde ao setup." },
          punchline: { type: "string", description: "Sua segunda mensagem reagindo à resposta dela." },
          continuacao: { type: "string", description: "Sua próxima mensagem pra manter o papo vivo." },
        },
        required: ["abordagem", "setup", "resposta_provavel", "punchline", "continuacao"],
        additionalProperties: false,
      },
    },
  },
  required: ["contexto", "sequencias"],
  additionalProperties: false,
} as const;


export interface CantadaSequencia {
  abordagem: "Natural" | "Engraçada" | "Flertando";
  setup: string;
  resposta_provavel: string;
  punchline: string;
  continuacao: string;
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const userText = `Monta a sequência em 4 etapas (Setup → Resposta provável → Punchline → Continuação) em 3 abordagens (Natural, Engraçada, Flertando) pra esse contexto: ${data.contexto || "(sem texto, ler o print)"}`;

    const userContent: unknown[] = [{ type: "text", text: userText }];
    if (data.imageDataUrl) {
      userContent.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }

    const body = {
      model: "gemini-flash-latest",
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

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
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
