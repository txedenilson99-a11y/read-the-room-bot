import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiRequest } from "./gemini";

// =========================================================================
// CENTRAL IA v7.20 — MODO ECONOMIA MÁXIMA
// 1 imagem = 1 chamada Gemini Vision = 1 JSON salvo.
// Regenerar respostas NÃO reanalisa imagem (chamada texto-only).
// Sliders são puro front (filtragem/reorganização local).
// =========================================================================

const ESTILO_CENTRAL = `Você é OBSERVADOR SOCIAL HUMANO.

NUNCA: coach, sedutor profissional, psicólogo, leitor de mente, fã.
SEMPRE: observação visual, detalhe real, humor seco, frame holder, sem carência, sem elogio fácil.

PROIBIDO ABSOLUTO (palavras que não podem aparecer):
✗ "linda", "perfeita", "maravilhosa", "gata", "musa", "deusa", "gostosa", "deslumbrante", "que mulher", "casava"
✗ "vibe", "energia", "aura", "intenção" (substitua por "leitura observável" e "possíveis leituras")
✗ "carência", "gado" (substitua por "risco social")
✗ "claramente", "obviamente", "ponto alto do dia", "você quis chamar atenção"
✗ "sei exatamente o que isso significa", "transmite", "demonstra", "celebrar"
✗ "linda demais", "arrasou", "que foto", "amei", "uau"
✗ corações ❤️ 🥰 😍 🔥, emoji em excesso (máx 1 a cada 4)
✗ poesia, metáfora, pergunta filosófica
✗ "oi", "e aí", "tudo bem?" como abertura

REGRA DURA: cada resposta tem NO MÁXIMO 12 palavras.
REGRA DE OURO: comente a SITUAÇÃO, não a aparência.

FILTRO DOS 20%: se a resposta parecer algo que mais de 20% das pessoas mandaria, descarte.

ORDEM DE OBSERVAÇÃO (antes de pensar na pessoa):
1. OBJETOS na cena
2. AMBIENTE
3. ERROS (flash, reflexo, photobomb, desalinho)
4. CONTRASTES
5. COINCIDÊNCIAS
6. PEQUENOS DETALHES (etiqueta, sombra, texto pequeno)

PRIORIZE:
- observação RARA
- comentário ESPONTÂNEO
- detalhe ESPECÍFICO
- reação HUMANA REAL`;

const SYSTEM_ANALISE = `${ESTILO_CENTRAL}

MISSÃO: Analisar 1 story e devolver UM JSON ÚNICO E COMPLETO com tudo que a tela precisa.
NUNCA reanalise a mesma imagem. Esta é a ÚNICA chamada Gemini Vision.

REGRAS DE FORMATO:
- Listas: 3-5 itens curtos (2-6 palavras cada).
- detalhe_raro: UM detalhe que 95% das pessoas ignoraria. Específico.
- melhor_assunto: gancho real (máx 12 palavras), nunca elogio de beleza.
- leitura_observavel: 1-2 linhas SÓ sobre o que aparece. Sem interpretação de intenção.
- possiveis_leituras: 2-3 hipóteses honestas separadas por " | ". Nunca cravar.
- tipo_detectado: um dos rótulos abaixo (com emoji).
- detector_assunto: escala QUALITATIVA — "Muito Baixo" | "Baixo" | "Médio" | "Alto" | "Muito Alto". NUNCA número.
- métricas: também escala qualitativa (mesmos 5 níveis).

TIPOS DE STORY (escolha um):
"📸 Selfie / Espelho" | "🥤 Bebida / Comida" | "🎂 Aniversário" | "🎵 Música" | "🐶 Pet" | "🚗 Carro" | "🏋️ Academia" | "✈️ Viagem" | "🧉 Chimarrão" | "😂 Meme" | "🌅 Paisagem" | "🎮 Game" | "🧩 Outro"

RESPOSTAS — 8 categorias OBRIGATÓRIAS (uma cada), cada uma com personalidade própria:
- natural: tom de amigo real, observação solta.
- debochada: deboche fino sobre algo da cena.
- ironica: ironia seca, sem agressividade.
- flow: solto, gírias leves, sem esforço.
- anti_gado: oposto de elogio, frame holder, indiferente.
- misteriosa: incompleta, deixa curiosidade.
- lider: afirmativa, conduz a conversa.
- ousada: provocação leve, sem ser grosseiro.

DIVERSIDADE: cada resposta deve parecer escrita por pessoa DIFERENTE. Sem repetir estrutura. Máx 3 com "kkk".

${IA_HONESTA}`;

const SCHEMA_ANALISE = {
  type: "object",
  properties: {
    identificado: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: { type: "string", description: "Fato visível. 2-5 palavras." },
    },
    nao_confirmado: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string", description: "O que NÃO dá pra cravar." },
    },
    detalhe_raro: { type: "string", description: "1 detalhe específico que 95% ignoraria." },
    melhor_assunto: { type: "string", description: "Máx 12 palavras. Gancho real." },
    leitura_observavel: { type: "string", description: "1-2 linhas só sobre o visível." },
    possiveis_leituras: { type: "string", description: "2-3 hipóteses separadas por ' | '." },
    assuntos_usar: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
    },
    assuntos_evitar: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
    },
    tipo_detectado: {
      type: "string",
      enum: [
        "📸 Selfie / Espelho",
        "🥤 Bebida / Comida",
        "🎂 Aniversário",
        "🎵 Música",
        "🐶 Pet",
        "🚗 Carro",
        "🏋️ Academia",
        "✈️ Viagem",
        "🧉 Chimarrão",
        "😂 Meme",
        "🌅 Paisagem",
        "🎮 Game",
        "🧩 Outro",
      ],
    },
    detector_assunto: {
      type: "string",
      enum: ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"],
      description: "Potencial de conversa, escala qualitativa.",
    },
    melhor_resposta: { type: "string", description: "A resposta que vai funcionar melhor. Máx 12 palavras." },
    porque_funciona: { type: "string", description: "1 linha curta explicando." },
    respostas: {
      type: "object",
      properties: {
        natural: { type: "string" },
        debochada: { type: "string" },
        ironica: { type: "string" },
        flow: { type: "string" },
        anti_gado: { type: "string" },
        misteriosa: { type: "string" },
        lider: { type: "string" },
        ousada: { type: "string" },
      },
      required: ["natural", "debochada", "ironica", "flow", "anti_gado", "misteriosa", "lider", "ousada"],
      additionalProperties: false,
    },
    metricas: {
      type: "object",
      properties: {
        naturalidade: { type: "string", enum: ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"] },
        originalidade: { type: "string", enum: ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"] },
        chance_resposta: { type: "string", enum: ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"] },
        risco_social: { type: "string", enum: ["Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto"] },
      },
      required: ["naturalidade", "originalidade", "chance_resposta", "risco_social"],
      additionalProperties: false,
    },
  },
  required: [
    "identificado",
    "nao_confirmado",
    "detalhe_raro",
    "melhor_assunto",
    "leitura_observavel",
    "possiveis_leituras",
    "assuntos_usar",
    "assuntos_evitar",
    "tipo_detectado",
    "detector_assunto",
    "melhor_resposta",
    "porque_funciona",
    "respostas",
    "metricas",
  ],
  additionalProperties: false,
} as const;

export type NivelQualitativo = "Muito Baixo" | "Baixo" | "Médio" | "Alto" | "Muito Alto";

export interface RespostasObj {
  natural: string;
  debochada: string;
  ironica: string;
  flow: string;
  anti_gado: string;
  misteriosa: string;
  lider: string;
  ousada: string;
}

export interface ResponderStoryResult {
  identificado: string[];
  nao_confirmado: string[];
  detalhe_raro: string;
  melhor_assunto: string;
  leitura_observavel: string;
  possiveis_leituras: string;
  assuntos_usar: string[];
  assuntos_evitar: string[];
  tipo_detectado: string;
  detector_assunto: NivelQualitativo;
  melhor_resposta: string;
  porque_funciona: string;
  respostas: RespostasObj;
  metricas: {
    naturalidade: NivelQualitativo;
    originalidade: NivelQualitativo;
    chance_resposta: NivelQualitativo;
    risco_social: NivelQualitativo;
  };
}

// =========================================================================
// 1) ANÁLISE COMPLETA — chamada ÚNICA com Gemini Vision
// =========================================================================
export const responderStory = createServerFn({ method: "POST" })
  .inputValidator((input: { imageDataUrl?: string }) => {
    const imageDataUrl =
      typeof input?.imageDataUrl === "string" && input.imageDataUrl.startsWith("data:")
        ? input.imageDataUrl
        : undefined;
    if (!imageDataUrl) throw new Error("Manda o print do story.");
    if (imageDataUrl.length > 12_000_000) throw new Error("Arquivo muito pesado. Tenta um menor.");
    return { imageDataUrl };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const userParts: any[] = [
      { type: "text", text: "Analisa esse story e devolve UM JSON único com TUDO. Modo Economia: chamada única." },
      { type: "image_url", image_url: { url: data.imageDataUrl } },
    ];

    const json = (await geminiRequest(apiKey, {
      model: "gemini-flash-latest",
      messages: [
        { role: "system", content: SYSTEM_ANALISE },
        { role: "user", content: userParts },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "analisar_story",
            description: "Devolve análise completa do story em 1 JSON.",
            parameters: SCHEMA_ANALISE,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "analisar_story" } },
    })) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    const result = JSON.parse(args) as ResponderStoryResult;
    return { result };
  });

// =========================================================================
// 2) REGENERAR RESPOSTAS — texto-only, SEM imagem
//    Usa apenas a análise já existente. NUNCA dispara Gemini Vision.
// =========================================================================
const SYSTEM_REGENERAR = `${ESTILO_CENTRAL}

MISSÃO: Você JÁ TEM a análise da imagem. NÃO precisa enxergar a foto.
Use APENAS o contexto textual abaixo (detalhe raro, melhor assunto, leitura, tipo) pra gerar 8 respostas novas, DIFERENTES das anteriores.

REGRAS:
- Cada categoria mantém seu tom (natural, debochada, ironica, flow, anti_gado, misteriosa, lider, ousada).
- Máx 12 palavras cada.
- Sem repetir frase, estrutura ou palavra-chave das respostas anteriores.
- Sem reanálise visual — você não tem a imagem.`;

const SCHEMA_REGENERAR = {
  type: "object",
  properties: {
    respostas: SCHEMA_ANALISE.properties.respostas,
  },
  required: ["respostas"],
  additionalProperties: false,
} as const;

export const regenerarRespostas = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      detalhe_raro?: string;
      melhor_assunto?: string;
      leitura_observavel?: string;
      tipo_detectado?: string;
      respostas_anteriores?: Partial<RespostasObj>;
    }) => {
      const detalhe_raro = (input?.detalhe_raro ?? "").slice(0, 500);
      const melhor_assunto = (input?.melhor_assunto ?? "").slice(0, 500);
      const leitura_observavel = (input?.leitura_observavel ?? "").slice(0, 1000);
      const tipo_detectado = (input?.tipo_detectado ?? "").slice(0, 100);
      if (!detalhe_raro && !melhor_assunto && !leitura_observavel) {
        throw new Error("Sem contexto pra regenerar. Analise um story primeiro.");
      }
      const ant = input?.respostas_anteriores ?? {};
      const respostas_anteriores: Partial<RespostasObj> = {};
      for (const k of [
        "natural",
        "debochada",
        "ironica",
        "flow",
        "anti_gado",
        "misteriosa",
        "lider",
        "ousada",
      ] as const) {
        const v = ant[k];
        if (typeof v === "string") respostas_anteriores[k] = v.slice(0, 200);
      }
      return { detalhe_raro, melhor_assunto, leitura_observavel, tipo_detectado, respostas_anteriores };
    },
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const contexto = `CONTEXTO DA IMAGEM (já analisada — não reanalisar):
- Tipo: ${data.tipo_detectado || "—"}
- Detalhe raro: ${data.detalhe_raro || "—"}
- Melhor assunto: ${data.melhor_assunto || "—"}
- Leitura observável: ${data.leitura_observavel || "—"}

RESPOSTAS ANTERIORES (NÃO REPETIR):
${Object.entries(data.respostas_anteriores)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Gere 8 respostas NOVAS, ancoradas no detalhe raro e no melhor assunto.`;

    const json = (await geminiRequest(apiKey, {
      model: "gemini-flash-latest",
      messages: [
        { role: "system", content: SYSTEM_REGENERAR },
        { role: "user", content: contexto },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "regenerar_respostas",
            description: "8 respostas novas baseadas só no contexto textual.",
            parameters: SCHEMA_REGENERAR,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "regenerar_respostas" } },
    })) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };

    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    const out = JSON.parse(args) as { respostas: RespostasObj };
    return { respostas: out.respostas };
  });
