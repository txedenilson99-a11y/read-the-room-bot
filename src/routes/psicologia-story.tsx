import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { analisarPsicologiaStory } from "@/lib/psicologia-story.functions";
import { STORY_MAX_BYTES, validateStoryInput } from "@/lib/psicologia-story.validation";
import { Button } from "@/components/ui/button";
import { Copy, Check, X, RefreshCw, ImagePlus } from "lucide-react";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/psicologia-story")({
  head: () =>
    seoHead({
      path: "/psicologia-story",
      title: "Psicologia Proibida — Story | ScanSocial",
      description:
        "Análise contextual de stories com fatos, hipóteses e quatro mensagens naturais explicadas, sem presumir sentimentos ou intenções.",
    }),
  component: PsicologiaStoryPage,
});

const TOM: Record<string, string> = {
  natural: "💬 Natural",
  engracado: "😂 Engraçado",
  curioso: "👀 Curioso",
  confiante: "😎 Confiante",
  carinhoso: "🤍 Carinhoso",
  provocador: "😏 Provocador",
};
const INC: Record<string, { label: string; color: string }> = {
  alta: { label: "Incerteza alta", color: "var(--muted-foreground)" },
  media: { label: "Incerteza média", color: "var(--accent)" },
  baixa: { label: "Incerteza baixa", color: "var(--violet)" },
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-premium p-5 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="size-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        />
        <span className="text-[10px] uppercase tracking-[0.24em]" style={{ color }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="shrink-0">
      <Button
        variant="secondary"
        size="sm"
        title={ok ? "Copiado" : "Copiar mensagem"}
        aria-label={ok ? "Copiado" : "Copiar mensagem"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setOk(true);
            setError(false);
            setTimeout(() => setOk(false), 1500);
          } catch {
            setError(true);
          }
        }}
        className="rounded-full"
      >
        {ok ? <Check /> : <Copy />}
      </Button>
      {error && (
        <p role="alert" className="mt-1 max-w-24 text-xs text-destructive">
          Não foi possível copiar.
        </p>
      )}
    </div>
  );
}

function PsicologiaStoryPage() {
  const fn = useServerFn(analisarPsicologiaStory);
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [contexto, setContexto] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const mutation = useMutation({
    retry: false,
    mutationFn: (anteriores: string[]) =>
      fn({ data: { contexto, image: image ?? "", anteriores } }),
  });
  const result = mutation.data?.result;
  const busy = reading || mutation.isPending;

  const handleFile = async (f: File) => {
    setFileError(null);
    if (!["image/jpeg", "image/png", "image/jpg"].includes(f.type)) {
      setFileError("Use um print em JPG ou PNG.");
      return;
    }
    if (f.size > STORY_MAX_BYTES) {
      setFileError("Imagem muito pesada (máx. 6 MB).");
      return;
    }
    setReading(true);
    try {
      const next = await readFile(f);
      validateStoryInput({ image: next });
      const decoded = new Image();
      decoded.src = next;
      await decoded.decode();
      setImage(next);
      mutation.reset();
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Não consegui ler a imagem.");
    } finally {
      setReading(false);
    }
  };

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }}
        />
      </div>

      <Link
        to="/"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Central
      </Link>

      <header className="mt-6 mb-8 animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4">
          <span
            className="size-1.5 rounded-full animate-pulse"
            style={{ background: "var(--violet)", boxShadow: "0 0 12px var(--violet)" }}
          />
          <span
            className="text-[10px] font-medium uppercase tracking-[0.32em]"
            style={{ color: "var(--violet)" }}
          >
            Story
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium tracking-[0.04em] leading-[1.05]">
          <span className="shimmer-text">PSICOLOGIA PROIBIDA — STORY</span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[52ch]">
          Manda o print do story para encontrar uma resposta que combine com ele.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground/70 max-w-[52ch]">
          Sinais, não pensamentos. Ninguém sabe a intenção de um story — aqui você vê o que dá e o
          que não dá pra concluir.
        </p>
      </header>

      <section className="space-y-4 animate-fade-up">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          disabled={busy}
          aria-label="Print do story"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {!image ? (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full h-auto flex-col rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center hover:border-accent/40 hover:bg-card/60 transition"
          >
            <span className="text-sm font-medium text-foreground">
              {reading ? "Lendo imagem…" : "📸 Enviar print do story"}
            </span>
            <span className="text-xs text-muted-foreground mt-1">JPG ou PNG · até 6 MB</span>
          </Button>
        ) : (
          <div className="relative mx-auto w-48 aspect-[9/16] rounded-2xl overflow-hidden ring-1 ring-border bg-card/60">
            <img
              src={image}
              alt="Print do story enviado"
              className="w-full h-full object-contain"
            />
            <Button
              variant="secondary"
              size="icon"
              disabled={busy}
              onClick={() => {
                setImage(null);
                setFileError(null);
                mutation.reset();
              }}
              className="absolute top-2 right-2 size-7 rounded-full bg-background/80 backdrop-blur text-sm ring-1 ring-border"
              aria-label="Remover print"
              title="Remover print"
            >
              <X />
            </Button>
          </div>
        )}
        {image && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus /> Substituir print
          </Button>
        )}
        {fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}

        <textarea
          value={contexto}
          disabled={busy}
          maxLength={1500}
          aria-label="Contexto opcional"
          onChange={(e) => {
            setContexto(e.target.value);
            mutation.reset();
          }}
          rows={3}
          placeholder="Contexto opcional: legenda, música, situação, como vocês se conhecem…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <Button
          onClick={() => mutation.mutate([])}
          disabled={!image || busy}
          aria-busy={mutation.isPending}
          className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
        >
          {mutation.isPending ? "Lendo o story…" : "🕯️ Analisar story"}
        </Button>

        {mutation.isError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm"
          >
            {(mutation.error as Error).message || "Algo deu errado. Tenta de novo."}
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={busy}
              onClick={() => mutation.mutate([])}
            >
              <RefreshCw /> Tentar novamente
            </Button>
          </div>
        )}
      </section>

      {result && (
        <section className="mt-12 space-y-5 animate-fade-up">
          <div
            className="card-premium p-5 md:p-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--violet) 18%, transparent), transparent 70%)",
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span
                className="text-[10px] uppercase tracking-[0.24em]"
                style={{ color: "var(--violet)" }}
              >
                🏆 Melhor resposta
              </span>
              <CopyBtn text={result.melhor_resposta.texto} />
            </div>
            <p className="text-xl font-medium text-foreground leading-snug">
              "{result.melhor_resposta.texto}"
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{result.melhor_resposta.por_que}</p>
          </div>

          <Section title="Respostas por tom" color="var(--accent)">
            <ul className="space-y-3">
              {result.respostas.map((r, i) => (
                <li key={i} className="flex items-start justify-between gap-3" data-story-message>
                  <div className="min-w-0 break-words">
                    <div className="text-[11px] text-muted-foreground">{TOM[r.tom] ?? r.tom}</div>
                    <div className="text-sm text-foreground/95">{r.texto}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.por_que}</p>
                  </div>
                  <CopyBtn text={r.texto} />
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Detalhes observáveis" color="var(--accent)">
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {result.detalhes_observaveis.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">›</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Interpretações possíveis" color="var(--violet)">
            <ul className="space-y-3">
              {result.interpretacoes.map((it, i) => {
                const p = INC[it.incerteza] ?? {
                  label: "Incerteza alta",
                  color: "var(--muted-foreground)",
                };
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

          <Section title="O que não dá pra concluir" color="var(--muted-foreground)">
            <ul className="space-y-1.5 text-sm text-foreground/80">
              {result.nao_da_pra_concluir.map((s, i) => (
                <li key={i}>? {s}</li>
              ))}
            </ul>
          </Section>

          <Section title="Estratégia recomendada" color="var(--violet)">
            <p className="text-sm text-foreground/90">{result.estrategia}</p>
          </Section>

          <Button
            variant="secondary"
            onClick={() => mutation.mutate(result.respostas.map((r) => r.texto))}
            disabled={busy}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition disabled:opacity-40"
          >
            <RefreshCw />{" "}
            {mutation.isPending ? "Gerando novas respostas…" : "Gerar novas respostas"}
          </Button>
        </section>
      )}
    </main>
  );
}
