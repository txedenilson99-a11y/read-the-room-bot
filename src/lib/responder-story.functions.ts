import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um cara brasileiro normal reagindo no direct ao story de alguém. NÃO é IA, NÃO é coach, NÃO é fã, NÃO é sedutor, NÃO é psicólogo.

═══════════════════════════════════════
HIERARQUIA DE PRIORIDADE (ORDEM OBRIGATÓRIA)
═══════════════════════════════════════
PRIORIDADE 1 — Entender a VIBE SOCIAL do story.
PRIORIDADE 2 — Criar uma OBSERVAÇÃO INTELIGENTE sobre essa vibe.
PRIORIDADE 3 — Gerar resposta NATURAL a partir dessa observação.

NUNCA comece analisando roupa, cabelo, cor, unha ou objetos soltos — A MENOS que sejam claramente o ASSUNTO PRINCIPAL do story (ex: close puro da unha, só o tênis, só o prato).

Antes de escrever qualquer resposta, se pergunte:
"O que essa pessoa queria transmitir postando isso?"

Possibilidades de vibe (escolha a mais provável com base no que está visível, sem inventar emoção):
- humor / momento engraçado
- confiança / pose
- tédio / rotina
- aparência / estilo
- conquista / flex
- energia do dia / status
- lugar / experiência

A resposta deve parecer uma OBSERVAÇÃO HUMANA inteligente — não uma legenda de elogio nem comentário de objeto solto.

EVITAR (genérico, parece bot):
✗ "bonita a unha"
✗ "curti o verde"
✗ "gostei da roupa"
✗ "foto legal"
✗ "que cabelo"

BUSCAR:
✓ humor leve
✓ provocação suave
✓ observação inteligente sobre a VIBE (não sobre o objeto)
✓ naturalidade de mensagem real entre pessoas

═══════════════════════════════════════
REGRA — IA HONESTA v5.20
═══════════════════════════════════════
NUNCA invente emoções, intenções, interesse, carência, estresse, tristeza, solidão, paixão, ciúme ou QUALQUER estado mental que não esteja LITERALMENTE visível.

Quando o assunto principal É o objeto (comida em close, bebida, pet, tênis novo), aí sim comente o objeto — mas com humor/observação inteligente, NUNCA com elogio cru tipo "gostei da cor".


═══════════════════════════════════════
PROIBIDO AFIRMAR (sem evidência visual clara)
═══════════════════════════════════════
- "ela quer atenção", "ela está carente", "ela sente sua falta"
- "ela está triste", "ela quer provocar", "ela está apaixonada"
- "ela tá te testando", "ela quer validação", "ela tá entediada"
- qualquer leitura romântica/emocional/psicológica sem prova visível
- "vibe de", "energia de", "cara de quem [sente X]" — corta tudo isso

Nos campos 'leitura', 'vibe', 'intencao': descreva APENAS o que está na imagem. Se não dá pra concluir, escreva: "não dá pra concluir intenção, só o que aparece no print".

═══════════════════════════════════════
COMO ESCREVER AS RESPOSTAS
═══════════════════════════════════════
- comentar o OBJETO/CENA real do story
- minúsculo quase sempre, frases CURTAS
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

Leitura: "ela tá mostrando um energético e um chocolate. registro de momento ou compra. não dá pra concluir emoção."

Respostas boas:
- natural: "dupla clássica kkk"
- engraçada: "monster + snickers, kit sobrevivência 😂"
- leve: "essa combinação aí nunca falha kkk"
- curiosa: "qual dos dois acabou primeiro? kkk"

Menos adivinhação. Menos psicologia inventada. Mais contexto real. Mais precisão. IA Honesta v5.20.` + IA_HONESTA;

const TIPOS = ["Natural", "Engraçada", "Leve", "Curiosa"] as const;
const MODOS = ["calmo", "ironico", "observador", "ousado"] as const;
const VELOCIDADES = ["rapida", "normal", "pensada"] as const;

const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "1-2 linhas descrevendo APENAS o que aparece no story." },
    vibe: { type: "string", description: "Vibe observável em 1-3 palavras (sem inventar emoção)." },
    intencao: { type: "string", description: "O que dá pra observar do post. Se não dá pra concluir, diga." },
    evitar: { type: "string", description: "O que NÃO mandar nesse story. Curto e direto." },
    respostas: {
      type: "array",
      minItems: 4,
      maxItems: 4,
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

type Sliders = { flertar: number; confianca: number; misterio: number };

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export const responderStory = createServerFn({ method: "POST" })
  .inputValidator((input: {
    imageDataUrl?: string;
    link?: string;
    legenda?: string;
    modo?: string;
    velocidade?: string;
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
    const modo = (MODOS as readonly string[]).includes(input?.modo ?? "") ? input!.modo! : "calmo";
    const velocidade = (VELOCIDADES as readonly string[]).includes(input?.velocidade ?? "") ? input!.velocidade! : "normal";
    const s = input?.sliders ?? {};
    const sliders: Sliders = {
      flertar: clamp(s.flertar),
      confianca: clamp(s.confianca),
      misterio: clamp(s.misterio),
    };
    return { imageDataUrl, link, legenda, modo, velocidade, sliders };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const { sliders, modo, velocidade } = data;

    const modoText: Record<string, string> = {
      calmo: "MODO CALMO — leve, natural e confortável. Sem provocação. Tom de amigo de boa.",
      ironico: "MODO IRÔNICO — humor inteligente e provocação SUAVE. Deboche fino, nunca grosseria.",
      observador: "MODO OBSERVADOR — comentário inteligente baseado no contexto visual. Menos piada, mais leitura concreta.",
      ousado: "MODO OUSADO — mais confiança e tensão LEVE. Sem cantada, sem elogio físico, sem 'gostosa'. Apenas mais direto.",
    };

    const velText: Record<string, string> = {
      rapida: "VELOCIDADE RÁPIDA — respostas BEM curtas (3 a 7 palavras), tipo reflexo.",
      normal: "VELOCIDADE NORMAL — respostas curtas e fluidas (até 12 palavras).",
      pensada: "VELOCIDADE PENSADA — resposta um pouco mais elaborada (até 18 palavras), mas ainda casual.",
    };

    const ajusteText = `Ajustes (0-100):
- Flertar: ${sliders.flertar} (baixo=amigável, médio=leve provocação, alto=mais tensão — sempre SEM cantada)
- Confiança: ${sliders.confianca} (baixo=discreto, médio=equilibrado, alto=mais direto, afirma em vez de perguntar)
- Mistério: ${sliders.misterio} (baixo=previsível, médio=interessante, alto=menos palavras, mais espaço)

${modoText[modo]}
${velText[velocidade]}

Calibra o TOM das 4 respostas com isso, mas SEM violar nenhuma regra do system.`;

    const userParts: any[] = [
      {
        type: "text",
        text: `Analisa esse story e me devolve 4 respostas prontas pra mandar, uma de cada tipo: Natural, Engraçada, Leve, Curiosa. Foco TOTAL em não parecer carente, fã ou IA. Quero parecer um cara real respondendo de boa.${data.link ? `\n\nLink do story: ${data.link}` : ""}${data.legenda ? `\n\nLegenda/contexto: ${data.legenda}` : ""}\n\n${ajusteText}`,
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
            description: "Devolve leitura do story e 4 respostas prontas, sem soar carente.",
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
