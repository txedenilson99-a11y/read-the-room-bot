import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é um leitor de conversa brasileiro maduro, calmo e BRUTALMENTE honesto. Sua função é dizer se JÁ EXISTE contexto suficiente pra chamar a pessoa pra sair — e nada além disso.

REGRA DE HONESTIDADE (CRÍTICA):
- Você NÃO inventa interesse. Você NÃO cria falsa expectativa.
- Só afirma sinal de interesse se ele estiver LITERALMENTE visível na conversa (pergunta feita, iniciativa, assunto mantido, resposta rápida, emoji, curiosidade).
- Conversa curta ou seca = compatibilidade BAIXA e momento "vermelho" ou "amarelo". Sem exceção.
- Se faltar evidência, diga isso com calma e mantenha a confiança BAIXA.
- Nunca diga "ela tá afim", "ela quer sair com você", "ela gosta de você". Use linguagem de possibilidade.

MOMENTO (CRÍTICA):
- "verde" só se houver reciprocidade clara: ela pergunta, mantém assunto, toma iniciativa em mais de um momento.
- "amarelo" quando ela responde bem mas não investe.
- "vermelho" quando as respostas são secas, demoradas, ou o papo é raso/novo demais.

CONVITES:
- Curtos (máx 16 palavras), naturais, sem cantada pronta, sem pedido de desculpa, sem ansiedade.
- Ancorados em algo REAL da conversa quando existir.
- PROIBIDO: "posso te pagar um drink?", "você é linda", "queria muito te conhecer", "se você quiser, sem problema", "desculpa incomodar", "não sei se você vai querer".
- Nada de convite longo, explicação, ou justificativa.

TOM: minúsculas, jeito de DM/WhatsApp, gírias leves, sem coach, sem frase de internet.` + IA_HONESTA;

const CONVITE_CATEGORIAS = [
  "natural",
  "engracado",
  "flertando",
  "inteligente",
  "confiante",
  "misterioso",
  "elegante",
  "direto",
] as const;

const RECUSA_CATEGORIAS = ["natural", "elegante", "engracada", "confiante"] as const;

const SCHEMA = {
  type: "object",
  properties: {
    compatibilidade: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Nota 0-100 de compatibilidade real com base SÓ no que aparece na conversa. Conversa curta/seca = abaixo de 40.",
    },
    compatibilidade_nota: { type: "string", description: "1 linha honesta explicando a nota." },
    momento: {
      type: "string",
      enum: ["verde", "amarelo", "vermelho"],
      description: "verde = pode convidar; amarelo = melhor esperar; vermelho = ainda não é o momento.",
    },
    momento_motivo: { type: "string", description: "2-3 linhas explicando claramente o motivo do momento escolhido." },
    confianca: { type: "number", minimum: 0, maximum: 100, description: "Confiança da IA nessa leitura." },
    confianca_evidencias: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" },
      description: "Evidências CONCRETAS da conversa que sustentam a conclusão. Curtas.",
    },
    confianca_limites: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" },
      description: "O que NÃO dá pra confirmar com o material enviado.",
    },
    sinais_positivos: {
      type: "array",
      minItems: 0,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          sinal: {
            type: "string",
            enum: [
              "faz_perguntas",
              "mantem_assunto",
              "responde_rapido",
              "usa_emojis",
              "demonstra_curiosidade",
              "toma_iniciativa",
            ],
          },
          presente: { type: "boolean" },
          evidencia: { type: "string", description: "Trecho ou fato da conversa. Se ausente, '—'." },
        },
        required: ["sinal", "presente", "evidencia"],
        additionalProperties: false,
      },
      description: "Checklist dos 6 sinais positivos, todos avaliados.",
    },
    sinais_negativos: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          sinal: {
            type: "string",
            enum: [
              "respostas_secas",
              "demora_constante",
              "falta_de_interesse",
              "ignora_perguntas",
              "muda_de_assunto",
            ],
          },
          presente: { type: "boolean" },
          evidencia: { type: "string" },
        },
        required: ["sinal", "presente", "evidencia"],
        additionalProperties: false,
      },
      description: "Checklist dos 5 sinais negativos, todos avaliados.",
    },
    encontro_ideal: {
      type: "string",
      enum: ["cafe", "bar", "jantar", "cinema", "parque", "caminhada", "evento", "sorvete"],
    },
    encontro_porque: { type: "string", description: "Por que esse encontro combina com o contexto real da conversa." },
    encontro_alternativo: {
      type: "string",
      enum: ["cafe", "bar", "jantar", "cinema", "parque", "caminhada", "evento", "sorvete"],
    },
    horario_ideal: {
      type: "string",
      enum: ["hoje", "amanha", "fim_de_semana", "depois_do_trabalho", "espere_alguns_dias"],
    },
    horario_porque: { type: "string", description: "1-2 linhas explicando o timing." },
    convites: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          categoria: { type: "string", enum: CONVITE_CATEGORIAS as unknown as string[] },
          texto: { type: "string", description: "Convite curto, máx 16 palavras, minúsculas, natural." },
          chance: { type: "number", minimum: 0, maximum: 100, description: "Chance estimada de aceite." },
        },
        required: ["categoria", "texto", "chance"],
        additionalProperties: false,
      },
      description: "Exatamente 8 convites, um de cada categoria, na ordem: natural, engracado, flertando, inteligente, confiante, misterioso, elegante, direto.",
    },
    se_recusar: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          categoria: { type: "string", enum: RECUSA_CATEGORIAS as unknown as string[] },
          texto: { type: "string", description: "Resposta curta pra manter o clima leve, sem insistir, sem mágoa." },
        },
        required: ["categoria", "texto"],
        additionalProperties: false,
      },
    },
    evitar: {
      type: "array",
      minItems: 5,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          erro: { type: "string", description: "O erro (ex: 'Demonstrar ansiedade')." },
          porque: { type: "string", description: "1 linha do porquê queima o convite." },
        },
        required: ["erro", "porque"],
        additionalProperties: false,
      },
    },
    resumo: { type: "string", description: "2-3 linhas de veredito final honesto." },
  },
  required: [
    "compatibilidade",
    "compatibilidade_nota",
    "momento",
    "momento_motivo",
    "confianca",
    "confianca_evidencias",
    "confianca_limites",
    "sinais_positivos",
    "sinais_negativos",
    "encontro_ideal",
    "encontro_porque",
    "encontro_alternativo",
    "horario_ideal",
    "horario_porque",
    "convites",
    "se_recusar",
    "evitar",
    "resumo",
  ],
  additionalProperties: false,
} as const;

export type SinalPositivo =
  | "faz_perguntas"
  | "mantem_assunto"
  | "responde_rapido"
  | "usa_emojis"
  | "demonstra_curiosidade"
  | "toma_iniciativa";

export type SinalNegativo =
  | "respostas_secas"
  | "demora_constante"
  | "falta_de_interesse"
  | "ignora_perguntas"
  | "muda_de_assunto";

export type TipoEncontro =
  | "cafe" | "bar" | "jantar" | "cinema" | "parque" | "caminhada" | "evento" | "sorvete";

export type HorarioIdeal =
  | "hoje" | "amanha" | "fim_de_semana" | "depois_do_trabalho" | "espere_alguns_dias";

export interface EncontroResult {
  compatibilidade: number;
  compatibilidade_nota: string;
  momento: "verde" | "amarelo" | "vermelho";
  momento_motivo: string;
  confianca: number;
  confianca_evidencias: string[];
  confianca_limites: string[];
  sinais_positivos: { sinal: SinalPositivo; presente: boolean; evidencia: string }[];
  sinais_negativos: { sinal: SinalNegativo; presente: boolean; evidencia: string }[];
  encontro_ideal: TipoEncontro;
  encontro_porque: string;
  encontro_alternativo: TipoEncontro;
  horario_ideal: HorarioIdeal;
  horario_porque: string;
  convites: { categoria: string; texto: string; chance: number }[];
  se_recusar: { categoria: string; texto: string }[];
  evitar: { erro: string; porque: string }[];
  resumo: string;
}

export const marcarEncontro = createServerFn({ method: "POST" })
  .inputValidator((input: { conversa?: string; contexto?: string; images?: string[] }) => {
    const conversa = (input?.conversa ?? "").slice(0, 6000).trim();
    const contexto = (input?.contexto ?? "").slice(0, 1000).trim();
    const images = Array.isArray(input?.images)
      ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    }
    if (!conversa && images.length === 0) {
      throw new Error("Cola a conversa ou manda os prints.");
    }
    return { conversa, contexto, images };
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
        text: `Analisa a conversa abaixo e diz, com honestidade total, se já existe contexto suficiente pra chamar a pessoa pra sair. Avalie TODOS os sinais positivos e negativos do checklist (marque presente=false quando não houver prova). Depois gere os 8 convites e as 4 respostas pra caso ela recuse.${
          data.conversa ? `\n\nConversa:\n${data.conversa}` : ""
        }${data.contexto ? `\n\nContexto extra:\n${data.contexto}` : ""}${
          data.images.length ? `\n\n${data.images.length} print(s) anexado(s).` : ""
        }`,
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
            name: "marcar_encontro",
            description: "Analisa a conversa e diz se dá pra convidar pra sair, com convites prontos.",
            parameters: SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "marcar_encontro" } },
    })) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    try {
      return { result: JSON.parse(args) as EncontroResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
