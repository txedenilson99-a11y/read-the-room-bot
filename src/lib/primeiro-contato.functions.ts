import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `Você é o AMIGO brasileiro experiente, jovem, socialmente esperto, que sabe puxar papo no Tinder, Badoo, Bumble e direct do Insta. Não é IA, não é coach, não é psicólogo.

COMO FALAR:
- Português brasileiro REAL, gíria leve, tom de WhatsApp.
- Mensagens CURTAS, com personalidade, com micro imperfeição humana.
- Lê ego, vibe, biscoito, joguinho, perfil low profile vs blogueira vs festeira.
- Foge do óbvio. Nada de "oi", "tudo bem?", "gata", "linda", "adorei sua bio", elogio físico raso.

NUNCA gerar:
- cantada cringe, mensagem perfeitinha, frase de coach, robô, genérica
- "celebrar a vida", "compartilhar momento", "interação social"
- mais de 1 emoji por mensagem inteira (use com parcimônia)

EXEMPLOS DE NÍVEL CERTO (estilo, não copiar):
- "Tenho a sensação que teu perfil dá trabalho e entretenimento ao mesmo tempo."
- "Confesso que a última foto quase me fez acreditar no algoritmo."
- "Teu perfil parece aqueles trailers que escondem o caos do filme."
- "Tá com cara de quem responde só quando quer. Vou arriscar mesmo assim."
- "Imagino que você seja insuportável de leve. Combina comigo."

REGRAS DE LEITURA POR PERFIL:
- academia / corpo: NUNCA elogiar físico. Provocação leve.
- viagem: observação específica do lugar, não genérica.
- low profile: tom calmo, sem agitação, sem emoji.
- muita selfie: humor e ironia leve, sem ataque.
- cara fechada nas fotos: quebra de tensão com humor seco.
- blogueira / influencer vibe: tirar do pedestal sem ofender.
- festeira: energia alta, debochada.
- bio em inglês / frase motivacional: ironia inteligente.

PERSONA (escolha UMA): tímida, padrão, blogueira, low profile, festeira, debochada, emocional, fria, provocadora, seletiva.
ABORDAGEM IDEAL (escolha UMA): engraçada, provocativa, misteriosa, calma, dominante, espontânea.

Soa humano, improvisado, conversa real.`;

const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "1-2 linhas lendo a vibe da pessoa, tom de amigo." },
    persona: {
      type: "string",
      enum: ["tímida","padrão","blogueira","low profile","festeira","debochada","emocional","fria","provocadora","seletiva"],
    },
    abordagem: {
      type: "string",
      enum: ["engraçada","provocativa","misteriosa","calma","dominante","espontânea"],
    },
    painel: {
      type: "object",
      properties: {
        interesse: { type: "number", minimum: 0, maximum: 100 },
        ego: { type: "number", minimum: 0, maximum: 100 },
        chance_resposta: { type: "number", minimum: 0, maximum: 100 },
        competicao: { type: "number", minimum: 0, maximum: 100 },
        risco_ignorar: { type: "number", minimum: 0, maximum: 100 },
        energia: { type: "string", description: "1-3 palavras: ex 'calma e seletiva', 'festeira ligada', 'fria distante'." },
        melhor_horario: { type: "string", description: "Curto. Ex: 'entre 21h e meia-noite'." },
        estilo_ideal: { type: "string", description: "1 frase curta sobre o tom que funciona melhor." },
      },
      required: ["interesse","ego","chance_resposta","competicao","risco_ignorar","energia","melhor_horario","estilo_ideal"],
      additionalProperties: false,
    },
    abridores: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: [
              "Principal",
              "Engraçado",
              "Misterioso",
              "Ousado",
              "Low Profile",
              "Anti-gado",
              "Resposta curta",
              "Resposta com tensão",
              "Resposta casual",
              "Continuação do papo",
            ],
          },
          texto: { type: "string", description: "Mensagem pronta. Curta, humana, com personalidade." },
        },
        required: ["tipo","texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["leitura","persona","abordagem","painel","abridores"],
  additionalProperties: false,
} as const;

export interface PrimeiroContatoResult {
  leitura: string;
  persona: string;
  abordagem: string;
  painel: {
    interesse: number;
    ego: number;
    chance_resposta: number;
    competicao: number;
    risco_ignorar: number;
    energia: string;
    melhor_horario: string;
    estilo_ideal: string;
  };
  abridores: { tipo: string; texto: string }[];
}

export const gerarPrimeiroContato = createServerFn({ method: "POST" })
  .inputValidator((input: { bio?: string; contexto?: string; images: string[] }) => {
    if (!input || !Array.isArray(input.images)) throw new Error("Input inválido.");
    const images = input.images.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6);
    const bio = (input.bio ?? "").slice(0, 1500).trim();
    const contexto = (input.contexto ?? "").slice(0, 1000).trim();
    if (images.length === 0 && !bio && !contexto) {
      throw new Error("Manda pelo menos uma foto, a bio ou um contexto.");
    }
    for (const img of images) {
      if (img.length > 8_000_000) throw new Error("Uma das fotos tá muito pesada.");
    }
    return { bio, contexto, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const parts: any[] = [
      {
        type: "text",
        text: `Analisa esse match (Tinder/Badoo/Direct). Lê fotos, bio, vibe e energia. Devolve a leitura, a persona dela, a melhor abordagem, o painel e 10 abridores prontos pra mandar (um por tipo).${data.bio ? `\n\nBio: ${data.bio}` : ""}${data.contexto ? `\n\nContexto: ${data.contexto}` : ""}`,
      },
      ...data.images.map((url) => ({ type: "image_url", image_url: { url } })),
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
            name: "gerar_primeiro_contato",
            description: "Devolve leitura do match e 10 abridores prontos.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "gerar_primeiro_contato" } },
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
      return { result: JSON.parse(args) as PrimeiroContatoResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
