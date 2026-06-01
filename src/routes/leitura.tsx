import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { lerComportamento, type LeituraResult } from "@/lib/leitura.functions";

export const Route = createFileRoute("/leitura")({
  head: () => ({
    meta: [
      { title: "Leitura Comportamental IA — ScanSocial" },
      {
        name: "description",
        content:
          "A IA lê o contexto de fotos, stories e prints de forma madura e respeitosa. Mostra vibe, intenção possível e se vale responder.",
      },
    ],
  }),
  component: LeituraPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

function Meter({ label, value, tone = "accent" }: { label: string; value: number; tone?: "accent" | "violet" | "destructive" }) {
  const color =
    tone === "violet" ? "var(--violet)" : tone === "destructive" ? "var(--destructive)" : "var(--accent)";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span className="uppercase tracking-[0.18em]">{label}</span>
        <span className="font-medium text-foreground tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-card/80 ring-1 ring-border overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
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

function Chip({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "violet" | "destructive" }) {
  const color = tone === "violet" ? "var(--violet)" : tone === "destructive" ? "var(--destructive)" : "var(--accent)";
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[12px] font-medium"
      style={{ color, boxShadow: `0 0 18px color-mix(in oklab, ${color} 18%, transparent)` }}
    >
      <span className="size-1.5 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      {children}
    </span>
  );
}

const VALE_LABEL: Record<LeituraResult["vale_responder"], string> = {
  sim: "Vale responder",
  talvez: "Talvez valha",
  "melhor-esperar": "Melhor esperar",
  "nao-necessario": "Não precisa responder",
};

function LeituraPage() {
  const fn = useServerFn(lerComportamento);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [contexto, setContexto] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { contexto, images } }),
  });
  const result = mutation.data?.result as LeituraResult | undefined;

  const handleFiles = async (files: FileList) => {
    const arr: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      arr.push(await fileToDataUrl(f));
    }
    setImages((prev) => [...prev, ...arr].slice(0, 6));
    mutation.reset();
  };

  const copyFrase = async () => {
    if (!result?.frase_pronta) return;
    await navigator.clipboard.writeText(result.frase_pronta);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const canSubmit = (contexto.trim().length > 0 || images.length > 0) && !mutation.isPending;

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
        <div className="absolute top-4 right-0 w-[360px] h-[360px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Central</Link>

      <header className="mt-6 mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 12px var(--accent)" }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-accent">Leitura comportamental</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.05]">
          <span className="shimmer-text">Entende o contexto</span>
          <br />sem dramatizar.
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[52ch]">
          Leitura madura e leve. Mostra a vibe provável, intenção possível e se vale responder.
          Sem ataque, sem julgar a pessoa, sem fingir certeza.
        </p>
      </header>

      <section className="space-y-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={5}
          placeholder="Descreve a situação: o que ela postou, o que rolou, o que tá em dúvida. Ou só manda o print abaixo."
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
            <div className="text-sm font-medium text-foreground">Anexar print, story ou foto (opcional)</div>
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
          {mutation.isPending ? "IA lendo o contexto…" : "🧠 Ler contexto"}
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
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <Chip>Vibe · {result.vibe}</Chip>
              <Chip tone="violet">{VALE_LABEL[result.vale_responder]}</Chip>
            </div>
            <h2 className="text-xl md:text-2xl font-medium tracking-tight leading-snug mt-3">{result.titulo}</h2>
            <p className="mt-3 text-sm md:text-base text-foreground/85 leading-relaxed whitespace-pre-line">
              {result.descricao}
            </p>
            <p className="mt-3 text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
              {result.leitura}
            </p>
            <p className="mt-3 text-xs text-muted-foreground italic">{result.porque_vale}</p>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 10px var(--accent)" }} />
              <span className="text-[10px] uppercase tracking-[0.22em] text-accent">Medidores</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Meter label="Interesse real" value={result.medidores.interesse_real} />
              <Meter label="Abertura pra conversa" value={result.medidores.abertura_conversa} />
              <Meter label="Risco de parecer forçado" value={result.medidores.risco_forcado} tone="destructive" />
              <Meter label="Melhor timing" value={result.medidores.timing} tone="violet" />
              <Meter label="Chance de resposta" value={result.medidores.chance_resposta} />
            </div>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3">Intenção possível</div>
            <ul className="space-y-2">
              {result.intencao_possivel.map((t, i) => (
                <li key={i} className="text-sm text-foreground/90 flex gap-2">
                  <span className="text-accent mt-1">›</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">São hipóteses, não certezas.</p>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--violet)" }}>
              Abre espaço para
            </div>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {result.abre_espaco_para.map((s, i) => <li key={i}>+ {s}</li>)}
            </ul>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--destructive)" }}>
              O que evitar
            </div>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {result.evitar.map((s, i) => <li key={i}>✕ {s}</li>)}
            </ul>
          </div>

          <div className="card-premium p-5 md:p-6">
            <Chip tone="violet">Abordagem ideal</Chip>
            <p className="mt-3 text-base md:text-lg font-medium text-foreground leading-snug">
              {result.abordagem_ideal}
            </p>
          </div>

          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3">Próximos passos</div>
            <ol className="space-y-2">
              {result.proximos_passos.map((s, i) => (
                <li key={i} className="text-sm text-foreground/90 flex gap-3">
                  <span className="size-5 rounded-full bg-accent/15 text-accent text-[11px] font-medium grid place-items-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card-premium p-5 md:p-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--accent) 12%, transparent), color-mix(in oklab, var(--violet) 10%, transparent) 60%, transparent)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <Chip>Mensagem que combina agora</Chip>
              <button
                onClick={copyFrase}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                {copied ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <p className="text-lg md:text-xl font-medium text-foreground leading-snug">"{result.frase_pronta}"</p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Reler
          </button>
        </section>
      )}
    </main>
  );
}
