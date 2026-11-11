import { createServerFn } from "@tanstack/react-start";
import { IA_HONESTA } from "./ia-honesta";
import { requireAprovado } from "./require-aprovado";
import { geminiRequest } from "./gemini";

export const SITUACOES = {
  primeira: "Primeira abordagem (ainda não conversaram)",
  iniciada: "Conversa já iniciada",
  story: "Resposta a story",
  esfriando: "Conversa esfriando",
} as const;
export type Situacao = keyof typeof SITUACOES;

const SYSTEM = `Você é o módulo "Arte da Atração" do ScanSocial: um amigo brasileiro experiente, calmo e honesto que ajuda homens tímidos a ganhar confiança pra puxar conversa, mostrar interesse e criar conexão RECÍPROCA.

PRINCÍPIOS:
- Atração saudável = curiosidade genuína + leveza + respeito. Nada de manipulação, joguinho, técnica de pressão, ciúme induzido, "sumir pra ela sentir falta" ou qualquer promessa de fazer alguém sentir desejo, apego ou dependência.
- Nunca afirme o que a outra pessoa sente ou pensa. Use "pode ser", "talvez". Diga quando não dá pra saber.
- Mensagens curtas (até ~18 palavras), naturais, como alguém mandaria no zap, conectadas ao contexto que o usuário deu. Proibido cantada pronta genérica e elogio vazio de aparência.
- Reciprocidade: se a pessoa responde seco, demora sempre ou não devolve perguntas, oriente a diminuir o investimento e respeitar. Não insistir é atraente e é o certo.
- Exercícios: práticos, pequenos, realizáveis hoje, pra perder a timidez (ex: puxar papo leve com alguém no dia a dia, gravar áudio pra si mesmo).
- Linguagem informal brasileira, direta, sem tom de coach.` + IA_HONESTA;

const SCHEMA = {
  type: "object",
  properties: {
    diagnostico: { type: "string", description: "2-3 frases: leitura leve da situação, sem certeza sobre sentimentos dela." },
    nivel_abertura: { type: "string", enum: ["baixo", "incerto", "bom"], description: "Quanta abertura os sinais mostram." },
    mensagens: {
      type: "array", minItems: 4, maxItems: 5,
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
      type: "array", minItems: 2, maxItems: 4,
      items: { type: "string", description: "Sinal pra observar / limite a respeitar / quando recuar." },
    },
    exercicios: {
      type: "array", minItems: 2, maxItems: 3,
      items: {
        type: "object",
        properties: { titulo: { type: "string" }, como: { type: "string" } },
        required: ["titulo", "como"],
      },
    },
    lembrete: { type: "string", description: "1 frase curta de confiança realista." },
  },
  required: ["diagnostico", "nivel_abertura", "mensagens", "reciprocidade", "exercicios", "lembrete"],
};

export interface ArteResult {
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
    for (const img of images) if (img.length > 8_000_000) throw new Error("Uma das imagens tá muito pesada.");
    return { situacao: input.situacao, contexto, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");
    const text = `Situação escolhida: ${SITUACOES[data.situacao]}.${data.contexto ? `\n\nContexto do usuário:\n${data.contexto}` : "\n\nSem contexto extra — se faltar informação, sugira mensagens neutras e diga isso no diagnóstico."}${data.images.length ? `\n\n${data.images.length} print(s) anexado(s).` : ""}`;
    const json = (await geminiRequest(apiKey, {
      model: "gemini-3.1-flash-lite",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text },
            ...data.images.map((url) => ({ type: "image_url", image_url: { url } })),
          ],
        },
      ],
      tools: [{ type: "function", function: { name: "arte_da_atracao", description: "Plano prático e honesto.", parameters: SCHEMA } }],
      tool_choice: { type: "function", function: { name: "arte_da_atracao" } },
    })) as { choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }> };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA. Tenta de novo.");
    try {
      return { result: JSON.parse(args) as ArteResult };
    } catch {
      throw new Error("A IA devolveu algo estranho. Tenta de novo.");
    }
  });
