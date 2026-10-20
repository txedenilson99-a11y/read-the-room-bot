import { createServerFn } from "@tanstack/react-start";
import { IA_HONESTA } from "./ia-honesta";
import { requireAprovado } from "./require-aprovado";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é o "Psicologia Proibida — Story" do ScanSocial: um observador social brasileiro, calmo e honesto. Recebe o print de um story (foto, legenda, música, sticker, ambiente) e ajuda a responder de um jeito natural.

REGRAS:
- Comece pelo que é OBSERVÁVEL no print: objetos, ambiente, legenda, música, texto, expressão visível, horário, erros/detalhes curiosos.
- Interpretações são hipóteses com nível de incerteza ("pode ser", "talvez"). Nunca afirme intenção certa, nunca diga que o story é "pra você", nunca leia a mente.
- Nada de diagnóstico ou rótulo psicológico ("carente", "narcisista", "quer atenção", etc.).
- Diga claramente o que NÃO dá para concluir só com um story.
- Respostas comentam a SITUAÇÃO/detalhe, não a aparência. Proibido elogio genérico ("linda", "maravilhosa", "gata").
- Respostas curtas (até ~14 palavras), português natural de zap, minúsculas ok, sem tom de coach, sem manipulação.
- O tom "provocador" é provocação leve e respeitosa, nunca ofensiva ou sexual.` + IA_HONESTA;

const TONS = ["engracado", "curioso", "confiante", "carinhoso", "provocador"] as const;

const SCHEMA = {
  type: "object",
  properties: {
    detalhes_observaveis: { type: "array", minItems: 2, maxItems: 6, items: { type: "string" } },
    interpretacoes: {
      type: "array", minItems: 1, maxItems: 4,
      items: {
        type: "object",
        properties: {
          leitura: { type: "string" },
          base: { type: "string", description: "Detalhe observável que sustenta a hipótese." },
          incerteza: { type: "string", enum: ["alta", "media", "baixa"] },
        },
        required: ["leitura", "base", "incerteza"],
      },
    },
    nao_da_pra_concluir: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    estrategia: { type: "string", description: "1-2 frases: qual gancho usar e por quê." },
    respostas: {
      type: "array", minItems: 4, maxItems: 5,
      items: {
        type: "object",
        properties: {
          tom: { type: "string", enum: [...TONS] },
          texto: { type: "string" },
        },
        required: ["tom", "texto"],
      },
    },
    melhor_resposta: {
      type: "object",
      properties: {
        texto: { type: "string" },
        por_que: { type: "string", description: "1 frase curta." },
      },
      required: ["texto", "por_que"],
    },
  },
  required: ["detalhes_observaveis", "interpretacoes", "nao_da_pra_concluir", "estrategia", "respostas", "melhor_resposta"],
};

export interface PsicologiaStoryResult {
  detalhes_observaveis: string[];
  interpretacoes: { leitura: string; base: string; incerteza: "alta" | "media" | "baixa" }[];
  nao_da_pra_concluir: string[];
  estrategia: string;
  respostas: { tom: (typeof TONS)[number]; texto: string }[];
  melhor_resposta: { texto: string; por_que: string };
}

export const analisarPsicologiaStory = createServerFn({ method: "POST" })
  .middleware([requireAprovado])
  .inputValidator((input: { contexto?: string; image?: string }) => {
    const contexto = (input?.contexto ?? "").slice(0, 1500).trim();
    const image = typeof input?.image === "string" ? input.image : "";
    if (!/^data:image\/(png|jpe?g);base64,/.test(image)) {
      throw new Error("Manda o print do story em JPG ou PNG.");
    }
    if (image.length > 8_000_000) throw new Error("A imagem tá muito pesada. Tenta um print menor.");
    return { contexto, image };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("A IA não está configurada no servidor.");

    const json = (await geminiRequest(apiKey, {
      model: "gemini-3.1-flash-lite",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analisa este story. Lista detalhes observáveis, leituras possíveis com incerteza, o que não dá pra concluir, uma estratégia e 5 respostas (um tom cada: engracado, curioso, confiante, carinhoso, provocador respeitoso). Destaca a melhor.${data.contexto ? `\n\nContexto extra (legenda/música/situação):\n${data.contexto}` : ""}`,
            },
            { type: "image_url", image_url: { url: data.image } },
          ],
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "psicologia_story",
          description: "Leitura honesta do story com respostas sugeridas.",
          parameters: SCHEMA,
        },
      }],
      tool_choice: { type: "function", function: { name: "psicologia_story" } },
    })) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("A IA não respondeu dessa vez. Tenta de novo.");
    try {
      return { result: JSON.parse(args) as PsicologiaStoryResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
