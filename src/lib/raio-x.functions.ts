import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiChat } from "./gemini";

const TIPOS_PERFIL = [
  "Visual",
  "Selfie",
  "Social",
  "Viajante",
  "Fitness",
  "Cultural",
  "Interior",
  "Pet Lover",
  "Automotivo",
  "Foodie",
  "Gamer",
  "Intelectual",
  "Low Profile",
] as const;

const SYSTEM = `Você é um amigo brasileiro socialmente esperto. Faz o Raio-X v5.20 de um perfil (Instagram, Tinder, Badoo, Bumble, Facebook Namoro).

REGRA DE OURO:
- SÓ fatos observáveis. NUNCA inventa personalidade, intenção, sentimento ou objetivo dela no app.
- Se não dá pra ver, diga que não dá pra ver. Honestidade > adivinhação.
- Foco em CONTEXTO REAL do perfil, não em fantasia.

DETECTOR DE PERFIL — escolha UM tipo principal (com confiança 0-100 e 3-5 motivos curtos):
Visual, Selfie, Social, Viajante, Fitness, Cultural, Interior, Pet Lover, Automotivo, Foodie, Gamer, Intelectual, Low Profile.

FATOS OBSERVADOS — só o que dá pra ver/ler:
quantidade de fotos, presença de selfies, presença de amigos, locais, objetos recorrentes, estilo visual, info da bio, cidade, trabalho, hobbies visíveis.
Se não aparece, NÃO inclua.

ASSUNTOS ENCONTRADOS — ganchos reais (cidade, trabalho, lugares, música, pets, esporte, estilo, viagens, rotina, hobbies). Só os que aparecem.

ABRIDORES (10) — naturais, curtos, parecem mensagem de gente real:
- minúsculo na maioria, frases curtas, "kkk" quando couber, sem cantada
- ancorados em algo que aparece no perfil
- nada de "oi linda", "tudo bem?", elogio físico, pergunta de entrevista
Mais o MELHOR ABRIDOR (escolha 1 dos 10 ou outro).

CONFIANÇA DA LEITURA — 4 medidores 0-100:
fatos_observados (alto), interesses (médio), personalidade (baixo), objetivo_no_app (muito baixo).

O QUE A IA NÃO SABE — liste o que não dá pra cravar (timidez, extroversão, intenção, nível de interesse, como ela conversa, se quer relacionamento).

RESUMO FINAL — tipo de perfil, assunto mais forte, melhor estratégia, risco (Baixo/Médio/Alto), objetivo.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    tipo_perfil: {
      type: "object",
      properties: {
        principal: { type: "string", enum: TIPOS_PERFIL as unknown as string[] },
        confianca: { type: "number", minimum: 0, maximum: 100 },
        motivos: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
      },
      required: ["principal", "confianca", "motivos"],
      additionalProperties: false,
    },
    fatos_observados: {
      type: "array", minItems: 3, maxItems: 12,
      items: { type: "string", description: "Fato curto e concreto sobre o perfil." },
    },
    assuntos_encontrados: {
      type: "array", minItems: 3, maxItems: 10,
      items: { type: "string", description: "Assunto/gancho real pra conversa." },
    },
    melhor_abridor: { type: "string", description: "Mensagem pronta. Curta, natural, ancorada em algo do perfil." },
    abridores: {
      type: "array", minItems: 10, maxItems: 10,
      items: { type: "string", description: "Mensagem pronta. Curta, humana, sem cantada." },
    },
    evitar: {
      type: "array", minItems: 4, maxItems: 8,
      items: { type: "string", description: "Mensagem genérica/cringe que NÃO funciona." },
    },
    chance_resposta: {
      type: "object",
      properties: {
        valor: { type: "number", minimum: 0, maximum: 100 },
        motivos: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
      },
      required: ["valor", "motivos"],
      additionalProperties: false,
    },
    confianca_leitura: {
      type: "object",
      properties: {
        fatos_observados: { type: "number", minimum: 0, maximum: 100 },
        interesses: { type: "number", minimum: 0, maximum: 100 },
        personalidade: { type: "number", minimum: 0, maximum: 100 },
        objetivo_no_app: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["fatos_observados", "interesses", "personalidade", "objetivo_no_app"],
      additionalProperties: false,
    },
    nao_sabe: {
      type: "array", minItems: 3, maxItems: 8,
      items: { type: "string", description: "Algo que a IA honestamente não pode cravar." },
    },
    resumo: {
      type: "object",
      properties: {
        tipo_perfil: { type: "string" },
        assunto_mais_forte: { type: "string" },
        melhor_estrategia: { type: "string" },
        risco: { type: "string", enum: ["Baixo", "Médio", "Alto"] },
        objetivo: { type: "string" },
      },
      required: ["tipo_perfil", "assunto_mais_forte", "melhor_estrategia", "risco", "objetivo"],
      additionalProperties: false,
    },
  },
  required: [
    "tipo_perfil", "fatos_observados", "assuntos_encontrados",
    "melhor_abridor", "abridores", "evitar",
    "chance_resposta", "confianca_leitura", "nao_sabe", "resumo",
  ],
  additionalProperties: false,
} as const;

export type TipoPerfil = (typeof TIPOS_PERFIL)[number];

export interface RaioXResult {
  tipo_perfil: { principal: TipoPerfil; confianca: number; motivos: string[] };
  fatos_observados: string[];
  assuntos_encontrados: string[];
  melhor_abridor: string;
  abridores: string[];
  evitar: string[];
  chance_resposta: { valor: number; motivos: string[] };
  confianca_leitura: {
    fatos_observados: number;
    interesses: number;
    personalidade: number;
    objetivo_no_app: number;
  };
  nao_sabe: string[];
  resumo: {
    tipo_perfil: string;
    assunto_mais_forte: string;
    melhor_estrategia: string;
    risco: "Baixo" | "Médio" | "Alto";
    objetivo: string;
  };
}

export const raioXPerfil = createServerFn({ method: "POST" })
  .inputValidator((input: { bio?: string; contexto?: string; images?: string[] }) => {
    const bio = (input.bio ?? "").slice(0, 1500);
    const contexto = (input.contexto ?? "").slice(0, 1500);
    const images = Array.isArray(input.images) ? input.images.slice(0, 8) : [];
    for (const img of images) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) throw new Error("Imagem inválida.");
      if (img.length > 5_000_000) throw new Error("Imagem muito pesada.");
    }
    if (!bio && !contexto && images.length === 0) {
      throw new Error("Manda pelo menos uma foto, bio ou contexto.");
    }
    return { bio, contexto, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const partes = [
      "Faz o Raio-X v5.20 desse perfil. Detecta o tipo, lista só fatos observáveis, assuntos reais, 10 abridores naturais, melhor abridor, o que evitar, chance de resposta com motivos, confiança da leitura (4 medidores), o que a IA não sabe e o resumo final.",
      data.bio ? `Bio:\n${data.bio}` : "",
      data.contexto ? `Contexto: ${data.contexto}` : "",
      data.images.length ? `Use as ${data.images.length} imagem(ns) do perfil.` : "Sem fotos, baseia em bio/contexto.",
    ].filter(Boolean).join("\n\n");

    const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
      { type: "text", text: partes },
    ];
    for (const url of data.images) userContent.push({ type: "image_url", image_url: { url } });

        const json = await geminiChat(apiKey, {
        model: "gemini-flash-latest",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: { name: "raio_x_perfil", description: "Raio-X v5.20 do perfil.", parameters: SCHEMA },
        }],
        tool_choice: { type: "function", function: { name: "raio_x_perfil" } },
      }) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    return { result: JSON.parse(args) as RaioXResult };
  });
