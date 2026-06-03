import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const ESTRATEGIAS = ["curiosidade", "provocacao", "humor", "direto", "suave", "story"] as const;
export type ReativacaoEstrategia = (typeof ESTRATEGIAS)[number];

const ESTRATEGIA_GUIA: Record<ReativacaoEstrategia, string> = {
  curiosidade: "🧠 Curiosidade — abre um loop, deixa ela querer responder pra saber o resto. Nada de pergunta carente.",
  provocacao: "😏 Provocação leve — alfinetada de bom humor. Sem grosseria, sem cobrança do sumiço.",
  humor: "😂 Humor — uma piada curta, observação engraçada, gancho leve. Sem tentar 'ser engraçado'.",
  direto: "🎯 Direto — uma frase curta, sem rodeio, sem explicação do tempo sem falar.",
  suave: "🌙 Reentrada suave — calma, sem peso, parece que ela pensou na pessoa de leve.",
  story: "📱 Reação em story — comentário casual sobre algo que ela postou agora. Volta pelo lado dela.",
};

const SYSTEM = `Você é um amigo brasileiro maduro, calmo e observador, especialista em REATIVAR conversa morta sem entregar carência.

CONTEXTO DA FERRAMENTA:
A pessoa quer voltar a falar com alguém depois de tempo sem contato (semanas, meses, ou sumiço no meio do papo). A IA analisa o histórico/print e cria a melhor reentrada possível.

REGRA DE LEITURA (CRÍTICA):
- Leia APENAS o que aparece no print/contexto. Não invente histórico nem sentimento.
- Não diga "ela tava afim", "ela ficou chateada", "ela tá esperando" sem prova clara.
- Se não dá pra cravar nível de abertura, use "não dá pra cravar" / "parece" / "pode ser que".

REATIVAÇÃO SEM CARÊNCIA (CRÍTICA):
- A mensagem PROIBIDO mencionar tempo sem falar, sumiço, saudade, "cadê você", "sumida(o)", "lembrei de você", "fazia tempo".
- PROIBIDO pedir desculpa pelo sumiço, cobrar resposta, reclamar, fazer textão, abrir com "oi", "e aí", "tudo bem?".
- PROIBIDO elogio direto ("linda", "perfeita", "gata", "musa", "gostei da sua foto").
- A reentrada tem que parecer NATURAL — como se a conversa nunca tivesse parado, ou como se algo do dia da pessoa fez ele lembrar daquele assunto específico.
- Curto, leve, sem energia de fã, sem parecer que ficou esperando.
- Se houver story recente no contexto, prioriza reagir ao story (entra pelo lado dela, não pelo passado de vocês).

EXEMPLOS DE TOM:
- Conversa morreu falando de viagem → "lembrei daquele rolê que tu falou. fui ou ficou na promessa? kkk"
- Ela sumiu depois de mandar foto → "aquele lugar que aparecia atrás de ti era onde mesmo?"
- Story de comida → "essa combinação aí já me deu fome kkk"

POSTURA:
- Frases curtas, jeito de DM/WhatsApp. Minúsculas, gírias leves, 'kkk' quando couber.
- Nunca cantada pronta, nunca frase de coach, nunca tom dramático.
- Parece calmo, observador, sem pressa.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "Resumo curto e honesto do estado da conversa morta. 2-3 linhas." },
    tempo_sem_contato: { type: "string", description: "Estimativa de quanto tempo a conversa tá parada, se der pra inferir. Senão 'não dá pra cravar'." },
    como_terminou: { type: "string", description: "1 linha sobre como a última interação terminou (ela parou de responder, sumiu no meio, despedida normal, etc)." },
    nivel_abertura: { type: "number", minimum: 0, maximum: 100, description: "Quanto ela parece ainda aberta a voltar a falar. Baixo se não houver sinal claro." },
    chance_resposta: { type: "number", minimum: 0, maximum: 100, description: "Chance realista de ela responder à reativação." },
    risco_silencio: { type: "number", minimum: 0, maximum: 100, description: "Risco de ela ler e não responder." },
    melhor_abordagem: { type: "string", description: "1 linha sobre qual estratégia combina mais com esse caso e por quê." },
    mensagem_principal: { type: "string", description: "A mensagem ideal pra reativar AGORA, no estilo escolhido. Curta, natural, sem mencionar sumiço." },
    porque_funciona: { type: "string", description: "1-2 linhas explicando por que essa reentrada funciona neste caso." },
    alternativas: {
      type: "array", minItems: 3, maxItems: 5,
      items: {
        type: "object",
        properties: {
          estilo: { type: "string", enum: ["curiosidade", "provocacao", "humor", "direto", "suave", "story"] },
          texto: { type: "string", description: "Reentrada alternativa pronta pra mandar." },
        },
        required: ["estilo", "texto"],
        additionalProperties: false,
      },
    },
    se_ela_responder_curto: {
      type: "object",
      description: "O que mandar se ela devolver algo curto/morno.",
      properties: {
        kkk: { type: "string" },
        sim: { type: "string" },
        emoji: { type: "string" },
      },
      required: ["kkk","sim","emoji"],
      additionalProperties: false,
    },
    evitar: {
      type: "array", minItems: 3, maxItems: 6,
      items: { type: "string" },
      description: "Mensagens/atitudes que quebram a reativação (cobrar sumiço, textão, carência, etc).",
    },
    plano_b: { type: "string", description: "Se ela não responder em alguns dias, qual o próximo passo (sem insistir, sem dramático)." },
  },
  required: [
    "leitura","tempo_sem_contato","como_terminou",
    "nivel_abertura","chance_resposta","risco_silencio",
    "melhor_abordagem","mensagem_principal","porque_funciona",
    "alternativas","se_ela_responder_curto","evitar","plano_b",
  ],
  additionalProperties: false,
} as const;

export interface ReativacaoResult {
  leitura: string;
  tempo_sem_contato: string;
  como_terminou: string;
  nivel_abertura: number;
  chance_resposta: number;
  risco_silencio: number;
  melhor_abordagem: string;
  mensagem_principal: string;
  porque_funciona: string;
  alternativas: Array<{ estilo: ReativacaoEstrategia; texto: string }>;
  se_ela_responder_curto: { kkk: string; sim: string; emoji: string };
  evitar: string[];
  plano_b: string;
}

export const reativarContato = createServerFn({ method: "POST" })
  .inputValidator((input: { contexto?: string; estrategia?: ReativacaoEstrategia; images?: string[] }) => {
    const contexto = (input?.contexto ?? "").slice(0, 4000).trim();
    const estrategia: ReativacaoEstrategia = ESTRATEGIAS.includes(input?.estrategia as ReativacaoEstrategia)
      ? (input!.estrategia as ReativacaoEstrategia)
      : "curiosidade";
    const images = Array.isArray(input?.images)
      ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    }
    if (!contexto && images.length === 0) {
      throw new Error("Cola o print, a última mensagem ou descreve o contexto.");
    }
    return { contexto, estrategia, images };
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
        text: `Analisa essa conversa morta e cria a melhor REATIVAÇÃO de contato no estilo "${data.estrategia}" (${ESTRATEGIA_GUIA[data.estrategia]}).

A mensagem principal NÃO pode mencionar tempo sem falar, sumiço, saudade ou cobrar resposta. Tem que parecer natural, como se a conversa nunca tivesse parado.${data.contexto ? `\n\nContexto / última conversa:\n${data.contexto}` : ""}${data.images.length ? `\n\n${data.images.length} imagem(ns) anexada(s) com o print.` : ""}`,
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
            name: "reativar_contato",
            description: "Devolve a leitura da conversa morta + reentrada ideal pra reativar contato.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "reativar_contato" } },
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
      return { result: JSON.parse(args) as ReativacaoResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
