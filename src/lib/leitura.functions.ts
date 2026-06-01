import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um leitor comportamental brasileiro, socialmente esperto, frio e preciso. NÃO é coach, NÃO é terapeuta, NÃO é IA fofa. Você lê o que tá por trás das palavras, fotos, stories e atitudes.

COMO LER:
- Foca em sinais, padrões, contradição, micro-comportamento.
- Diferencia interesse real de educação, biscoito, joguinho, tédio, validação.
- Aponta intenção oculta sem inventar.
- Direto, seco, sem suavizar. Sem clichê de autoajuda.

NUNCA use:
- "transmite confiança", "energia única", "vibe especial", "linguagem do amor"
- "celebrar", "compartilhar momento", "vulnerabilidade saudável"
- emoji em excesso, mais de 1 por bloco
- generalidades vazias ("ela pode estar passando por algo")

TOM DOS EXEMPLOS:
- "Não é interesse. É educação pra não parecer mal."
- "Tá testando se você corre atrás. Não corre."
- "Responde rápido quando tá entediada, some quando tem opção melhor."
- "O story é pra alguém. Não é pra você."
- "Quer atenção, não quer compromisso."

Se não dá pra ler com o que foi enviado, fala. Não inventa.`;

const SCHEMA = {
  type: "object",
  properties: {
    veredito: {
      type: "string",
      enum: [
        "interesse-real",
        "interesse-morno",
        "educação",
        "joguinho",
        "validação",
        "biscoito",
        "desinteresse",
        "tédio",
        "manipulação",
        "indefinido",
      ],
    },
    titulo: { type: "string", description: "1 linha afiada resumindo o que tá rolando." },
    leitura: { type: "string", description: "3-6 linhas explicando o subtexto, sem encheção." },
    transmitindo: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string", description: "Sinal claro que a pessoa tá emitindo." },
    },
    sinais_interesse: {
      type: "array", minItems: 0, maxItems: 6,
      items: { type: "string" },
    },
    sinais_desinteresse: {
      type: "array", minItems: 0, maxItems: 6,
      items: { type: "string" },
    },
    contradicoes: {
      type: "array", minItems: 0, maxItems: 5,
      items: { type: "string", description: "Onde o discurso bate de frente com o comportamento." },
    },
    intencoes_ocultas: {
      type: "array", minItems: 0, maxItems: 5,
      items: { type: "string" },
    },
    medidores: {
      type: "object",
      properties: {
        interesse_real: { type: "number", minimum: 0, maximum: 100 },
        apenas_educacao: { type: "number", minimum: 0, maximum: 100 },
        joguinho: { type: "number", minimum: 0, maximum: 100 },
        carencia: { type: "number", minimum: 0, maximum: 100 },
        risco_perder: { type: "number", minimum: 0, maximum: 100 },
        chance_evoluir: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["interesse_real","apenas_educacao","joguinho","carencia","risco_perder","chance_evoluir"],
      additionalProperties: false,
    },
    evitar: {
      type: "array", minItems: 3, maxItems: 6,
      items: { type: "string", description: "O que NÃO dizer/fazer agora." },
    },
    abordagem_ideal: {
      type: "string",
      description: "Qual postura/abordagem combina com o que tá rolando. 1-2 linhas.",
    },
    proximos_passos: {
      type: "array", minItems: 3, maxItems: 5,
      items: { type: "string", description: "Próximo movimento concreto e estratégico." },
    },
    frase_pronta: {
      type: "string",
      description: "1 mensagem curta, natural, que faz sentido AGORA. Sem cantada. Sem clichê.",
    },
  },
  required: [
    "veredito","titulo","leitura","transmitindo",
    "sinais_interesse","sinais_desinteresse","contradicoes","intencoes_ocultas",
    "medidores","evitar","abordagem_ideal","proximos_passos","frase_pronta",
  ],
  additionalProperties: false,
} as const;

export interface LeituraResult {
  veredito: string;
  titulo: string;
  leitura: string;
  transmitindo: string[];
  sinais_interesse: string[];
  sinais_desinteresse: string[];
  contradicoes: string[];
  intencoes_ocultas: string[];
  medidores: {
    interesse_real: number;
    apenas_educacao: number;
    joguinho: number;
    carencia: number;
    risco_perder: number;
    chance_evoluir: number;
  };
  evitar: string[];
  abordagem_ideal: string;
  proximos_passos: string[];
  frase_pronta: string;
}

export const lerComportamento = createServerFn({ method: "POST" })
  .inputValidator((input: { contexto?: string; images?: string[] }) => {
    const contexto = (input?.contexto ?? "").slice(0, 4000).trim();
    const images = Array.isArray(input?.images)
      ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    }
    if (!contexto && images.length === 0) {
      throw new Error("Manda o print, story, foto ou descreve a situação.");
    }
    return { contexto, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `Faz uma leitura comportamental honesta da situação abaixo. Aponta sinais reais, contradições, intenção, e qual abordagem combina agora. Sem suavizar, sem inventar.${data.contexto ? `\n\nContexto / situação:\n${data.contexto}` : ""}${data.images.length ? `\n\n${data.images.length} imagem(ns) anexada(s): print, story, perfil ou foto.` : ""}`,
      },
      ...data.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: parts },
        ],
        tools: [{
          type: "function",
          function: {
            name: "ler_comportamento",
            description: "Devolve leitura comportamental estruturada.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "ler_comportamento" } },
      }),
    });

    if (res.status === 429) throw new Error("Muitas leituras de uma vez. Espera um pouco.");
    if (res.status === 402) throw new Error("Sem créditos de IA. Adicione em Settings → Workspace → Usage.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error("A IA não respondeu agora. Tenta de novo.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    try {
      return { result: JSON.parse(args) as LeituraResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
