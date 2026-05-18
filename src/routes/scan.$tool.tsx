import { createFileRoute, Link, notFound, useParams, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { analisar } from "@/lib/analise.functions";

export const Route = createFileRoute("/scan/$tool")({
  validateSearch: (search: Record<string, unknown>) => ({
    seed: typeof search.seed === "string" ? search.seed : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (!(params.tool in TOOLS)) throw notFound();
  },
  head: ({ params }) => {
    const t = TOOLS[params.tool as ToolSlug];
    return {
      meta: [
        { title: `${t?.title ?? "Scan"} — ScanSocial` },
        { name: "description", content: t?.short ?? "" },
      ],
    };
  },
  component: ScanPage,
});

type Entry = { line: string; explain?: string };

function parseReading(raw: string): Entry[] {
  // Split by blank lines into paragraphs. First paragraph = headline.
  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return [];
  const entries: Entry[] = [];
  // Headline = first block
  entries.push({ line: blocks[0] });
  // Pair remaining as observation+explain or just standalone short lines
  for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    // If block is a single short line, treat as observation headline
    if (b.length < 90 && !b.includes("\n")) {
      const next = blocks[i + 1];
      if (next && next.length > 60) {
        entries.push({ line: b, explain: next });
        i++;
      } else {
        entries.push({ line: b });
      }
    } else {
      entries.push({ line: b });
    }
  }
  return entries;
}

function saveToHistory(tool: ToolSlug, input: string, reading: string) {
  if (typeof window === "undefined") return;
  try {
    const key = "scansocial.history";
    const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
    const next = [
      { id: crypto.randomUUID(), tool, input, reading, at: Date.now() },
      ...prev,
    ].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function ScanPage() {
  const { tool } = useParams({ from: "/scan/$tool" });
  const { seed } = useSearch({ from: "/scan/$tool" });
  const toolDef = TOOLS[tool as ToolSlug];
  const analisarFn = useServerFn(analisar);
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: (text: string) => analisarFn({ data: { tool: tool as ToolSlug, content: text } }),
  });

  useEffect(() => {
    if (mutation.data?.reading) {
      saveToHistory(tool as ToolSlug, content, mutation.data.reading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutation.data?.reading]);

  // Reset on tool change; prefill from ?seed=
  useEffect(() => {
    setContent(seed ?? "");
    mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, seed]);

  const entries = mutation.data ? parseReading(mutation.data.reading) : [];

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Central
      </Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          {toolDef.title}
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[24ch]">
          {toolDef.long}
        </h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (content.trim().length < 3) return;
          mutation.mutate(content.trim());
        }}
        className="animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <label className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
          {toolDef.inputLabel}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={toolDef.inputPlaceholder}
          rows={8}
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-5 text-base text-foreground placeholder:text-muted-foreground/60 transition-all"
        />
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {content.length > 0 ? `${content.length} caracteres` : "Quanto mais contexto, mais afiada a leitura."}
          </span>
          <button
            type="submit"
            disabled={mutation.isPending || content.trim().length < 3}
            className="inline-flex items-center gap-2 bg-foreground text-background text-sm font-medium px-5 py-2.5 rounded-full hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? "Lendo…" : toolDef.cta}
            {!mutation.isPending && <span>→</span>}
          </button>
        </div>
      </form>

      {mutation.isError && (
        <div className="mt-10 p-5 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm text-destructive-foreground animate-fade-up">
          {(mutation.error as Error)?.message ?? "Algo deu errado."}
        </div>
      )}

      {mutation.data && (
        <section className="mt-16 border-t border-border pt-12 animate-fade-up">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border mb-8">
            Leitura
          </span>

          <div className="space-y-10">
            {entries.map((e, i) => (
              <div key={i} className="relative pl-8 border-l border-border">
                <div
                  className={
                    "absolute -left-[5px] top-2 size-2.5 rounded-full " +
                    (i === 0
                      ? "bg-accent shadow-[0_0_12px_var(--accent-glow)]"
                      : "bg-muted")
                  }
                />
                <p className={
                  "leading-tight tracking-tight font-medium text-foreground mb-3 " +
                  (i === 0 ? "text-2xl md:text-3xl text-balance" : "text-xl text-balance")
                }>
                  {e.line}
                </p>
                {e.explain && (
                  <p className="text-muted-foreground text-pretty leading-relaxed max-w-[58ch] whitespace-pre-wrap">
                    {e.explain}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <button
              onClick={() => mutation.mutate(content.trim())}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm text-foreground hover:bg-secondary/70 transition-colors"
            >
              Ler de novo
            </button>
            {tool !== "gerar-resposta" && (
              <Link
                to="/scan/$tool"
                params={{ tool: "gerar-resposta" }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Como responder? →
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
