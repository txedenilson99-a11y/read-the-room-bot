import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é um leitor social brasileiro maduro, calmo e realista. Ajuda a pessoa a entender o contexto de uma foto, story, print ou situação SEM atacar, julgar ou humilhar ninguém.

POSTURA:
- Direto, maduro, leve, respeitoso.
- Descreve o que aparece sem exagero nem drama.
- Fala em possibilidades, não em certezas. Usa "pode ser", "parece", "talvez", "abre espaço para".
- Reconhece quando não dá pra saber. Não inventa intenção.
- Útil de verdade: ajuda a decidir se vale responder e como.

NUNCA:
- Chame a pessoa de "carente", "biscoiteira", "quer validação", "joguinho", "manipuladora".
- Diga "ela não tem interesse em você", "tá te usando", "corre" como certeza.
- Julgue o corpo, a aparência, a roupa ou o estilo de vida da pessoa.
- Use tom de coach masculinista, redpill, deboche ou superioridade.
- Finja ler a mente. Você lê sinais, não pensamentos.
- Use clichês de autoajuda ("energia única", "vibe especial", "vulnerabilidade").

TOM DOS EXEMPLOS (use esse estilo):
- "Ela postou uma foto da academia mostrando rotina. A vibe é confiante e casual. Pode ser só um post normal, mas abre espaço pra uma resposta leve se quiser puxar assunto."
- "É uma foto de viagem comum. Não dá pra cravar interesse, mas é um gancho fácil pra comentar algo do lugar."
- "A mensagem foi curta e educada. Pode ser que ela tava ocupada, pode ser desinteresse leve. Vale esperar antes de mandar de novo."

Se não dá pra ler com o que foi enviado, fala isso com tranquilidade. Sem inventar.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    vibe: {
      type: "string",
      description: "1-3 palavras descrevendo a vibe provável (ex: 'confiante e casual', 'introspectiva', 'animada', 'reservada').",
    },
    titulo: { type: "string", description: "1 linha leve resumindo o contexto, sem julgamento." },
    descricao: {
      type: "string",
      description: "2-4 linhas descrevendo o que aparece na foto/print/situação, sem exagero nem drama.",
    },
    leitura: {
      type: "string",
      description: "3-5 linhas em tom maduro e respeitoso explicando possibilidades, usando 'pode ser', 'parece', 'talvez'.",
    },
    intencao_possivel: {
      type: "array", minItems: 1, maxItems: 4,
      items: { type: "string", description: "Intenção POSSÍVEL (não certa). Ex: 'pode estar só compartilhando a rotina'." },
    },
    abre_espaco_para: {
      type: "array", minItems: 1, maxItems: 4,
      items: { type: "string", description: "Ganchos naturais que a situação oferece pra puxar conversa." },
    },
    vale_responder: {
      type: "string",
      enum: ["sim", "talvez", "melhor-esperar", "nao-necessario"],
    },
    porque_vale: {
      type: "string",
      description: "1-2 linhas explicando, sem agressividade, por que vale ou não responder agora.",
    },
    medidores: {
      type: "object",
      properties: {
        interesse_real: { type: "number", minimum: 0, maximum: 100 },
        abertura_conversa: { type: "number", minimum: 0, maximum: 100 },
        risco_forcado: { type: "number", minimum: 0, maximum: 100 },
        timing: { type: "number", minimum: 0, maximum: 100, description: "Quão bom é o timing pra responder agora (0 = ruim, 100 = ótimo)." },
        chance_resposta: { type: "number", minimum: 0, maximum: 100 },
      },
      required: ["interesse_real","abertura_conversa","risco_forcado","timing","chance_resposta"],
      additionalProperties: false,
    },
    evitar: {
      type: "array", minItems: 2, maxItems: 5,
      items: { type: "string", description: "O que evitar dizer/fazer agora, em tom respeitoso (sem atacar ela)." },
    },
    abordagem_ideal: {
      type: "string",
      description: "1-2 linhas com a postura que combina. Tom maduro, sem coach.",
    },
    proximos_passos: {
      type: "array", minItems: 2, maxItems: 4,
      items: { type: "string", description: "Próximo movimento natural e tranquilo." },
    },
    frase_pronta: {
      type: "string",
      description: "1 mensagem curta, natural, leve. Sem cantada, sem deboche, sem agressividade. Pode ter 'kkk' se couber.",
    },
  },
  required: [
    "vibe","titulo","descricao","leitura","intencao_possivel","abre_espaco_para",
    "vale_responder","porque_vale","medidores","evitar","abordagem_ideal",
    "proximos_passos","frase_pronta",
  ],
  additionalProperties: false,
} as const;

export interface LeituraResult {
  vibe: string;
  titulo: string;
  descricao: string;
  leitura: string;
  intencao_possivel: string[];
  abre_espaco_para: string[];
  vale_responder: "sim" | "talvez" | "melhor-esperar" | "nao-necessario";
  porque_vale: string;
  medidores: {
    interesse_real: number;
    abertura_conversa: number;
    risco_forcado: number;
    timing: number;
    chance_resposta: number;
  };
  evitar: string[];
  abordagem_ideal: string;
  proximos_passos: string[];
  frase_pronta: string;
}

export const lerComportamento = createServerFn({ method: "POST" })
  .inputValidator((input: { contexto?: string; images?: string[] }) => {
    const contexto = (input?.contexto ?? "").slice(0, 4000).trim();
    const images = Array.isArray(input?.images)
      ? input!.images!.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    }
    if (!contexto && images.length === 0) {
      throw new Error("Manda o print, story, foto ou descreve a situação.");
    }
    return { contexto, images };
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
        text: `Faz uma leitura madura, leve e realista da situação abaixo. Descreve o que aparece sem exagero, mostra a vibe provável, fala de intenção POSSÍVEL (não certa), e ajuda a decidir se vale responder e como. Sem atacar, sem julgar corpo/estilo, sem chamar de carente ou biscoiteira.${data.contexto ? `\n\nContexto / situação:\n${data.contexto}` : ""}${data.images.length ? `\n\n${data.images.length} imagem(ns) anexada(s).` : ""}`,
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
            name: "ler_comportamento",
            description: "Devolve leitura social estruturada, madura e respeitosa.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "ler_comportamento" } },
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
      return { result: JSON.parse(args) as LeituraResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
