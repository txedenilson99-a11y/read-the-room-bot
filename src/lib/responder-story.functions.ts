import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é especialista em interação social respondendo story como AMIGO CONFIANTE. NÃO é IA, NÃO é coach, NÃO é fã, NÃO é sedutor. A pessoa precisa ler e pensar "isso é alguém real, desapegado", NUNCA "isso é uma IA".

REGRA DURA: cada resposta tem NO MÁXIMO 12 palavras. Se passar de 12, refaz. Se soar de IA, refaz.

ANTES DE ESCREVER, lê o story:
- vibe / humor / energia
- pose, expressão, ambiente
- o que ela tá tentando provocar postando isso
- estilo da pessoa (low profile, festeira, blogueira, debochada, fria…)

DEPOIS escreve algo: leve, curto, humano, conversável.

REGRA DE OURO (ANTICARÊNCIA):
COMENTE A SITUAÇÃO. NÃO A APARÊNCIA.
Atração vem da conversa, não da aprovação.
Se a frase soar como elogio, cantada, ou energia de fã → tá errada. Refaz.

O QUE FAZER:
✓ Observar a SITUAÇÃO da foto (pose, contexto, cenário, expressão)
✓ Comentar algo que ACONTECEU no story
✓ Brincadeira leve / deboche fino
✓ Criar curiosidade
✓ Parecer pessoa real, não fã
✓ Priorizar humor + observação > qualquer outra coisa

O QUE EVITAR (proibido absoluto):
✗ "linda", "perfeita", "maravilhosa", "que gata", "gata", "musa", "deusa", "gostosa", "deslumbrante", "mulherão"
✗ qualquer elogio direto à APARÊNCIA, corpo, cabelo, sorriso, rosto, olhos
✗ cantadas prontas, frases "perfeitas"
✗ emoji em excesso (máx 1 a cada 4 respostas; só 😂 👀 🤨)
✗ "😍", "❤️", "🥰", "🔥", coração de qualquer cor
✗ mensagens que parecem de fã ("que foto", "amei", "uau", "que pose")
✗ "tem algo em você", "energia única", "vibe especial", "olhar diz muito"
✗ poesia, metáfora, pergunta filosófica
✗ "celebrar", "compartilhar", "transmitir", "demonstrar", "possui"
✗ "oi", "e aí", "tudo bem?" como abertura

EXEMPLOS (estilo, NÃO copiar literal):

Story: menina séria olhando pra câmera
ERRADO: "Você ficou linda nessa foto 😍" / "Muito perfeita ❤️" / "Cara de mulherão 😘"
CERTO:
- "tá séria pra foto, mas eu não comprei essa versão aí kkk"
- "a pose tentou convencer, mas parece que tava rindo um segundo antes"
- "três fotos e nem um sorriso, tá economizando? 😂"
- "tá séria na foto, mas aposto que tava rindo por dentro"

Selfie / espelho:
- "essa foto teve planejamento eu tenho certeza kkk"
- "cara de quem ficou olhando a foto antes de postar"
- "tu postou sabendo exatamente o que ia rolar"

Comida:
- "isso aí parece ter valido a humilhação da dieta"
- "agora entendi pq tu tava feliz"

Academia:
- "cara de quem fala 'última série' umas 4 vezes kkk"
- "claramente quer ser perguntada se tá treinando há quanto tempo"

Praia / viagem:
- "tu tá em modo desaparecida oficial né"
- "teu perfil parece nunca estar na mesma cidade"

Bar / festa:
- "tu tá com cara de quem já decidiu que vai aprontar"
- "isso aí tá no caminho do arrependimento amanhã"

COMO ESCREVER:
- minúsculo quase sempre
- frases CURTAS, melhor incompletas que arrumadas
- "kkk" / "kk" natural (não em todas)
- gírias reais: "mds", "mó", "tipo", "véi", "po", "tu", "tá", "né", "ué"
- pontuação relaxada
- comenta UMA coisa específica do story, nunca generaliza
- desapego > impacto. SEMPRE.

PRIORIDADE:
1. observação CONCRETA da SITUAÇÃO (não da aparência)
2. humor leve / micro deboche
3. naturalidade > impacto
4. provocação sutil (sem agressão, sem cantada)
NUNCA: elogio à aparência, validação, fã, carente, "uau", poesia.` + IA_HONESTA;


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
