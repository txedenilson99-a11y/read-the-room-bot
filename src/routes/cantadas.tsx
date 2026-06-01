import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { gerarCantadas, type CantadasResult, type CantadaSequencia } from "@/lib/cantadas.functions";

export const Route = createFileRoute("/cantadas")({
  head: () => ({
    meta: [
      { title: "Cantadas IA — ScanSocial" },
      { name: "description", content: "Sequência completa de mensagens: setup, desenvolvimento e punchline." },
    ],
  }),
  component: CantadasPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

const TONES: Record<CantadaSequencia["abordagem"], { dot: string; label: string }> = {
  Natural: { dot: "var(--accent)", label: "leve, espontânea" },
  Engraçada: { dot: "#f5b14a", label: "humor + provocação" },
  Sedutora: { dot: "var(--violet)", label: "tensão e interesse" },
};

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="text-[11px] text-muted-foreground hover:text-foreground transition"
    >
      {ok ? "copiado ✓" : "copiar"}
    </button>
  );
}

function Step({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-background/40 ring-1 ring-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
        <CopyBtn text={text} />
      </div>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function Sequencia({ s, onCopyAll }: { s: CantadaSequencia; onCopyAll: () => void }) {
  const [revealDev, setRevealDev] = useState(false);
  const [revealPunch, setRevealPunch] = useState(false);
  const tone = TONES[s.abordagem];

  return (
    <div className="card-premium p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full" style={{ background: tone.dot, boxShadow: `0 0 12px ${tone.dot}` }} />
          <h3 className="text-base font-medium">{s.abordagem}</h3>
          <span className="text-[11px] text-muted-foreground">· {tone.label}</span>
        </div>
        <button onClick={onCopyAll} className="text-[11px] text-muted-foreground hover:text-foreground">copiar tudo</button>
      </div>

      <div className="space-y-3">
        <Step label="Setup" text={s.setup} />

        <div className="pl-4 border-l border-border/60 ml-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
            simulação · ela provavelmente responde
          </div>
          <p className="text-sm italic text-muted-foreground">"{s.resposta_provavel}"</p>
        </div>

        {revealDev ? (
          <Step label="Desenvolvimento" text={s.desenvolvimento} />
        ) : (
          <button
            onClick={() => setRevealDev(true)}
            className="w-full rounded-2xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40 transition"
          >
            Próxima etapa → desenvolvimento
          </button>
        )}

        {revealDev && (revealPunch ? (
          <Step label="Punchline" text={s.punchline} />
        ) : (
          <button
            onClick={() => setRevealPunch(true)}
            className="w-full rounded-2xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40 transition"
          >
            Próxima etapa → punchline
          </button>
        ))}
      </div>
    </div>
  );
}

function CantadasPage() {
  const fn = useServerFn(gerarCantadas);
  const inputRef = useRef<HTMLInputElement>(null);
  const [contexto, setContexto] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { contexto, imageDataUrl: preview ?? undefined } }),
  });
  const result = mutation.data as CantadasResult | undefined;

  const copyAll = (s: CantadaSequencia) => {
    navigator.clipboard.writeText(`${s.setup}\n\n[ela: ${s.resposta_provavel}]\n\n${s.desenvolvimento}\n\n${s.punchline}`);
  };

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-8 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Cantadas IA
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[28ch]">
          Não é frase pronta. É uma sequência inteira.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Setup → desenvolvimento → punchline. Em 3 vibes: natural, engraçada e sedutora.
        </p>
      </header>

      <div className="space-y-4 animate-fade-up">
        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={3}
          placeholder="Conta o contexto: 'story dela na academia', 'matchei no tinder, ela só tem foto de praia', 'ela respondeu meu story com kkk'…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setPreview(await fileToDataUrl(f));
          }}
        />

        <div className="flex items-center gap-3">
          {preview ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <img src={preview} alt="" className="size-10 rounded-lg object-cover ring-1 ring-border" />
              <button onClick={() => setPreview(null)} className="underline">remover print</button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + anexar print (opcional)
            </button>
          )}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (!contexto.trim() && !preview)}
          className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
        >
          {mutation.isPending ? "IA montando a sequência…" : "Gerar sequência"}
        </button>
      </div>

      {mutation.isError && (
        <div className="mt-6 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      {result && (
        <section className="mt-10 space-y-6 animate-fade-up">
          <div className="border-t border-border pt-6">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border mb-3">
              Contexto
            </span>
            <p className="text-lg font-medium text-balance leading-snug">{result.contexto}</p>
          </div>

          <div className="space-y-4">
            {result.sequencias.map((s) => (
              <Sequencia key={s.abordagem} s={s} onCopyAll={() => copyAll(s)} />
            ))}
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
