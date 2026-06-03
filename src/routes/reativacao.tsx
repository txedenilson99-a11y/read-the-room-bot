import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { reativarContato, type ReativacaoResult, type ReativacaoEstrategia } from "@/lib/reativacao.functions";

export const Route = createFileRoute("/reativacao")({
  head: () => ({
    meta: [
      { title: "Reativação — ScanSocial" },
      { name: "description", content: "Volte a conversar sem parecer que você sumiu esperando uma resposta." },
    ],
  }),
  component: ReativacaoPage,
});

const ESTRATEGIAS: { id: ReativacaoEstrategia; emoji: string; label: string; sub: string }[] = [
  { id: "curiosidade", emoji: "🧠", label: "Curiosidade", sub: "Abre um loop." },
  { id: "provocacao", emoji: "😏", label: "Provocação", sub: "Alfinetada leve." },
  { id: "humor", emoji: "😂", label: "Humor", sub: "Observação engraçada." },
  { id: "direto", emoji: "🎯", label: "Direto", sub: "Sem rodeio." },
  { id: "suave", emoji: "🌙", label: "Reentrada Suave", sub: "Calma, sem peso." },
  { id: "story", emoji: "📱", label: "Reação em Story", sub: "Volta pelo lado dela." },
];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

function Meter({ label, value, tone = "accent" }: { label: string; value: number; tone?: "accent" | "violet" | "destructive" }) {
  const color = tone === "violet" ? "var(--violet)" : tone === "destructive" ? "var(--destructive)" : "var(--accent)";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span className="uppercase tracking-[0.18em]">{label}</span>
        <span className="font-medium text-foreground tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-card/80 ring-1 ring-border overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(2, Math.min(100, value))}%`,
            background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 55%, transparent))`,
            boxShadow: `0 0 18px color-mix(in oklab, ${color} 45%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

function Chip({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "violet" }) {
  const color = tone === "violet" ? "var(--violet)" : "var(--accent)";
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[12px] font-medium"
      style={{ color, boxShadow: `0 0 18px color-mix(in oklab, ${color} 18%, transparent)` }}>
      <span className="size-1.5 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      {children}
    </span>
  );
}

function CopyableMsg({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-card/50 ring-1 ring-border p-3">
      <div className="flex-1">
        {label && <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">{label}</div>}
        <p className="text-sm text-foreground/90">{text}</p>
      </div>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="text-[11px] text-muted-foreground hover:text-foreground transition shrink-0"
      >
        {copied ? "✓" : "copiar"}
      </button>
    </div>
  );
}

function ReativacaoPage() {
  const fn = useServerFn(reativarContato);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [contexto, setContexto] = useState("");
  const [estrategia, setEstrategia] = useState<ReativacaoEstrategia>("curiosidade");
  const [copiedMain, setCopiedMain] = useState(false);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { contexto, estrategia, images } }),
  });
  const result = mutation.data?.result as ReativacaoResult | undefined;

  const handleFiles = async (files: FileList) => {
    const arr: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      arr.push(await fileToDataUrl(f));
    }
    setImages((prev) => [...prev, ...arr].slice(0, 6));
    mutation.reset();
  };

  const copyMain = async () => {
    if (!result?.mensagem_principal) return;
    await navigator.clipboard.writeText(result.mensagem_principal);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 1500);
  };

  const canSubmit = (contexto.trim().length > 0 || images.length > 0) && !mutation.isPending;

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
        <div className="absolute top-4 right-0 w-[360px] h-[360px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Central</Link>

      <header className="mt-6 mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--violet)", boxShadow: "0 0 12px var(--violet)" }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.28em]" style={{ color: "var(--violet)" }}>
            Reativação · aguardando input social
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.05]">
          <span className="shimmer-text">Volte a conversar</span>
          <br />sem parecer que sumiu esperando.
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[54ch]">
          Faz tempo que a conversa morreu? Cola o print, a última mensagem ou descreve o contexto. A IA cria uma reentrada natural — sem carência, sem cobrança, sem drama.
        </p>
      </header>

      <section className="space-y-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">Estratégia</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ESTRATEGIAS.map((m) => {
              const active = estrategia === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setEstrategia(m.id)}
                  className={`p-3 rounded-xl ring-1 transition text-left ${
                    active ? "bg-accent/10 ring-accent/50" : "bg-card/40 ring-border hover:ring-accent/30"
                  }`}
                >
                  <div className="text-base leading-none mb-1">{m.emoji}</div>
                  <div className="text-[12px] font-medium text-foreground">{m.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{m.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={5}
          placeholder="Cola a última conversa, descreve há quanto tempo parou, o que ela tem postado no story… ou só anexa o print abaixo."
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {images.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center hover:border-accent/40 hover:bg-card/60 transition"
          >
            <div className="text-sm font-medium text-foreground">Anexar print da conversa morta (opcional)</div>
            <div className="text-xs text-muted-foreground mt-1">Até 6 imagens</div>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-border bg-card/60">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-background/80 backdrop-blur text-xs ring-1 ring-border"
                  aria-label="Remover"
                >×</button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground transition"
              >
                + foto
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
        >
          {mutation.isPending ? "IA lendo a conversa morta…" : "⚡ Reativar contato"}
        </button>

        <p className="text-[11px] text-center text-muted-foreground italic">
          Transforme silêncio em conversa novamente.
        </p>

        {mutation.isError && (
          <div className="p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}
      </section>

      {result && (
        <section className="mt-12 space-y-8 animate-fade-up">
          <div className="card-premium p-5 md:p-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--violet) 14%, transparent), color-mix(in oklab, var(--accent) 10%, transparent) 60%, transparent)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <Chip tone="violet">⚡ Mensagem de reativação</Chip>
              <button onClick={copyMain} className="text-xs text-muted-foreground hover:text-foreground transition">
                {copiedMain ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <p className="text-lg md:text-xl font-medium text-foreground leading-snug">"{result.mensagem_principal}"</p>
            <p className="mt-3 text-xs text-muted-foreground italic">{result.porque_funciona}</p>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--violet)", boxShadow: "0 0 10px var(--violet)" }} />
              <span className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--violet)" }}>Leitura da conversa morta</span>
            </div>
            <p className="text-sm text-foreground/85 mb-4">{result.leitura}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-card/50 ring-1 ring-border p-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Tempo sem contato</div>
                <p className="text-sm text-foreground/90">{result.tempo_sem_contato}</p>
              </div>
              <div className="rounded-xl bg-card/50 ring-1 ring-border p-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Como terminou</div>
                <p className="text-sm text-foreground/90">{result.como_terminou}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Meter label="Abertura dela" value={result.nivel_abertura} tone="violet" />
              <Meter label="Chance de resposta" value={result.chance_resposta} />
              <Meter label="Risco de silêncio" value={result.risco_silencio} tone="destructive" />
            </div>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-2">🎯 Melhor abordagem</div>
            <p className="text-sm text-foreground/90">{result.melhor_abordagem}</p>
          </div>

          <div className="card-premium p-5 md:p-6">
            <Chip>🔁 Alternativas</Chip>
            <div className="mt-4 space-y-2">
              {result.alternativas.map((a, i) => (
                <CopyableMsg key={i} label={a.estilo} text={a.texto} />
              ))}
            </div>
          </div>

          <div className="card-premium p-5 md:p-6">
            <Chip tone="violet">💬 Se ela responder curto</Chip>
            <div className="mt-4 space-y-2">
              <CopyableMsg label="kkk" text={result.se_ela_responder_curto.kkk} />
              <CopyableMsg label="sim" text={result.se_ela_responder_curto.sim} />
              <CopyableMsg label="emoji" text={result.se_ela_responder_curto.emoji} />
            </div>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--destructive)" }}>
              ⚠️ O que evitar
            </div>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {result.evitar.map((s, i) => <li key={i}>✕ {s}</li>)}
            </ul>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-2">📅 Plano B</div>
            <p className="text-sm text-foreground/90">{result.plano_b}</p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Gerar novamente
          </button>
        </section>
      )}
    </main>
  );
}
