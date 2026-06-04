import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const MODOS = ["natural", "engracado", "flertando", "inteligente", "madrugada"] as const;
export type FlowModo = (typeof MODOS)[number];

const MODO_GUIA: Record<FlowModo, string> = {
  natural: "Leve, seco, espontâneo. Como mensagem de amigo, sem esforço. Sem flerte explícito, sem elogio.",
  engracado: "Humor brasileiro seco, provocação baixa, 'kkk' onde couber. Sem forçar piada, sem fã.",
  flertando: "Tensão sutil e calma. Charme sem pressa. Nunca apelativo, nunca cantada pronta, nunca elogio direto.",
  inteligente: "Observação fina, curiosidade real sobre algo concreto do print. Nada de coach, nada de 'me conta mais sobre você'.",
  madrugada: "Calmo, voz baixa, sem pressa. Sem ser invasivo, sem romance forçado.",
};

const SYSTEM = `Você é um leitor de conversa brasileiro maduro, calmo e observador. Ajuda a pessoa a continuar o assunto SEM parecer carente, fã ou apressado.

REGRA DE LEITURA (CRÍTICA):
- Leia APENAS a última resposta real dela + o contexto visível no print. Não invente histórico.
- NÃO transforme resposta curta em interesse alto.
- NÃO diga "bom sinal", "ela gostou", "ela tá receptiva", "boa intimidade", "ela tá afim", "ela tá aberta" sem prova CLARA no print.
- Resposta curta ("obrigada", "kkk", "sim", "não", "talvez", emoji) = resposta curta. Nada além disso.
- Se não há evidência, diga com calma que não dá pra cravar. Mantenha nivel_interesse e energia_dela BAIXOS/MÉDIOS nesses casos.

MODO SEM CARÊNCIA (CRÍTICA):
- Respostas curtas, naturais, secas ou com provocação BAIXA.
- Sem elogio direto. Sem pergunta carente. Sem parecer fã. Sem forçar romance.
- PROIBIDO gerar frases tipo: "o que te fez rir aí?", "me dá uma luz", "o que esse sim esconde?", "agora fiquei curioso", "conta mais sobre você", "quero saber mais de você", "me explica melhor", "me fala mais".
- Quando ela manda algo curto, devolve algo curto, leve e observador. Não puxa assunto à força.

REGRA ANTI-ROBÔ (CRÍTICA):
- Nem toda mensagem precisa abrir assunto novo. Às vezes a melhor resposta é a mais simples.
- Se ela responder curto ("kkk", "sim", "não", "só aprontam", "pois é", "verdade", "nossa", "real"), NÃO invente curiosidade, NÃO crie pergunta, NÃO force gancho, NÃO transforme em deixa pra outro assunto.
- Responde no MESMO nível de energia que ela mandou. Poucas palavras. Soa natural, como amigo no zap.
- PROIBIDO virar tudo em pergunta tipo "então o que rolou?", "me conta", "como assim?", "o que foi dessa vez?".

EXEMPLOS DE TOM CORRETO:
- Ela: "Obrigada" → "pior que ficou mesmo kkk"
- Ela: "Meu best" → "agora fui promovido do nada kkk"
- Ela: "kkk" → "kkkk já imaginei"
- Ela: "sim" → "tá explicado então kkk"
- Ela: "Só aprontam!!" → "coitada de ti 😂" / "já deu pra perceber kkk" / "aí eu acredito"
- Ela: "pois é" → "é osso kkk"
- Ela: "verdade" → "né"


POSTURA:
- Frases curtas, jeito de DM/WhatsApp. Minúsculas, gírias leves, 'kkk' quando couber.
- Nunca cantada pronta, nunca frase de internet, nunca tom de coach.
- Nunca chama a pessoa de carente, biscoiteira, joguinho.
- Parece calmo, observador, sem pressa.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    clima: { type: "string", description: "1 linha sobre o clima atual da conversa." },
    nivel_interesse: { type: "number", minimum: 0, maximum: 100 },
    energia_dela: { type: "number", minimum: 0, maximum: 100 },
    risco_morrer: { type: "number", minimum: 0, maximum: 100, description: "Risco da conversa morrer agora." },
    proxima_mensagem: { type: "string", description: "A próxima mensagem ideal pra enviar agora. Natural, curta, no tom do modo escolhido." },
    porque_funciona: { type: "string", description: "1-2 linhas explicando por que essa mensagem combina agora." },
    escalar_interesse: { type: "string", description: "1 linha sobre como aumentar conexão sem parecer emocionado." },
    assunto_ideal: { type: "string", description: "Melhor tema pra continuar a conversa agora." },
    evitar: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string" },
      description: "Mensagens/atitudes que quebram o clima agora.",
    },
    continuacao_curta: {
      type: "object",
      description: "O que responder se ela mandar resposta curta.",
      properties: {
        kkk: { type: "string" },
        sim: { type: "string" },
        nao: { type: "string" },
        talvez: { type: "string" },
        sei_la: { type: "string" },
        emoji: { type: "string" },
      },
      required: ["kkk","sim","nao","talvez","sei_la","emoji"],
      additionalProperties: false,
    },
    direcao: { type: "string", description: "1 linha sobre a melhor direção pra seguir nas próximas mensagens." },
  },
  required: [
    "clima","nivel_interesse","energia_dela","risco_morrer",
    "proxima_mensagem","porque_funciona","escalar_interesse","assunto_ideal",
    "evitar","continuacao_curta","direcao",
  ],
  additionalProperties: false,
} as const;

export interface FlowResult {
  clima: string;
  nivel_interesse: number;
  energia_dela: number;
  risco_morrer: number;
  proxima_mensagem: string;
  porque_funciona: string;
  escalar_interesse: string;
  assunto_ideal: string;
  evitar: string[];
  continuacao_curta: {
    kkk: string; sim: string; nao: string;
    talvez: string; sei_la: string; emoji: string;
  };
  direcao: string;
}

export const continuarConversa = createServerFn({ method: "POST" })
  .inputValidator((input: { contexto?: string; modo?: FlowModo; images?: string[] }) => {
    const contexto = (input?.contexto ?? "").slice(0, 4000).trim();
    const modo: FlowModo = MODOS.includes(input?.modo as FlowModo) ? (input!.modo as FlowModo) : "natural";
    const images = Array.isArray(input?.images)
      ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    }
    if (!contexto && images.length === 0) {
      throw new Error("Manda o print da conversa ou descreve a situação.");
    }
    return { contexto, modo, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `Lê o print/contexto abaixo e devolve a próxima mensagem ideal pra manter o assunto fluindo, no modo "${data.modo}" (${MODO_GUIA[data.modo]}). Tom natural, brasileiro, curto. Sem cantada pronta, sem coach.${data.contexto ? `\n\nContexto / conversa:\n${data.contexto}` : ""}${data.images.length ? `\n\n${data.images.length} imagem(ns) anexada(s).` : ""}`,
      },
      ...data.images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: parts },
        ],
        tools: [{
          type: "function",
          function: {
            name: "continuar_conversa",
            description: "Devolve a leitura do flow + próxima mensagem ideal.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "continuar_conversa" } },
      }),
    });

    if (res.status === 429) throw new Error("Muitas mensagens de uma vez. Espera um pouco.");
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
      return { result: JSON.parse(args) as FlowResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
