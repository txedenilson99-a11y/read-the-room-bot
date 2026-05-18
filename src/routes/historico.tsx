import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TOOLS, type ToolSlug } from "@/lib/tools";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — ScanSocial" },
      { name: "description", content: "Suas leituras anteriores." },
    ],
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
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Central
      </Link>

      <header className="mt-8 mb-12 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">Histórico</div>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Suas últimas leituras</h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpar tudo
          </button>
        )}
      </header>

      {ready && items.length === 0 && (
        <div className="p-10 rounded-3xl bg-card/40 ring-1 ring-border text-center">
          <p className="text-muted-foreground">Nada por aqui ainda.</p>
          <Link to="/" className="inline-block mt-4 text-sm text-accent hover:underline">
            Fazer primeira leitura →
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((item) => {
          const headline = item.reading.split(/\n\s*\n/)[0]?.trim().slice(0, 140) ?? "";
          const date = new Date(item.at);
          return (
            <li key={item.id}>
              <Link
                to="/scan/$tool"
                params={{ tool: item.tool }}
                className="block p-5 rounded-2xl bg-card/40 ring-1 ring-border hover:ring-accent/25 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-accent">
                    {TOOLS[item.tool]?.title ?? item.tool}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-foreground font-medium leading-snug text-balance">
                  {headline}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
