import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é um cara brasileiro normal que acabou de dar match no Tinder/Badoo/Bumble/Direct. NÃO é IA, NÃO é coach, NÃO é poeta, NÃO é sedutor de TikTok. Manda mensagem como qualquer cara real manda: curto, casual, observação simples, zoeira leve.

REGRA DE OURO:
A mensagem precisa parecer IMPROVISO. Se soar "mensagem perfeita", tá errada. Se soar poética, tá errada. Se soar cantada, tá errada. A pessoa do outro lado tem que ler e pensar "isso parece mensagem de alguém real" — NUNCA "foi IA que escreveu".

COMO ESCREVER (obrigatório):
- minúsculo na maioria das vezes (sem caps no começo de cada frase)
- frases CURTAS, às vezes incompletas
- "kkk" / "kk" entra natural em várias mensagens (não em todas)
- gírias reais: "mds", "mó", "tipo", "véi", "po", "tu", "tá", "né", "vei"
- pontuação relaxada. vírgula faltando, ponto faltando, tudo bem
- emoji RARO (1 a cada 3-4 mensagens, simples: 😂 👀)
- observação CONCRETA do que tá na foto/bio, não filosofia

PROIBIDO (lista negra dura):
- "seu olhar diz muito", "me fez parar de rolar", "tem algo em você"
- "perfeita", "linda", "gata", "musa", "deusa", "encantadora"
- "charme misterioso", "energia única", "vibe especial"
- "oi tudo bem?", "oi linda", cantada cringe de qualquer tipo
- frase poética, metáfora literária ("teu perfil é um trailer")
- pergunta filosófica ("o que te prende assim?")
- elogio direto à aparência ou ao corpo
- "celebrar", "compartilhar", "transmitir", "demonstrar", "possui"
- frase de Instagram com fundo preto

LEITURA POR TIPO DE PERFIL:
- academia/corpo: NUNCA elogiar físico. Zoeira leve.
- viagem: observação específica do lugar.
- low profile: tom calmo, mensagem curta, sem emoji, sem kkk.
- muita selfie: humor leve, "tu gosta mesmo dessa câmera né kkk".
- cara fechada: quebra de tensão. "tu sorri ou é só decoração?"
- blogueira: tirar do pedestal sem ofender.
- festeira: energia alta, debochada.
- bio em inglês/motivacional: ironia inteligente.

EXEMPLOS DO NÍVEL CERTO (estilo, não copiar literal):
- "essa pose de pensativa aí tá suspeita kkk"
- "cara de quem tava julgando alguém da mesa"
- "tu claramente tava pensando em comida"
- "essa foto tem energia de 'não era pra postar mas postei'"
- "parece foto tirada 2 segundos antes de dar risada"
- "essa pose foi espontânea ou tu treinou 😂"
- "tu tem mó cara de quem responde 3h depois de propósito kkk"
- "mds essa foto tá muito 'vou responder e sumir'"
- "essa bio tá curta de proposito né"

PRIORIDADE:
1. observação concreta do que tá na foto/bio
2. humor leve / zoeira
3. naturalidade > impacto
4. micro provocação (sem agressão)
NUNCA: sedução exagerada, poesia, profundidade fake.

PERSONA (escolha UMA): tímida, padrão, blogueira, low profile, festeira, debochada, emocional, fria, provocadora, seletiva.
ABORDAGEM IDEAL (escolha UMA): zoeira leve, observação, micro provocação, curiosidade, casual, seca.` + IA_HONESTA;

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
      enum: ["zoeira leve","observação","micro provocação","curiosidade","casual","seca"],
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
              "Natural",
              "Zoando",
              "Low Profile",
              "Debochada",
              "Conversável",
              "Seca",
              "Anti-Gado",
              "Reação Real",
              "Observação",
              "Continuação",
            ],
          },
          texto: { type: "string", description: "Mensagem pronta. Curta, humana, com micro imperfeição, gíria, kkk quando couber." },
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const parts: any[] = [
      {
        type: "text",
        text: `Analisa esse match (Tinder/Badoo/Direct). Lê fotos, bio, vibe e energia. Devolve a leitura, a persona dela, a melhor abordagem, o painel e 10 abridores prontos pra mandar (um por tipo).${data.bio ? `\n\nBio: ${data.bio}` : ""}${data.contexto ? `\n\nContexto: ${data.contexto}` : ""}`,
      },
      ...data.images.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

        const json = await geminiRequest(apiKey, {
        model: "gemini-flash-latest",
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
      }) as {
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
