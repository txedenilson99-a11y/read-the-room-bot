import { z } from "zod";

export const STORY_TONES = ["natural", "engracado", "curioso", "confiante"] as const;
export const STORY_MAX_BYTES = 6_000_000;
const text = z.string().trim().min(1).max(1500);
const banned =
  /\b(na bad|magoou|sofrendo|triste|superando|linda|gata|maravilhosa|deusa|perfeita|claramente|obviamente)\b|vai passar|força aí|se precisar|tô aqui pra|me conta mais|fiquei curioso/i;
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const storyResultSchema = z
  .object({
    detalhes_observaveis: z.array(text).min(1).max(6),
    interpretacoes: z
      .array(z.object({ leitura: text, base: text, incerteza: z.enum(["alta", "media", "baixa"]) }))
      .max(4),
    nao_da_pra_concluir: z.array(text).min(1).max(4),
    estrategia: text,
    respostas: z
      .array(
        z.object({
          tom: z.enum(STORY_TONES),
          texto: text.refine(
            (s) =>
              s.split(/\s+/).length <= 12 &&
              !banned.test(s) &&
              !/^(que legal|adorei|amei|tudo bem)[.!?]*$/i.test(s),
            "Mensagem longa, genérica ou presumindo sentimentos.",
          ),
          detalhe_indice: z.number().int().min(0),
          por_que: text,
        }),
      )
      .length(4),
    melhor_resposta: z.object({ texto: text, por_que: text }),
  })
  .superRefine((result, ctx) => {
    const invalid =
      new Set(result.respostas.map((r) => r.tom)).size !== 4 ||
      new Set(result.respostas.map((r) => normalize(r.texto))).size !== 4 ||
      result.respostas.some((r) => r.detalhe_indice >= result.detalhes_observaveis.length) ||
      !result.respostas.some((r) => r.texto === result.melhor_resposta.texto);
    if (invalid)
      ctx.addIssue({
        code: "custom",
        message:
          "As quatro mensagens precisam de tons e textos distintos, base observável válida e melhor resposta entre as opções.",
      });
  });

export type PsicologiaStoryResult = z.infer<typeof storyResultSchema>;

export function validateStoryInput(input: {
  contexto?: string;
  image?: string;
  anteriores?: string[];
}) {
  const image = typeof input.image === "string" ? input.image : "";
  const match = /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
  const base64 = match?.[2];
  if (!base64 || base64.length % 4 !== 0)
    throw new Error("Manda o print do story em JPG ou PNG válido.");
  const bytes =
    (base64.length * 3) / 4 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (bytes > STORY_MAX_BYTES) throw new Error("Imagem muito pesada (máx. 6 MB).");
  const binary = atob(base64.slice(0, 32));
  const png = binary.startsWith("\x89PNG\r\n\x1a\n");
  const jpeg = binary.startsWith("\xff\xd8\xff");
  if ((match?.[1] === "png" && !png) || (match?.[1] !== "png" && !jpeg))
    throw new Error("Não consegui reconhecer a imagem. Use JPG ou PNG válido.");
  return {
    image,
    contexto: typeof input.contexto === "string" ? input.contexto.slice(0, 1500).trim() : "",
    anteriores: Array.isArray(input.anteriores)
      ? input.anteriores
          .filter((s) => typeof s === "string")
          .slice(0, 4)
          .map((s) => s.slice(0, 200))
      : [],
  };
}
