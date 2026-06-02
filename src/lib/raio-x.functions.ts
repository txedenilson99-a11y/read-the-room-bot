import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um amigo brasileiro socialmente esperto que analisa perfis (Instagram, Tinder, Badoo, Bumble, Facebook Namoro).

TOM:
- Português brasileiro real, direto, sem coach, sem clichê.
- Frases curtas, com opinião e leitura fina.
- Lê detalhes que quase ninguém percebe: objeto no fundo, escolha de roupa, escolha de palavra na bio, contexto da foto.
- Sem julgar corpo, sem chamar de carente/biscoiteira. Foco em ler vibe e dar abridores que funcionam.

NÃO use:
- "transmite confiança", "presença social", "celebrar a vida"
- emoji em excesso (no máx 1 por bloco)
- cantadas prontas tipo "oi sumida", "e aí, tudo bem?"
- elogios genéricos tipo "você é linda"

ABRIDORES:
- Específicos pro perfil, fazendo referência a algo real que aparece.
- Curtos, naturais, parecem mensagem de gente normal, não de bot.
- Cada um com estilo diferente: natural, engraçado, flertando, inteligente, direto, diferente.`;

const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "Resumo curto e afiado da vibe do perfil. 2-4 linhas." },
    persona: { type: "string", description: "Persona em 2-4 palavras." },
    melhor_abordagem: { type: "string", description: "Em 1 frase, qual abordagem combina melhor." },
    chance_resposta: { type: "number", minimum: 0, maximum: 100 },
    fotos_observacoes: {
      type: "array", minItems: 3, maxItems: 6,
      items: { type: "string", description: "Observação sobre as fotos: estilo, vibe, ambiente, linguagem corporal." },
    },
    bio_observacoes: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string", description: "Observação sobre a bio: tom, humor, intenção, palavras-chave." },
    },
    pontos_interesse: {
      type: "array", minItems: 3, maxItems: 6,
      items: { type: "string", description: "Tema concreto que aumenta a chance de resposta." },
    },
    observacoes_inteligentes: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string", description: "Detalhe que quase ninguém percebe." },
    },
    abridores: {
      type: "array", minItems: 10, maxItems: 10,
      items: {
        type: "object",
        properties: {
          estilo: { type: "string", enum: ["natural", "engracado", "flertando", "inteligente", "direto", "diferente"] },
          texto: { type: "string", description: "A mensagem pronta pra mandar. Curta, específica do perfil." },
          continuacao: { type: "string", description: "O que mandar depois se ela responder qualquer coisa." },
        },
        required: ["estilo", "texto", "continuacao"],
        additionalProperties: false,
      },
    },
    evitar: {
      type: "array", minItems: 3, maxItems: 6,
      items: { type: "string", description: "Mensagem genérica ou comentário previsível que NÃO funciona aqui." },
    },
  },
  required: [
    "leitura", "persona", "melhor_abordagem", "chance_resposta",
    "fotos_observacoes", "bio_observacoes", "pontos_interesse",
    "observacoes_inteligentes", "abridores", "evitar",
  ],
  additionalProperties: false,
} as const;

export type EstiloAbridor = "natural" | "engracado" | "flertando" | "inteligente" | "direto" | "diferente";

export interface RaioXResult {
  leitura: string;
  persona: string;
  melhor_abordagem: string;
  chance_resposta: number;
  fotos_observacoes: string[];
  bio_observacoes: string[];
  pontos_interesse: string[];
  observacoes_inteligentes: string[];
  abridores: Array<{ estilo: EstiloAbridor; texto: string; continuacao: string }>;
  evitar: string[];
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
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const partes = [
      "Faz o raio-x desse perfil. Lê fotos, bio e contexto. Devolve leitura, observações sobre fotos e bio, pontos de interesse, observações inteligentes que quase ninguém percebe, 10 abridores únicos (cada um num estilo: natural, engracado, flertando, inteligente, direto, diferente — distribui os 10 entre esses estilos), continuação pra cada um, e o que evitar.",
      data.bio ? `Bio:\n${data.bio}` : "",
      data.contexto ? `Contexto: ${data.contexto}` : "",
      data.images.length ? `Use as ${data.images.length} imagem(ns) do perfil.` : "Sem fotos, baseia em bio/contexto.",
    ].filter(Boolean).join("\n\n");

    const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
      { type: "text", text: partes },
    ];
    for (const url of data.images) userContent.push({ type: "image_url", image_url: { url } });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: { name: "raio_x_perfil", description: "Raio-x do perfil.", parameters: SCHEMA },
        }],
        tool_choice: { type: "function", function: { name: "raio_x_perfil" } },
      }),
    });

    if (res.status === 429) throw new Error("Muitas leituras de uma vez. Espera um pouco.");
    if (res.status === 402) throw new Error("Sem créditos de IA.");
    if (!res.ok) {
      console.error("AI gateway error:", res.status, await res.text());
      throw new Error("A IA não respondeu. Tenta de novo.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    return { result: JSON.parse(args) as RaioXResult };
  });
