import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/novidades")({
  head: () => ({
    meta: [
      { title: "Novidades v5.20 — ScanSocial" },
      { name: "description", content: "O que mudou na versão 5.20: IA Honesta, leitura de contexto melhorada e mais." },
      { property: "og:title", content: "ScanSocial v5.20 — IA Honesta" },
      { property: "og:description", content: "Observe. Entenda. Responda. A maior atualização até agora." },
    ],
  }),
  component: NovidadesPage,
});

function Section({
  badge, title, children, tone = "accent",
}: { badge: string; title: string; children: React.ReactNode; tone?: "accent" | "violet" }) {
  const color = tone === "violet" ? "var(--violet)" : "var(--accent)";
  return (
    <section className="card-premium p-5 md:p-6 animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="size-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.24em]"
          style={{ color }}
        >
          {badge}
        </span>
      </div>
      <h2 className="text-lg md:text-xl font-medium tracking-tight mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
        {children}
      </div>
    </section>
  );
}

function Bullet({ ok = true, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className={ok ? "text-accent" : "text-destructive"}>{ok ? "✓" : "✗"}</span>
      <span>{children}</span>
    </div>
  );
}

function NovidadesPage() {
  return (
    <main className="relative max-w-2xl mx-auto px-5 md:px-6 pt-10 pb-40">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span className="size-2 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 12px var(--accent)" }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-foreground/80">
            Versão 5.20
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.05]">
          🚀 A maior <span className="shimmer-text">atualização</span> até agora.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Observe. Entenda. Responda.
        </p>
      </header>

      <div className="space-y-4">
        <Section badge="Inteligência" title="🧠 IA mais inteligente">
          <p>Agora a IA entende melhor antes de gerar qualquer resposta:</p>
          <Bullet>Fotos</Bullet>
          <Bullet>Stories</Bullet>
          <Bullet>Conversas</Bullet>
          <Bullet>Bios</Bullet>
          <Bullet>Perfis</Bullet>
        </Section>

        <Section badge="Motor" title="⚡ Novo motor de leitura" tone="violet">
          <p>Menos respostas genéricas. Mais foco em:</p>
          <Bullet>Contexto real</Bullet>
          <Bullet>Conversa real</Bullet>
          <Bullet>Comportamento real</Bullet>
          <Bullet>Linguagem natural</Bullet>
        </Section>

        <Section badge="Melhorias" title="🔥 O que ficou melhor">
          <Bullet>Raio-X de Perfil melhorado</Bullet>
          <Bullet>Foto → Mensagem melhorado</Bullet>
          <Bullet>Chat Scan mais preciso</Bullet>
          <Bullet>Story Scan mais preciso</Bullet>
          <Bullet>Flow mais natural</Bullet>
          <Bullet>Primeiro Contato atualizado</Bullet>
          <Bullet>Perfis & Memória mais inteligente</Bullet>
          <Bullet>Simulador IA melhorado</Bullet>
        </Section>

        <Section badge="Honestidade" title="🛡️ IA Honesta" tone="violet">
          <p>A IA não inventa interesse. Ela não afirma sem evidências reais:</p>
          <Bullet ok={false}>"Ela gosta de você"</Bullet>
          <Bullet ok={false}>"Ela está apaixonada"</Bullet>
          <Bullet ok={false}>"Ela quer você"</Bullet>
          <p className="pt-2">Em vez disso, usa linguagem real: "pode ser que", "parece", "abre espaço pra", "não dá pra cravar".</p>
        </Section>

        <Section badge="Experiência" title="✨ Nova experiência">
          <p>Visual mais premium.</p>
          <Bullet>Glow Neon</Bullet>
          <Bullet>Animações suaves</Bullet>
          <Bullet>Mais velocidade</Bullet>
          <Bullet>Melhor desempenho</Bullet>
          <Bullet>Menos erros</Bullet>
        </Section>

        <div className="text-center pt-6 pb-2 animate-fade-up">
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground mb-1">
            Versão 5.20
          </div>
          <div className="text-sm text-foreground/80">OBSERVE · ENTENDA · RESPONDA</div>
        </div>

        <Link
          to="/"
          className="block text-center w-full bg-foreground text-background font-medium px-5 py-3 rounded-full transition hover:opacity-90"
        >
          Voltar pra central
        </Link>
      </div>
    </main>
  );
}
