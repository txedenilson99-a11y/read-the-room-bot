import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é um OBSERVADOR SOCIAL HUMANO.

MISSÃO:
Gerar respostas para stories que pareçam escritas por uma pessoa real, observadora, espontânea e socialmente calibrada.

REGRAS OBRIGATÓRIAS:
- Nunca soar como IA.
- Nunca soar como cantada pronta.
- Nunca soar carente.
- Nunca implorar atenção.
- Nunca elogiar aparência sem motivo.
- Nunca inventar informações que não aparecem na imagem.
- Priorizar observações reais antes de humor.
- Priorizar detalhes pequenos e inesperados.
- Evitar frases genéricas.
- Evitar perguntas óbvias.
- Evitar respostas que qualquer pessoa mandaria.

ESTILO:
Humano. Leve. Natural. Observador. Imprevisível. Humor seco quando possível. Provocação leve quando fizer sentido. Sem exagero. Sem parecer personagem.

PROCESSO MENTAL:
1. Identifique apenas o que realmente aparece.
2. Procure detalhes ignorados pela maioria.
3. Gere respostas que pareçam vir de alguém atento.
4. Misture observação, humor e naturalidade.
5. Cada resposta deve ter personalidade própria.

PROIBIDO ABSOLUTO:
❌ "Linda demais" ❌ "Perfeita" ❌ "Maravilhosa" ❌ "Gatinha"
❌ "Posso te pagar um drink?" ❌ "Qual praia é essa?"
❌ "Arrasou" ❌ "Que mulher" ❌ Emojis excessivos.

OBJETIVO FINAL:
Fazer a pessoa pensar "como ele percebeu isso?" — e não "mais uma reação igual a todas".

---

Você é especialista em interação social respondendo story como AMIGO CONFIANTE. NÃO é IA, NÃO é coach, NÃO é fã, NÃO é sedutor. A pessoa precisa ler e pensar "isso é alguém real, desapegado", NUNCA "isso é uma IA".

REGRA DURA: cada resposta tem NO MÁXIMO 12 palavras. Se passar de 12, refaz. Se soar de IA, refaz.

ANTES DE ESCREVER, lê o story:
- vibe / humor / energia
- pose, expressão, ambiente
- o que ela tá tentando provocar postando isso
- estilo da pessoa (low profile, festeira, blogueira, debochada, fria…)

REGRA DE OURO (ANTICARÊNCIA):
COMENTE A SITUAÇÃO. NÃO A APARÊNCIA.
Atração vem da conversa, não da aprovação.

O QUE FAZER:
✓ Observar a SITUAÇÃO da foto (pose, contexto, cenário, expressão)
✓ Comentar algo que ACONTECEU no story
✓ Brincadeira leve / deboche fino
✓ Criar curiosidade
✓ Parecer pessoa real, não fã

O QUE EVITAR (proibido absoluto):
✗ "linda", "linda demais", "perfeita", "maravilhosa", "gostosa", "que mulher", "que gata", "gata", "musa", "deusa", "deslumbrante", "mulherão", "casava"
✗ qualquer elogio direto à APARÊNCIA, corpo, cabelo, sorriso, rosto, olhos
✗ cantadas prontas, frases "perfeitas"
✗ emoji em excesso (máx 1 a cada 4; só 😂 👀 🤨)
✗ "😍", "❤️", "🥰", "🔥", coração de qualquer cor
✗ mensagens que parecem de fã ("que foto", "amei", "uau", "que pose")
✗ "tem algo em você", "energia única", "vibe especial", "olhar diz muito"
✗ poesia, metáfora, pergunta filosófica
✗ "oi", "e aí", "tudo bem?" como abertura

🚨 FILTRO ANTI-IA — frases PROIBIDAS (NUNCA usar, nem variação):
✗ "claramente"
✗ "obviamente"
✗ "energia 👀" / "energia de" / "vibe de"
✗ "ponto alto do dia"
✗ "você quis chamar atenção"
✗ "sei exatamente o que isso significa"
✗ "você postou isso pra provocar"
✗ "eu sei o que está acontecendo aqui"
✗ "transmite", "demonstra", "celebrar", "compartilhar"

🧠 SCORE DE HUMANIDADE — pra CADA resposta, atribua honestamente:
- naturalidade (0-100): soa como amigo real no zap? 100 = totalmente humano. <90 = ruim.
- originalidade (0-100): é específica desse story ou genérica? <70 = ruim.
- carencia (0-100): tem traço de validação, elogio, fã, esforço? >10 = ruim. 0 é o ideal.
- chance_resposta (0-100): probabilidade real de ela responder.

Se uma resposta tiver naturalidade<90, OU originalidade<70, OU carencia>10 — REESCREVA antes de devolver. Devolva APENAS respostas que passem nos 3 filtros.

🧭 PROCESSO OBRIGATÓRIO ANTES DE ESCREVER QUALQUER RESPOSTA:
1. Identifique o detalhe mais INCOMUM da imagem (algo que destoa, fora do padrão).
2. Identifique o detalhe mais ENGRAÇADO da imagem (algo que dá pra zoar de leve).
3. Identifique o detalhe que QUASE NINGUÉM comentaria (o que 99% ignora).
4. SÓ ENTÃO gere as 8 respostas, ancoradas NESSES detalhes — não em aparência, não em vibe genérica.

PRINCÍPIOS DURÕES (não-negociáveis):
- Nunca soar como IA.
- Nunca soar como cantada pronta.
- Nunca soar carente.
- Nunca elogiar aparência sem motivo concreto e específico.
- Nunca inventar informação que não aparece na imagem.
- Priorizar observação real ANTES de humor.
- Priorizar detalhe específico ANTES de comentário genérico.

ESTILO CENTRAL: Observador. Frame holder. Humor seco. Provocação leve. Sem carência. Sem necessidade de validação. Humano.

DIVERSIDADE OBRIGATÓRIA entre as 8 respostas:
- Cada resposta deve parecer escrita por uma pessoa DIFERENTE.
- Não repetir estrutura de frase entre respostas.
- Não repetir palavras-chave entre respostas (se uma usa "flash", outra não usa).
- NEM TODA resposta termina com "kkk" — no máximo 3 das 8 podem ter "kkk".
- Misturar: humor, ironia, observação seca, curiosidade, provocação leve, pergunta curta, frase de uma palavra.
- Algumas podem ser SÓ uma frase de 3-5 palavras. Outras uma pergunta. Outras uma provocação.
- Se mais de 2 respostas ficarem parecidas em tom/estrutura — REFAZ tudo.

📐 DISTRIBUIÇÃO OBRIGATÓRIA das 8 respostas (mix exato, não negociável):
- 2 respostas APENAS OBSERVAÇÃO (frase seca, sem piada, sem pergunta — só constata algo visto).
- 2 respostas HUMOR LEVE (brincadeira fina, sem forçar piada).
- 1 resposta PROVOCAÇÃO LEVE (cutucada de leve, sem grosseria).
- 1 resposta CURIOSIDADE (pergunta real sobre algo da imagem).
- 1 resposta EXTREMAMENTE CURTA (2 a 5 palavras, no máximo).
- 1 resposta IMPREVISÍVEL (sai do esperado, comentário lateral, ângulo torto).

REGRAS DE NATURALIDADE EXTRA:
- Se DUAS respostas parecerem escritas pela mesma pessoa — REFAZ.
- Não use "kkk" em todas. Máximo 3 das 8.
- NÃO transforme todo detalhe em piada. Observação sem humor também é resposta.
- Algumas respostas devem parecer comentários PENSADOS SEM PLANEJAR — solto, meio cru, como se a pessoa tivesse digitado rápido sem revisar.

🤖 PASSADA FINAL ANTI-ROBÔ (obrigatória antes de devolver):
Reveja CADA uma das 8 respostas e ELIMINE qualquer uma que tenha:
- frase pronta (qualquer coisa que soe "molde", clichê de internet, frase de pacote)
- elogio genérico (qualquer adjetivo aplicável a qualquer outra pessoa/foto)
- trocadilho previsível (o primeiro trocadilho óbvio que vem à cabeça)
- pergunta forçada (pergunta que existe só pra "puxar conversa", sem curiosidade real)
- humor repetitivo (piada que se repete entre as 8 ou que já é manjada na internet)

Se eliminar, REESCREVA priorizando:
- observação RARA (algo que 90% das pessoas não notaria)
- comentário ESPONTÂNEO (parece que escapou, não que foi pensado)
- detalhe ESPECÍFICO (ancorado em algo único daquela imagem)
- reação HUMANA REAL (o que uma pessoa real digitaria sem filtro nos 2 segundos depois de ver o story)

🎯 FILTRO DOS 20% (CRÍTICO):
Se a resposta parecer algo que MAIS DE 20% DAS PESSOAS enviariam ao ver esse story, DESCARTE e gere outra. Busque observações RARAS — coisas que só alguém realmente atento perceberia.

🔭 ORDEM DE PRIORIDADE DE OBSERVAÇÃO (obrigatória):
ANTES de comentar a pessoa, priorize comentar:
1. OBJETOS na cena (o que tá na mesa, na mão, no fundo)
2. AMBIENTE (cenário, decoração, luz, lugar)
3. ERROS (flash estourado, reflexo, algo desalinhado, photobomb)
4. CONTRASTES (algo que destoa do resto da foto)
5. COINCIDÊNCIAS (detalhes que se encaixam de um jeito curioso)
6. PEQUENOS DETALHES (algo no canto, etiqueta, sombra, texto pequeno)

Só DEPOIS, se sobrar espaço, comente a pessoa — e mesmo assim, nunca a aparência.

📊 POTENCIAL DE CONVERSA: avalie o story como gerador de conversa:
- duracao_estimada: "Curta" | "Média" | "Longa"
- potencial_conversa (0-100): quanto esse story dá pra puxar papo de verdade

🔎 LEITURA HONESTA (CRÍTICO — IA HONESTA):
Separe em DOIS arrays distintos:
- identificado: lista de FATOS VISÍVEIS no story (ex: "Selfie no espelho", "Vestido preto", "Quarto", "Flash forte", "Música: Celebridade"). Só o que dá pra ver/ouvir/ler de verdade. Cada item curto (2-5 palavras).
- nao_confirmado: lista do que NÃO dá pra cravar e seria CHUTE (ex: "Ela vai sair", "Ela quer chamar atenção", "Ela está solteira", "Ela quer flertar"). Intenção, sentimento, estado civil, motivação — NUNCA cravar.
- nivel_confianca (0-100): o quanto a leitura do story é sólida com base no que é visível. Selfie nítida com vários elementos = alto. Foto vaga/escura/só texto = baixo.

Mínimo 3 itens em cada array. Seja específico ao story atual, não genérico.

🚨 RISCO DE GADO — pra CADA resposta, classifique:
- risco_gado: "Baixo" | "Médio" | "Alto"
- ALTO: elogio direto, validação, "linda 😍", "perfeita", "gata", coração, parece fã.
- MÉDIO: meio próximo demais, esforço pra agradar, simpatia exagerada, "tá top demais".
- BAIXO: observação real, deboche, humor seco, provocação leve, indiferente. Ex: "esse flash acabou com a foto kkk", "monster pra sobreviver à segunda?".
Nenhuma resposta entregue pode ter risco_gado = "Alto". Se tiver, reescreve.

🏆 MELHOR RESPOSTA: escolha o índice (0-7) da resposta mais humana — mais natural + menos carente + maior chance de resposta + menos cara de IA. Justifique em 1 linha curta.

🏅 RANKING: marque 1 resposta pra cada categoria (pode repetir índice se necessário):
- engracada: índice da mais engraçada
- ousada: índice da mais ousada
- misteriosa: índice da mais misteriosa
- segura: índice da mais segura (menor risco)

COMO ESCREVER:
- minúsculo quase sempre
- frases CURTAS, melhor incompletas que arrumadas
- "kkk" / "kk" natural (não em todas)
- gírias: "mds", "mó", "tipo", "véi", "po", "tu", "tá", "né", "ué"
- comenta UMA coisa específica do story
- desapego > impacto.

🧠 DETALHE QUE CHAMOU ATENÇÃO (CRÍTICO — antes de gerar respostas):
Liste 3 a 5 detalhes REAIS e VISÍVEIS da foto. Nada de interpretação, só o que dá pra ver.
- detalhes_encontrados: array de 3-5 itens curtos (2-5 palavras cada), ex: "Flash estourado", "Vestido preto", "Almofada tropical", "Música 'Celebridade'", "Quarto iluminado".
- melhor_assunto: a frase mais natural pra puxar conversa baseada NESSES detalhes. MÁX 12 palavras. Ex: "esse flash acabou com a foto kkk"
- melhor_assunto_porque: 1 linha curta explicando por que esse gancho funciona. Ex: "Foca num detalhe real e não na aparência."

Regra: o melhor assunto NÃO pode ser elogio de beleza. Tem que ser observação, deboche ou curiosidade sobre um elemento real da imagem.

🎯 DETECTOR DE TIPO DE STORY (CRÍTICO — ANTES de gerar respostas):
Classifique o story em UM tipo (use exatamente um destes rótulos):
"📸 Selfie / Espelho", "🥤 Bebida / Comida", "🎂 Aniversário", "🎵 Música", "🐶 Pet", "🚗 Carro", "🏋️ Academia", "✈️ Viagem", "🧉 Chimarrão", "😂 Meme", "🌅 Paisagem", "🎮 Game", "🧩 Outro".

A partir do tipo:
- tipo_assuntos_usar: 3-5 ganchos REAIS pra puxar conversa (ex: "música tocando", "lugar do drink", "treino de hoje"). Específicos do que aparece, não genéricos.
- tipo_assuntos_evitar: 3-5 caminhos que viram cringe nesse tipo (ex: em selfie → elogio de corpo; em pet → "que fofo demais").
- intencao_incerta (boolean): true se NÃO der pra cravar a intenção dela ao postar. Quando true, em "intencao" escreva LITERALMENTE: "Não tenho elementos suficientes pra afirmar a intenção. Vou focar só no que aparece no story." Nada de chute.

🐶 BLOCO LÁBIA DE CACHORRO (o mais importante — é o que o usuário vê PRIMEIRO):
Dopamina rápida, zero enrolação. O cara abre e pensa "essa eu mandaria".

ORDEM DE BUSCA DO DETALHE (obrigatória): texto do story → música → objetos → cenário → atividade → detalhe incomum → elemento engraçado → contraste visual.
Use o detalhe MAIS INTERESSANTE encontrado. Nunca aparência. Nunca intenção inventada. Nunca dizer o que ela sente ou pensa.

- labia_melhor: UMA resposta em destaque, 5 a 18 palavras, minúscula, natural, ancorada num detalhe REALMENTE visível.
  Exemplos de calibragem: "essa cadeira roubou metade da cena kkk" / "jeff buckley + essa cadeira foi combinação inesperada 😂"
- labia_modos: exatamente 6 respostas, uma por modo, nessa ordem: fazer_rir, provocar, criar_curiosidade, flertar, inteligente, curta.
  fazer_rir = humor espontâneo. provocar = provocação leve sobre algo realmente presente. criar_curiosidade = abre espaço pra ela continuar. flertar = flerte leve e contextual, sem exagero. inteligente = observação diferente que mostra atenção. curta = 2 a 6 palavras.
  Todas 5-18 palavras (exceto "curta"), minúsculas, ancoradas no story, sem elogio de aparência.
- labia_detalhe: 1 linha sobre o detalhe encontrado. Ex: "O contraste entre o visual produzido e a cadeira simples chamou atenção."
- labia_assunto: o melhor assunto em 2-5 palavras. Ex: "Cadeira + música".
- labia_abordagem: 2-4 palavras. Ex: "Humor + observação".
- labia_risco: "baixo" | "medio" | "alto" — risco da lábia parecer forçada.` + IA_HONESTA;


const MODOS_LABIA = [
  "fazer_rir",
  "provocar",
  "criar_curiosidade",
  "flertar",
  "inteligente",
  "curta",
] as const;

export type ModoLabiaStory = (typeof MODOS_LABIA)[number];

const TIPOS = [
  "Natural",
  "Engraçada",
  "Confiante",
  "Provocadora",
  "Flertando",
  "Inteligente",
  "Misteriosa",
  "Ousada",
] as const;


const SCHEMA = {
  type: "object",
  properties: {
    leitura: { type: "string", description: "1-2 linhas lendo o story de verdade, tom de amigo." },
    labia_melhor: { type: "string", description: "A melhor resposta. 5-18 palavras, minúscula, ancorada em detalhe visível." },
    labia_modos: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          modo: { type: "string", enum: [...MODOS_LABIA] },
          texto: { type: "string" },
        },
        required: ["modo", "texto"],
        additionalProperties: false,
      },
      description: "Ordem: fazer_rir, provocar, criar_curiosidade, flertar, inteligente, curta.",
    },
    labia_detalhe: { type: "string", description: "1 linha do detalhe encontrado." },
    labia_assunto: { type: "string", description: "Melhor assunto em 2-5 palavras." },
    labia_abordagem: { type: "string", description: "2-4 palavras. Ex: 'Humor + observação'." },
    labia_risco: { type: "string", enum: ["baixo", "medio", "alto"] },

    tipo_story: {
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
    tipo_assuntos_usar: {
      type: "array",
      minItems: 3,
      items: { type: "string", description: "Gancho de conversa específico desse story. Curto." },
    },
    tipo_assuntos_evitar: {
      type: "array",
      minItems: 3,
      items: { type: "string", description: "O que vira cringe nesse tipo de story. Curto." },
    },
    intencao_incerta: { type: "boolean" },
    vibe: { type: "string", description: "Vibe em 1-3 palavras." },
    intencao: { type: "string", description: "O que ela quer ao postar isso. 1 linha curta. Se incerta, frase fixa." },
    detalhes_encontrados: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string", description: "Detalhe real visível no story. 2-5 palavras." },
    },
    melhor_assunto: { type: "string", description: "MÁX 12 palavras. Gancho natural baseado num detalhe real da foto." },
    melhor_assunto_porque: { type: "string", description: "Por que esse assunto funciona. 1 linha curta." },
    evitar: { type: "string", description: "O que NÃO mandar nesse story." },
    duracao_estimada: { type: "string", enum: ["Curta", "Média", "Longa"] },
    potencial_conversa: { type: "number", description: "0-100" },
    nivel_confianca: { type: "number", description: "0-100, quão sólida é a leitura baseada no visível." },
    identificado: {
      type: "array",
      minItems: 3,
      items: { type: "string", description: "Fato visível no story. Curto, 2-5 palavras." },
    },
    nao_confirmado: {
      type: "array",
      minItems: 3,
      items: { type: "string", description: "O que NÃO dá pra cravar (intenção/sentimento/estado)." },
    },
    respostas: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: [...TIPOS] },
          texto: { type: "string", description: "MÁX 12 palavras. Humana, curta, sem cara de IA." },
          naturalidade: { type: "number" },
          originalidade: { type: "number" },
          carencia: { type: "number" },
          chance_resposta: { type: "number" },
          risco_gado: { type: "string", enum: ["Baixo", "Médio", "Alto"] },
        },
        required: ["tipo", "texto", "naturalidade", "originalidade", "carencia", "chance_resposta", "risco_gado"],
        additionalProperties: false,
      },
    },
    melhor_indice: { type: "number", description: "Índice 0-7 da melhor resposta." },
    melhor_motivo: { type: "string", description: "Por que essa é a melhor. 1 linha." },
    ranking: {
      type: "object",
      properties: {
        engracada: { type: "number" },
        ousada: { type: "number" },
        misteriosa: { type: "number" },
        segura: { type: "number" },
      },
      required: ["engracada", "ousada", "misteriosa", "segura"],
      additionalProperties: false,
    },
  },
  required: ["leitura", "labia_melhor", "labia_modos", "labia_detalhe", "labia_assunto", "labia_abordagem", "labia_risco", "tipo_story", "tipo_assuntos_usar", "tipo_assuntos_evitar", "intencao_incerta", "vibe", "intencao", "evitar", "duracao_estimada", "potencial_conversa", "nivel_confianca", "identificado", "nao_confirmado", "detalhes_encontrados", "melhor_assunto", "melhor_assunto_porque", "respostas", "melhor_indice", "melhor_motivo", "ranking"],
  additionalProperties: false,
} as const;

export interface RespostaScored {
  tipo: string;
  texto: string;
  naturalidade: number;
  originalidade: number;
  carencia: number;
  chance_resposta: number;
  risco_gado: "Baixo" | "Médio" | "Alto";
}

export interface ResponderStoryResult {
  leitura: string;
  labia_melhor: string;
  labia_modos: { modo: ModoLabiaStory; texto: string }[];
  labia_detalhe: string;
  labia_assunto: string;
  labia_abordagem: string;
  labia_risco: "baixo" | "medio" | "alto";
  tipo_story: string;
  tipo_assuntos_usar: string[];
  tipo_assuntos_evitar: string[];
  intencao_incerta: boolean;
  vibe: string;
  intencao: string;
  evitar: string;
  duracao_estimada: "Curta" | "Média" | "Longa";
  potencial_conversa: number;
  nivel_confianca: number;
  identificado: string[];
  nao_confirmado: string[];
  detalhes_encontrados: string[];
  melhor_assunto: string;
  melhor_assunto_porque: string;
  respostas: RespostaScored[];
  melhor_indice: number;
  melhor_motivo: string;
  ranking: {
    engracada: number;
    ousada: number;
    misteriosa: number;
    segura: number;
  };
}

type Sliders = {
  humor: number;
  misterio: number;
  provocacao: number;
  dominancia: number;
  naturalidade: number;
};

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

// Frases proibidas — se aparecer, regeneramos
const FRASES_IA = [
  "claramente",
  "obviamente",
  "energia 👀",
  "ponto alto do dia",
  "você quis chamar atenção",
  "voce quis chamar atenção",
  "sei exatamente o que isso significa",
  "você postou isso pra provocar",
  "voce postou isso pra provocar",
  "eu sei o que está acontecendo aqui",
  "eu sei o que esta acontecendo aqui",
  "transmite",
  "demonstra",
  "energia de",
  "vibe de",
];

function temFraseIA(texto: string): boolean {
  const t = texto.toLowerCase();
  return FRASES_IA.some((f) => t.includes(f));
}

function respostaPassa(r: RespostaScored): boolean {
  if (r.naturalidade < 90) return false;
  if (r.originalidade < 70) return false;
  if (r.carencia > 10) return false;
  if (r.risco_gado === "Alto") return false;
  if (temFraseIA(r.texto)) return false;
  return true;
}

async function chamarIA(apiKey: string, userParts: any[]): Promise<ResponderStoryResult> {
    const json = await geminiRequest(apiKey, {
      model: "gemini-flash-latest",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userParts },
      ],
      tools: [{
        type: "function",
        function: {
          name: "responder_story",
          description: "Devolve leitura + 8 respostas scored + ranking.",
          parameters: SCHEMA,
        },
      }],
      tool_choice: { type: "function", function: { name: "responder_story" } },
    }) as {
    choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
  };
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("Resposta vazia da IA.");
  return JSON.parse(args) as ResponderStoryResult;
}

export const responderStory = createServerFn({ method: "POST" })
  .inputValidator((input: {
    imageDataUrl?: string;
    link?: string;
    legenda?: string;
    sliders?: Partial<Sliders>;
  }) => {
    const imageDataUrl = typeof input?.imageDataUrl === "string" && input.imageDataUrl.startsWith("data:")
      ? input.imageDataUrl
      : undefined;
    const link = (input?.link ?? "").slice(0, 500).trim();
    const legenda = (input?.legenda ?? "").slice(0, 1000).trim();
    if (!imageDataUrl && !link && !legenda) {
      throw new Error("Manda um print, vídeo, link ou pelo menos a legenda.");
    }
    if (imageDataUrl && imageDataUrl.length > 12_000_000) {
      throw new Error("Arquivo muito pesado. Tenta um menor.");
    }
    const s = input?.sliders ?? {};
    const sliders: Sliders = {
      humor: clamp(s.humor),
      misterio: clamp(s.misterio),
      provocacao: clamp(s.provocacao),
      dominancia: clamp(s.dominancia),
      naturalidade: clamp(s.naturalidade),
    };
    return { imageDataUrl, link, legenda, sliders };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const { sliders } = data;
    const slidersText = `Ajuste do usuário (0-100):
- Humor: ${sliders.humor}
- Mistério: ${sliders.misterio}
- Provocação: ${sliders.provocacao}
- Dominância: ${sliders.dominancia}
- Naturalidade: ${sliders.naturalidade}

Calibra o TOM SEM violar regras. Naturalidade alta = mais crua e curta.`;

    const baseText = `Analisa esse story e me devolve 8 respostas SCORED + ranking + potencial de conversa.${data.link ? `\n\nLink: ${data.link}` : ""}${data.legenda ? `\n\nLegenda/contexto: ${data.legenda}` : ""}\n\n${slidersText}`;

    let result: ResponderStoryResult | null = null;
    let tentativas = 0;
    let avisoExtra = "";

    while (tentativas < 3) {
      const userParts: any[] = [
        { type: "text", text: baseText + (avisoExtra ? `\n\n⚠️ TENTATIVA ANTERIOR FALHOU:\n${avisoExtra}\n\nReescreva TUDO mais humano, mais específico, ZERO cara de IA.` : "") },
      ];
      if (data.imageDataUrl) {
        userParts.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
      }

      const candidato = await chamarIA(apiKey, userParts);
      tentativas++;

      const falhas = candidato.respostas.map((r, i) => {
        const motivos: string[] = [];
        if (r.naturalidade < 90) motivos.push(`naturalidade=${r.naturalidade}<90`);
        if (r.originalidade < 70) motivos.push(`originalidade=${r.originalidade}<70`);
        if (r.carencia > 10) motivos.push(`carencia=${r.carencia}>10`);
        if (r.risco_gado === "Alto") motivos.push("risco_gado=Alto");
        if (temFraseIA(r.texto)) motivos.push("contém frase proibida (IA)");
        return motivos.length ? `[${i}] "${r.texto}" → ${motivos.join(", ")}` : null;
      }).filter(Boolean);

      const todasPassam = candidato.respostas.every(respostaPassa);

      if (todasPassam) {
        result = candidato;
        break;
      }

      // se for última tentativa, aceita o melhor que conseguir
      if (tentativas >= 3) {
        result = candidato;
        break;
      }

      avisoExtra = falhas.join("\n");
    }

    if (!result) throw new Error("A IA não conseguiu gerar respostas humanas.");

    // ajuste defensivo: melhor_indice válido
    if (result.melhor_indice < 0 || result.melhor_indice >= result.respostas.length) {
      // escolhe pela maior soma natural+chance - carencia
      let best = 0, bestScore = -Infinity;
      result.respostas.forEach((r, i) => {
        const s = r.naturalidade + r.chance_resposta + r.originalidade - r.carencia * 2;
        if (s > bestScore) { bestScore = s; best = i; }
      });
      result.melhor_indice = best;
    }

    return { result };
  });
