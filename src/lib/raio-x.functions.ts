import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { requireAprovado } from "./require-aprovado";
import { geminiRequest } from "./gemini";

const SYSTEM = `Você é um amigo brasileiro socialmente esperto. Faz o Raio-X de um perfil (Instagram, Tinder, Bumble etc.) pra ajudar a puxar conversa de forma natural.

REGRAS:
- Use SÓ o que aparece nas imagens/textos. Nunca invente informação.
- Não afirme que a pessoa está interessada, solteira, carente ou querendo relacionamento.
- Sem diagnóstico psicológico. Não presuma personalidade pela aparência.
- Nada de frases genéricas ("você parece interessante") nem elogio físico.
- Priorize detalhes reais: bio, interesses, lugares, atividades, músicas, animais, viagens, objetos.
- Se houver pouco contexto, marque pouco_contexto=true, diga isso no contexto e sugira abordagens neutras.
- Mensagens curtas (até ~18 palavras), minúsculas na maioria, fáceis de enviar. Sem tom de coach ou relatório.

ENTREGA:
- como_abordar: 8 primeiras mensagens DIFERENTES entre si, cada uma ancorada num detalhe real diferente quando possível. A primeira é a melhor.
- interesses, assuntos (3-5 concretos), detalhes (que podem render conversa).
- contexto: 1-2 frases sobre o que o perfil transmite com base só no que aparece.
- melhor_oportunidade: o detalhe mais específico + por quê, curto.
- primeiro_contato: natural, flertando (leve, sem apelação), divertida.` + IA_HONESTA;

const arr = (min: number, max: number) => ({ type: "array", minItems: min, maxItems: max, items: { type: "string" } });
const SCHEMA = {
  type: "object",
  properties: {
    pouco_contexto: { type: "boolean" },
    como_abordar: arr(8, 8),
    interesses: arr(1, 6),
    assuntos: arr(3, 5),
    detalhes: arr(1, 6),
    contexto: { type: "string" },
    melhor_oportunidade: { type: "string" },
    primeiro_contato: {
      type: "object",
      properties: { natural: { type: "string" }, flertando: { type: "string" }, divertida: { type: "string" } },
      required: ["natural", "flertando", "divertida"],
      additionalProperties: false,
    },
  },
  required: ["pouco_contexto", "como_abordar", "interesses", "assuntos", "detalhes", "contexto", "melhor_oportunidade", "primeiro_contato"],
  additionalProperties: false,
} as const;

export interface RaioXResult {
  pouco_contexto: boolean;
  como_abordar: string[];
  interesses: string[];
  assuntos: string[];
  detalhes: string[];
  contexto: string;
  melhor_oportunidade: string;
  primeiro_contato: { natural: string; flertando: string; divertida: string };
}

export const raioXPerfil = createServerFn({ method: "POST" })
  .middleware([requireAprovado])
  .inputValidator((input: { bio?: string; contexto?: string; images?: string[] }) => {
    const bio = (input.bio ?? "").slice(0, 1500);
    const contexto = (input.contexto ?? "").slice(0, 1500);
    const images = Array.isArray(input.images) ? input.images.slice(0, 6) : [];
    for (const img of images) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) throw new Error("Imagem inválida.");
      if (img.length > 5_000_000) throw new Error("Imagem muito pesada.");
    }
    if (!bio && !contexto && images.length === 0) {
      throw new Error("Manda pelo menos uma foto, bio ou contexto.");
    }
    return { bio, contexto, images };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");

    const partes = [
      "Faz o Raio-X desse perfil seguindo o formato.",
      data.bio ? `Bio:\n${data.bio}` : "",
      data.contexto ? `Contexto: ${data.contexto}` : "",
      data.images.length ? `Use as ${data.images.length} imagem(ns) do perfil.` : "Sem fotos, baseia em bio/contexto.",
    ].filter(Boolean).join("\n\n");

    const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
      { type: "text", text: partes },
    ];
    for (const url of data.images) userContent.push({ type: "image_url", image_url: { url } });

        const json = await geminiRequest(apiKey, {
        model: "gemini-flash-latest",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: { name: "raio_x_perfil", description: "Raio-X do perfil.", parameters: SCHEMA },
        }],
        tool_choice: { type: "function", function: { name: "raio_x_perfil" } },
      }) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>;
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta vazia da IA.");
    return { result: JSON.parse(args) as RaioXResult };
  });
