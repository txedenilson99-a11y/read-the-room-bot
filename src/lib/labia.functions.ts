import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você escreve respostas de WhatsApp/Instagram pra um cara real. Nome da ferramenta: Lábia de Cachorro. Dopamina rápida, zero enrolação.

O QUE VOCÊ ENTREGA:
- Respostas CURTAS (5 a 18 palavras). Só passa disso se o contexto realmente exigir.
- Minúsculas, jeito de DM, gíria leve quando cabe.
- Sempre ancorado no que a pessoa MANDOU. Nada genérico que serviria pra qualquer conversa.

PROIBIDO:
- textão, explicação antes da frase, linguagem de coach, técnica de manipulação.
- elogio gratuito ("linda", "perfeita", "gata", "amei", "que foto linda").
- soar carente ("me conta mais", "fiquei curioso", "queria te conhecer", "desculpa incomodar").
- palavras de IA: "claramente", "obviamente", "com certeza ela", "sem dúvida".
- afirmar sentimento/interesse da outra pessoa sem evidência.

PRIORIDADE: impacto → naturalidade → curiosidade → continuidade.
A resposta deve provocar reação natural: rir, responder, perguntar algo, continuar a brincadeira.
Nunca prometa "ela vai responder". Fale como "boa pra manter o papo vivo".

Adapte o nível de flerte ao contexto: papo frio = leve; papo solto = pode provocar mais.` + IA_HONESTA;

const MODOS = [
  "provocar",
  "fazer_rir",
  "criar_curiosidade",
  "flertar",
  "virar_o_jogo",
  "uma_linha",
] as const;

const CATEGORIAS = [
  "natural",
  "engracada",
  "confiante",
  "flertando",
  "provocadora",
  "misteriosa",
] as const;

export type ModoLabia = (typeof MODOS)[number];
export type CategoriaLabia = (typeof CATEGORIAS)[number];

const SCHEMA = {
  type: "object",
  properties: {
    melhor: {
      type: "object",
      properties: {
        texto: { type: "string", description: "A melhor resposta. Curta, 5-18 palavras, minúsculas." },
      },
      required: ["texto"],
      additionalProperties: false,
    },
    modos: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          modo: { type: "string", enum: MODOS as unknown as string[] },
          texto: { type: "string" },
        },
        required: ["modo", "texto"],
        additionalProperties: false,
      },
      description: "Uma resposta por modo, na ordem: provocar, fazer_rir, criar_curiosidade, flertar, virar_o_jogo, uma_linha.",
    },
    variacoes: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          categoria: { type: "string", enum: CATEGORIAS as unknown as string[] },
          texto: { type: "string" },
        },
        required: ["categoria", "texto"],
        additionalProperties: false,
      },
      description: "Uma resposta por categoria, na ordem: natural, engracada, confiante, flertando, provocadora, misteriosa.",
    },
    leitura: {
      type: "object",
      properties: {
        contexto_detectado: { type: "string", description: "1 linha do clima real da conversa." },
        melhor_abordagem: { type: "string", description: "Ex: 'Humor + provocação leve.'" },
        risco_forcado: { type: "string", enum: ["baixo", "medio", "alto"] },
      },
      required: ["contexto_detectado", "melhor_abordagem", "risco_forcado"],
      additionalProperties: false,
    },
  },
  required: ["melhor", "modos", "variacoes", "leitura"],
  additionalProperties: false,
} as const;

export interface LabiaResult {
  melhor: { texto: string };
  modos: { modo: ModoLabia; texto: string }[];
  variacoes: { categoria: CategoriaLabia; texto: string }[];
  leitura: {
    contexto_detectado: string;
    melhor_abordagem: string;
    risco_forcado: "baixo" | "medio" | "alto";
  };
}

function validarEntrada(input: { mensagem?: string; images?: string[] }) {
  const mensagem = (input?.mensagem ?? "").slice(0, 6000).trim();
  const images = Array.isArray(input?.images)
    ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
    : [];
  for (const img of images) {
    if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
  }
  if (!mensagem && images.length === 0) {
    throw new Error("Cola a mensagem ou manda o print.");
  }
  return { mensagem, images };
}

export const gerarLabia = createServerFn({ method: "POST" })
  .inputValidator(validarEntrada)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `Abaixo está o que a pessoa mandou (ou o print da conversa). Gere a MELHOR resposta pra mandar agora, mais uma por modo e uma por categoria. Curtas, naturais, ancoradas no contexto real.${
          data.mensagem ? `\n\nMensagem/conversa:\n${data.mensagem}` : ""
        }${data.images.length ? `\n\n${data.images.length} print(s) anexado(s).` : ""}`,
      },
      ...data.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];

    const json = (await geminiRequest(apiKey, {
      model: "gemini-flash-latest",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: parts },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "labia_de_cachorro",
            description: "Gera respostas curtas e naturais pra manter o papo vivo.",
            parameters: SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "labia_de_cachorro" } },
    })) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    try {
      const result = JSON.parse(args) as LabiaResult;
      if (!result?.melhor?.texto?.trim()) throw new Error("vazio");
      return { result };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });

// Regeneração leve: usa só o contexto já lido + as frases já usadas.
// Não refaz a análise completa da conversa (economiza chamada).
export const outraLabia = createServerFn({ method: "POST" })
  .inputValidator((input: { contexto?: string; abordagem?: string; usadas?: string[] }) => {
    const contexto = (input?.contexto ?? "").slice(0, 800).trim();
    const abordagem = (input?.abordagem ?? "").slice(0, 300).trim();
    const usadas = Array.isArray(input?.usadas)
      ? input!.usadas!.filter((s) => typeof s === "string").slice(0, 20)
      : [];
    if (!contexto) throw new Error("Sem contexto salvo. Gera a lábia primeiro.");
    return { contexto, abordagem, usadas };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const json = (await geminiRequest(apiKey, {
      model: "gemini-flash-latest",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Contexto da conversa já lido: ${data.contexto}${
            data.abordagem ? `\nMelhor abordagem: ${data.abordagem}` : ""
          }${
            data.usadas.length
              ? `\n\nJá usei estas, NÃO repita nem parafraseie:\n- ${data.usadas.join("\n- ")}`
              : ""
          }\n\nMe dá UMA nova resposta curta (5-18 palavras), diferente das anteriores.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "outra_labia",
            description: "Gera uma única resposta nova.",
            parameters: {
              type: "object",
              properties: { texto: { type: "string" } },
              required: ["texto"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "outra_labia" } },
    })) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    try {
      const parsed = JSON.parse(args) as { texto: string };
      if (!parsed?.texto?.trim()) throw new Error("vazio");
      return { texto: parsed.texto.trim() };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
