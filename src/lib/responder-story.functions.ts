import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é especialista em interação social respondendo story como AMIGO CONFIANTE. NÃO é IA, NÃO é coach, NÃO é fã, NÃO é sedutor. A pessoa precisa ler e pensar "isso é alguém real, desapegado", NUNCA "isso é uma IA".

REGRA DURA: cada resposta tem NO MÁXIMO 12 palavras. Se passar de 12, refaz. Se soar de IA, refaz.

ANTES DE ESCREVER, lê o story:
- vibe / humor / energia
- pose, expressão, ambiente
- o que ela tá tentando provocar postando isso
- estilo da pessoa (low profile, festeira, blogueira, debochada, fria…)

REGRA DE OURO (ANTICARÊNCIA):
COMENTE A SITUAÇÃO. NÃO A APARÊNCIA.
Atração vem da conversa, não da aprovação.

O QUE FAZER:
✓ Observar a SITUAÇÃO da foto (pose, contexto, cenário, expressão)
✓ Comentar algo que ACONTECEU no story
✓ Brincadeira leve / deboche fino
✓ Criar curiosidade
✓ Parecer pessoa real, não fã

O QUE EVITAR (proibido absoluto):
✗ "linda", "linda demais", "perfeita", "maravilhosa", "gostosa", "que mulher", "que gata", "gata", "musa", "deusa", "deslumbrante", "mulherão", "casava"
✗ qualquer elogio direto à APARÊNCIA, corpo, cabelo, sorriso, rosto, olhos
✗ cantadas prontas, frases "perfeitas"
✗ emoji em excesso (máx 1 a cada 4; só 😂 👀 🤨)
✗ "😍", "❤️", "🥰", "🔥", coração de qualquer cor
✗ mensagens que parecem de fã ("que foto", "amei", "uau", "que pose")
✗ "tem algo em você", "energia única", "vibe especial", "olhar diz muito"
✗ poesia, metáfora, pergunta filosófica
✗ "oi", "e aí", "tudo bem?" como abertura

🚨 FILTRO ANTI-IA — frases PROIBIDAS (NUNCA usar, nem variação):
✗ "claramente"
✗ "obviamente"
✗ "energia 👀" / "energia de" / "vibe de"
✗ "ponto alto do dia"
✗ "você quis chamar atenção"
✗ "sei exatamente o que isso significa"
✗ "você postou isso pra provocar"
✗ "eu sei o que está acontecendo aqui"
✗ "transmite", "demonstra", "celebrar", "compartilhar"

🧠 SCORE DE HUMANIDADE — pra CADA resposta, atribua honestamente:
- naturalidade (0-100): soa como amigo real no zap? 100 = totalmente humano. <80 = ruim.
- originalidade (0-100): é específica desse story ou genérica? <70 = ruim.
- carencia (0-100): tem traço de validação, elogio, fã, esforço? >20 = ruim. 0 é o ideal.
- chance_resposta (0-100): probabilidade real de ela responder.

Se uma resposta tiver naturalidade<80, OU originalidade<70, OU carencia>20 — REESCREVA antes de devolver. Devolva APENAS respostas que passem nos 3 filtros.

📊 POTENCIAL DE CONVERSA: avalie o story como gerador de conversa:
- duracao_estimada: "Curta" | "Média" | "Longa"
- potencial_conversa (0-100): quanto esse story dá pra puxar papo de verdade

🔎 LEITURA HONESTA (CRÍTICO — IA HONESTA):
Separe em DOIS arrays distintos:
- identificado: lista de FATOS VISÍVEIS no story (ex: "Selfie no espelho", "Vestido preto", "Quarto", "Flash forte", "Música: Celebridade"). Só o que dá pra ver/ouvir/ler de verdade. Cada item curto (2-5 palavras).
- nao_confirmado: lista do que NÃO dá pra cravar e seria CHUTE (ex: "Ela vai sair", "Ela quer chamar atenção", "Ela está solteira", "Ela quer flertar"). Intenção, sentimento, estado civil, motivação — NUNCA cravar.
- nivel_confianca (0-100): o quanto a leitura do story é sólida com base no que é visível. Selfie nítida com vários elementos = alto. Foto vaga/escura/só texto = baixo.

Mínimo 3 itens em cada array. Seja específico ao story atual, não genérico.

🏆 MELHOR RESPOSTA: escolha o índice (0-7) da resposta mais humana — mais natural + menos carente + maior chance de resposta + menos cara de IA. Justifique em 1 linha curta.

🏅 RANKING: marque 1 resposta pra cada categoria (pode repetir índice se necessário):
- engracada: índice da mais engraçada
- ousada: índice da mais ousada
- misteriosa: índice da mais misteriosa
- segura: índice da mais segura (menor risco)

COMO ESCREVER:
- minúsculo quase sempre
- frases CURTAS, melhor incompletas que arrumadas
- "kkk" / "kk" natural (não em todas)
- gírias: "mds", "mó", "tipo", "véi", "po", "tu", "tá", "né", "ué"
- comenta UMA coisa específica do story
- desapego > impacto.` + IA_HONESTA;


const TIPOS = [
  "Natural",
  "Debochada",
  "Irônica",
  "Anti-Gado",
  "Misteriosa",
  "Flow",
  "Ousada",
  "Líder",
] as const;

const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "1-2 linhas lendo o story de verdade, tom de amigo." },
    vibe: { type: "string", description: "Vibe em 1-3 palavras." },
    intencao: { type: "string", description: "O que ela quer ao postar isso. 1 linha curta." },
    evitar: { type: "string", description: "O que NÃO mandar nesse story." },
    duracao_estimada: { type: "string", enum: ["Curta", "Média", "Longa"] },
    potencial_conversa: { type: "number", description: "0-100" },
    nivel_confianca: { type: "number", description: "0-100, quão sólida é a leitura baseada no visível." },
    identificado: {
      type: "array",
      minItems: 3,
      items: { type: "string", description: "Fato visível no story. Curto, 2-5 palavras." },
    },
    nao_confirmado: {
      type: "array",
      minItems: 3,
      items: { type: "string", description: "O que NÃO dá pra cravar (intenção/sentimento/estado)." },
    },
    respostas: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: [...TIPOS] },
          texto: { type: "string", description: "MÁX 12 palavras. Humana, curta, sem cara de IA." },
          naturalidade: { type: "number" },
          originalidade: { type: "number" },
          carencia: { type: "number" },
          chance_resposta: { type: "number" },
        },
        required: ["tipo", "texto", "naturalidade", "originalidade", "carencia", "chance_resposta"],
        additionalProperties: false,
      },
    },
    melhor_indice: { type: "number", description: "Índice 0-7 da melhor resposta." },
    melhor_motivo: { type: "string", description: "Por que essa é a melhor. 1 linha." },
    ranking: {
      type: "object",
      properties: {
        engracada: { type: "number" },
        ousada: { type: "number" },
        misteriosa: { type: "number" },
        segura: { type: "number" },
      },
      required: ["engracada", "ousada", "misteriosa", "segura"],
      additionalProperties: false,
    },
  },
  required: ["leitura", "vibe", "intencao", "evitar", "duracao_estimada", "potencial_conversa", "nivel_confianca", "identificado", "nao_confirmado", "respostas", "melhor_indice", "melhor_motivo", "ranking"],
  additionalProperties: false,
} as const;

export interface RespostaScored {
  tipo: string;
  texto: string;
  naturalidade: number;
  originalidade: number;
  carencia: number;
  chance_resposta: number;
}

export interface ResponderStoryResult {
  leitura: string;
  vibe: string;
  intencao: string;
  evitar: string;
  duracao_estimada: "Curta" | "Média" | "Longa";
  potencial_conversa: number;
  nivel_confianca: number;
  identificado: string[];
  nao_confirmado: string[];
  respostas: RespostaScored[];
  melhor_indice: number;
  melhor_motivo: string;
  ranking: {
    engracada: number;
    ousada: number;
    misteriosa: number;
    segura: number;
  };
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

// Frases proibidas — se aparecer, regeneramos
const FRASES_IA = [
  "claramente",
  "obviamente",
  "energia 👀",
  "ponto alto do dia",
  "você quis chamar atenção",
  "voce quis chamar atenção",
  "sei exatamente o que isso significa",
  "você postou isso pra provocar",
  "voce postou isso pra provocar",
  "eu sei o que está acontecendo aqui",
  "eu sei o que esta acontecendo aqui",
  "transmite",
  "demonstra",
  "energia de",
  "vibe de",
];

function temFraseIA(texto: string): boolean {
  const t = texto.toLowerCase();
  return FRASES_IA.some((f) => t.includes(f));
}

function respostaPassa(r: RespostaScored): boolean {
  if (r.naturalidade < 80) return false;
  if (r.originalidade < 70) return false;
  if (r.carencia > 20) return false;
  if (temFraseIA(r.texto)) return false;
  return true;
}

async function chamarIA(apiKey: string, userParts: any[]): Promise<ResponderStoryResult> {
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
          description: "Devolve leitura + 8 respostas scored + ranking.",
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
  return JSON.parse(args) as ResponderStoryResult;
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
    const slidersText = `Ajuste do usuário (0-100):
- Humor: ${sliders.humor}
- Mistério: ${sliders.misterio}
- Provocação: ${sliders.provocacao}
- Dominância: ${sliders.dominancia}
- Naturalidade: ${sliders.naturalidade}

Calibra o TOM SEM violar regras. Naturalidade alta = mais crua e curta.`;

    const baseText = `Analisa esse story e me devolve 8 respostas SCORED + ranking + potencial de conversa.${data.link ? `\n\nLink: ${data.link}` : ""}${data.legenda ? `\n\nLegenda/contexto: ${data.legenda}` : ""}\n\n${slidersText}`;

    let result: ResponderStoryResult | null = null;
    let tentativas = 0;
    let avisoExtra = "";

    while (tentativas < 3) {
      const userParts: any[] = [
        { type: "text", text: baseText + (avisoExtra ? `\n\n⚠️ TENTATIVA ANTERIOR FALHOU:\n${avisoExtra}\n\nReescreva TUDO mais humano, mais específico, ZERO cara de IA.` : "") },
      ];
      if (data.imageDataUrl) {
        userParts.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
      }

      const candidato = await chamarIA(apiKey, userParts);
      tentativas++;

      const falhas = candidato.respostas.map((r, i) => {
        const motivos: string[] = [];
        if (r.naturalidade < 80) motivos.push(`naturalidade=${r.naturalidade}<80`);
        if (r.originalidade < 70) motivos.push(`originalidade=${r.originalidade}<70`);
        if (r.carencia > 20) motivos.push(`carencia=${r.carencia}>20`);
        if (temFraseIA(r.texto)) motivos.push("contém frase proibida (IA)");
        return motivos.length ? `[${i}] "${r.texto}" → ${motivos.join(", ")}` : null;
      }).filter(Boolean);

      const todasPassam = candidato.respostas.every(respostaPassa);

      if (todasPassam) {
        result = candidato;
        break;
      }

      // se for última tentativa, aceita o melhor que conseguir
      if (tentativas >= 3) {
        result = candidato;
        break;
      }

      avisoExtra = falhas.join("\n");
    }

    if (!result) throw new Error("A IA não conseguiu gerar respostas humanas.");

    // ajuste defensivo: melhor_indice válido
    if (result.melhor_indice < 0 || result.melhor_indice >= result.respostas.length) {
      // escolhe pela maior soma natural+chance - carencia
      let best = 0, bestScore = -Infinity;
      result.respostas.forEach((r, i) => {
        const s = r.naturalidade + r.chance_resposta + r.originalidade - r.carencia * 2;
        if (s > bestScore) { bestScore = s; best = i; }
      });
      result.melhor_indice = best;
    }

    return { result };
  });
