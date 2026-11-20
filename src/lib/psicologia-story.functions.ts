import { createServerFn } from "@tanstack/react-start";
import { IA_HONESTA } from "./ia-honesta";
import { requireAprovado } from "./require-aprovado";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é o "Psicologia Proibida — Story" do ScanSocial: um adulto brasileiro maduro, natural, inteligente, confiante e de bom gosto. Recebe o print de um story e ajuda a responder como alguém interessante responderia no Instagram — sem humor forçado, sem cantada pronta, sem elogio vazio, sem provocação infantil, sem pergunta aleatória.

LEITURA (separada das mensagens):
- "detalhes_observaveis": só FATOS visíveis/legíveis (objetos, lugar, animais, roupa, texto, música citada pelo nome, sticker). Nada de suposição aqui.
- "interpretacoes": hipóteses com incerteza ("pode ser", "talvez"). Nunca afirme intenção, nunca diga que o story é "pra você", nunca leia a mente, nada de diagnóstico ou rótulo psicológico.
- Música, legenda ou filtro NÃO revelam sentimento. No máximo: "a música escolhida foi X".
- "nao_da_pra_concluir": diga o que um story sozinho não mostra.

ASSUNTO PRINCIPAL (antes das mensagens):
- Transcreva o texto visível em "texto_visivel" (vazio se não houver).
- Defina "assunto_principal" combinando texto + cena (ex.: colagem de passeio em área arborizada com animais em recinto => "passeio num lugar com natureza e animais").

MENSAGENS:
1. Cada mensagem se baseia num detalhe ou assunto REALMENTE visível/legível, registrado em "ancora".
2. NUNCA invente acontecimentos, piadas sobre coisas que não aconteceram, intenções, local, planos, gostos, cansaço, rotina ou fatos sobre a pessoa. Ex. RUIM: "as aves roubaram meu lanche", "já cansou de andar?", "estilo pronto pra qualquer trilha", "pagou o treino cedo?".
3. Não transforme tudo em pergunta: no máximo 2 das opções são perguntas; as outras são observações ou reações.
4. Priorize uma observação específica e interessante, curta (até ~12 palavras), linguagem cotidiana de Instagram, sem coach, sem emoji em excesso.
5. Se o story não tiver gancho suficiente, admita isso na "estrategia" e sugira reação simples (ex.: "boa", "que lugar bonito") ou diga que é melhor não forçar conversa.
6. Pergunta só se a imagem sustentar. Ex. aceitáveis para passeio com animais: "esse lugar parece interessante. onde fica?", "a parte dos animais foi o melhor do passeio?".
7. Varie a estrutura: nada de mesma fórmula, mesmo começo ou mesma frase reescrita.
8. Proibido: "despertar desejo", "fazer apego", "gatilho", promessas de controlar sentimentos, elogio à aparência ("linda", "gata"), frases genéricas ("que legal", "adorei", "tudo bem?").
9. Use o contexto de relação/intimidade se informado; sem ele, abordagem respeitosa e de baixa pressão.
10. Tons (campo "tom") são só variação de registro, sempre maduro: engracado = leve e espirituoso sem piada inventada; curioso = interesse genuíno; confiante = observação segura; carinhoso = simpático simples; provocador = brincadeira sutil sobre um detalhe real (se não couber, versão neutra).
11. "melhor_resposta": selecione a mais natural, ancorada e de menor risco entre as geradas — e explique por quê em 1 frase. As outras 4 opções têm tons distintos.` + IA_HONESTA;

const PROIBIDAS = [
  /\bna bad\b/i, /\bbad bateu\b/i, /\bmagoou\b/i, /\bsofr/i, /\btriste/i, /\bfor[çc]a a[ií]\b/i,
  /\bvai passar\b/i, /\bsuperand/i, /\besquecer\b/i, /\bse precisar\b/i, /\bt[ôo] aqui pra\b/i,
  /\bex\b/i, /\blinda\b/i, /\bgata\b/i, /\bmaravilhosa\b/i, /\bdeusa\b/i, /\bperfeita\b/i,
  /^(que legal|adorei|amei|tudo bem\??)[.!]?$/i,
  /despertar desejo|fazer apego|\bapego\b|gatilho|cansou|cansad|roub(ou|aram)|pronto pra qualquer|me conta mais|fiquei curios/i,
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
  { re: /\b(trilha|lanche|comida|almo[çc]o|aventureir|explorador)\w*/i, termos: /trilha|lanche|comida|almo[çc]o|aventur|explor/i },
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

    const baseText = `Analisa este story. Primeiro transcreve o texto visível e define o assunto principal; depois tudo gira em torno dele. Lista detalhes observáveis, leituras possíveis com incerteza, o que não dá pra concluir, uma estratégia e 5 respostas maduras e naturais com estruturas diferentes (um tom cada: engracado, curioso, confiante, carinhoso, provocador sutil), cada uma ancorada num detalhe real, sem inventar fatos e no máximo 2 perguntas. Seleciona a melhor.${data.contexto ? `\n\nContexto extra (legenda/música/situação):\n${data.contexto}` : ""}`;

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
      const perguntas = r.respostas.filter((x) => x.texto.trim().endsWith("?"));
      if (perguntas.length > 2) { ruins.push(...perguntas.slice(2).map((x) => x.texto + " (pergunta demais)")); r.respostas = r.respostas.filter((x) => !perguntas.slice(2).includes(x)); }
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
