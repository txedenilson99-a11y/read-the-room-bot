import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { raioXPerfil, type EstiloAbridor, type RaioXResult } from "@/lib/raio-x.functions";

export const Route = createFileRoute("/raio-x")({
  head: () => ({
    meta: [
      { title: "Raio-X de Perfil — ScanSocial" },
      { name: "description", content: "Analise fotos e bio. A IA gera 10 abridores únicos pro perfil." },
    ],
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
  "captando a vibe…",
  "achando detalhes que ninguém vê…",
  "montando abridores únicos…",
  "calibrando o tom…",
];

const ESTILO_META: Record<EstiloAbridor, { label: string; icon: string }> = {
  natural: { label: "Natural", icon: "😎" },
  engracado: { label: "Engraçado", icon: "😂" },
  flertando: { label: "Flertando", icon: "😏" },
  inteligente: { label: "Inteligente", icon: "🧠" },
  direto: { label: "Direto", icon: "🎯" },
  diferente: { label: "Diferente", icon: "🌙" },
};

function RaioXPage() {
  const fn = useServerFn(raioXPerfil);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [contexto, setContexto] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [filter, setFilter] = useState<EstiloAbridor | "todos">("todos");
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

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const result: RaioXResult | undefined = mutation.data?.result;
  const canGenerate = images.length > 0 || bio.trim().length > 3 || contexto.trim().length > 3;

  const filtered = result?.abridores.filter((a) => filter === "todos" || a.estilo === filter) ?? [];

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Raio-X de Perfil
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Manda as fotos e a bio. A IA acha assuntos que passam despercebidos.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Instagram, Tinder, Badoo, Bumble, Facebook Namoro. 10 abridores únicos, continuação pra cada um, e o que evitar.
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
          <div className="border-t border-border pt-8">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border mb-4">
              Leitura
            </span>
            <p className="text-xl md:text-2xl font-medium text-balance leading-snug">{result.leitura}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Tag label="Persona" value={result.persona} />
              <Tag label="Melhor abordagem" value={result.melhor_abordagem} tone="accent" />
            </div>
          </div>

          <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5">
            <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-3">Chance de resposta</div>
            <Bar value={result.chance_resposta} />
          </div>

          <Block title="📸 Sobre as fotos" items={result.fotos_observacoes} />
          {result.bio_observacoes.length > 0 && <Block title="📝 Sobre a bio" items={result.bio_observacoes} />}
          <Block title="🔥 Pontos de interesse" items={result.pontos_interesse} tone="violet" />
          <Block title="😎 Observações inteligentes" items={result.observacoes_inteligentes} />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-medium uppercase tracking-widest text-accent">
                💬 Abridores únicos
              </div>
              <div className="text-xs text-muted-foreground">{filtered.length} de {result.abridores.length}</div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <FilterChip active={filter === "todos"} onClick={() => setFilter("todos")} label="Todos" />
              {(Object.keys(ESTILO_META) as EstiloAbridor[]).map((k) => (
                <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)} label={`${ESTILO_META[k].icon} ${ESTILO_META[k].label}`} />
              ))}
            </div>
            <div className="space-y-3">
              {filtered.map((a, i) => {
                const idx = result.abridores.indexOf(a);
                const meta = ESTILO_META[a.estilo];
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-accent/30 transition">
                    <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">
                      {meta.icon} {meta.label}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-3">{a.texto}</p>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">se ela responder</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 italic">"{a.continuacao}"</p>
                    <button
                      onClick={() => copy(a.texto, idx)}
                      className="text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      {copied === idx ? "Copiado ✓" : "Copiar abridor"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <Block title="⚠️ Evitar" items={result.evitar} tone="danger" />

          <button
            onClick={() => mutation.mutate()}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Gerar novos
          </button>
        </section>
      )}
    </main>
  );
}

function Tag({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs ring-1 ${tone === "accent" ? "bg-accent/10 ring-accent/30 text-accent" : "bg-card/60 ring-border text-foreground"}`}>
      <span className="text-muted-foreground mr-1.5">{label}:</span>{value}
    </span>
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

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs transition ring-1 ${active ? "bg-accent text-accent-foreground ring-accent" : "bg-card/40 text-muted-foreground ring-border hover:text-foreground"}`}
    >
      {label}
    </button>
  );
}
