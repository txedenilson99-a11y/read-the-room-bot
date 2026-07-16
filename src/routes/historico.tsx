import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/historico")({
  head: () =>
    seoHead({
      path: "/historico",
      title: "Histórico de leituras — ScanSocial",
      description:
        "Todas as suas leituras anteriores no ScanSocial em um só lugar: stories, prints, perfis e conversas analisadas pela IA.",
    }),
  component: HistoricoPage,
});

type Item = {
  id: string;
  tool: ToolSlug;
  input: string;
  reading: string;
  at: number;
};

const PLACEHOLDERS = [
  { tag: "Story analisado", text: "Pose pensativa, energia 'me notem sem reagir'.", ago: "há 2h", tone: "violet" as const },
  { tag: "Resposta criada", text: "Resposta seca pro 'sumido né' — sem parecer empolgado.", ago: "há 5h", tone: "accent" as const },
  { tag: "Perfil lido", text: "Bio motivacional + foto sozinha. Persona vs realidade.", ago: "ontem", tone: "accent" as const },
  { tag: "Match analisado", text: "Festeira ligada. 10 abridores prontos.", ago: "ontem", tone: "violet" as const },
  { tag: "Conversa decifrada", text: "Ela já decidiu. Você ainda tá tentando provar.", ago: "2 dias", tone: "accent" as const },
];

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)}min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)}h`;
  return `há ${Math.floor(s / 86400)}d`;
}

function HistoricoPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scansocial.history");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  const clear = () => {
    localStorage.removeItem("scansocial.history");
    setItems([]);
  };

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Voltar
      </Link>

      <header className="mt-6 mb-8 flex items-end justify-between gap-4 animate-fade-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 10px var(--accent)" }} />
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Memória da IA</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Suas leituras</h1>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
            Limpar tudo
          </button>
        )}
      </header>

      {/* real items */}
      {ready && items.length > 0 && (
        <ul className="space-y-3 mb-8">
          {items.map((item) => {
            const headline = item.reading.split(/\n\s*\n/)[0]?.trim().slice(0, 140) ?? "";
            return (
              <li key={item.id}>
                <Link
                  to="/scan/$tool"
                  params={{ tool: item.tool }}
                  className="block p-5 rounded-2xl bg-card/40 ring-1 ring-border hover:ring-accent/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-accent">
                      {TOOLS[item.tool]?.title ?? item.tool}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(item.at)}</span>
                  </div>
                  <p className="text-foreground font-medium leading-snug">{headline}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* placeholders premium */}
      <div className="space-y-3">
        {ready && items.length === 0 && (
          <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Exemplos do que aparece aqui</div>
        )}
        {PLACEHOLDERS.map((p, i) => (
          <div
            key={i}
            className="relative p-5 rounded-2xl bg-card/30 ring-1 ring-border overflow-hidden animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: p.tone === "violet" ? "var(--violet)" : "var(--accent)",
                    boxShadow: `0 0 10px ${p.tone === "violet" ? "var(--violet)" : "var(--accent)"}`,
                  }}
                />
                <span
                  className="text-[10px] font-medium uppercase tracking-widest"
                  style={{ color: p.tone === "violet" ? "var(--violet)" : "var(--accent)" }}
                >
                  {p.tag}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">{p.ago}</span>
            </div>
            <p className="text-foreground/85 leading-snug text-[15px]">{p.text}</p>
          </div>
        ))}
      </div>

      {ready && items.length === 0 && (
        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-accent hover:underline">
            Fazer primeira leitura →
          </Link>
        </div>
      )}
    </main>
  );
}
