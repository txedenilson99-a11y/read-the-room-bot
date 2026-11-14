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

ASSUNTO PRINCIPAL (faça isso ANTES das mensagens):
- TEXTO VISÍVEL no story (legenda escrita, frase, sticker de texto) é o contexto PRIORITÁRIO. Transcreva exatamente em "texto_visivel" (vazio se não houver).
- Defina "assunto_principal" em poucas palavras combinando texto visível + cena (ex.: texto "Sextou pago" + selfie de treino na academia => "treino feito na sexta / sextou com treino pago").
- Todas as respostas giram em torno desse assunto. Variam o estilo, nunca o assunto.

REGRAS DAS MENSAGENS (separadas da análise):
- Pareça mensagem real e espontânea de zap: reação curta, comentário leve. Evite perguntas artificiais ou de entrevista; no máximo 1-2 das opções podem ser pergunta, e só se for natural.
- PROIBIDO inventar horário, dia além do que está escrito, rotina, frequência, local específico (nome de academia, cidade), plano de fim de semana, intenção ou qualquer fato não visível/informado. Ex. RUIM para "Sextou pago" no treino: "pagou o treino cedo ou foi final de tarde?", "já tá pronta pro fds", "17h de sexta...". Ex. BOM (só referência de tom): "sexta começou do jeito certo então kkk 💪", "sextou e o treino tá pago 😂", "disciplina até na sexta, aí sim".
- Ligue direto ao texto visível/tema sem só repetir o texto literalmente.
- Se não houver gancho suficiente, prefira reação simples e honesta ("boa kkk", "aí sim") em vez de fabricar assunto.
- Para cada resposta, preencha "ancora": o detalhe visível/texto/contexto exato em que ela se baseia (precisa estar em detalhes_observaveis, texto_visivel ou contexto).
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

// Elementos que costumam ser inventados (horário, rotina, fds, lugar, plano).
const INVENTADOS: { re: RegExp; termos: RegExp }[] = [
  { re: /\b\d{1,2}\s?(h|horas?)\b|\b(cedo|madrugada|final de tarde|fim de tarde|de manh[ãa]|à noite|a noite|hoje cedo)\b/i, termos: /\b\d{1,2}\s?h\b|hor[áa]rio|cedo|manh[ãa]|tarde|noite|madrugada/i },
  { re: /\b(fds|fim de semana|final de semana|balada|rol[êe])\b/i, termos: /fds|fim de semana|final de semana|balada|rol[êe]/i },
  { re: /\b(todo dia|sempre|rotina|de novo|toda semana)\b/i, termos: /todo dia|sempre|rotina|toda semana|de novo/i },
  { re: /\b(praia|viagem|show|festa|trabalho|faculdade|namorad|crush)\w*/i, termos: /praia|viagem|show|festa|trabalho|faculdade|namorad|crush/i },
];

function inventaElemento(texto: string, fonte: string): boolean {
  return INVENTADOS.some(({ re, termos }) => re.test(texto) && !termos.test(fonte));
}

function norm(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

const TONS = ["engracado", "curioso", "confiante", "carinhoso", "provocador"] as const;

const SCHEMA = {
  type: "object",
  properties: {
    texto_visivel: { type: "string", description: "Texto escrito no story, transcrito exatamente. Vazio se não houver." },
    assunto_principal: { type: "string", description: "Assunto central do story em poucas palavras." },
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
          ancora: { type: "string", description: "Detalhe visível/texto/contexto que sustenta a resposta." },
        },
        required: ["tom", "texto", "ancora"],
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
  required: ["texto_visivel", "assunto_principal", "detalhes_observaveis", "interpretacoes", "nao_da_pra_concluir", "estrategia", "respostas", "melhor_resposta"],
};

export interface PsicologiaStoryResult {
  texto_visivel?: string;
  assunto_principal?: string;
  detalhes_observaveis: string[];
  interpretacoes: { leitura: string; base: string; incerteza: "alta" | "media" | "baixa" }[];
  nao_da_pra_concluir: string[];
  estrategia: string;
  respostas: { tom: (typeof TONS)[number]; texto: string; ancora?: string }[];
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

    const baseText = `Analisa este story. Primeiro transcreve o texto visível e define o assunto principal; depois tudo gira em torno dele. Lista detalhes observáveis, leituras possíveis com incerteza, o que não dá pra concluir, uma estratégia e 5 respostas distintas (um tom cada: engracado, curioso, confiante, carinhoso, provocador respeitoso), cada uma ancorada num detalhe real e sem presumir sentimento pela música/legenda. Destaca a melhor.${data.contexto ? `\n\nContexto extra (legenda/música/situação):\n${data.contexto}` : ""}`;

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
      const fonte = [r.texto_visivel, r.assunto_principal, ...(r.detalhes_observaveis ?? []), data.contexto].join(" | ");
      const vistos = new Set<string>();
      const ruins: string[] = [];
      r.respostas = r.respostas.filter((x) => {
        const k = norm(x.texto);
        if (mensagemRuim(x.texto) || inventaElemento(x.texto, fonte) || vistos.has(k)) { ruins.push(x.texto); return false; }
        vistos.add(k);
        return true;
      });
      if (mensagemRuim(r.melhor_resposta.texto) || inventaElemento(r.melhor_resposta.texto, fonte)) {
        ruins.push(r.melhor_resposta.texto);
        if (r.respostas[0]) r.melhor_resposta = { texto: r.respostas[0].texto, por_que: "A mais natural e ancorada num detalhe real." };
      }
      best = r;
      if (ruins.length === 0 && r.respostas.length >= 4) break;
      feedback = `\n\nATENÇÃO: descarte e refaça. Estas mensagens foram rejeitadas por presumir sentimento, inventar horário/rotina/lugar/plano não visível, serem genéricas, longas, repetidas ou elogio: ${ruins.map((s) => `"${s}"`).join(", ")}. Gere 5 novas, curtas, espontâneas e distintas, todas sobre o assunto principal${r.assunto_principal ? ` ("${r.assunto_principal}")` : ""}, ancoradas no texto visível e detalhes reais.`;
    }
    if (!best || best.respostas.length === 0) throw new Error("A IA não respondeu dessa vez. Tenta de novo.");
    return { result: best };
  });
