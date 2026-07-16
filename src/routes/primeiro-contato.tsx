import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { gerarPrimeiroContato, type PrimeiroContatoResult } from "@/lib/primeiro-contato.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/primeiro-contato")({
  head: () =>
    seoHead({
      path: "/primeiro-contato",
      title: "Primeiro Contato — Abridores de IA para Tinder e direct | ScanSocial",
      description:
        "Match no Tinder, Badoo ou direct do Instagram? A IA lê o perfil e entrega 10 abridores prontos, naturais e sem cara de copy-paste.",
    }),
  component: PrimeiroContatoPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

const LOADING_PHRASES = [
  "lendo a vibe…",
  "captando o ego…",
  "decifrando a bio…",
  "medindo a competição…",
  "calibrando o tom certo…",
  "escrevendo do jeito que ela responde…",
];

function PrimeiroContatoPage() {
  const fn = useServerFn(gerarPrimeiroContato);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [contexto, setContexto] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [phrase, setPhrase] = useState(LOADING_PHRASES[0]);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { bio, contexto, images } }),
  });

  useEffect(() => {
    if (!mutation.isPending) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      setPhrase(LOADING_PHRASES[i]);
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

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const result = mutation.data?.result;
  const canGenerate = images.length > 0 || bio.trim().length > 5 || contexto.trim().length > 5;

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-violet mb-3">
          Primeiro Contato
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[24ch]">
          Manda o perfil. Eu leio personalidade, sinais e te dou várias formas de puxar assunto.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Tinder, Badoo, Bumble ou direct. Fotos + bio → persona, painel de interesse e 10 abridores prontos.
        </p>
      </header>

      <div className="space-y-5 animate-fade-up">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Fotos do perfil (até 6)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-border bg-card/60">
                <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur px-2 py-0.5 rounded-full text-[10px] ring-1 ring-border"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-2xl border border-dashed border-border bg-card/40 hover:border-violet/40 hover:bg-card/60 transition text-xs text-muted-foreground"
              >
                + foto
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Cola a bio dela aqui (opcional)…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-violet/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={2}
          placeholder="Contexto opcional: app, idade, o que chamou atenção…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-violet/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canGenerate}
          className="w-full bg-gradient-to-r from-violet to-accent text-background font-medium px-5 py-3.5 rounded-full disabled:opacity-40 transition relative overflow-hidden"
        >
          {mutation.isPending ? `IA ${phrase}` : "GERAR ABRIDORES"}
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
              <Tag label="Abordagem" value={result.abordagem} tone="accent" />
            </div>
          </div>

          <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5 md:p-6">
            <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-5">
              Painel IA
            </div>
            <div className="space-y-4">
              <Bar label="Interesse provável" value={result.painel.interesse} />
              <Bar label="Ego dela" value={result.painel.ego} />
              <Bar label="Chance de resposta" value={result.painel.chance_resposta} />
              <Bar label="Nível de competição" value={result.painel.competicao} danger />
              <Bar label="Risco de ignorar" value={result.painel.risco_ignorar} danger />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <Info label="Energia" text={result.painel.energia} />
              <Info label="Melhor horário" text={result.painel.melhor_horario} />
              <Info label="Estilo ideal" text={result.painel.estilo_ideal} />
            </div>
          </div>

          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-4">
              Abridores prontos
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.abridores.map((a, i) => (
                <div key={i} className="p-5 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-violet/30 transition">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">{a.tipo}</div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">{a.texto}</p>
                  <button
                    onClick={() => copy(a.texto, i)}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {copied === i ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => mutation.mutate()}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Regenerar
          </button>
        </section>
      )}
    </main>
  );
}

function Tag({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs ring-1 ${tone === "accent" ? "bg-accent/10 ring-accent/30 text-accent" : "bg-card/60 ring-border text-foreground"}`}>
      <span className="text-muted-foreground mr-1.5">{label}:</span>
      {value}
    </span>
  );
}

function Bar({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{v}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${v}%`,
            background: danger
              ? "linear-gradient(90deg, var(--destructive), oklch(0.75 0.18 25))"
              : "linear-gradient(90deg, var(--violet), var(--accent))",
            boxShadow: danger
              ? "0 0 12px color-mix(in oklab, var(--destructive) 50%, transparent)"
              : "0 0 12px color-mix(in oklab, var(--violet) 50%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

function Info({ label, text }: { label: string; text: string }) {
  return (
    <div className="p-4 rounded-2xl ring-1 ring-border bg-background/40">
      <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-1.5">{label}</div>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
