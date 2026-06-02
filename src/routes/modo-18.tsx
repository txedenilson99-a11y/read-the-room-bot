import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { gerarModo18, type Modo18Result, type Modo18Estilo } from "@/lib/modo18.functions";

export const Route = createFileRoute("/modo-18")({
  head: () => ({
    meta: [
      { title: "Modo 18+ — ScanSocial" },
      { name: "description", content: "Flerte intenso, provocação e química. Mensagens mais ousadas e confiantes, sem cair em cantada pronta." },
    ],
  }),
  component: Modo18Page,
});

const ESTILOS: { id: Modo18Estilo; emoji: string; label: string; sub: string }[] = [
  { id: "provocador", emoji: "😏", label: "Provocador", sub: "Cria curiosidade e tensão." },
  { id: "atrevido", emoji: "🔥", label: "Atrevido", sub: "Confiança e atitude." },
  { id: "madrugada", emoji: "🌙", label: "Madrugada", sub: "Clima íntimo e envolvente." },
  { id: "duplo_sentido", emoji: "😉", label: "Duplo Sentido", sub: "Brincadeira inteligente e leve." },
  { id: "quimica", emoji: "💜", label: "Química", sub: "Conexão e atração natural." },
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

function Modo18Page() {
  const fn = useServerFn(gerarModo18);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [contexto, setContexto] = useState("");
  const [estilo, setEstilo] = useState<Modo18Estilo>("provocador");
  const [copied, setCopied] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { contexto, estilo, images } }),
  });
  const result = mutation.data?.result as Modo18Result | undefined;

  const handleFiles = async (files: FileList) => {
    const arr: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      arr.push(await fileToDataUrl(f));
    }
    setImages((prev) => [...prev, ...arr].slice(0, 6));
    mutation.reset();
  };

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const canSubmit = (contexto.trim().length > 0 || images.length > 0) && !mutation.isPending;

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--destructive), transparent 70%)" }} />
        <div className="absolute top-4 right-0 w-[360px] h-[360px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Central</Link>

      <header className="mt-6 mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--destructive)", boxShadow: "0 0 12px var(--destructive)" }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.28em]" style={{ color: "var(--destructive)" }}>🔥 Modo 18+</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.05]">
          <span className="shimmer-text">Flerte intenso,</span>
          <br />provocação e química.
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[52ch]">
          Respostas mais ousadas, confiantes e provocativas. Sem cantada pronta, sem vulgaridade, sem cair em carência.
        </p>
        <p className="mt-4 text-[13px] italic text-foreground/70 border-l-2 border-accent/40 pl-3">
          "Atração não é sobre insistir. É sobre criar conexão."
        </p>
      </header>

      <section className="space-y-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">Estilo</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ESTILOS.map((m) => {
              const active = estilo === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setEstilo(m.id)}
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
          placeholder="Cola a conversa, descreve o contexto, ou só anexa o print abaixo."
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
            <div className="text-sm font-medium text-foreground">Anexar print (opcional)</div>
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
          {mutation.isPending ? "IA lendo o clima…" : "🔥 Gerar Modo 18+"}
        </button>

        {mutation.isError && (
          <div className="p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}
      </section>

      {result && (
        <section className="mt-12 space-y-8 animate-fade-up">
          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3">Leitura</div>
            <p className="text-base md:text-lg text-foreground/90 leading-snug mb-5">{result.leitura}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Meter label="Química" value={result.quimica} tone="violet" />
              <Meter label="Tensão" value={result.tensao} tone="destructive" />
              <Meter label="Abertura" value={result.abertura} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.mensagens.map((m, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-accent/30 transition">
                <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">{m.tipo}</div>
                <p className="text-sm text-foreground leading-relaxed mb-4">{m.texto}</p>
                <button
                  onClick={() => copy(m.texto, i)}
                  className="text-xs text-muted-foreground hover:text-foreground transition"
                >
                  {copied === i ? "Copiado ✓" : "Copiar"}
                </button>
              </div>
            ))}
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-2">Por que funciona</div>
            <p className="text-sm text-foreground/90">{result.porque_funciona}</p>
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
            <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--violet)" }}>Próximo passo</div>
            <p className="text-sm text-foreground/90">{result.proximo_passo}</p>
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
