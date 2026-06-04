import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um detector de robô especializado em validar se uma mensagem soa HUMANA, NATURAL e sem CARÊNCIA.

Analise a mensagem do usuário e retorne métricas precisas de 0 a 100:

- naturalidade: o quanto a mensagem soa como algo que um amigo real mandaria no zap (0 = robô total, 100 = perfeitamente natural)
- carencia: o quanto a mensagem transmite necessidade de aprovação, validação ou atenção (0 = zero carência, 100 = muito carente)
- originalidade: o quanto a mensagem é única e não genérica (0 = cantada pronta/genérica, 100 = original e personalizada)
- chance_resposta: probabilidade de gerar resposta boa do outro lado (0 = vai morrer a conversa, 100 = alta chance de continuar)

CHECKS booleanos:
- humano: a mensagem soa escrita por uma pessoa real? (true se naturalidade >= 70)
- sem_carencia: não transmite carência? (true se carencia <= 30)
- sem_cantada_pronta: não é cantada genérica, frase de internet ou elogio direto? (true se originalidade >= 60)
- liberado: passa em todos os checks acima? (true se humano && sem_carencia && sem_cantada_pronta)

REGRAS DE ANÁLISE:
- Cantadas prontas, elogios diretos ("linda", "perfeita", "gostosa"), frases de internet diminuem originalidade
- Mensagens longas demais, excesso de emojis, "😍❤️🥰", pontuação perfeita diminuem naturalidade
- Perguntas carentes ("me conta mais", "quero saber de você", "o que você acha de mim?") aumentam carência
- Respostas curtas, naturais, com humor seco, observação concreta aumentam naturalidade e originalidade
- Se a mensagem for genérica o suficiente pra funcionar pra qualquer pessoa, originalidade é baixa

Seja HONESTO e CRÍTICO. Uma mensagem ruim deve ter notas baixas. Não infla notas.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    naturalidade: { type: "number", minimum: 0, maximum: 100, description: "Quão humana e natural a mensagem soa." },
    carencia: { type: "number", minimum: 0, maximum: 100, description: "Quanto a mensagem transmite carência/neediness." },
    originalidade: { type: "number", minimum: 0, maximum: 100, description: "Quão única e não genérica é a mensagem." },
    chance_resposta: { type: "number", minimum: 0, maximum: 100, description: "Probabilidade de gerar boa resposta do outro lado." },
    humano: { type: "boolean", description: "Soa escrita por pessoa real? (naturalidade >= 70)" },
    sem_carencia: { type: "boolean", description: "Sem carência? (carencia <= 30)" },
    sem_cantada_pronta: { type: "boolean", description: "Sem cantada genérica? (originalidade >= 60)" },
    liberado: { type: "boolean", description: "Passa em todos os checks?" },
    diagnostico: { type: "string", description: "1-2 linhas explicando o diagnóstico principal da mensagem." },
    sugestao: { type: "string", description: "1 linha curta sugerindo como melhorar, se houver problema." },
  },
  required: [
    "naturalidade", "carencia", "originalidade", "chance_resposta",
    "humano", "sem_carencia", "sem_cantada_pronta", "liberado",
    "diagnostico", "sugestao",
  ],
  additionalProperties: false,
} as const;

export interface DetectorRoboResult {
  naturalidade: number;
  carencia: number;
  originalidade: number;
  chance_resposta: number;
  humano: boolean;
  sem_carencia: boolean;
  sem_cantada_pronta: boolean;
  liberado: boolean;
  diagnostico: string;
  sugestao: string;
}

export const detectorRobo = createServerFn({ method: "POST" })
  .inputValidator((input: { mensagem?: string }) => {
    const mensagem = (input?.mensagem ?? "").slice(0, 2000).trim();
    if (!mensagem) {
      throw new Error("Cole a mensagem que você quer testar.");
    }
    return { mensagem };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Analise esta mensagem e retorne as métricas:\n\n"""${data.mensagem}"""` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "detector_robo",
            description: "Analisa uma mensagem e retorna métricas de naturalidade, carência, originalidade e chance de resposta.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "detector_robo" } },
      }),
    });

    if (res.status === 429) throw new Error("Muitas análises de uma vez. Espera um pouco.");
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
      return { result: JSON.parse(args) as DetectorRoboResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
