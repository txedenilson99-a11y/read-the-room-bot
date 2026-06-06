import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiRequest } from "./gemini";

const ESTILOS = ["provocador", "atrevido", "madrugada", "duplo_sentido", "quimica"] as const;
export type Modo18Estilo = (typeof ESTILOS)[number];

const ESTILO_GUIA: Record<Modo18Estilo, string> = {
  provocador: "Cria curiosidade e tensão. Frases que abrem espaço pra ela querer responder. Sem cantada pronta.",
  atrevido: "Confiança e atitude. Direto mas elegante. Sem grosseria, sem apelão, sem vulgaridade.",
  madrugada: "Clima íntimo, voz baixa, presença. Lento, envolvente, sem pressa. Nada invasivo.",
  duplo_sentido: "Brincadeira inteligente com duplo sentido leve. Sutil, não escancarado, não vulgar.",
  quimica: "Conexão e atração natural. Tom presente, observador, com química sem precisar dizer.",
};

const SYSTEM = `Você é um leitor de conversa brasileiro maduro, confiante e provocativo. Modo 18+: flerte intenso, química e tensão. Continua sendo CALMO e ELEGANTE — nunca apelativo, nunca vulgar, nunca cringe.

REGRAS DO MODO 18+:
- Cria respostas mais ousadas, confiantes e provocativas que o modo normal.
- Mantém naturalidade de DM/WhatsApp. Frases curtas, minúsculas, gírias leves.
- Tensão sutil > apelo explícito. Charme > cantada. Provocação > elogio.

A IA DEVE:
✓ ser confiante, divertida e provocativa
✓ criar química real, sem forçar
✓ manter naturalidade brasileira

A IA NÃO DEVE:
✗ parecer desesperada, carente ou fã
✗ usar cantada pronta ou frase de internet
✗ repetir elogio físico genérico ("linda", "gata", "perfeita", "deusa", "musa", "maravilhosa")
✗ ser vulgar, explícita ou apelativa
✗ parecer robô, coach ou guru
✗ inventar interesse que não tem prova no print

LEITURA:
- Lê APENAS a última resposta real dela + contexto visível.
- Resposta curta dela = resposta curta sua, com tensão/provocação baixa.
- Se não há evidência de interesse, NÃO diga "ela tá afim". Use possibilidade.

POSTURA:
- Calma, presença, sem pressa, sem ansiedade.
- Confiança vem da postura, não do volume.
- Provoca pelo que observa no contexto real — não pela aparência dela.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "1-2 linhas: o que dá pra ler do clima/contexto agora." },
    quimica: { type: "number", minimum: 0, maximum: 100, description: "Nível de química atual baseado em evidência." },
    tensao: { type: "number", minimum: 0, maximum: 100, description: "Tensão/provocação no ar." },
    abertura: { type: "number", minimum: 0, maximum: 100, description: "Abertura dela pra flerte, com base em sinais reais." },
    mensagens: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", description: "Rótulo curto: provocador, atrevido, química, etc." },
          texto: { type: "string", description: "Mensagem pronta pra enviar. Curta, natural, no estilo do modo." },
        },
        required: ["tipo", "texto"],
        additionalProperties: false,
      },
    },
    porque_funciona: { type: "string", description: "1-2 linhas: por que essa abordagem funciona agora." },
    evitar: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" },
      description: "Atitudes/frases que matam o clima.",
    },
    proximo_passo: { type: "string", description: "1 linha sobre o melhor caminho daqui pra frente." },
  },
  required: ["leitura", "quimica", "tensao", "abertura", "mensagens", "porque_funciona", "evitar", "proximo_passo"],
  additionalProperties: false,
} as const;

export interface Modo18Result {
  leitura: string;
  quimica: number;
  tensao: number;
  abertura: number;
  mensagens: { tipo: string; texto: string }[];
  porque_funciona: string;
  evitar: string[];
  proximo_passo: string;
}

export const gerarModo18 = createServerFn({ method: "POST" })
  .inputValidator((input: { contexto?: string; estilo?: Modo18Estilo; images?: string[] }) => {
    const contexto = (input?.contexto ?? "").slice(0, 4000).trim();
    const estilo: Modo18Estilo = ESTILOS.includes(input?.estilo as Modo18Estilo)
      ? (input!.estilo as Modo18Estilo)
      : "provocador";
    const images = Array.isArray(input?.images)
      ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    }
    if (!contexto && images.length === 0) {
      throw new Error("Manda o print ou descreve a situação.");
    }
    return { contexto, estilo, images };
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
        text: `Modo 18+ — estilo "${data.estilo}" (${ESTILO_GUIA[data.estilo]}).

Lê o print/contexto e devolve 4 mensagens prontas, no estilo escolhido, confiantes e provocativas, sem cair em cantada pronta ou vulgaridade. Mantém leitura honesta dos sinais.${data.contexto ? `\n\nContexto / conversa:\n${data.contexto}` : ""}${data.images.length ? `\n\n${data.images.length} imagem(ns) anexada(s).` : ""}`,
      },
      ...data.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];

        const json = await geminiRequest(apiKey, {
        model: "gemini-flash-latest",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: parts },
        ],
        tools: [{
          type: "function",
          function: {
            name: "modo_18",
            description: "Devolve leitura + 4 mensagens no modo 18+.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "modo_18" } },
      }) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    try {
      return { result: JSON.parse(args) as Modo18Result };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
