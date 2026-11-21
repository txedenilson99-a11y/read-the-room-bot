import { createServerFn } from "@tanstack/react-start";
import { IA_HONESTA } from "./ia-honesta";
import { requireAprovado } from "./require-aprovado";
import { geminiRequest } from "./gemini";
import {
  DIAGNOSTICO_PAISAGEM,
  diagnosticoRuim,
  ehPaisagem,
  filtrarMensagens,
} from "./arte-atracao.validacao";

export const SITUACOES = {
  primeira: "Primeira abordagem (ainda não conversaram)",
  iniciada: "Conversa já iniciada",
  story: "Resposta a story",
  esfriando: "Conversa esfriando",
} as const;
export type Situacao = keyof typeof SITUACOES;

const SYSTEM =
  `Você é o módulo "Arte da Atração" do ScanSocial: um amigo brasileiro experiente, calmo e honesto que ajuda homens tímidos a ganhar confiança pra puxar conversa, mostrar interesse e criar conexão RECÍPROCA.

PRINCÍPIOS:
- Atração saudável = curiosidade genuína + leveza + respeito. Nada de manipulação, joguinho, técnica de pressão, ciúme induzido, "sumir pra ela sentir falta" ou qualquer promessa de fazer alguém sentir desejo, apego ou dependência.
- Nunca afirme o que a outra pessoa sente ou pensa. Use "pode ser", "talvez". Diga quando não dá pra saber.
- Mensagens curtas (até ~18 palavras), naturais, como alguém mandaria no zap, conectadas ao contexto que o usuário deu. Proibido cantada pronta genérica e elogio vazio de aparência.
- Reciprocidade: se a pessoa responde seco, demora sempre ou não devolve perguntas, oriente a diminuir o investimento e respeitar. Não insistir é atraente e é o certo.
- Exercícios: práticos, pequenos, realizáveis hoje, pra perder a timidez (ex: puxar papo leve com alguém no dia a dia, gravar áudio pra si mesmo).
- Linguagem informal brasileira, direta, sem tom de coach.

LEITURA SOCIAL ANTES DE ESCREVER (obrigatório, qualquer story/print):
1. Copie o texto visível da postagem (legenda, pergunta, trend).
2. Identifique o CONVITE SOCIAL: o que a pessoa está chamando os seguidores pra fazer? (ex: trend "Chat, como eu seria se fosse personagem do GTA6?" = ela está convidando a brincar e imaginá-la como personagem).
3. Identifique o GANCHO DE INTERAÇÃO: o jeito mais fácil de entrar na brincadeira e abrir conversa.
4. Só então escreva as mensagens.

REGRAS DAS MENSAGENS:
- Entre na brincadeira/tema proposto e fale com a PESSOA sobre a postagem dela. Proibido só descrever a imagem, comentar o cenário ou repetir a legenda.
- NUNCA atribua à pessoa papel, identidade, personalidade, aparência, crime ou comportamento que ela não declarou (ex: nada de "você seria ladra de banco", "cara de vilã", "combinou com assalto"). A brincadeira é sobre a trend; afirmações sobre ela só com base no que está explícito na postagem.
- Prefira ganchos ligados à trend e convites leves pra ela responder: perguntas dentro do tema, escolhas divertidas, curiosidade sobre a versão dela da brincadeira.
- Até 4 mensagens com ângulos realmente diferentes e ESTRUTURAS diferentes (não repita o mesmo formato, ex: 4 perguntas seguidas ou 4 frases começando igual). A primeira é a melhor.
- No máximo 1 ou 2 terminam em pergunta, e só quando soar orgânico (pergunta leve dentro do tema).
- Não assuma interesse romântico, não cite aparência/atributos que não aparecem, não invente história, horário, lugar ou plano.

PROIBIDO IDENTIFICAR LUGARES (regra crítica):
- Nunca diga nome de local, cidade, ponto turístico, cachoeira, praia, trilha ou estabelecimento a partir da imagem. Só cite um nome se estiver ESCRITO no print ou no contexto do usuário.
- Nunca afirme fama, "lugar clássico", "ponto turístico", distância, trilha, subida, dificuldade de acesso ou histórico do lugar.
- Nunca invente experiência pessoal do usuário ("faz tempo que não vou lá", "já fui", "por essas bandas") nem falsa intimidade.
- Descreva só o que é visível em termos genéricos (ex: "cachoeira", "paisagem com mata"). Se não souber onde é, pergunte de forma simples ("onde fica essa cachoeira?", "que lugar é esse?").
- Diagnóstico de foto de paisagem/lugar: diga só que é uma paisagem e que não há sinal claro de intenção romântica. Não atribua pensamentos, desejos ou estado emocional à pessoa.

TOM DAS MENSAGENS: conversa real de WhatsApp/Instagram. Proibido linguagem publicitária, frases de efeito, exageros e clichês: "merece a visita", "visual renova", "energia absurda", "lugar clássico", "vibe incrível", "paraíso", "recarregar as energias" e parecidos.
- Em foto de paisagem/lugar: no máximo 2 mensagens (prefira 1), curiosidade direta sobre o visível, sem fala em primeira pessoa ("nunca fui", "faz tempo que não vou"), sem perguntas sobre dia bom/passeio/tempo/som/vista. Se não houver gancho real, diga no "lembrete" que é melhor não mandar nada.
- Não force quantidade: gere de 1 a 4 mensagens, só as que tiverem função conversacional diferente (ex: pergunta simples, reação curta, comentário específico). Se só houver 2 boas, entregue 2.

- Referência de tom pro exemplo GTA6 (não copiar literal): "qual seria tua missão principal em Vice City?", "protagonista ou dona da cidade? kkk", "qual seria teu nome no GTA 6?".` +
  IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    tipo_imagem: {
      type: "string",
      enum: [
        "paisagem_lugar",
        "selfie_pessoa",
        "trend_texto",
        "print_conversa",
        "outro",
        "sem_imagem",
      ],
      description: "O que a imagem mostra principalmente.",
    },
    texto_visivel: {
      type: "string",
      description:
        "Transcrição LITERAL do texto escrito na imagem. Vazio se não houver. Nunca coloque nome de lugar que não esteja escrito.",
    },
    convite_social: {
      type: "string",
      description:
        "Texto visível + o que a postagem convida os seguidores a fazer + gancho de interação.",
    },
    diagnostico: {
      type: "string",
      description: "2-3 frases: leitura leve da situação, sem certeza sobre sentimentos dela.",
    },
    nivel_abertura: {
      type: "string",
      enum: ["baixo", "incerto", "bom"],
      description: "Quanta abertura os sinais mostram.",
    },
    mensagens: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          tom: { type: "string", description: "Ex: leve, curioso, bem-humorado, direto." },
          texto: { type: "string" },
          por_que: { type: "string", description: "1 frase: por que pode funcionar." },
        },
        required: ["tom", "texto", "por_que"],
      },
    },
    reciprocidade: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "string",
        description: "Sinal pra observar / limite a respeitar / quando recuar.",
      },
    },
    exercicios: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: { titulo: { type: "string" }, como: { type: "string" } },
        required: ["titulo", "como"],
      },
    },
    lembrete: { type: "string", description: "1 frase curta de confiança realista." },
  },
  required: [
    "tipo_imagem",
    "texto_visivel",
    "convite_social",
    "diagnostico",
    "nivel_abertura",
    "mensagens",
    "reciprocidade",
    "exercicios",
    "lembrete",
  ],
};

export interface ArteResult {
  tipo_imagem?: string;
  texto_visivel?: string;
  convite_social?: string;
  diagnostico: string;
  nivel_abertura: "baixo" | "incerto" | "bom";
  mensagens: { tom: string; texto: string; por_que: string }[];
  reciprocidade: string[];
  exercicios: { titulo: string; como: string }[];
  lembrete: string;
}

export const gerarArteAtracao = createServerFn({ method: "POST" })
  .middleware([requireAprovado])
  .inputValidator((input: { situacao: Situacao; contexto?: string; images?: string[] }) => {
    if (!input || !(input.situacao in SITUACOES)) throw new Error("Escolhe uma situação.");
    const contexto = (input.contexto ?? "").slice(0, 3000).trim();
    const images = Array.isArray(input.images)
      ? input.images.filter((u) => typeof u === "string" && u.startsWith("data:image/")).slice(0, 6)
      : [];
    for (const img of images)
      if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    return { situacao: input.situacao, contexto, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");
    const text = `Situação escolhida: ${SITUACOES[data.situacao]}.${data.contexto ? `\n\nContexto do usuário:\n${data.contexto}` : "\n\nSem contexto extra — se faltar informação, sugira mensagens neutras e diga isso no diagnóstico."}${data.images.length ? `\n\n${data.images.length} print(s) anexado(s).` : ""}`;
    const fonte = data.contexto.toLowerCase();
    const call = async (extra: string) => {
      const json = (await geminiRequest(apiKey, {
        model: "gemini-3.1-flash-lite",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: text + extra },
              ...data.images.map((url) => ({ type: "image_url", image_url: { url } })),
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "arte_da_atracao",
              description: "Plano prático e honesto.",
              parameters: SCHEMA,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "arte_da_atracao" } },
      })) as {
        choices?: Array<{
          message?: { tool_calls?: Array<{ function?: { arguments?: string } }> };
        }>;
      };
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("Resposta vazia da IA. Tenta de novo.");
      try {
        return JSON.parse(args) as ArteResult;
      } catch {
        throw new Error("A IA devolveu algo estranho. Tenta de novo.");
      }
    };
    const avaliar = (r: ArteResult) => {
      const paisagem =
        r.tipo_imagem === "paisagem_lugar" ||
        (r.tipo_imagem !== "trend_texto" && ehPaisagem(r.diagnostico, r.convite_social));
      // Em paisagem, nomes só valem se o usuário escreveu; em trends, vale também o texto visível transcrito.
      const fonte = paisagem ? data.contexto : `${data.contexto}\n${r.texto_visivel ?? ""}`;
      return { paisagem, fonte, ...filtrarMensagens(r.mensagens ?? [], fonte, paisagem) };
    };
    let result = await call("");
    let av = avaliar(result);
    if (av.reprovadas.length || diagnosticoRuim(result.diagnostico ?? "", av.fonte)) {
      const lista = av.reprovadas.map((x) => `"${x.texto}" (${x.motivo})`).join("; ");
      const primeiras = av.aprovadas;
      result = await call(
        `\n\nREFAÇA. Reprovadas: ${lista || "diagnóstico com suposição"}. Não use nome de lugar, fama, subida, vista, clima, passeio, viagem nem clichês (incrível, surreal, icônico, clássico, energia, vibe). Descreva só o visível. Pode devolver só 1 ou 2 mensagens.`,
      );
      av = avaliar(result);
      // mantém as aprovadas da 1ª tentativa se a 2ª vier pior
      if (av.aprovadas.length === 0 && primeiras.length) av = { ...av, aprovadas: primeiras };
    }
    result.mensagens = av.aprovadas.slice(0, av.paisagem ? 2 : 4);
    if (av.paisagem) {
      result.diagnostico = DIAGNOSTICO_PAISAGEM;
      if (result.nivel_abertura === "bom") result.nivel_abertura = "incerto";
      if (!result.mensagens.length) {
        result.mensagens = [
          {
            tom: "pergunta simples",
            texto: "Que lugar é esse?",
            por_que: "Pergunta direta sobre o que aparece na foto, sem supor nada.",
          },
        ];
      }
    } else if (diagnosticoRuim(result.diagnostico ?? "", av.fonte)) {
      result.diagnostico =
        "A imagem/contexto não permite concluir a intenção de quem postou. Vai pelo que está visível e observa como ela responde.";
    }
    if (!result.mensagens.length)
      throw new Error(
        "Não consegui gerar mensagens confiáveis com essas informações. Tenta adicionar um pouco de contexto.",
      );
    return { result };
  });
