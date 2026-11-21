// Validação determinística das mensagens do "Gerar plano de atração".
// Pura (sem IA) para poder ser testada.

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Clichês e exageros proibidos (comparação sem acento, por palavra/trecho).
const CLICHES = [
  "iconic",
  "surreal",
  "incrivel",
  "energia",
  "classico",
  "classica",
  "vibe",
  "vale a subida",
  "merece a visita",
  "visual renova",
  "paraiso",
  "recarregar",
  "espetacular",
  "maravilhos",
  "de tirar o folego",
  "sensacional",
  "lugar perfeito",
  "cartao postal",
  "absurd",
];

// Suposições sem base visível: lugar, fama, trajeto, clima, experiência.
const SUPOSICOES = [
  "trilha",
  "subida",
  "subir",
  "la de cima",
  "vista de cima",
  "la em cima",
  "mirante",
  "tempo ta",
  "o tempo",
  "clima",
  "dia bom",
  "dia de sol",
  "sol ",
  "chuva",
  "frio",
  "calor",
  "famos",
  "conhecid",
  "turistic",
  "turista",
  "ponto turistico",
  "dizem que",
  "falam que",
  "deve ser",
  "ja fui",
  "faz tempo que",
  "por essas bandas",
  "passeio",
  "viagem",
  "viajar",
  "barulho",
  "agua gelada",
  "de perto",
  "pegou um dia",
];

// Palavras comuns que podem abrir frase com maiúscula sem serem nome próprio.
const INICIOS_OK = new Set(
  (
    "onde que qual quais quem como quando esse essa esses essas isso este esta aqui ai la lugar " +
    "foto voce tu eu e a o os as um uma nossa nossa poxa caramba kkk kkkk haha olha so tambem " +
    "mas entao bora tipo sera ficou cachoeira paisagem me ta tá sextou boa bom nao sim de da do " +
    "pra pro com sem se ja agora hoje fala opa oi eita vixe"
  ).split(/\s+/),
);

const PAISAGEM_RE =
  /cachoeir|paisage|queda d|cascata|praia|montanh|serra|mata|floresta|natureza|rio |lago|por do sol|mar /;

export function ehPaisagem(...textos: (string | undefined)[]) {
  return PAISAGEM_RE.test(norm(textos.filter(Boolean).join(" ")));
}

/** Nomes próprios (palavras capitalizadas) que não aparecem no contexto do usuário. */
export function nomesInventados(texto: string, contexto: string): string[] {
  const ctx = norm(contexto);
  const out: string[] = [];
  const frases = texto.split(/(?<=[.!?…])\s+|\n+/);
  for (const frase of frases) {
    const tokens = frase.match(/[A-Za-zÀ-ÿ]+/g) ?? [];
    tokens.forEach((tok, i) => {
      if (!/^[A-ZÀ-Ý]/.test(tok) || tok.length < 3) return;
      const n = norm(tok);
      if (i === 0 && INICIOS_OK.has(n)) return;
      if (n === "gta" || n === "vice" || n === "city") {
        if (ctx.includes(n)) return;
      }
      if (!ctx.includes(n)) out.push(tok);
    });
  }
  return out;
}

/** Retorna o motivo da reprovação, ou null se aprovada. */
export function motivoReprovacao(
  texto: string,
  contexto: string,
  paisagem: boolean,
): string | null {
  const t = ` ${norm(texto)} `;
  const ctx = norm(contexto);
  const c = CLICHES.find((x) => t.includes(x) && !ctx.includes(x));
  if (c) return `clichê "${c}"`;
  const s = SUPOSICOES.find((x) => t.includes(x) && !ctx.includes(x.trim()));
  if (s) return `suposição sem base "${s.trim()}"`;
  const nomes = nomesInventados(texto, contexto);
  if (nomes.length) return `nome próprio não informado "${nomes[0]}"`;
  if (paisagem && (texto.match(/\?/g) ?? []).length > 1) return "mais de uma pergunta";
  if (texto.split(/\s+/).length > 18) return "longa demais";
  return null;
}

export const DIAGNOSTICO_PAISAGEM =
  "É uma foto de uma cachoeira/paisagem. A imagem não permite concluir onde fica nem a intenção de quem postou.";

type Msg = { tom: string; texto: string; por_que: string };

/** Filtra mensagens; em paisagem, no máximo 1 pergunta e 1 observação. */
export function filtrarMensagens(msgs: Msg[], contexto: string, paisagem: boolean) {
  const aprovadas: Msg[] = [];
  const reprovadas: { texto: string; motivo: string }[] = [];
  const vistos = new Set<string>();
  let perguntas = 0;
  let observacoes = 0;
  for (const m of msgs ?? []) {
    const motivo = motivoReprovacao(m.texto ?? "", contexto, paisagem);
    if (motivo) {
      reprovadas.push({ texto: m.texto, motivo });
      continue;
    }
    const chave = norm(m.texto)
      .replace(/[^a-z ]/g, "")
      .trim();
    if (vistos.has(chave)) continue;
    if (paisagem) {
      const pergunta = m.texto.includes("?");
      if (pergunta ? perguntas >= 1 : observacoes >= 1) continue;
      if (pergunta) perguntas++;
      else observacoes++;
    }
    vistos.add(chave);
    aprovadas.push(m);
  }
  return { aprovadas, reprovadas };
}

/** Diagnóstico não pode afirmar fama, viagem ou intenção. */
export function diagnosticoRuim(diag: string, contexto: string) {
  const t = norm(diag);
  if (/viage|romant|interess|quer |deseja|abertura para|convite|iniciar conversa/.test(t))
    return true;
  return !!motivoReprovacao(diag.replace(/\?/g, ""), contexto, false)?.match(/clich|suposi|nome/);
}
