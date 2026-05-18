export type ToolSlug =
  | "story-scan"
  | "chat-scan"
  | "perfil-scan"
  | "gerar-resposta"
  | "recuperar-controle"
  | "simulador";

export interface ToolDef {
  slug: ToolSlug;
  title: string;
  short: string;
  long: string;
  inputLabel: string;
  inputPlaceholder: string;
  cta: string;
  systemHint: string;
}

export const TOOLS: Record<ToolSlug, ToolDef> = {
  "story-scan": {
    slug: "story-scan",
    title: "Story Scan",
    short: "Sinais por trás de quem te assiste.",
    long: "Cole o nome, o contexto ou descreva quem anda visualizando seus stories.",
    inputLabel: "Conta o que tá rolando",
    inputPlaceholder: "Ex: o ex assiste todo story em 2 minutos mas nunca reage…",
    cta: "Ler intenção",
    systemHint: "Analise quem está observando os stories e a real motivação. Foque em: monitoramento, ciúme, validação, curiosidade fria.",
  },
  "chat-scan": {
    slug: "chat-scan",
    title: "Chat Scan",
    short: "O que não foi dito no print.",
    long: "Cole a conversa. Eu leio o subtexto, o ego, o timing e a real intenção.",
    inputLabel: "Cola a conversa",
    inputPlaceholder: "Ex:\nEla: oi sumido\nEu: opa, tudo?\nEla: nada não, só passando…",
    cta: "Decifrar conversa",
    systemHint: "Analise o subtexto da conversa: intenção real, jogos de poder, ego, timing, quem está em vantagem.",
  },
  "perfil-scan": {
    slug: "perfil-scan",
    title: "Perfil Scan",
    short: "Sinais de ego, branding e fome de validação.",
    long: "Cole bio, descreva fotos, conta o tipo de post. Eu te digo o que essa pessoa quer parecer.",
    inputLabel: "Descreve o perfil",
    inputPlaceholder: "Ex: bio com frase em inglês, só foto sozinha, sempre em viagem, legenda curta…",
    cta: "Ler o perfil",
    systemHint: "Leia o perfil como um observador frio: o que essa pessoa quer parecer, o ego em jogo, fome de validação, persona vs realidade.",
  },
  "gerar-resposta": {
    slug: "gerar-resposta",
    title: "Gerar Resposta",
    short: "Retoma o frame sem parecer que tá tentando.",
    long: "Cola o que mandaram e eu te devolvo uma resposta curta, calma e com peso social.",
    inputLabel: "O que mandaram pra você",
    inputPlaceholder: "Ex: 'sumido né, achei que tinha morrido kkk'",
    cta: "Gerar resposta",
    systemHint: "Gere 3 opções de resposta curtas, naturais, com peso social. Tom calmo, confiante, sem joguinho óbvio. Cada opção em uma linha numerada.",
  },
  "recuperar-controle": {
    slug: "recuperar-controle",
    title: "Recuperar Controle",
    short: "Quando você perdeu o frame, isso aqui te traz de volta.",
    long: "Descreve a situação. Eu te digo onde você cedeu e o que fazer agora.",
    inputLabel: "Conta a situação",
    inputPlaceholder: "Ex: mandei mensagem demais, ela parou de responder, agora tô ansioso…",
    cta: "Recuperar jogo",
    systemHint: "Aponte exatamente onde a pessoa perdeu o frame e dê 3 movimentos concretos para reverter. Sem coach, sem positividade tóxica. Direto.",
  },
  simulador: {
    slug: "simulador",
    title: "Simulador IA",
    short: "Testa a mensagem antes de enviar.",
    long: "Cola o que você quer mandar. Eu simulo como vai cair do outro lado.",
    inputLabel: "O que você quer mandar",
    inputPlaceholder: "Ex: 'oi, tava pensando em você, bora marcar algo?'",
    cta: "Simular reação",
    systemHint: "Simule como essa mensagem vai cair: percepção provável, nível de poder que você está cedendo, e se vale enviar. Curto e honesto.",
  },
};

export const TOOL_LIST = Object.values(TOOLS);
