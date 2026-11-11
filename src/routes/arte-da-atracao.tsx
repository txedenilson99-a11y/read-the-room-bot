import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { gerarArteAtracao, SITUACOES, type Situacao, type ArteResult } from "@/lib/arte-atracao.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/arte-da-atracao")({
  head: () =>
    seoHead({
      path: "/arte-da-atracao",
      title: "Arte da Atração — Psicologia Proibida | ScanSocial",
      description:
        "Confiança pra puxar conversa, mostrar interesse e criar conexão recíproca. Mensagens naturais, sinais de reciprocidade e exercícios práticos.",
    }),
  component: ArtePage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

const EMOJI: Record<Situacao, string> = { primeira: "👋", iniciada: "💬", story: "📸", esfriando: "🧊" };
const ABERTURA = {
  baixo: { label: "Abertura baixa", color: "var(--destructive)" },
  incerto: { label: "Abertura incerta", color: "var(--accent)" },
  bom: { label: "Abertura boa", color: "var(--violet)" },
};

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 transition">
      {ok ? "Copiado ✓" : "📋 Copiar"}
    </button>
  );
}

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

function ArtePage() {
  const fn = useServerFn(gerarArteAtracao);
  const inputRef = useRef<HTMLInputElement>(null);
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [contexto, setContexto] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [feitos, setFeitos] = useState<Record<number, boolean>>({});

  const mutation = useMutation({
    mutationFn: () => fn({ data: { situacao: situacao!, contexto, images } }),
    onSuccess: () => setFeitos({}),
  });
  const result = mutation.data?.result as ArteResult | undefined;

  const handleFiles = async (files: FileList) => {
    const arr: string[] = [];
    for (const f of Array.from(files)) if (f.type.startsWith("image/")) arr.push(await fileToDataUrl(f));
    setImages((p) => [...p, ...arr].slice(0, 6));
  };

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
      </div>

      <Link to="/psicologia-proibida" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Psicologia Proibida</Link>

      <header className="mt-6 mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--violet)", boxShadow: "0 0 12px var(--violet)" }} />
          <span className="text-[10px] font-medium uppercase tracking-[0.32em]" style={{ color: "var(--violet)" }}>Módulo · Psicologia Proibida</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[0.04em] leading-[1.05]">
          <span className="shimmer-text">ARTE DA ATRAÇÃO</span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[52ch]">
          Confiança pra puxar assunto, mostrar interesse e criar química de verdade — dos dois lados.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground/70 max-w-[52ch]">
          Sem manipulação e sem fórmula mágica. Ninguém controla o que o outro sente — a ideia é você se mostrar melhor e respeitar a resposta.
        </p>
      </header>

      <section className="space-y-4 animate-fade-up">
        <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">1. Qual é a situação?</div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SITUACOES) as Situacao[]).map((k) => (
            <button key={k} onClick={() => { setSituacao(k); mutation.reset(); }}
              className={`rounded-2xl p-4 text-left text-sm ring-1 transition ${situacao === k ? "ring-accent/60 bg-card" : "ring-border bg-card/40 hover:bg-card/60"}`}>
              <div className="text-lg">{EMOJI[k]}</div>
              <div className="mt-1 font-medium text-foreground leading-tight">{SITUACOES[k]}</div>
            </button>
          ))}
        </div>

        <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground pt-2">2. Conta um pouco (opcional)</div>
        <textarea value={contexto} onChange={(e) => setContexto(e.target.value)} rows={4}
          placeholder="Ex: conheci ela na academia, a gente só se cumprimenta. Quero puxar assunto sem parecer estranho…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60" />

        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
        {images.length === 0 ? (
          <button onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center hover:border-accent/40 transition">
            <div className="text-sm font-medium text-foreground">Anexar prints (opcional)</div>
            <div className="text-xs text-muted-foreground mt-1">Até 6 imagens</div>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-border">
                <img src={src} alt={`Print anexado ${i + 1}`} className="w-full h-full object-cover" />
                <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))} aria-label={`Remover imagem ${i + 1}`}
                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-background/80 text-xs ring-1 ring-border">×</button>
              </div>
            ))}
            {images.length < 6 && (
              <button onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-border text-xs text-muted-foreground">+ foto</button>
            )}
          </div>
        )}

        <button onClick={() => mutation.mutate()} disabled={!situacao || mutation.isPending}
          className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition">
          {mutation.isPending ? "Montando seu plano…" : "💜 Gerar plano de atração"}
        </button>
        {mutation.isError && (
          <div className="p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">{(mutation.error as Error).message}</div>
        )}
      </section>

      {result && (
        <section className="mt-12 space-y-5 animate-fade-up">
          <Section title="Diagnóstico" color="var(--violet)">
            <p className="text-sm md:text-base text-foreground/90">{result.diagnostico}</p>
            <p className="mt-2 text-[11px]" style={{ color: (ABERTURA[result.nivel_abertura] ?? ABERTURA.incerto).color }}>
              {(ABERTURA[result.nivel_abertura] ?? ABERTURA.incerto).label} · leitura dos sinais, não certeza
            </p>
          </Section>

          <Section title="Mensagens pra mandar" color="var(--accent)">
            <ul className="space-y-4">
              {result.mensagens.map((m, i) => (
                <li key={i} className={i === 0 ? "pb-4 border-b border-border" : ""}>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    {i === 0 ? "🏆 Melhor · " : ""}{m.tom}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <p className={`${i === 0 ? "text-lg" : "text-sm"} font-medium text-foreground leading-snug`}>"{m.texto}"</p>
                    <CopyBtn text={m.texto} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Por que pode funcionar: {m.por_que}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Reciprocidade e limites" color="var(--destructive)">
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {result.reciprocidade.map((s, i) => <li key={i} className="flex gap-2"><span>⚖️</span><span>{s}</span></li>)}
            </ul>
          </Section>

          <Section title="Exercícios de confiança" color="var(--violet)">
            <ul className="space-y-3">
              {result.exercicios.map((e, i) => (
                <li key={i}>
                  <label className="flex gap-3 items-start cursor-pointer">
                    <input type="checkbox" checked={!!feitos[i]} onChange={() => setFeitos((f) => ({ ...f, [i]: !f[i] }))}
                      className="mt-1 accent-[var(--violet)]" />
                    <span className={feitos[i] ? "opacity-50 line-through" : ""}>
                      <span className="block text-sm font-medium text-foreground">{e.titulo}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{e.como}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Section>

          <p className="text-sm text-muted-foreground italic">💜 {result.lembrete}</p>

          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition disabled:opacity-40">
            Gerar de novo
          </button>
        </section>
      )}
    </main>
  );
}
