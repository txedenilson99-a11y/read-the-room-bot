import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { analisarPsicologia, type PsicologiaResult } from "@/lib/psicologia.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/psicologia-proibida")({
  head: () =>
    seoHead({
      path: "/psicologia-proibida",
      title: "Psicologia Proibida — Leia as entrelinhas | ScanSocial",
      description:
        "Descreva a conversa ou mande prints. A IA separa sinais reais de interpretações possíveis, aponta contradições e sugere o próximo passo.",
    }),
  component: PsicologiaPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

const PESO: Record<string, { label: string; color: string }> = {
  fraca: { label: "Hipótese fraca", color: "var(--muted-foreground)" },
  moderada: { label: "Hipótese moderada", color: "var(--accent)" },
  forte: { label: "Hipótese forte", color: "var(--violet)" },
};

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-5 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
        <span className="text-[10px] uppercase tracking-[0.24em]" style={{ color }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PsicologiaPage() {
  const fn = useServerFn(analisarPsicologia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [contexto, setContexto] = useState("");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({ mutationFn: () => fn({ data: { contexto, images } }) });
  const result = mutation.data?.result as PsicologiaResult | undefined;

  const handleFiles = async (files: FileList) => {
    const arr: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      arr.push(await fileToDataUrl(f));
    }
    setImages((prev) => [...prev, ...arr].slice(0, 6));
    mutation.reset();
  };

  const copy = async () => {
    if (!result?.resposta_sugerida) return;
    await navigator.clipboard.writeText(result.resposta_sugerida);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const canSubmit = (contexto.trim().length > 0 || images.length > 0) && !mutation.isPending;

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
        <div className="absolute top-10 right-0 w-[320px] h-[320px] rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Central</Link>

      <header className="mt-6 mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--violet)", boxShadow: "0 0 12px var(--violet)" }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.32em]" style={{ color: "var(--violet)" }}>Acesso restrito</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[0.04em] leading-[1.05]">
          <span className="shimmer-text">PSICOLOGIA PROIBIDA</span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[52ch]">
          Leia as entrelinhas. Entenda o que pode estar por trás.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground/70 max-w-[52ch]">
          Sinais, não pensamentos. A IA não lê mentes nem dá diagnóstico — mostra o que dá e o que não dá pra concluir.
        </p>
      </header>

      <section className="space-y-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={5}
          placeholder="Conta a situação ou cola a conversa. Ex: ela diz que quer sair, mas sempre desmarca em cima da hora…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />

        {images.length === 0 ? (
          <button onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center hover:border-accent/40 hover:bg-card/60 transition">
            <div className="text-sm font-medium text-foreground">Anexar prints da conversa (opcional)</div>
            <div className="text-xs text-muted-foreground mt-1">Até 6 imagens</div>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-border bg-card/60">
                <img src={src} alt={`Print anexado ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-background/80 backdrop-blur text-xs ring-1 ring-border"
                  aria-label={`Remover imagem ${i + 1}`}>×</button>
              </div>
            ))}
            {images.length < 6 && (
              <button onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground transition">
                + foto
              </button>
            )}
          </div>
        )}

        <button onClick={() => mutation.mutate()} disabled={!canSubmit}
          className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition">
          {mutation.isPending ? "Lendo as entrelinhas…" : "🕯️ Analisar entrelinhas"}
        </button>

        {mutation.isError && (
          <div className="p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}
      </section>

      {result && (
        <section className="mt-12 space-y-5 animate-fade-up">
          <p className="text-base md:text-lg font-medium text-foreground leading-snug">{result.resumo}</p>

          <Section title="Sinais observáveis" color="var(--accent)">
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {result.sinais_observaveis.map((s, i) => <li key={i} className="flex gap-2"><span className="text-accent">›</span><span>{s}</span></li>)}
            </ul>
          </Section>

          <Section title="Interpretações possíveis" color="var(--violet)">
            <ul className="space-y-3">
              {result.interpretacoes.map((it, i) => {
                const p = PESO[it.peso] ?? PESO.moderada;
                return (
                  <li key={i} className="text-sm">
                    <div className="text-foreground/95">{it.leitura}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      <span style={{ color: p.color }}>{p.label}</span> · base: {it.base}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">São hipóteses, não fatos.</p>
          </Section>

          {result.contradicoes.length > 0 && (
            <Section title="Palavras × atitudes" color="var(--destructive)">
              <ul className="space-y-1.5 text-sm text-foreground/90">
                {result.contradicoes.map((s, i) => <li key={i}>⇄ {s}</li>)}
              </ul>
            </Section>
          )}

          <Section title="Ainda não dá pra concluir" color="var(--muted-foreground)">
            <ul className="space-y-1.5 text-sm text-foreground/80">
              {result.nao_da_pra_concluir.map((s, i) => <li key={i}>? {s}</li>)}
            </ul>
          </Section>

          <div className="card-premium p-5 md:p-6"
            style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--violet) 14%, transparent), color-mix(in oklab, var(--accent) 8%, transparent) 60%, transparent)" }}>
            <div className="text-[10px] uppercase tracking-[0.24em] mb-2" style={{ color: "var(--violet)" }}>Próximo passo</div>
            <p className="text-sm md:text-base text-foreground/90">{result.proximo_passo}</p>
            {result.resposta_sugerida && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-accent">Resposta sugerida</span>
                  <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition">
                    {copied ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>
                <p className="text-lg font-medium text-foreground leading-snug">"{result.resposta_sugerida}"</p>
              </div>
            )}
          </div>

          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition disabled:opacity-40">
            Analisar de novo
          </button>
        </section>
      )}
    </main>
  );
}
