import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { analisarFoto, type StoryResult } from "@/lib/foto.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/foto-story")({
  head: () =>
    seoHead({
      path: "/foto-story",
      title: "Foto do Story — Leitura por IA | ScanSocial",
      description:
        "Manda o print do story: a IA decifra a intenção, o clima e te entrega a melhor resposta para reagir sem parecer óbvio.",
    }),
  component: FotoStoryPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não consegui ler a imagem."));
    reader.readAsDataURL(file);
  });
}

const METRIC_LABELS: { key: keyof StoryResult["metricas"]; label: string }[] = [
  { key: "clima", label: "Clima da conversa" },
  { key: "abertura", label: "Abertura pra responder" },
  { key: "interesse", label: "Nível de interesse" },
  { key: "energia", label: "Energia do story" },
  { key: "chance_papo", label: "Chance dela continuar o papo" },
];

function FotoStoryPage() {
  const fn = useServerFn(analisarFoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (imageDataUrl: string) =>
      fn({ data: { mode: "story", imageDataUrl, extra } }),
  });

  const result = mutation.data?.result as StoryResult | undefined;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = await fileToDataUrl(file);
    setPreview(url);
    mutation.reset();
  };

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-violet mb-3">
          Foto Story
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Manda o print do story. Eu leio e te dou a resposta certa.
        </h1>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center hover:border-violet/40 hover:bg-card/60 transition-all animate-fade-up"
        >
          <div className="text-base font-medium text-foreground mb-1">Enviar Story</div>
          <div className="text-sm text-muted-foreground">Toca aqui pra subir o print</div>
        </button>
      ) : (
        <div className="space-y-5 animate-fade-up">
          <div className="relative rounded-3xl overflow-hidden ring-1 ring-border bg-card/60">
            <img src={preview} alt="preview" className="w-full max-h-[60vh] object-contain" />
            {mutation.isPending && (
              <>
                <div className="scan-line pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet/5 to-transparent pointer-events-none" />
              </>
            )}
            <button
              onClick={() => { setPreview(null); mutation.reset(); }}
              className="absolute top-3 right-3 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs ring-1 ring-border"
            >
              Trocar
            </button>
          </div>

          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={2}
            placeholder="Contexto opcional: quem postou, o que rolou antes…"
            className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-violet/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
          />

          <button
            onClick={() => preview && mutation.mutate(preview)}
            disabled={mutation.isPending}
            className="w-full bg-gradient-to-r from-violet to-accent text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
          >
            {mutation.isPending ? "IA analisando o story…" : "Decifrar Story"}
          </button>
        </div>
      )}

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Insight label="Estratégia" text={result.estrategia} />
            <Insight label="Timing" text={result.timing} />
            <Insight label="Evitar" text={result.evitar} tone="danger" />
          </div>

          <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5 md:p-6">
            <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-5">
              Painel de análise
            </div>
            <div className="space-y-4">
              {METRIC_LABELS.map(({ key, label }) => {
                const value = Math.max(0, Math.min(100, Math.round(result.metricas[key] ?? 0)));
                const danger = false;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${value}%`,
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
              })}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-4">
              Respostas prontas
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.respostas.map((r, i) => (
                <div key={i} className="p-5 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-violet/30 transition">
                  <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">
                    {r.modo}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">{r.texto}</p>
                  <button
                    onClick={() => copy(r.texto, i)}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {copied === i ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => preview && mutation.mutate(preview)}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Regenerar
          </button>
        </section>
      )}
    </main>
  );
}

function Insight({ label, text, tone }: { label: string; text: string; tone?: "danger" }) {
  return (
    <div className={`p-4 rounded-2xl ring-1 ${tone === "danger" ? "bg-destructive/5 ring-destructive/20" : "bg-card/60 ring-border"}`}>
      <div className={`text-[10px] font-medium uppercase tracking-widest mb-2 ${tone === "danger" ? "text-destructive" : "text-accent"}`}>
        {label}
      </div>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
