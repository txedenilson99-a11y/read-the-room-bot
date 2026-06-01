import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth, useProfile } from "@/lib/use-auth";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScanSocial — IA Social" },
      { name: "description", content: "IA social pra ler stories, prints, perfis e conversas." },
    ],
  }),
  component: Home,
});

const VIBES = [
  "Pronta pra ler sinais.",
  "Analisando padrões sociais.",
  "Detectando intenção por trás da mensagem.",
  "Interpretando a energia da conversa.",
  "Lendo o subtexto antes de você responder.",
  "Mapeando ego, biscoito e joguinho.",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function Typing({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => {
      setN((v) => (v >= text.length ? v : v + 1));
    }, 28);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, n)}
      <span className="inline-block w-[2px] h-[1em] align-[-2px] ml-0.5 bg-accent animate-pulse" />
    </span>
  );
}

function ToolCard({
  to, label, title, sub, tone = "accent", span,
}: {
  to: string; label: string; title: string; sub: string;
  tone?: "accent" | "violet"; span?: string;
}) {
  const isViolet = tone === "violet";
  const color = isViolet ? "var(--violet)" : "var(--accent)";
  return (
    <Link
      to={to}
      onMouseMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        (e.currentTarget as HTMLElement).style.setProperty("--mx", `${e.clientX - r.left}px`);
        (e.currentTarget as HTMLElement).style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`group relative overflow-hidden p-5 md:p-6 card-premium transition-transform duration-500 hover:scale-[1.015] active:scale-[0.99] ${span ?? ""}`}
    >
      {/* spotlight follows cursor */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(420px circle at var(--mx,50%) var(--my,50%), color-mix(in oklab, ${color} 22%, transparent), transparent 45%)`,
        }}
      />
      {/* corner glow */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"
        style={{ background: `radial-gradient(closest-side, ${color}, transparent 70%)` }}
      />
      <div className="relative flex items-center gap-2 mb-3">
        <span
          className="size-1.5 rounded-full animate-pulse"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.24em]"
          style={{ color }}
        >
          {label}
        </span>
      </div>
      <h3 className="relative text-base md:text-lg font-medium text-foreground mb-1.5 tracking-tight">{title}</h3>
      <p className="relative text-[13px] text-muted-foreground leading-snug">{sub}</p>
      <span className="absolute bottom-5 right-5 text-muted-foreground/70 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
        →
      </span>
    </Link>
  );
}

function Home() {
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const firstName = useMemo(() => {
    const n = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "";
    return n.split(" ")[0];
  }, [profile, user]);

  const [vibe, setVibe] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setVibe((v) => (v + 1) % VIBES.length), 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="relative max-w-5xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
        <div className="absolute top-10 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
      </div>

      {/* greeting */}
      <header className="animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span className="relative flex size-2">
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--accent)", opacity: 0.6 }} />
            <span className="relative rounded-full size-2" style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-foreground/80">
            IA · online
          </span>
          <span className="mx-1 size-0.5 rounded-full bg-muted-foreground/40" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            modo observador
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.05]">
          {greeting()}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-3 text-base md:text-lg text-muted-foreground min-h-[1.6em]">
          <Typing text={VIBES[vibe]} />
        </p>
      </header>

      {/* hero card */}
      <Link
        to="/foto-mensagem"
        className="group relative block mt-8 md:mt-10 p-6 md:p-8 rounded-3xl overflow-hidden card-premium animate-fade-up"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--accent) 16%, transparent), color-mix(in oklab, var(--violet) 14%, transparent) 60%, transparent)",
          animationDelay: "60ms",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="scan-line" />
        </div>
        {/* breathing glow */}
        <div className="pointer-events-none absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full blur-3xl glow-breath"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-32 -right-20 w-[360px] h-[360px] rounded-full blur-3xl glow-breath"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)", animationDelay: "1.6s" }} />

        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 12px var(--accent)" }} />
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent">IA pronta</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-medium tracking-tight">
              <span className="shimmer-text">Manda a situação.</span>
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-[44ch]">
              Foto, story, print, bio ou conversa. A IA devolve a leitura por trás do que ela quis dizer.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <span
                className="px-5 py-2.5 rounded-full bg-accent text-accent-foreground neon-pulse transition-shadow"
                style={{ boxShadow: "0 0 24px color-mix(in oklab, var(--accent) 35%, transparent)" }}
              >
                Analisar agora →
              </span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 pt-1">
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">processando</div>
            <div className="flex items-center">
              <span className="ai-dot" /><span className="ai-dot" /><span className="ai-dot" />
            </div>
          </div>
        </div>
      </Link>

      {/* tools grid */}
      <section className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <ToolCard
          to="/foto-mensagem"
          label="Foto"
          title="Foto → Mensagem"
          sub="A IA lê a vibe da foto antes de criar a resposta."
          span="col-span-2"
        />
        <ToolCard
          to="/foto-story"
          label="Story"
          title="Foto do Story"
          sub="Detecta o que ela tava tentando dizer sem dizer."
          tone="violet"
        />
        <ToolCard
          to="/responder-story"
          label="Reply"
          title="Responder Story"
          sub="Resposta que parece de gente real. Sem energia de fã."
          tone="violet"
          span="col-span-2"
        />
        <ToolCard
          to="/primeiro-contato"
          label="Match"
          title="Primeiro Contato"
          sub="Manda o perfil. A IA lê personalidade, sinais de interesse e te dá várias formas de puxar assunto."
          tone="violet"
          span="col-span-2"
        />
        <ToolCard
          to="/perfil-ig"
          label="Perfil"
          title="Análise de Perfil"
          sub="A vibe que seu perfil passa de verdade."
        />
        <ToolCard
          to={`/scan/${TOOLS["chat-scan"].slug}`}
          label="Chat"
          title="Chat Scan"
          sub="A IA interpreta clima, tensão e interesse."
        />
        <ToolCard
          to={`/scan/${TOOLS["story-scan"].slug}`}
          label="Stalker"
          title="Story Scan"
          sub="Quem busca atenção, validação ou conexão."
          tone="violet"
        />
        <ToolCard
          to={`/scan/${TOOLS["gerar-resposta"].slug}`}
          label="Reply"
          title="Gerar Resposta"
          sub="Retoma o frame sem entregar o jogo."
        />
        <ToolCard
          to={`/scan/${TOOLS["simulador"].slug}`}
          label="Sim"
          title="Simulador IA"
          sub="Testa a resposta antes de enviar de verdade."
        />
        <ToolCard
          to={`/scan/${TOOLS["recuperar-controle"].slug}`}
          label="Reset"
          title="Recuperar Controle"
          sub="Volta o jogo pro seu lado sem drama."
          tone="violet"
        />
        <ToolCard
          to="/cantadas"
          label="Conversa"
          title="Cantadas em Etapas"
          sub="A IA monta a conversa inteira, etapa por etapa."
          span="col-span-2"
        />

        <ToolCard
          to="/memoria"
          label="Memória"
          title="Perfis & Memória"
          sub="A IA lembra a vibe, o humor e o histórico de cada pessoa."
          tone="violet"
          span="col-span-2"
        />

      </section>



      {/* footer quick links */}
      <div className="mt-8 flex gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <Link to="/historico" className="flex-1 p-4 rounded-2xl bg-card/30 ring-1 ring-border hover:ring-accent/30 transition text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Histórico</div>
          <div className="text-sm font-medium text-foreground mt-1">Suas leituras</div>
        </Link>
        <Link to="/perfil" className="flex-1 p-4 rounded-2xl bg-card/30 ring-1 ring-border hover:ring-accent/30 transition text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Você</div>
          <div className="text-sm font-medium text-foreground mt-1">Perfil</div>
        </Link>
      </div>
    </main>
  );
}
