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
    assunto_principal: { type: "string", description: "O tema que está dominando a conversa agora. 1 linha curta." },
    clima: { type: "string", description: "1 linha sobre o clima atual: leve, divertido, sério, flertando, provocativo ou neutro." },
    clima_tag: {
      type: "string",
      enum: ["leve","divertido","serio","flertando","provocativo","neutro"],
      description: "Classificação do clima em 1 palavra.",
    },
    energia_dela_nivel: { type: "string", enum: ["baixa","media","alta"] },
    interesse_nivel: { type: "string", enum: ["baixo","medio","alto"] },
    nivel_interesse: { type: "number", minimum: 0, maximum: 100 },
    energia_dela: { type: "number", minimum: 0, maximum: 100 },
    risco_morrer: { type: "number", minimum: 0, maximum: 100, description: "Risco da conversa morrer agora." },
    risco_morrer_nivel: { type: "string", enum: ["baixo","medio","alto"] },
    chance_continuar: { type: "number", minimum: 0, maximum: 100, description: "Chance de continuar o papo se enviar a melhor resposta." },
    potencial_conexao: { type: "number", minimum: 0, maximum: 100, description: "Potencial de conexão real entre os dois." },
    gancho_ultima_msg: { type: "string", description: "A última mensagem dela, citada literalmente entre aspas se possível. Se não houver, '—'." },
    gancho_entregou: {
      type: "array", minItems: 2, maxItems: 6,
      items: { type: "string" },
      description: "O que ela entregou na última mensagem (ex: 'Emoção', 'Futebol', 'Torcida', 'Experiência pessoal').",
    },
    gancho_direcao: { type: "string", description: "Melhor direção pra continuar a partir do gancho. 1 linha." },
    proxima_mensagem: { type: "string", description: "🎯 A MELHOR resposta. Maior chance de manter a conversa fluindo. Natural, curta, no tom do modo escolhido." },
    porque_funciona: { type: "string", description: "1-2 linhas explicando por que essa mensagem combina agora." },
    melhor_resposta_nota: { type: "number", minimum: 0, maximum: 10, description: "Nota da melhor resposta de 0 a 10 (ex: 9.4)." },
    melhor_resposta_motivos: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string" },
      description: "Motivos curtos do porquê a melhor resposta funciona (ex: 'Natural', 'Engraçada', 'Gera resposta', 'Sem pressão').",
    },
    traducao_bullets: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string" },
      description: "🧠 O que ela quis dizer com a última mensagem. 2-4 bullets curtos (ex: 'Ela entrou na brincadeira.', 'Compartilhou uma emoção.').",
    },
    traducao_sinal: {
      type: "string",
      enum: ["positivo","neutro","negativo"],
      description: "Sinal geral da última mensagem dela.",
    },
    chance_resposta_por_modo: {
      type: "object",
      description: "Chance estimada (0-100) de ela responder cada modo de mensagem.",
      properties: {
        natural: { type: "number", minimum: 0, maximum: 100 },
        engracada: { type: "number", minimum: 0, maximum: 100 },
        flertando: { type: "number", minimum: 0, maximum: 100 },
        inteligente: { type: "number", minimum: 0, maximum: 100 },
        provocando: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["natural","engracada","flertando","inteligente","provocando"],
      additionalProperties: false,
    },
    proximo_passo: {
      type: "object",
      description: "🎮 Próximo passo dependendo da reação dela.",
      properties: {
        se_rir: { type: "string", description: "O que fazer se ela rir (ex: 'continuar brincadeira')." },
        se_concordar: { type: "string", description: "Se ela concordar (ex: 'aprofundar assunto')." },
        se_mudar_assunto: { type: "string", description: "Se ela mudar de assunto (ex: 'seguir o assunto dela')." },
        se_sumir: { type: "string", description: "Se ela sumir (ex: 'não cobrar resposta')." },
      },
      required: ["se_rir","se_concordar","se_mudar_assunto","se_sumir"],
      additionalProperties: false,
    },
    score_chance_resposta: { type: "number", minimum: 0, maximum: 100, description: "Chance dela responder a próxima mensagem." },
    score_naturalidade: { type: "number", minimum: 0, maximum: 100 },
    score_carencia: { type: "number", minimum: 0, maximum: 100, description: "Carência percebida. Quanto menor, melhor. Idealmente 0." },
    investimento: { type: "number", minimum: 0, maximum: 100, description: "Quanto ela tá investindo na conversa (escrevendo, perguntando, mantendo o assunto)." },
    investimento_nivel: { type: "string", enum: ["baixo","medio","alto"] },
    respostas_alternativas: {
      type: "object",
      description: "Uma resposta pronta pra cada tom: natural, engraçada, flertando, inteligente e provocando.",
      properties: {
        natural: { type: "string" },
        engracada: { type: "string" },
        flertando: { type: "string" },
        inteligente: { type: "string" },
        provocando: { type: "string", description: "Provocação leve, sem ofender, com humor. Não confundir com cantada." },
      },
      required: ["natural","engracada","flertando","inteligente","provocando"],
      additionalProperties: false,
    },
    escalar_interesse: { type: "string", description: "1 linha sobre como aumentar conexão sem parecer emocionado." },
    assunto_ideal: { type: "string", description: "Melhor tema pra continuar a conversa agora." },
    evitar: {
      type: "array", minItems: 3, maxItems: 6,
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
    chance_encontro: { type: "number", minimum: 0, maximum: 100, description: "Chance de evoluir pra um encontro real, com base no clima atual." },
    perfil_tipo: { type: "string", description: "Tipo dela detectado em 1 linha curta (ex: 'Emocional e brincalhona', 'Direta e seca', 'Reservada e curiosa')." },
    perfil_funciona_com: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string" },
      description: "O que funciona melhor com esse tipo (ex: 'Humor', 'Histórias', 'Provocação leve', 'Profundidade').",
    },
    resumo_ia: { type: "string", description: "🎯 RESUMO da IA: 2-3 linhas falando o estado da conversa e o melhor caminho a seguir." },
    direcao: { type: "string", description: "🎯 DIREÇÃO FINAL: 1 frase sobre o melhor caminho pra continuar sem parecer robô e sem parecer carente." },
    status_conversa: {
      type: "object",
      description: "📊 STATUS DA CONVERSA: diagnóstico honesto do estado atual.",
      properties: {
        checklist: {
          type: "array", minItems: 4, maxItems: 8,
          items: {
            type: "object",
            properties: {
              ok: { type: "boolean", description: "true = ✅ aconteceu, false = ❌ não aconteceu." },
              texto: { type: "string", description: "Frase curta (ex: 'Ela respondeu.', 'Entrou na brincadeira.', 'Não criou assunto novo.', 'Não fez pergunta.')." },
            },
            required: ["ok","texto"],
            additionalProperties: false,
          },
        },
        o_que_aconteceu: { type: "string", description: "2-3 linhas descrevendo o que aconteceu na conversa de forma honesta e calma." },
        nao_significa: {
          type: "array", minItems: 2, maxItems: 5, items: { type: "string" },
          description: "O que isso NÃO significa (ex: 'Ela perdeu interesse.', 'Ela está te ignorando.'). Lista de fantasias a descartar.",
        },
        pode_significar: {
          type: "array", minItems: 2, maxItems: 5, items: { type: "string" },
          description: "O que isso PODE significar (ex: 'Estava ocupada.', 'Achou agradável, mas o tema acabou.'). Possibilidades reais.",
        },
        investimento_dela: { type: "string", description: "1-2 linhas sobre o investimento dela (ex: 'Baixo a médio. Responde quando provocada, mas não puxa muito.')." },
        energia_dela_status: { type: "string", description: "1 linha sobre a energia dela (ex: 'Leve. Confortável. Sem sinais de desconforto.')." },
        risco_real: { type: "string", description: "1-2 linhas sobre o risco real (ex: 'Baixo. Não existe rejeição explícita, apenas falta de impulso.')." },
        veredito_ia: { type: "string", description: "Veredito honesto em 1-2 linhas (ex: 'A conversa foi positiva. O assunto perdeu força, não a conexão.')." },
        proximo_passo_status: {
          type: "array", minItems: 1, maxItems: 4, items: { type: "string" },
          description: "Próximos passos práticos (ex: 'Não insistir no mesmo tema.', 'Abrir assunto novo ou esperar um momento melhor.').",
        },
      },
      required: ["checklist","o_que_aconteceu","nao_significa","pode_significar","investimento_dela","energia_dela_status","risco_real","veredito_ia","proximo_passo_status"],
      additionalProperties: false,
    },
    leitor_interesse: {
      type: "object",
      description: "🧠 LEITOR DE INTERESSE: por que ela respondeu?",
      properties: {
        gostou_conversa: { type: "boolean", description: "Ela respondeu porque gostou da conversa / tá interessada." },
        educacao: { type: "boolean", description: "Ela respondeu só por educação / formalidade." },
        resposta_automatica: { type: "boolean", description: "Parece resposta automática, reação mecânica ou sem pensar." },
        sem_interesse: { type: "boolean", description: "A resposta indica falta de interesse real em continuar." },
        confianca: { type: "number", minimum: 0, maximum: 100, description: "Confiança da leitura (0-100)." },
        nota: { type: "string", description: "1 frase justificando a leitura." },
      },
      required: ["gostou_conversa","educacao","resposta_automatica","sem_interesse","confianca","nota"],
      additionalProperties: false,
    },
  },
  required: [
    "assunto_principal","clima","clima_tag","energia_dela_nivel","interesse_nivel",
    "nivel_interesse","energia_dela","risco_morrer","risco_morrer_nivel",
    "chance_continuar","potencial_conexao",
    "gancho_ultima_msg","gancho_entregou","gancho_direcao",
    "proxima_mensagem","porque_funciona","melhor_resposta_nota","melhor_resposta_motivos",
    "traducao_bullets","traducao_sinal","chance_resposta_por_modo","proximo_passo",
    "score_chance_resposta","score_naturalidade","score_carencia",
    "investimento","investimento_nivel",
    "respostas_alternativas","escalar_interesse","assunto_ideal","evitar","continuacao_curta",
    "chance_encontro","perfil_tipo","perfil_funciona_com","resumo_ia","direcao",
    "leitor_interesse","status_conversa",
  ],
  additionalProperties: false,
} as const;

export interface FlowResult {
  assunto_principal: string;
  clima: string;
  clima_tag: "leve"|"divertido"|"serio"|"flertando"|"provocativo"|"neutro";
  energia_dela_nivel: "baixa"|"media"|"alta";
  interesse_nivel: "baixo"|"medio"|"alto";
  nivel_interesse: number;
  energia_dela: number;
  risco_morrer: number;
  risco_morrer_nivel: "baixo"|"medio"|"alto";
  chance_continuar: number;
  potencial_conexao: number;
  gancho_ultima_msg: string;
  gancho_entregou: string[];
  gancho_direcao: string;
  proxima_mensagem: string;
  porque_funciona: string;
  melhor_resposta_nota: number;
  melhor_resposta_motivos: string[];
  traducao_bullets: string[];
  traducao_sinal: "positivo"|"neutro"|"negativo";
  chance_resposta_por_modo: {
    natural: number;
    engracada: number;
    flertando: number;
    inteligente: number;
    provocando: number;
  };
  proximo_passo: {
    se_rir: string;
    se_concordar: string;
    se_mudar_assunto: string;
    se_sumir: string;
  };
  score_chance_resposta: number;
  score_naturalidade: number;
  score_carencia: number;
  investimento: number;
  investimento_nivel: "baixo"|"medio"|"alto";
  respostas_alternativas: {
    natural: string;
    engracada: string;
    flertando: string;
    inteligente: string;
    provocando: string;
  };
  escalar_interesse: string;
  assunto_ideal: string;
  evitar: string[];
  continuacao_curta: {
    kkk: string; sim: string; nao: string;
    talvez: string; sei_la: string; emoji: string;
  };
  chance_encontro: number;
  perfil_tipo: string;
  perfil_funciona_com: string[];
  resumo_ia: string;
  direcao: string;
  leitor_interesse: {
    gostou_conversa: boolean;
    educacao: boolean;
    resposta_automatica: boolean;
    sem_interesse: boolean;
    confianca: number;
    nota: string;
  };
  status_conversa: {
    checklist: { ok: boolean; texto: string }[];
    o_que_aconteceu: string;
    nao_significa: string[];
    pode_significar: string[];
    investimento_dela: string;
    energia_dela_status: string;
    risco_real: string;
    veredito_ia: string;
    proximo_passo_status: string[];
  };
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
