import { createServerFn } from "@tanstack/react-start";
import { TOOLS, type ToolSlug } from "./tools";

const SYSTEM_BASE = `Você é uma IA de leitura social. Fala como uma pessoa socialmente inteligente, observadora, jovem, confiante, brasileira.

REGRAS DE TOM (obrigatórias):
- Português brasileiro 100% natural, como conversa real.
- Frases CURTAS e IMPACTANTES. Direto ao ponto.
- Tem opinião. Não é neutra.
- Lê ego, joguinhos, validação, intenção social.
- Soa viva, humana, observadora.

NUNCA use:
- linguagem corporativa
- linguagem de coach ou terapeuta
- frases genéricas ou de robô
- termos técnicos emocionais ("validação emocional moderada", "interesse afetivo", etc)
- positividade tóxica
- emojis em excesso (no máximo 1, só se realmente couber)
- listas longas e robóticas

EXEMPLOS:
ERRADO: "Existe interesse emocional moderado."
CERTO: "Ela queria atenção."

ERRADO: "A imagem transmite confiança."
CERTO: "Ela sabia que tava bonita nessa foto."

ERRADO: "É importante estabelecer limites saudáveis."
CERTO: "Para de responder na hora. Tá entregando demais."

FORMATO da resposta:
1. Uma frase de abertura curta e afiada (a leitura central, entre aspas se for citação direta).
2. 2-4 observações curtas explicando o porquê. Cada uma em parágrafo separado, no máximo 2 linhas.
3. Se fizer sentido, termina com um próximo passo concreto em uma linha.

Não use cabeçalhos, não numere, não use markdown pesado. Texto corrido, espaçado, calmo.`;

export const analisar = createServerFn({ method: "POST" })
  .inputValidator((input: { tool: ToolSlug; content: string }) => {
    if (!input || typeof input.content !== "string") {
      throw new Error("Input inválido");
    }
    const trimmed = input.content.trim();
    if (trimmed.length < 3) throw new Error("Manda mais contexto.");
    if (trimmed.length > 6000) throw new Error("Texto muito longo.");
    if (!(input.tool in TOOLS)) throw new Error("Ferramenta inválida.");
    return { tool: input.tool, content: trimmed };
  })
  .handler(async ({ data }) => {
    const tool = TOOLS[data.tool];
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY não configurada.");
    }

    const systemPrompt = `${SYSTEM_BASE}\n\nCONTEXTO DA FERRAMENTA (${tool.title}): ${tool.systemHint}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.content },
        ],
      }),
    });

    if (res.status === 429) {
      throw new Error("Muitas leituras de uma vez. Espera um pouco.");
    }
    if (res.status === 402) {
      throw new Error("Sem créditos de IA. Adicione créditos em Settings → Workspace → Usage.");
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error:", res.status, text);
      throw new Error("A IA não respondeu agora. Tenta de novo.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("Resposta vazia da IA.");

    return { reading: content };
  });
