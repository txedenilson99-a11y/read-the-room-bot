import { IA_HONESTA } from "./ia-honesta";
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
- LEIA as mensagens trocadas na ordem, do início ao fim
- Se houver IMAGEM DE STORY no print (foto, meme, print de outro story que ele respondeu), ELA É PARTE DO CONTEXTO. A conversa pode estar girando em torno daquela imagem.
- Identifique a ÚLTIMA mensagem dela
- Sua tarefa: CONTINUAR o papo de forma natural
- NÃO analise cenário, ambiente, vibe, jogo, intenção oculta
- NÃO invente contexto que não está escrito ali
- Trate como se fosse SEU amigo te mostrando o print pedindo "o que respondo?"

━━━━━━━━━━━━━━━━━━━
REGRA DE INTERPRETAÇÃO (CRÍTICO)
━━━━━━━━━━━━━━━━━━━
NUNCA interprete uma palavra isolada dela sem olhar o contexto inteiro (o story respondido + a mensagem que o usuário mandou + as respostas dela em ordem).

Se ela diz "meu best", "amo", "lindo", "gato", "perfeito", "gostoso" — PERGUNTE-SE PRIMEIRO: ela está falando do USUÁRIO ou de algo/alguém no story (jogador, artista, meme, animal, comida, personagem)?

Na dúvida, assuma que se refere ao CONTEÚDO DO STORY, não ao usuário. Exemplo: story mostra Neymar, usuário zoou, ela responde "kkk meu best" → "best" é o Neymar, NÃO o usuário.

NÃO afirme sem evidência clara:
  ✗ "ela te chamou de best"
  ✗ "ela te considera"
  ✗ "vocês têm intimidade"
  ✗ "ela tá interessada"
  ✗ "ela tá flertando"

Diga em vez disso: "ela entrou na brincadeira", "ela riu", "a zoeira funcionou", "ela respondeu de boa", "não dá pra concluir interesse, só que o papo fluiu".

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
NÃO: "ela está no jogo, mantenha o frame".` + IA_HONESTA;

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
    leitura: { type: "string", description: "O que esse story tá dizendo de verdade, em tom de amigo. 1-2 linhas." },
    estrategia: { type: "string", description: "Melhor jogada agora, tom de amigo. Curto." },
    timing: { type: "string", description: "Quando responder, em linguagem real. Curto." },
    evitar: { type: "string", description: "O que NÃO mandar. Curto e direto." },
    metricas: {
      type: "object",
      properties: {
        clima: { type: "number", minimum: 0, maximum: 100 },
        abertura: { type: "number", minimum: 0, maximum: 100 },
        interesse: { type: "number", minimum: 0, maximum: 100 },
        energia: { type: "number", minimum: 0, maximum: 100 },
        chance_papo: { type: "number", minimum: 0, maximum: 100 },
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
          texto: { type: "string" },
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
  tipo_imagem?: "conversa" | "story" | "perfil" | "foto";
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const isMensagem = data.mode === "mensagem";

    const userText = isMensagem
      ? `Olha essa imagem. PRIMEIRO identifica o tipo (conversa / story / perfil / foto). Se for PRINT DE CONVERSA, lê as mensagens trocadas e me dá 4 respostas pra eu mandar agora continuando o papo de forma natural. Não inventa contexto que não tá ali. ${data.extra ? `Contexto extra do usuário: ${data.extra}` : ""}`
      : `Analisa esse print de story (Instagram/WhatsApp/Snap/Facebook). Lê legenda, expressão, pose, ambiente, emoção, intenção. Devolve a leitura, estratégia, timing, o que evitar, métricas de 0 a 100 e 7 respostas prontas (uma por modo). ${data.extra ? `Contexto extra: ${data.extra}` : ""}`;

    const toolName = isMensagem ? "responder_foto" : "responder_story";
    const schema = isMensagem ? MENSAGEM_SCHEMA : STORY_SCHEMA;

    const body = {
      model: "gemini-2.5-flash",
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

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
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
