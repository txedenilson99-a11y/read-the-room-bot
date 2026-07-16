import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { raioXPerfil, type RaioXResult } from "@/lib/raio-x.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/raio-x")({
  head: () =>
    seoHead({
      path: "/raio-x",
      title: "Raio-X de Perfil — Análise IA de Instagram e apps | ScanSocial",
      description:
        "Manda as fotos e a bio. A IA do ScanSocial detecta o tipo de perfil, acha fatos reais e gera abridores naturais que passam despercebidos.",
    }),
  component: RaioXPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("erro ao ler imagem"));
    r.readAsDataURL(file);
  });
}

const LOADING = [
  "lendo as fotos…",
  "detectando o tipo de perfil…",
  "achando assuntos reais…",
  "montando abridores naturais…",
  "calibrando o tom…",
];

function RaioXPage() {
  const fn = useServerFn(raioXPerfil);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [contexto, setContexto] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [phrase, setPhrase] = useState(LOADING[0]);

  const mutation = useMutation({ mutationFn: () => fn({ data: { bio, contexto, images } }) });

  useEffect(() => {
    if (!mutation.isPending) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % LOADING.length;
      setPhrase(LOADING[i]);
    }, 1400);
    return () => clearInterval(id);
  }, [mutation.isPending]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 8 - images.length);
    const urls = await Promise.all(arr.filter((f) => f.type.startsWith("image/")).map(fileToDataUrl));
    setImages((prev) => [...prev, ...urls].slice(0, 8));
    mutation.reset();
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const result: RaioXResult | undefined = mutation.data?.result;
  const canGenerate = images.length > 0 || bio.trim().length > 3 || contexto.trim().length > 3;

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Raio-X de Perfil v5.20
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Manda as fotos e a bio. A IA acha assuntos reais.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Sem cantadas prontas. Sem psicologia inventada. Sem resposta robótica.
        </p>
      </header>

      <div className="space-y-5 animate-fade-up">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Fotos do perfil (até 8)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-border bg-card/60">
                <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur px-2 py-0.5 rounded-full text-[10px] ring-1 ring-border"
                >×</button>
              </div>
            ))}
            {images.length < 8 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-2xl border border-dashed border-border bg-card/40 hover:border-accent/40 transition text-xs text-muted-foreground"
              >+ foto</button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        <textarea
          value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
          placeholder="Bio do perfil (opcional)…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />
        <textarea
          value={contexto} onChange={(e) => setContexto(e.target.value)} rows={2}
          placeholder="Contexto: app, idade, situação, o que chamou atenção…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canGenerate}
          className="w-full bg-gradient-to-r from-accent to-violet text-background font-medium px-5 py-3.5 rounded-full disabled:opacity-40 transition"
        >
          {mutation.isPending ? `IA ${phrase}` : "🔍 ANALISAR PERFIL"}
        </button>
      </div>

      {mutation.isError && (
        <div className="mt-8 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      {result && (
        <section className="mt-12 space-y-10 animate-fade-up">
          {/* TIPO PRINCIPAL */}
          <div className="rounded-3xl bg-gradient-to-br from-accent/10 to-violet/10 ring-1 ring-accent/30 p-6">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">🧬 Tipo detectado</div>
            <div className="flex items-baseline gap-3 mb-4">
              <div className="text-3xl font-medium tracking-tight">Perfil {result.tipo_perfil.principal}</div>
              <div className="text-xs text-muted-foreground">confiança {Math.round(result.tipo_perfil.confianca)}%</div>
            </div>
            <ul className="space-y-1.5">
              {result.tipo_perfil.motivos.map((m, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {m}</li>
              ))}
            </ul>
          </div>

          {/* MELHOR ABRIDOR */}
          <div className="rounded-3xl bg-card/80 ring-1 ring-accent/40 p-6">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-3">🏆 Melhor abridor</div>
            <p className="text-xl md:text-2xl font-medium leading-snug text-balance mb-4">"{result.melhor_abridor}"</p>
            <button
              onClick={() => copy(result.melhor_abridor, "best")}
              className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition"
            >
              {copied === "best" ? "Copiado ✓" : "Copiar"}
            </button>
          </div>

          {/* FATOS */}
          <Block title="👁️ Fatos observados" items={result.fatos_observados} />

          {/* ASSUNTOS */}
          <Block title="🔥 Assuntos encontrados" items={result.assuntos_encontrados} tone="violet" />

          {/* 10 ABRIDORES */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-4">💬 10 abridores naturais</div>
            <div className="space-y-2">
              {result.abridores.map((a, i) => (
                <div key={i} className="p-4 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-accent/30 transition flex items-start gap-3">
                  <div className="text-xs text-muted-foreground mt-0.5 w-5 shrink-0">{i + 1}.</div>
                  <p className="text-sm leading-relaxed flex-1">{a}</p>
                  <button
                    onClick={() => copy(a, `a${i}`)}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition shrink-0"
                  >
                    {copied === `a${i}` ? "✓" : "copiar"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* EVITAR */}
          <Block title="🚫 O que evitar" items={result.evitar} tone="danger" />

          {/* CHANCE DE RESPOSTA */}
          <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-3">📈 Chance de resposta</div>
            <Bar value={result.chance_resposta.valor} />
            <ul className="mt-4 space-y-1">
              {result.chance_resposta.motivos.map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {m}</li>
              ))}
            </ul>
          </div>

          {/* CONFIANÇA DA LEITURA */}
          <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-4">🎯 Confiança da leitura</div>
            <div className="space-y-3">
              <MiniBar label="Fatos observados" value={result.confianca_leitura.fatos_observados} />
              <MiniBar label="Interesses" value={result.confianca_leitura.interesses} />
              <MiniBar label="Personalidade" value={result.confianca_leitura.personalidade} />
              <MiniBar label="Objetivo no app" value={result.confianca_leitura.objetivo_no_app} />
            </div>
          </div>

          {/* O QUE A IA NÃO SABE */}
          <div className="rounded-3xl bg-muted/30 ring-1 ring-border p-5">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">🤔 O que a IA não sabe</div>
            <ul className="space-y-1.5">
              {result.nao_sabe.map((m, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {m}</li>
              ))}
            </ul>
          </div>

          {/* RESUMO FINAL */}
          <div className="rounded-3xl bg-gradient-to-br from-card to-card/40 ring-1 ring-border p-6">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-4">📋 Resumo final</div>
            <dl className="space-y-3 text-sm">
              <Row k="Tipo de perfil" v={result.resumo.tipo_perfil} />
              <Row k="Assunto mais forte" v={result.resumo.assunto_mais_forte} />
              <Row k="Melhor estratégia" v={result.resumo.melhor_estrategia} />
              <Row k="Risco" v={result.resumo.risco} />
              <Row k="Objetivo" v={result.resumo.objetivo} />
            </dl>
          </div>

          <button
            onClick={() => mutation.mutate()}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Gerar novo raio-x
          </button>
        </section>
      )}
    </main>
  );
}

function Bar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">Probabilidade</span>
        <span className="font-medium text-foreground">{v}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{
          width: `${v}%`,
          background: "linear-gradient(90deg, var(--violet), var(--accent))",
          boxShadow: "0 0 12px color-mix(in oklab, var(--accent) 50%, transparent)",
        }} />
      </div>
    </div>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{v}%</span>
      </div>
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Block({ title, items, tone }: { title: string; items: string[]; tone?: "violet" | "danger" }) {
  const color = tone === "violet" ? "text-violet" : tone === "danger" ? "text-destructive" : "text-accent";
  return (
    <div>
      <div className={`text-[10px] font-medium uppercase tracking-widest mb-3 ${color}`}>{title}</div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="p-4 rounded-2xl bg-card/40 ring-1 ring-border text-sm leading-relaxed">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <dt className="text-xs uppercase tracking-widest text-muted-foreground sm:w-40 shrink-0">{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}
