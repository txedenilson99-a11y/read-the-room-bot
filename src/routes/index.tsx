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
  "O que vamos decifrar hoje?",
  "Qual foi a situação agora?",
  "Manda o print.",
  "A IA lê a vibe.",
  "Vamos analisar isso.",
  "Quem postou o story?",
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
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden p-5 md:p-6 rounded-3xl bg-card/40 ring-1 ring-border hover:ring-accent/40 transition-all duration-500 hover:-translate-y-0.5 ${span ?? ""}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mx,50%) var(--my,50%), ${isViolet ? "color-mix(in oklab, var(--violet) 18%, transparent)" : "color-mix(in oklab, var(--accent) 16%, transparent)"}, transparent 40%)`,
        }}
      />
      <div className="flex items-center gap-2 mb-3">
        <span
          className="size-1.5 rounded-full animate-pulse"
          style={{ background: isViolet ? "var(--violet)" : "var(--accent)", boxShadow: `0 0 12px ${isViolet ? "var(--violet)" : "var(--accent)"}` }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.22em]"
          style={{ color: isViolet ? "var(--violet)" : "var(--accent)" }}
        >
          {label}
        </span>
      </div>
      <h3 className="text-base md:text-lg font-medium text-foreground mb-1.5">{title}</h3>
      <p className="text-[13px] text-muted-foreground leading-snug">{sub}</p>
      <span className="absolute bottom-5 right-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
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
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex size-2">
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--accent)", opacity: 0.6 }} />
            <span className="relative rounded-full size-2" style={{ background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            IA social · online
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground leading-tight">
          {greeting()}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-2 text-base md:text-lg text-muted-foreground min-h-[1.6em]">
          <Typing text={VIBES[vibe]} />
        </p>
      </header>

      {/* hero card */}
      <Link
        to="/foto-mensagem"
        className="group relative block mt-8 md:mt-10 p-6 md:p-8 rounded-3xl overflow-hidden ring-1 ring-accent/25 hover:ring-accent/50 transition-all duration-500 animate-fade-up"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--accent) 14%, transparent), color-mix(in oklab, var(--violet) 12%, transparent) 60%, transparent)",
          animationDelay: "60ms",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="scan-line" />
        </div>
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 12px var(--accent)" }} />
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent">IA pronta</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight">
              Pronta pra analisar
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-[40ch]">
              stories · prints · conversas · perfis · mensagens
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="px-4 py-2 rounded-full bg-accent text-accent-foreground group-hover:shadow-[0_0_30px_var(--accent-glow)] transition-shadow">
                Analisar agora →
              </span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1.5 pt-1">
            {[0,1,2].map((i) => (
              <span key={i} className="flex gap-1">
                {[0,1,2].map((j) => (
                  <span key={j} className="size-1.5 rounded-full bg-accent/40 animate-pulse" style={{ animationDelay: `${(i*3+j)*120}ms` }} />
                ))}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* tools grid */}
      <section className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <ToolCard
          to="/foto-mensagem"
          label="Foto"
          title="Foto → Mensagem"
          sub="A IA lê a vibe da foto."
          span="col-span-2"
        />
        <ToolCard
          to="/foto-story"
          label="Story"
          title="Foto Story"
          sub="Leitura inteligente de story."
          tone="violet"
        />
        <ToolCard
          to="/responder-story"
          label="Reply"
          title="Responder Story"
          sub="Respostas naturais. Sem parecer empolgado."
          tone="violet"
          span="col-span-2"
        />
        <ToolCard
          to="/perfil-ig"
          label="Perfil"
          title="Análise de Perfil"
          sub="A vibe que seu perfil passa."
        />
        <ToolCard
          to="/primeiro-contato"
          label="Match"
          title="Primeiro Contato"
          sub="Puxa assunto sem parecer forçado."
        />
        <ToolCard
          to={`/scan/${TOOLS["chat-scan"].slug}`}
          label="Chat"
          title="Chat Scan"
          sub="O subtexto do print."
        />
        <ToolCard
          to={`/scan/${TOOLS["story-scan"].slug}`}
          label="Stalker"
          title="Story Scan"
          sub="Quem observa e por quê."
          tone="violet"
        />
        <ToolCard
          to={`/scan/${TOOLS["gerar-resposta"].slug}`}
          label="Reply"
          title="Gerar Resposta"
          sub="Retoma o frame sem esforço."
        />
        <ToolCard
          to={`/scan/${TOOLS["simulador"].slug}`}
          label="Sim"
          title="Simulador IA"
          sub="Testa antes de enviar."
        />
        <ToolCard
          to={`/scan/${TOOLS["recuperar-controle"].slug}`}
          label="Reset"
          title="Recuperar Controle"
          sub="Volta o jogo pro seu lado."
          tone="violet"
        />
        <ToolCard
          to="/memoria"
          label="Memória"
          title="Perfis & Memória"
          sub="A IA lembra cada pessoa."
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
