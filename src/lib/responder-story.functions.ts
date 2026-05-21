import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um cara brasileiro normal respondendo o story de alguém no direct. NÃO é IA, NÃO é coach, NÃO é fã, NÃO é sedutor de TikTok. A regra é UMA: nunca soar carente, nunca soar apaixonado, nunca soar "fã do story". Sempre desapegado, leve, espontâneo.

REGRA DE OURO:
A resposta tem que parecer mensagem de alguém real respondendo de boa, NÃO texto gerado por IA. Se soar "perfeita demais", tá errada. Se soar como cantada, tá errada. Se soar como elogio, tá MUITO errada.

COMO ESCREVER (obrigatório):
- minúsculo na maioria das vezes
- frases CURTAS, às vezes incompletas
- "kkk" / "kk" natural (não em todas)
- gírias: "mds", "mó", "tipo", "véi", "po", "tu", "tá", "né", "vei", "ué"
- pontuação relaxada
- emoji RARO (1 a cada 4 respostas, simples: 😂 👀 🤨)
- observação CONCRETA do que tá no story
- desapego > impacto. SEMPRE.

PROIBIDO (lista negra dura):
- "linda", "perfeita", "gata", "musa", "deusa", "maravilhosa", "gostosa"
- "😍", "❤️", "🥰", coração de qualquer cor
- "que foto", "que story", "amei"
- "tem algo em você", "energia única", "vibe especial"
- cantada de qualquer tipo
- elogio direto à aparência ou ao corpo
- poesia, metáfora literária, pergunta filosófica
- "celebrar", "compartilhar", "transmitir", "demonstrar"
- qualquer coisa que pareça fã respondendo

FONTES DE MATERIAL (use o que TÁ no story):
- expressão (rindo, séria, julgando, cansada, animada)
- pose (espelho, selfie no carro, foto profissional, foto random)
- ambiente (academia, bar, viagem, casa, restaurante)
- música tocando / legenda escrita
- objeto (comida, drink, pet, treino, paisagem)
- vibe (validação, deboche, low profile, festa, drama)

EXEMPLOS HUMANOS (estilo, não copiar):
Story academia:
- "tu claramente julga quem descansa entre série"
- "cara de quem fala 'última série' umas 4 vezes kkk"
Story espelho:
- "essa foto teve mais de uma tentativa eu tenho certeza"
- "tu postou isso sabendo exatamente o efeito kkk"
Story comida:
- "agora entendi pq tu tava feliz"
- "isso aí tava perigoso de bom mesmo?"
Story viagem:
- "tu tem energia de quem some e aparece em outro estado"
- "isso aí tem cara de lugar que rende história ruim kkk"
Story vídeo:
- "o vídeo piora pq agora parece ainda mais suspeito"
- "a confiança desse story tá absurda kkk"

PRIORIDADE:
1. observação concreta do que tá no story
2. humor leve / deboche
3. naturalidade > impacto
4. micro provocação (sem agressão, sem cantada)
NUNCA: elogio à aparência, validação, fã, carente, "uau".`;

const TIPOS = [
  "Natural",
  "Engraçada",
  "Debochada",
  "Misteriosa",
  "Anti-Gado",
  "Low Profile",
  "Tensão Leve",
  "Flow",
] as const;

const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "1-2 linhas lendo o que esse story tá dizendo de verdade, tom de amigo." },
    vibe: { type: "string", description: "Vibe em 1-3 palavras. Ex: 'validação leve', 'festa low', 'tédio postado'." },
    intencao: { type: "string", description: "O que ela quer ao postar isso. 1 linha curta, direto." },
    evitar: { type: "string", description: "O que NÃO mandar nesse story. Curto e direto." },
    respostas: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: [...TIPOS] },
          texto: { type: "string", description: "Resposta pronta. Curta, humana, com micro imperfeição." },
        },
        required: ["tipo", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["leitura", "vibe", "intencao", "evitar", "respostas"],
  additionalProperties: false,
} as const;

export interface ResponderStoryResult {
  leitura: string;
  vibe: string;
  intencao: string;
  evitar: string;
  respostas: { tipo: string; texto: string }[];
}

type Sliders = {
  humor: number;
  misterio: number;
  provocacao: number;
  dominancia: number;
  naturalidade: number;
};

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export const responderStory = createServerFn({ method: "POST" })
  .inputValidator((input: {
    imageDataUrl?: string;
    link?: string;
    legenda?: string;
    sliders?: Partial<Sliders>;
  }) => {
    const imageDataUrl = typeof input?.imageDataUrl === "string" && input.imageDataUrl.startsWith("data:")
      ? input.imageDataUrl
      : undefined;
    const link = (input?.link ?? "").slice(0, 500).trim();
    const legenda = (input?.legenda ?? "").slice(0, 1000).trim();
    if (!imageDataUrl && !link && !legenda) {
      throw new Error("Manda um print, vídeo, link ou pelo menos a legenda.");
    }
    if (imageDataUrl && imageDataUrl.length > 12_000_000) {
      throw new Error("Arquivo muito pesado. Tenta um menor.");
    }
    const s = input?.sliders ?? {};
    const sliders: Sliders = {
      humor: clamp(s.humor),
      misterio: clamp(s.misterio),
      provocacao: clamp(s.provocacao),
      dominancia: clamp(s.dominancia),
      naturalidade: clamp(s.naturalidade),
    };
    return { imageDataUrl, link, legenda, sliders };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const { sliders } = data;
    const slidersText = `Ajuste pedido pelo usuário (0-100):
- Humor: ${sliders.humor}
- Mistério: ${sliders.misterio}
- Provocação: ${sliders.provocacao}
- Dominância: ${sliders.dominancia}
- Naturalidade: ${sliders.naturalidade}

Calibra o TOM das 8 respostas com isso, mas SEM violar nenhuma regra do system. Naturalidade alta = mensagem mais crua e curta. Mistério alto = menos palavras, mais espaço. Dominância alta = sem perguntas, afirma. Provocação alta = micro deboche sem agressão. Humor alto = kkk natural, deboche.`;

    const userParts: any[] = [
      {
        type: "text",
        text: `Analisa esse story e me devolve 8 respostas prontas pra mandar, uma de cada tipo (Natural, Engraçada, Debochada, Misteriosa, Anti-Gado, Low Profile, Tensão Leve, Flow). Foco TOTAL em não parecer carente, fã ou IA. Quero parecer um cara real respondendo de boa.${data.link ? `\n\nLink do story: ${data.link}` : ""}${data.legenda ? `\n\nLegenda/contexto: ${data.legenda}` : ""}\n\n${slidersText}`,
      },
    ];
    if (data.imageDataUrl) {
      userParts.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userParts },
        ],
        tools: [{
          type: "function",
          function: {
            name: "responder_story",
            description: "Devolve leitura do story e 8 respostas prontas, sem soar carente.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "responder_story" } },
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
      return { result: JSON.parse(args) as ResponderStoryResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
