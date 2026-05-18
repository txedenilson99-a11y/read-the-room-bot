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
        <Card
          slug={TOOLS["story-scan"].slug}
          title={TOOLS["story-scan"].title}
          short={TOOLS["story-scan"].short}
          span="md:col-span-2 md:row-span-1 min-h-[200px]"
        />
        <Card
          slug={TOOLS["chat-scan"].slug}
          title={TOOLS["chat-scan"].title}
          short={TOOLS["chat-scan"].short}
          span="min-h-[200px]"
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

      <section className="mt-24 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-medium tracking-tight">Cenários reais</h2>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Toca pra ler</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCENARIOS.map((s) => (
            <Link
              key={s.title}
              to="/scan/$tool"
              params={{ tool: s.tool }}
              search={{ seed: s.seed }}
              className="group p-5 rounded-2xl bg-card/40 ring-1 ring-border hover:ring-accent/30 transition-all"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
                {TOOLS[s.tool].title}
              </div>
              <p className="text-foreground text-base leading-snug whitespace-pre-line text-pretty">
                {s.preview}
              </p>
              <span className="mt-4 inline-block text-xs text-muted-foreground group-hover:text-accent transition-colors">
                Ler intenção →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

const SCENARIOS: { tool: "story-scan" | "chat-scan" | "perfil-scan"; preview: string; seed: string; title: string }[] = [
  {
    tool: "story-scan",
    title: "A que vê tudo",
    preview: "Ela vê tudo.\nMas nunca reage.\nPosta indireta.\nSome. Depois volta.",
    seed: "Ela vê todos os meus stories em minutos, mas nunca reage. Posta indireta logo depois. Some por dias e depois aparece de novo, vendo tudo.",
  },
  {
    tool: "chat-scan",
    title: "Responde seco, some, volta",
    preview: "Responde seco.\nSome do nada.\nVolta puxando assunto.",
    seed: "Ela responde seco, frase curta, sem perguntar nada de volta. Some do nada por um, dois dias. Depois volta puxando assunto como se nada tivesse acontecido.",
  },
  {
    tool: "perfil-scan",
    title: "“Vivendo sem pressa”",
    preview: "@usuario\n“vivendo sem pressa”\nSó foto sozinha, viagem, café.",
    seed: "Perfil @usuario. Bio: “vivendo sem pressa”. Só foto sozinha, viagens, café, pôr do sol. Legendas curtas em minúsculo. Nunca mostra ninguém junto.",
  },
  {
    tool: "chat-scan",
    title: "Perdeu o ritmo",
    preview: "Ela sumiu.\nResponde diferente.\nPerdeu o ritmo.",
    seed: "Ela sumiu uns dias. Voltou respondendo diferente, mais curto, sem emoji. A conversa perdeu o ritmo que tinha antes.",
  },
];
