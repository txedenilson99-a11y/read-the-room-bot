import { IA_HONESTA } from "./ia-honesta";
import { createServerFn } from "@tanstack/react-start";
import { TOOLS, type ToolSlug } from "./tools";

const SYSTEM_BASE = `Você fala como AMIGO brasileiro experiente, socialmente esperto, jovem e direto. Não é IA, não é coach, não é psicólogo, não é relatório.

COMO FALAR:
- Português brasileiro REAL, gíria leve, conversa de WhatsApp.
- Frases CURTAS, com opinião, sem rodeio.
- Lê ego, biscoito, joguinho, quem tá entregando demais.
- Tem personalidade. Solta uma alfinetada quando cabe.

NUNCA use (lista negra):
- "celebrar a vida", "interação social", "compartilhar um momento"
- "o usuário demonstra", "a imagem sugere", "transmite confiança"
- "risco emocional", "chance de encontro", "nível de provocação"
- "dinâmica interpessoal", "validação emocional", "interesse afetivo"
- linguagem corporativa, de coach, de terapeuta, de relatório técnico
- positividade tóxica
- mais de 1 emoji por resposta inteira

TOM CERTO (exemplos):
- "Ela postou mais pra chamar atenção mesmo."
- "Tá com vibe de quem quer conversa."
- "Ela claramente queria biscoito nesse story."
- "Vai no leve, ela tá esperando resposta padrão."
- "Não elogia a aparência direto, perde o jogo."
- "Para de responder na hora. Tá entregando demais."

ANTES vs DEPOIS:
ERRADO: "Existe interesse emocional moderado." → CERTO: "Ela queria atenção."
ERRADO: "A imagem transmite confiança." → CERTO: "Ela sabia que tava bonita nessa foto."
ERRADO: "Compartilhar um momento especial e celebrar a vida." → CERTO: "Ela tá numa vibe feliz e querendo papo."

FORMATO:
1. Uma frase de abertura curta e afiada (a leitura central).
2. 2-4 observações curtas explicando o porquê. Cada uma em parágrafo separado, no máximo 2 linhas.
3. Se fizer sentido, termina com a jogada certa em uma linha.

Texto corrido, espaçado, calmo. Sem cabeçalho, sem numeração, sem markdown pesado, sem lista de bullets.` + IA_HONESTA;

export const analisar = createServerFn({ method: "POST" })
  .inputValidator((input: { tool: ToolSlug; content: string }) => {
    if (!input || typeof input.content !== "string") {
      throw new Error("Input inválido");
    }
    const trimmed = input.content.trim();
    if (trimmed.length < 3) throw new Error("Manda mais contexto.");
    if (trimmed.length > 6000) throw new Error("Texto muito longo.");
    if (!(input.tool in TOOLS)) throw new Error("Ferramenta inválida.");
    return { tool: input.tool, content: trimmed };
  })
  .handler(async ({ data }) => {
    const tool = TOOLS[data.tool];
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada.");
    }

    const systemPrompt = `${SYSTEM_BASE}\n\nCONTEXTO DA FERRAMENTA (${tool.title}): ${tool.systemHint}`;

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.content },
        ],
      }),
    });

    if (res.status === 429) {
      throw new Error("Muitas leituras de uma vez. Espera um pouco.");
    }
    if (res.status === 402) {
      throw new Error("Sem créditos de IA. Adicione créditos em Settings → Workspace → Usage.");
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("AI gateway error:", res.status, text);
      throw new Error("A IA não respondeu agora. Tenta de novo.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) throw new Error("Resposta vazia da IA.");

    return { reading: content };
  });
