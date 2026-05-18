import { createFileRoute, Link } from "@tanstack/react-router";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Central — ScanSocial" },
      { name: "description", content: "Sete ferramentas para decifrar conversas, perfis e stories." },
    ],
  }),
  component: Central,
});

function Card({
  slug, title, short, span, variant,
}: { slug: string; title: string; short: string; span?: string; variant?: "accent" }) {
  const base =
    "group relative p-6 md:p-8 rounded-3xl ring-1 transition-all duration-500 hover:-translate-y-0.5";
  const styles =
    variant === "accent"
      ? "bg-accent/5 ring-accent/15 hover:ring-accent/30"
      : "bg-card/50 ring-border hover:ring-accent/25";
  return (
    <Link
      to="/scan/$tool"
      params={{ tool: slug }}
      className={`${base} ${styles} ${span ?? ""}`}
    >
      <h2 className={`text-lg md:text-xl font-medium mb-2 ${variant === "accent" ? "text-accent" : "text-foreground"}`}>
        {title}
      </h2>
      <p className={`text-sm text-pretty max-w-[48ch] ${variant === "accent" ? "text-accent/70" : "text-muted-foreground"}`}>
        {short}
      </p>
      <span className="absolute bottom-6 right-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        →
      </span>
    </Link>
  );
}

function Central() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-20 pb-40">
      <header className="mb-14 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-4">
          Central IA
        </div>
        <h1 className="text-3xl md:text-5xl font-medium text-foreground tracking-tight text-balance leading-tight max-w-[22ch]">
          O que você quer decifrar hoje?
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <Link
          to="/foto-mensagem"
          className="group relative p-6 md:p-8 rounded-3xl ring-1 ring-accent/20 bg-gradient-to-br from-accent/10 to-transparent hover:ring-accent/40 transition-all md:col-span-2 min-h-[200px]"
        >
          <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-3">Novo</div>
          <h2 className="text-xl md:text-2xl font-medium text-foreground mb-2">Foto → Mensagem</h2>
          <p className="text-sm text-muted-foreground max-w-[48ch]">
            Manda a foto. Eu leio a vibe e te dou a mensagem perfeita pra puxar assunto.
          </p>
        </Link>

        <Link
          to="/foto-story"
          className="group relative p-6 md:p-8 rounded-3xl ring-1 bg-gradient-to-br from-violet/10 to-transparent hover:ring-violet/40 transition-all min-h-[200px]"
          style={{ ['--tw-ring-color' as string]: 'color-mix(in oklab, var(--violet) 20%, transparent)' }}
        >
          <div className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--violet)' }}>Novo</div>
          <h2 className="text-xl md:text-2xl font-medium text-foreground mb-2">Foto Story</h2>
          <p className="text-sm text-muted-foreground">
            Print do story → leitura, métricas e 7 respostas prontas.
          </p>
        </Link>

        <Card
          slug={TOOLS["story-scan"].slug}
          title={TOOLS["story-scan"].title}
          short={TOOLS["story-scan"].short}
          span="md:col-span-2 min-h-[160px]"
        />
        <Card
          slug={TOOLS["chat-scan"].slug}
          title={TOOLS["chat-scan"].title}
          short={TOOLS["chat-scan"].short}
          span="min-h-[160px]"
        />

        <Card slug={TOOLS["perfil-scan"].slug} title={TOOLS["perfil-scan"].title} short={TOOLS["perfil-scan"].short} />
        <Card slug={TOOLS["gerar-resposta"].slug} title={TOOLS["gerar-resposta"].title} short={TOOLS["gerar-resposta"].short} />
        <Card slug={TOOLS["simulador"].slug} title={TOOLS["simulador"].title} short={TOOLS["simulador"].short} />

        <div className="md:col-span-3 flex flex-col md:flex-row gap-4">
          <Card
            slug={TOOLS["recuperar-controle"].slug}
            title={TOOLS["recuperar-controle"].title}
            short={TOOLS["recuperar-controle"].short}
            span="flex-1"
          />
          <Link
            to="/historico"
            className="md:w-1/3 p-6 md:p-8 rounded-3xl bg-accent/5 ring-1 ring-accent/15 hover:ring-accent/30 transition-all"
          >
            <h2 className="text-lg md:text-xl font-medium text-accent mb-2">Histórico</h2>
            <p className="text-sm text-accent/70">Suas leituras anteriores.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
