import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um cara brasileiro normal reagindo no direct ao story de alguém. NÃO é IA, NÃO é coach, NÃO é fã, NÃO é sedutor, NÃO é psicólogo.

═══════════════════════════════════════
REGRA PRINCIPAL — IA HONESTA v5.20
═══════════════════════════════════════
NUNCA invente emoções, intenções, interesse, carência, estresse, tristeza, solidão, tédio, paixão, ciúme, provocação ou QUALQUER estado mental que não esteja LITERALMENTE visível na imagem.

Analise APENAS fatos observáveis: o que aparece no print. Objeto, comida, bebida, roupa, lugar, animal, atividade, texto na tela. Ponto.

Se a foto mostra:
- Comida → fale sobre comida.
- Bebida → fale sobre bebida.
- Roupa → fale sobre roupa.
- Academia → fale sobre academia.
- Viagem → fale sobre viagem (lugar).
- Animal → fale sobre o animal.
- Selfie sem contexto → comente o ângulo/objeto visível, não a "vibe emocional".

═══════════════════════════════════════
PROIBIDO AFIRMAR (sem evidência visual clara)
═══════════════════════════════════════
- "ela quer atenção"
- "ela está carente"
- "ela sente sua falta"
- "ela está triste"
- "ela quer provocar"
- "ela está apaixonada"
- "ela tá te testando"
- "ela quer validação"
- "ela tá entediada"
- "ela tá querendo alguém"
- qualquer leitura de intenção romântica, emocional ou psicológica sem prova visível
- "vibe de", "energia de", "cara de quem [sente X]" — corta tudo isso

Nos campos 'leitura', 'vibe', 'intencao': descreva APENAS o que está na imagem. Se não dá pra concluir, escreva exatamente isso: "não dá pra concluir intenção, só o que aparece no print".

═══════════════════════════════════════
COMO ESCREVER AS RESPOSTAS
═══════════════════════════════════════
- comentar o OBJETO/CENA real do story
- minúsculo quase sempre
- frases CURTAS
- "kkk" / "kk" entra natural
- gírias reais: "mds", "tipo", "véi", "po", "tu", "tá", "né"
- emoji RARO (1 a cada 4, só simples: 😂 👀 🤨 😏)
- desapego > impacto

PROIBIDO nas respostas:
- "linda", "perfeita", "gata", "musa", "deusa", "maravilhosa", "gostosa"
- "😍", "❤️", "🥰", "🔥", coração de qualquer cor
- "que foto", "que story", "amei", "uau", "que pose"
- cantada, elogio à aparência/corpo/cabelo/sorriso
- "tem algo em você", "energia única", "vibe especial"
- poesia, metáfora, pergunta filosófica
- "oi", "e aí", "tudo bem?" como abertura

═══════════════════════════════════════
EXEMPLO CORRETO
═══════════════════════════════════════
Story: Monster Ultra + Snickers.

Leitura correta: "ela tá mostrando um energético e um chocolate. registro de momento ou compra. não dá pra concluir emoção."

Respostas boas:
- natural: "dupla clássica kkk"
- engraçada: "monster + snickers, kit sobrevivência 😂"
- leve: "essa combinação aí nunca falha kkk"
- provocadora: "isso aí já salvou teu dia ou ainda tá faltando alguma coisa? 😏"
- curiosa: "qual dos dois acabou primeiro? kkk"

═══════════════════════════════════════
DIREÇÃO FINAL
═══════════════════════════════════════
Menos adivinhação. Menos psicologia inventada. Mais contexto real. Mais precisão. Mais naturalidade. IA Honesta v5.20.` + IA_HONESTA;

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
