import { createServerFn } from "@tanstack/react-start";

type Mode = "mensagem" | "story";

const SYSTEM_BASE = `Você é um cara brasileiro normal mandando mensagem no WhatsApp/Direct. NÃO é IA, NÃO é coach, NÃO é poeta, NÃO é sedutor de TikTok. Manda mensagem como qualquer cara real manda: curto, casual, observação simples, zoeira leve.

REGRA DE OURO:
A mensagem precisa parecer IMPROVISO de homem normal. Se soar "mensagem perfeita", tá errada. Se soar poética, tá errada. Se soar cantada, tá errada.

COMO ESCREVER (obrigatório):
- minúsculo na maioria das vezes (sem caps no começo de cada frase)
- frases CURTAS, às vezes incompletas
- "kkk" / "kk" entra natural em várias mensagens (não em todas)
- gírias reais: "mds", "mó", "tipo", "véi", "po", "tu", "tá", "né"
- pontuação relaxada. vírgula faltando, ponto faltando, tudo bem
- emoji RARO (1 a cada 3-4 mensagens, simples: 😂 👀)
- observação CONCRETA do que tá na foto, não filosofia

PROIBIDO (lista negra dura):
- "seu olhar diz muito", "me fez parar de rolar", "tem algo em você"
- "perfeita", "linda", "gata", "musa", "deusa", "encantadora"
- "charme misterioso", "energia única", "vibe especial"
- frase poética, metáfora literária, "perfil é um trailer"
- pergunta filosófica ("o que te prende assim?")
- qualquer coisa que pareça frase de Instagram com fundo preto
- elogio direto à aparência
- "celebrar", "compartilhar", "transmitir", "demonstrar", "possui"

FONTES DE MATERIAL (use o que TÁ na foto):
- pose suspeita / forçada / espontânea
- expressão (rindo, séria, pensativa, cara de tédio, julgando)
- ambiente (bar, praia, espelho, carro, festa, casa)
- objeto (drink, comida, pet, celular)
- contexto (selfie, grupo, foto profissional, story aleatório)

EXEMPLOS DO NÍVEL CERTO (estilo, não copiar literal):
- "essa pose de pensativa aí tá suspeita kkk"
- "cara de quem tava julgando alguém da mesa"
- "tu claramente tava pensando em comida"
- "essa foto tem energia de 'não era pra postar mas postei'"
- "parece foto tirada 2 segundos antes de dar risada"
- "essa pose foi espontânea ou tu treinou 😂"
- "a câmera te pegou no modo observadora"
- "tu tem mó cara de quem responde 3h depois de propósito kkk"
- "mds essa foto tá muito 'vou responder e sumir'"

ANTES vs DEPOIS:
ERRADO: "Seu olhar diz muito... o que te prende assim?"
CERTO: "essa cara de pensativa tá suspeita kkk pensando no q"
ERRADO: "Perfeita até quando tá no mundo da lua."
CERTO: "tu tava claramente viajando nessa foto né kkk"
ERRADO: "Você possui um charme misterioso."
CERTO: "tu tem cara de quem responde quando quer"

PRIORIDADE:
1. observação concreta do que tá na foto
2. humor leve / zoeira
3. micro provocação (sem agressão)
4. naturalidade > impacto
NUNCA: sedução exagerada, poesia, profundidade fake.`;

const MENSAGEM_SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "Frase curta lendo a vibe da foto/pessoa. 1-2 linhas." },
    mensagens: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["Natural", "Zoando", "Low Profile", "Debochada", "Conversável", "Seca", "Anti-Gado", "Reação Real"],
          },
          texto: { type: "string", description: "Mensagem pronta para enviar. Curta, natural, brasileira." },
        },
        required: ["tipo", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["leitura", "mensagens"],
  additionalProperties: false,
} as const;

const STORY_SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "O que esse story tá dizendo de verdade, em tom de amigo. 1-2 linhas." },
    estrategia: { type: "string", description: "Melhor jogada agora, tom de amigo. Curto." },
    timing: { type: "string", description: "Quando responder, em linguagem real. Curto." },
    evitar: { type: "string", description: "O que NÃO mandar. Curto e direto." },
    metricas: {
      type: "object",
      properties: {
        clima: { type: "number", minimum: 0, maximum: 100, description: "Clima da conversa" },
        abertura: { type: "number", minimum: 0, maximum: 100, description: "Abertura pra responder" },
        interesse: { type: "number", minimum: 0, maximum: 100, description: "Nível de interesse" },
        energia: { type: "number", minimum: 0, maximum: 100, description: "Energia do story" },
        chance_papo: { type: "number", minimum: 0, maximum: 100, description: "Chance dela continuar o papo" },
      },
      required: ["clima", "abertura", "interesse", "energia", "chance_papo"],
      additionalProperties: false,
    },
    respostas: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          modo: {
            type: "string",
            enum: ["Calmo", "Engraçado", "Irônico", "Ousado", "Misterioso", "Sedutor", "Direto"],
          },
          texto: { type: "string", description: "Resposta pronta para mandar no story." },
        },
        required: ["modo", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["leitura", "estrategia", "timing", "evitar", "metricas", "respostas"],
  additionalProperties: false,
} as const;

export interface MensagemResult {
  leitura: string;
  mensagens: { tipo: string; texto: string }[];
}
export interface StoryResult {
  leitura: string;
  estrategia: string;
  timing: string;
  evitar: string;
  metricas: {
    clima: number;
    abertura: number;
    interesse: number;
    energia: number;
    chance_papo: number;
  };
  respostas: { modo: string; texto: string }[];
}

export const analisarFoto = createServerFn({ method: "POST" })
  .inputValidator((input: { mode: Mode; imageDataUrl: string; extra?: string }) => {
    if (!input || (input.mode !== "mensagem" && input.mode !== "story")) {
      throw new Error("Modo inválido.");
    }
    if (typeof input.imageDataUrl !== "string" || !input.imageDataUrl.startsWith("data:image/")) {
      throw new Error("Imagem inválida.");
    }
    if (input.imageDataUrl.length > 8_000_000) {
      throw new Error("Imagem muito pesada. Tenta uma menor.");
    }
    return {
      mode: input.mode,
      imageDataUrl: input.imageDataUrl,
      extra: (input.extra ?? "").slice(0, 1000),
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const isMensagem = data.mode === "mensagem";

    const userText = isMensagem
      ? `Analisa essa foto (estilo, ambiente, roupa, pose, expressão, vibe, legenda se houver) e me dá 8 mensagens prontas para puxar assunto, uma de cada tipo. Curtas, naturais, brasileiras. ${data.extra ? `Contexto extra: ${data.extra}` : ""}`
      : `Analisa esse print de story (Instagram/WhatsApp/Snap/Facebook). Lê legenda, expressão, pose, ambiente, emoção, intenção. Devolve a leitura, estratégia, timing, o que evitar, métricas de 0 a 100 e 7 respostas prontas (uma por modo). ${data.extra ? `Contexto extra: ${data.extra}` : ""}`;

    const toolName = isMensagem ? "responder_foto" : "responder_story";
    const schema = isMensagem ? MENSAGEM_SCHEMA : STORY_SCHEMA;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_BASE },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: toolName,
            description: isMensagem
              ? "Devolve 8 mensagens prontas para puxar assunto a partir da foto."
              : "Devolve análise estruturada do story e 7 respostas prontas.",
            parameters: schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: toolName } },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) throw new Error("Muitas leituras de uma vez. Espera um pouco.");
    if (res.status === 402) throw new Error("Sem créditos de IA. Adicione em Settings → Workspace → Usage.");
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error:", res.status, text);
      throw new Error("A IA não respondeu agora. Tenta de novo.");
    }

    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          tool_calls?: Array<{ function?: { arguments?: string } }>;
          content?: string;
        };
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

    return { mode: data.mode, result: parsed as MensagemResult | StoryResult };
  });
