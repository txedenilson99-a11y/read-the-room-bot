import { createServerFn } from "@tanstack/react-start";
import { IA_HONESTA } from "./ia-honesta";
import { requireAprovado } from "./require-aprovado";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é o "Psicologia Proibida" do ScanSocial: um observador social brasileiro, calmo, perspicaz e honesto. Você lê as entrelinhas de conversas, prints e situações descritas — sinais de interesse, contradições entre palavras e atitudes, padrões repetidos — sem nunca fingir ler pensamentos.

REGRAS:
- Separe SEMPRE o que é observável (está no print/texto) do que é interpretação.
- Interpretações são hipóteses: use "pode ser", "talvez", "uma leitura possível é". Dê mais de uma quando fizer sentido.
- Diga claramente o que NÃO dá pra concluir com o material enviado.
- Aponte contradições entre o que foi dito e o que foi feito só se aparecerem de fato.
- Nada de diagnóstico psicológico ou rótulo ("narcisista", "carente", "manipuladora", "tem ansiedade", etc.).
- Nada de manipulação, técnica para pressionar ou enganar a outra pessoa. O próximo passo é sempre respeitoso.
- Curto e útil. Frases diretas, português natural, sem tom de coach.
- Resposta sugerida: curta (até ~18 palavras), natural, como alguém mandaria no zap.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string", description: "1 frase curta resumindo a situação, sem julgamento." },
    sinais_observaveis: {
      type: "array", minItems: 1, maxItems: 5,
      items: { type: "string", description: "Fato concreto visto no print/texto (o que foi dito/feito, tempo, frequência)." },
    },
    interpretacoes: {
      type: "array", minItems: 1, maxItems: 4,
      items: {
        type: "object",
        properties: {
          leitura: { type: "string", description: "Hipótese em linguagem de possibilidade." },
          base: { type: "string", description: "Qual sinal observável sustenta essa hipótese." },
          peso: { type: "string", enum: ["fraca", "moderada", "forte"] },
        },
        required: ["leitura", "base", "peso"],
      },
    },
    contradicoes: {
      type: "array", maxItems: 3,
      items: { type: "string", description: "Contradição real entre palavras e atitudes. Vazio se não houver." },
    },
    nao_da_pra_concluir: {
      type: "array", minItems: 1, maxItems: 4,
      items: { type: "string", description: "O que o material não permite afirmar." },
    },
    proximo_passo: { type: "string", description: "1-2 frases: o que fazer agora, respeitoso e prático." },
    resposta_sugerida: { type: "string", description: "Mensagem curta pronta para enviar (ou vazio se o melhor é não responder agora)." },
  },
  required: ["resumo", "sinais_observaveis", "interpretacoes", "contradicoes", "nao_da_pra_concluir", "proximo_passo", "resposta_sugerida"],
};

export interface PsicologiaResult {
  resumo: string;
  sinais_observaveis: string[];
  interpretacoes: { leitura: string; base: string; peso: "fraca" | "moderada" | "forte" }[];
  contradicoes: string[];
  nao_da_pra_concluir: string[];
  proximo_passo: string;
  resposta_sugerida: string;
}

export const analisarPsicologia = createServerFn({ method: "POST" })
  .middleware([requireAprovado])
  .inputValidator((input: { contexto?: string; images?: string[] }) => {
    const contexto = (input?.contexto ?? "").slice(0, 4000).trim();
    const images = Array.isArray(input?.images)
      ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    }
    if (!contexto && images.length === 0) {
      throw new Error("Descreve a situação ou anexa um print.");
    }
    return { contexto, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `Lê as entrelinhas da situação abaixo. Separa sinais observáveis de interpretações possíveis, aponta contradições reais entre palavras e atitudes, diz o que ainda não dá pra concluir e sugere o próximo passo.${data.contexto ? `\n\nSituação descrita:\n${data.contexto}` : ""}${data.images.length ? `\n\n${data.images.length} imagem(ns) anexada(s).` : ""}`,
      },
      ...data.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];

    const json = (await geminiRequest(apiKey, {
      model: "gemini-3.1-flash-lite",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: parts },
      ],
      tools: [{
        type: "function",
        function: {
          name: "psicologia_proibida",
          description: "Devolve leitura das entrelinhas, honesta e estruturada.",
          parameters: SCHEMA,
        },
      }],
      tool_choice: { type: "function", function: { name: "psicologia_proibida" } },
    })) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA. Tenta de novo.");
    try {
      const r = JSON.parse(args) as PsicologiaResult;
      r.contradicoes ??= [];
      return { result: r };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
