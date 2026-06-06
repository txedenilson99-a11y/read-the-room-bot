import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiRequest } from "./gemini";

const SYSTEM_BASE = `Você é um amigo brasileiro socialmente esperto, jovem, direto, sem papas na língua. Não é IA, não é coach, não é terapeuta, não é relatório técnico.

COMO FALAR:
- Português brasileiro real, gíria leve, conversa de WhatsApp.
- Frases curtas, com opinião. Sem enrolar.
- Lê ego, biscoito, carência, joguinho, quem tá fingindo lifestyle.
- Tem personalidade. Sincero, mesmo quando dói. Não suaviza pra agradar.

NUNCA use:
- "transmite confiança", "presença social", "dinâmica interpessoal"
- "celebrar a vida", "compartilhar momentos", "autoestima saudável"
- linguagem corporativa, de coach, positividade tóxica
- mais de 1 emoji por bloco inteiro

EXEMPLOS DO TOM:
- "Bio em inglês, frase de filme. Tá tentando demais."
- "Feed sem identidade. Parece perfil de quem ainda tá se descobrindo."
- "Foto sempre sozinho. Passa que não tem círculo social."
- "Bio carente. Quem tá bem não escreve isso."
- "Tem ego, mas é o tipo que entrega que precisa de validação."

Seja honesto. Se o perfil é forte, fala. Se é fraco, fala também. Sem maquiar.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    veredito: {
      type: "string",
      enum: ["forte", "atraente", "interessante", "fraco", "carente", "fake", "sem-presenca"],
      description: "Categoria geral do perfil.",
    },
    titulo: { type: "string", description: "Frase curta e afiada resumindo o perfil. 1 linha." },
    leitura: { type: "string", description: "2-4 linhas de leitura honesta do perfil." },
    notas: {
      type: "object",
      properties: {
        geral: { type: "number", minimum: 0, maximum: 100 },
        atracao: { type: "number", minimum: 0, maximum: 100 },
        social: { type: "number", minimum: 0, maximum: 100 },
        confianca: { type: "number", minimum: 0, maximum: 100 },
        autenticidade: { type: "number", minimum: 0, maximum: 100 },
        interesse: { type: "number", minimum: 0, maximum: 100, description: "Chance de gerar interesse" },
      },
      required: ["geral", "atracao", "social", "confianca", "autenticidade", "interesse"],
      additionalProperties: false,
    },
    radar: {
      type: "object",
      description: "Notas 0-100 dos 6 eixos do radar social.",
      properties: {
        aparencia: { type: "number", minimum: 0, maximum: 100 },
        bio: { type: "number", minimum: 0, maximum: 100 },
        lifestyle: { type: "number", minimum: 0, maximum: 100 },
        social: { type: "number", minimum: 0, maximum: 100 },
        presenca: { type: "number", minimum: 0, maximum: 100 },
        confianca: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["aparencia", "bio", "lifestyle", "social", "presenca", "confianca"],
      additionalProperties: false,
    },
    flags: {
      type: "object",
      properties: {
        fake: { type: "number", minimum: 0, maximum: 100, description: "Probabilidade de perfil fake." },
        carencia: { type: "number", minimum: 0, maximum: 100, description: "Nível de carência exposta." },
        ego: { type: "number", minimum: 0, maximum: 100, description: "Excesso de ego/validação." },
      },
      required: ["fake", "carencia", "ego"],
      additionalProperties: false,
    },
    red_flags: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string", description: "Red flag curta e direta." },
    },
    ruim: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string", description: "O que está ruim. Frase curta." },
    },
    melhorar: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string", description: "O que melhorar. Frase curta e acionável." },
    },
    parecer_interessante: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string", description: "Como parecer mais interessante. Frase curta." },
    },
    nova_bio: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string", description: "Sugestão de bio pronta. Curta, com peso, sem clichê." },
    },
    ideias_fotos: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: { type: "string", description: "Ideia de foto que vai elevar o perfil." },
    },
    frases_destaque: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string", description: "Frase pronta para destaque/legenda." },
    },
    dicas_engajamento: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string", description: "Dica concreta pra subir engajamento." },
    },
    comparacao: {
      type: "string",
      description: "Comparação curta com perfis populares do mesmo nicho. 1-2 linhas.",
    },
  },
  required: [
    "veredito", "titulo", "leitura", "notas", "radar", "flags",
    "red_flags", "ruim", "melhorar", "parecer_interessante",
    "nova_bio", "ideias_fotos", "frases_destaque", "dicas_engajamento", "comparacao",
  ],
  additionalProperties: false,
} as const;

export type Veredito = "forte" | "atraente" | "interessante" | "fraco" | "carente" | "fake" | "sem-presenca";

export interface PerfilIGResult {
  veredito: Veredito;
  titulo: string;
  leitura: string;
  notas: {
    geral: number; atracao: number; social: number;
    confianca: number; autenticidade: number; interesse: number;
  };
  radar: {
    aparencia: number; bio: number; lifestyle: number;
    social: number; presenca: number; confianca: number;
  };
  flags: { fake: number; carencia: number; ego: number };
  red_flags: string[];
  ruim: string[];
  melhorar: string[];
  parecer_interessante: string[];
  nova_bio: string[];
  ideias_fotos: string[];
  frases_destaque: string[];
  dicas_engajamento: string[];
  comparacao: string;
}

export const analisarPerfilInstagram = createServerFn({ method: "POST" })
  .inputValidator((input: {
    handle?: string;
    bio?: string;
    contexto?: string;
    imagens?: string[];
  }) => {
    const handle = (input.handle ?? "").trim().replace(/^@/, "").slice(0, 60);
    const bio = (input.bio ?? "").slice(0, 1000);
    const contexto = (input.contexto ?? "").slice(0, 1500);
    const imagens = Array.isArray(input.imagens) ? input.imagens.slice(0, 6) : [];
    for (const img of imagens) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) {
        throw new Error("Uma das imagens é inválida.");
      }
      if (img.length > 5_000_000) throw new Error("Imagem muito pesada. Tenta uma menor.");
    }
    if (!handle && !bio && imagens.length === 0) {
      throw new Error("Manda o @, a bio ou pelo menos um print.");
    }
    return { handle, bio, contexto, imagens };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const partes: string[] = [
      "Analisa esse perfil de Instagram de forma honesta, sem suavizar.",
      data.handle ? `@${data.handle}` : "",
      data.bio ? `Bio:\n${data.bio}` : "",
      data.contexto ? `Contexto extra: ${data.contexto}` : "",
      data.imagens.length
        ? `Use as ${data.imagens.length} imagem(ns) anexadas (prints/fotos do perfil) pra basear a análise visual.`
        : "Sem prints. Baseia a análise no @ e/ou bio.",
      "Devolve veredito, leitura, notas 0-100, radar dos 6 eixos, flags (fake/carência/ego), red flags, o que tá ruim, o que melhorar, como parecer mais interessante, 3 sugestões de bio nova, ideias de foto, frases pra destaque, dicas de engajamento e uma comparação curta com perfis populares do nicho.",
    ].filter(Boolean);

    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [{ type: "text", text: partes.join("\n\n") }];

    for (const url of data.imagens) {
      userContent.push({ type: "image_url", image_url: { url } });
    }

    const body = {
      model: "gemini-flash-latest",
      messages: [
        { role: "system", content: SYSTEM_BASE },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "analisar_perfil_ig",
            description: "Devolve análise estruturada de um perfil do Instagram.",
            parameters: SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "analisar_perfil_ig" } },
    };

        const json = await geminiRequest(apiKey, body) as {
      choices?: Array<{
        message?: { tool_calls?: Array<{ function?: { arguments?: string } }> };
      }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(args);
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }

    return { result: parsed as PerfilIGResult };
  });
