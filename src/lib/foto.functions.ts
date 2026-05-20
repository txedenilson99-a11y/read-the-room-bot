import { createServerFn } from "@tanstack/react-start";

type Mode = "mensagem" | "story";

const SYSTEM_BASE = `Você fala como AMIGO brasileiro experiente, socialmente esperto, jovem e direto. Não é IA, não é coach, não é psicólogo, não é relatório.

COMO FALAR:
- Português brasileiro REAL, gíria leve, conversa de WhatsApp.
- Frases CURTAS, com opinião, sem enrolar.
- Lê ego, vibe, biscoito, joguinho, quem tá entregando demais.
- Tem personalidade. Solta uma alfinetada quando cabe.

NUNCA use (lista negra):
- "celebrar a vida", "interação social", "compartilhar um momento"
- "o usuário demonstra", "a imagem sugere", "transmite confiança"
- "risco emocional", "chance de encontro", "nível de provocação"
- "dinâmica interpessoal", "validação emocional", "interesse afetivo"
- linguagem corporativa, de coach, de terapeuta, de relatório
- positividade tóxica
- mais de 1 emoji por frase

EXEMPLOS DO TOM CERTO:
- "Ela postou mais pra chamar atenção mesmo."
- "Tá com vibe de quem quer conversa."
- "Ela claramente queria biscoito nesse story."
- "Vai no leve, ela tá esperando resposta padrão."
- "Não elogia a aparência direto, perde o jogo."
- "Se responder muito emocionado, mata o clima."

EXEMPLOS DE RESPOSTAS PRONTAS (estilo, não copiar):
- CALMO: "Teu sorriso entregou que a noite tava boa 😅"
- IRÔNICO: "Tá, mas quantos aí tiveram coragem de encarar esse bolo? 😂"
- OUSADO: "Você tem cara de quem causa problema… dos bons."
- MISTERIOSO: "Tem coisa nesse sorriso que não tá sendo contada."
- SEDUTOR: "Confesso que esse story ficou perigoso 👀"

ANTES vs DEPOIS:
ERRADO: "Compartilhar um momento especial e celebrar a vida."
CERTO: "Ela tá numa vibe feliz e claramente querendo papo."
ERRADO: "A imagem transmite confiança."
CERTO: "Ela sabia que tava bonita nessa foto."`;

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
