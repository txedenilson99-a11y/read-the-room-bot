import { createServerFn } from "@tanstack/react-start";

type Mode = "mensagem" | "story";

const SYSTEM_BASE = `Você é um cara brasileiro normal mandando mensagem no WhatsApp/Direct. NÃO é IA, NÃO é coach, NÃO é poeta, NÃO é sedutor. Manda mensagem como qualquer cara real manda: curto, casual, natural.

━━━━━━━━━━━━━━━━━━━
PASSO 1 — IDENTIFICAR O TIPO DE IMAGEM
━━━━━━━━━━━━━━━━━━━
Antes de qualquer coisa, identifica o que é a imagem:

1. PRINT DE CONVERSA (WhatsApp/Direct/iMessage): tem balões de mensagem, nomes, horários, "online", "digitando".
2. PRINT DE STORY (Instagram/Snap): tela cheia, barra de progresso no topo, "responder", "enviar mensagem".
3. PERFIL DE INSTAGRAM: grid de fotos, bio, seguidores, botão seguir.
4. FOTO COMUM: selfie, paisagem, pessoa posando, sem interface de app.

━━━━━━━━━━━━━━━━━━━
PASSO 2 — REGRA DE LEITURA
━━━━━━━━━━━━━━━━━━━

SE FOR PRINT DE CONVERSA (mais comum):
- LEIA as mensagens trocadas na ordem
- Identifique a ÚLTIMA mensagem dela
- Sua tarefa: CONTINUAR o papo de forma natural
- NÃO analise cenário, ambiente, vibe, jogo, intenção oculta
- NÃO invente contexto que não está escrito ali
- Trate como se fosse SEU amigo te mostrando o print pedindo "o que respondo?"

SE FOR STORY: comente o story de forma leve.
SE FOR PERFIL: observação curta sobre a vibe geral do perfil.
SE FOR FOTO COMUM: observação concreta sobre o que tá na foto.

━━━━━━━━━━━━━━━━━━━
PROIBIDO INVENTAR
━━━━━━━━━━━━━━━━━━━
NÃO diga que ela "joga", "está trollando", "tá no jogo", "vibe gamer", "carinho", "esteira", "test", "frame", "ego" se isso NÃO está explícito na imagem.
NÃO faça análise de "poder", "quem tá em vantagem", "joguinho".
NÃO use linguagem de coach de pegação.

━━━━━━━━━━━━━━━━━━━
COMO ESCREVER AS RESPOSTAS
━━━━━━━━━━━━━━━━━━━
- minúsculo na maioria das vezes
- frases CURTAS
- "kkk" / "kk" natural (não em todas)
- gírias reais: "tipo", "né", "tu", "tá", "po"
- pontuação relaxada
- emoji RARO (😂 👀 quando cabe)
- a resposta deve ENCAIXAR no que ela acabou de mandar

PROIBIDO:
- "linda", "gata", "perfeita", "musa"
- frase poética, metáfora
- pergunta filosófica
- elogio direto
- "celebrar", "transmitir", "possui"

━━━━━━━━━━━━━━━━━━━
CATEGORIAS DAS RESPOSTAS (4 ao todo)
━━━━━━━━━━━━━━━━━━━
Escolha os 4 tipos que MAIS FAZEM SENTIDO para o contexto da imagem.
Pool disponível: "Natural", "Zoando", "Leve", "Curiosa", "Seca", "Debochada", "Direta", "Provocação leve".

Se o print é uma conversa leve e ela tá rindo → use ["Natural", "Zoando", "Leve", "Curiosa"]
Se ela tá fria/curta → use ["Natural", "Seca", "Direta", "Curiosa"]
NÃO force categorias que não cabem.

━━━━━━━━━━━━━━━━━━━
LEITURA (campo "leitura")
━━━━━━━━━━━━━━━━━━━
1-2 linhas em tom de amigo resumindo o que tá rolando.
Ex: "Ela respondeu rindo e entrou na brincadeira. Dá pra continuar leve, sem exagerar."
NÃO: "ela está no jogo, mantenha o frame".`;

const MENSAGEM_SCHEMA = {
  type: "object",
  properties: {
    tipo_imagem: {
      type: "string",
      enum: ["conversa", "story", "perfil", "foto"],
      description: "Tipo da imagem identificada.",
    },
    leitura: { type: "string", description: "1-2 linhas em tom de amigo sobre o que tá rolando." },
    mensagens: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: ["Natural", "Zoando", "Leve", "Curiosa", "Seca", "Debochada", "Direta", "Provocação leve"],
          },
          texto: { type: "string", description: "Resposta pronta pra mandar. Curta e natural." },
        },
        required: ["tipo", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["tipo_imagem", "leitura", "mensagens"],
  additionalProperties: false,
} as const;

const STORY_SCHEMA = {
  type: "object",
  properties: {
    o_que_aparece: {
      type: "string",
      description:
        "Descrição objetiva do que realmente aparece: foto, legenda, música, expressão, ambiente. Só o visível, sem inventar.",
    },
    provavel_contexto: {
      type: "string",
      description:
        "1-2 linhas em tom especulativo (pode ser / parece) sobre o que provavelmente está rolando. Sem inventar sentimento, interesse ou intenção.",
    },
    melhor_angulo: {
      type: "string",
      description: "Qual ângulo faz mais sentido pra responder esse story específico. 1 linha.",
    },
    evitar: {
      type: "string",
      description: "O que evitar responder nesse story. 1 linha curta.",
    },
    respostas: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          modo: {
            type: "string",
            enum: ["Natural", "Engraçada", "Low profile", "Provocação leve"],
          },
          texto: {
            type: "string",
            description:
              "Resposta curta, humana, cara de Instagram real. minúsculo, kkk natural quando cabe, sem elogio direto, sem frase robótica, sem cantada pronta.",
          },
        },
        required: ["modo", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["o_que_aparece", "provavel_contexto", "melhor_angulo", "evitar", "respostas"],
  additionalProperties: false,
} as const;

export interface MensagemResult {
  tipo_imagem?: "conversa" | "story" | "perfil" | "foto";
  leitura: string;
  mensagens: { tipo: string; texto: string }[];
}
export interface StoryResult {
  o_que_aparece: string;
  provavel_contexto: string;
  melhor_angulo: string;
  evitar: string;
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
      ? `Olha essa imagem. PRIMEIRO identifica o tipo (conversa / story / perfil / foto). Se for PRINT DE CONVERSA, lê as mensagens trocadas e me dá 4 respostas pra eu mandar agora continuando o papo de forma natural. Não inventa contexto que não tá ali. ${data.extra ? `Contexto extra do usuário: ${data.extra}` : ""}`
      : `Analisa esse print de story (Instagram/WhatsApp/Snap). Observa: o que aparece, clima da foto, legenda/música se tiver, contexto provável, melhor ângulo pra responder. NÃO inventa certeza, NÃO diz que ela "quer validação", NÃO julga corpo/roupa, NÃO age como guru de sedução. Devolve a leitura (2-3 linhas) e EXATAMENTE 4 respostas curtas e humanas, uma por modo: Natural, Engraçada, Low profile, Provocação leve. ${data.extra ? `Contexto extra: ${data.extra}` : ""}`;

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
              ? "Identifica o tipo da imagem e devolve 4 respostas naturais pra continuar o papo."
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
