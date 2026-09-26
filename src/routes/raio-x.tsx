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
  "achando detalhes reais…",
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
  const [idx, setIdx] = useState(0);

  const mutation = useMutation({ mutationFn: () => fn({ data: { bio, contexto, images } }), onSuccess: () => setIdx(0) });

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
    const arr = Array.from(files).slice(0, 6 - images.length);
    const urls = await Promise.all(arr.filter((f) => f.type.startsWith("image/")).map(fileToDataUrl));
    setImages((prev) => [...prev, ...urls].slice(0, 6));
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
          🔎 Raio-X de Perfil
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Leia o perfil. Entenda o contexto. Saiba como abordar.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Manda prints, fotos ou a bio. A IA usa só o que aparece de verdade.
        </p>
      </header>

      <div className="space-y-5 animate-fade-up">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Prints ou fotos do perfil (até 6)
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
            {images.length < 6 && (
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
          placeholder="Bio ou texto copiado do perfil (opcional)…"
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
          {mutation.isPending ? `IA ${phrase}` : "🔎 FAZER RAIO-X"}
        </button>
      </div>

      {mutation.isError && (
        <div className="mt-8 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      {result && (
        <section className="mt-12 space-y-8 animate-fade-up">
          {/* COMO ABORDAR */}
          <div className="rounded-3xl bg-gradient-to-br from-accent/10 to-violet/10 ring-1 ring-accent/40 p-6">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-3">🎯 Como abordar</div>
            <p className="text-xl md:text-2xl font-medium leading-snug text-balance mb-5">"{result.como_abordar[idx % result.como_abordar.length]}"</p>
            <div className="flex gap-2">
              <button
                onClick={() => copy(result.como_abordar[idx % result.como_abordar.length], "best")}
                className="text-xs px-4 py-2 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition"
              >{copied === "best" ? "Copiado ✓" : "📋 Copiar"}</button>
              <button
                onClick={() => setIdx((i) => i + 1)}
                className="text-xs px-4 py-2 rounded-full bg-secondary hover:bg-secondary/70 transition"
              >🔥 Outra</button>
            </div>
            {result.pouco_contexto && (
              <p className="text-xs text-muted-foreground mt-4">Pouco contexto no perfil — abordagem mais neutra.</p>
            )}
          </div>

          {/* PRIMEIRO CONTATO */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-3">✉️ Primeiro contato</div>
            <div className="space-y-2">
              {([["💬 Natural", result.primeiro_contato.natural], ["😏 Flertando", result.primeiro_contato.flertando], ["😂 Divertida", result.primeiro_contato.divertida]] as const).map(([k, t]) => (
                <div key={k} className="p-4 rounded-2xl bg-card/60 ring-1 ring-border flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{k}</div>
                    <p className="text-sm leading-relaxed">{t}</p>
                  </div>
                  <button onClick={() => copy(t, k)} className="text-[11px] text-muted-foreground hover:text-foreground shrink-0">
                    {copied === k ? "✓" : "copiar"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* LEITURA */}
          <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5 space-y-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent">👤 Perfil</div>
            <Chips label="Interesses" items={result.interesses} />
            <Chips label="Detalhes que rendem conversa" items={result.detalhes} />
          </div>

          <Block title="💬 Assuntos para puxar" items={result.assuntos} tone="violet" />

          <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">🧠 Contexto</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.contexto}</p>
          </div>

          <div className="rounded-3xl bg-card/60 ring-1 ring-accent/30 p-5">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">⚡ Melhor oportunidade</div>
            <p className="text-sm leading-relaxed">{result.melhor_oportunidade}</p>
          </div>

          <button
            onClick={() => { setIdx(0); mutation.mutate(); }}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >Novo raio-x</button>
        </section>
      )}
    </main>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 ring-1 ring-border">{it}</span>
        ))}
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

