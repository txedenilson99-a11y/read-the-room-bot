import { createServerFn } from "@tanstack/react-start";
import { IA_HONESTA } from "./ia-honesta";
import { requireAprovado } from "./require-aprovado";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é o "Psicologia Proibida — Story" do ScanSocial: um observador social brasileiro, calmo e honesto. Recebe o print de um story (foto, legenda, música, sticker, ambiente) e ajuda a responder de um jeito natural.

REGRAS DE LEITURA:
- Comece pelo que é OBSERVÁVEL no print: objetos, ambiente, legenda, música, texto, expressão visível, horário, erros/detalhes curiosos. Só cite o que está realmente visível/legível ou foi informado no contexto.
- Interpretações são hipóteses com nível de incerteza ("pode ser", "talvez"). Nunca afirme intenção certa, nunca diga que o story é "pra você", nunca leia a mente.
- MÚSICA, LEGENDA OU FILTRO NÃO REVELAM SENTIMENTO. Ex.: selfie com a música "Quando a Bad Bater" NÃO significa que a pessoa está triste, sofrendo, na bad, superando alguém ou tentando esquecer problemas. Muita gente posta música só porque gosta dela ou porque tá em alta. No máximo: "a música escolhida foi X" e "não dá pra saber se tem relação com o humor dela".
- Nada de diagnóstico ou rótulo psicológico ("carente", "narcisista", "quer atenção", etc.). Não invente indiretas, ex, relacionamento, término ou intenção.
- Diga claramente o que NÃO dá para concluir só com um story (ex.: o humor real, se a música tem significado pessoal).

REGRAS DAS MENSAGENS (separadas da análise):
- As respostas NÃO podem usar as hipóteses como se fossem fatos. Proibido: "tá na bad?", "quem te magoou?", "força aí", "vai passar", "superando alguém?", "se precisar conversar", "tô aqui pra você" e qualquer coisa que presuma tristeza/problema.
- Cada resposta tem que se ancorar em UM detalhe concreto visível/legível (objeto, lugar, música citada pelo nome, texto, situação) ou no contexto informado. Se não houver gancho claro, faça comentário simples ou pergunta contextual honesta (ex.: "boa essa música, conhecia não" / "isso é onde?").
- Curtas: até ~12 palavras, português natural de zap, minúsculas ok, sem tom de coach, sem manipulação, sem emoji em excesso.
- As 5 opções devem ser realmente distintas entre si (gancho ou abordagem diferente), não a mesma frase reescrita.
- Não force cantada, carinho ou provocação quando não combinam com o story. Se o tom não encaixar, escreva uma versão leve e neutra daquele tom (ex.: "carinhoso" vira simpático simples; "provocador" vira brincadeira leve sobre um detalhe), nunca sexual, nunca ofensivo.
- Comente a SITUAÇÃO/detalhe, não a aparência. Proibido elogio genérico ("linda", "maravilhosa", "gata").
- Descarte mensagens genéricas que serviriam pra qualquer story ("que legal", "adorei", "tudo bem?").
- A melhor resposta é a mais natural e ancorada num detalhe real, de preferência a de menor risco.` + IA_HONESTA;

const PROIBIDAS = [
  /\bna bad\b/i, /\bbad bateu\b/i, /\bmagoou\b/i, /\bsofr/i, /\btriste/i, /\bfor[çc]a a[ií]\b/i,
  /\bvai passar\b/i, /\bsuperand/i, /\besquecer\b/i, /\bse precisar\b/i, /\bt[ôo] aqui pra\b/i,
  /\bex\b/i, /\blinda\b/i, /\bgata\b/i, /\bmaravilhosa\b/i, /\bdeusa\b/i, /\bperfeita\b/i,
  /^(que legal|adorei|amei|tudo bem\??)[.!]?$/i,
];

function mensagemRuim(t: string): boolean {
  const s = (t ?? "").trim();
  if (!s) return true;
  if (s.split(/\s+/).length > 16) return true;
  return PROIBIDAS.some((r) => r.test(s));
}

function norm(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

const TONS = ["engracado", "curioso", "confiante", "carinhoso", "provocador"] as const;

const SCHEMA = {
  type: "object",
  properties: {
    detalhes_observaveis: { type: "array", minItems: 2, maxItems: 6, items: { type: "string" } },
    interpretacoes: {
      type: "array", minItems: 1, maxItems: 4,
      items: {
        type: "object",
        properties: {
          leitura: { type: "string" },
          base: { type: "string", description: "Detalhe observável que sustenta a hipótese." },
          incerteza: { type: "string", enum: ["alta", "media", "baixa"] },
        },
        required: ["leitura", "base", "incerteza"],
      },
    },
    nao_da_pra_concluir: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
    estrategia: { type: "string", description: "1-2 frases: qual gancho usar e por quê." },
    respostas: {
      type: "array", minItems: 4, maxItems: 5,
      items: {
        type: "object",
        properties: {
          tom: { type: "string", enum: [...TONS] },
          texto: { type: "string" },
        },
        required: ["tom", "texto"],
      },
    },
    melhor_resposta: {
      type: "object",
      properties: {
        texto: { type: "string" },
        por_que: { type: "string", description: "1 frase curta." },
      },
      required: ["texto", "por_que"],
    },
  },
  required: ["detalhes_observaveis", "interpretacoes", "nao_da_pra_concluir", "estrategia", "respostas", "melhor_resposta"],
};

export interface PsicologiaStoryResult {
  detalhes_observaveis: string[];
  interpretacoes: { leitura: string; base: string; incerteza: "alta" | "media" | "baixa" }[];
  nao_da_pra_concluir: string[];
  estrategia: string;
  respostas: { tom: (typeof TONS)[number]; texto: string }[];
  melhor_resposta: { texto: string; por_que: string };
}

export const analisarPsicologiaStory = createServerFn({ method: "POST" })
  .middleware([requireAprovado])
  .inputValidator((input: { contexto?: string; image?: string }) => {
    const contexto = (input?.contexto ?? "").slice(0, 1500).trim();
    const image = typeof input?.image === "string" ? input.image : "";
    if (!/^data:image\/(png|jpe?g);base64,/.test(image)) {
      throw new Error("Manda o print do story em JPG ou PNG.");
    }
    if (image.length > 8_000_000) throw new Error("A imagem tá muito pesada. Tenta um print menor.");
    return { contexto, image };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("A IA não está configurada no servidor.");

    const baseText = `Analisa este story. Lista detalhes observáveis, leituras possíveis com incerteza, o que não dá pra concluir, uma estratégia e 5 respostas distintas (um tom cada: engracado, curioso, confiante, carinhoso, provocador respeitoso), cada uma ancorada num detalhe real e sem presumir sentimento pela música/legenda. Destaca a melhor.${data.contexto ? `\n\nContexto extra (legenda/música/situação):\n${data.contexto}` : ""}`;

    let feedback = "";
    let best: PsicologiaStoryResult | null = null;
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const json = (await geminiRequest(apiKey, {
        model: "gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: baseText + feedback },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "psicologia_story",
            description: "Leitura honesta do story com respostas sugeridas.",
            parameters: SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "psicologia_story" } },
      })) as {
        choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
      };
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) continue;
      let r: PsicologiaStoryResult;
      try { r = JSON.parse(args); } catch { continue; }
      if (!r?.respostas || !r?.melhor_resposta) continue;

      // Filtra mensagens ruins e duplicadas.
      const vistos = new Set<string>();
      const ruins: string[] = [];
      r.respostas = r.respostas.filter((x) => {
        const k = norm(x.texto);
        if (mensagemRuim(x.texto) || vistos.has(k)) { ruins.push(x.texto); return false; }
        vistos.add(k);
        return true;
      });
      if (mensagemRuim(r.melhor_resposta.texto)) {
        ruins.push(r.melhor_resposta.texto);
        if (r.respostas[0]) r.melhor_resposta = { texto: r.respostas[0].texto, por_que: "A mais natural e ancorada num detalhe real." };
      }
      best = r;
      if (ruins.length === 0 && r.respostas.length >= 4) break;
      feedback = `\n\nATENÇÃO: descarte e refaça. Estas mensagens foram rejeitadas por presumir sentimento, serem genéricas, longas, repetidas ou elogio: ${ruins.map((s) => `"${s}"`).join(", ")}. Gere 5 novas, curtas e distintas, ancoradas em detalhes visíveis.`;
    }
    if (!best || best.respostas.length === 0) throw new Error("A IA não respondeu dessa vez. Tenta de novo.");
    return { result: best };
  });
