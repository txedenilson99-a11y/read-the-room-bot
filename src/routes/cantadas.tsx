import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { gerarCantadas, type CantadasResult, type CantadaSequencia } from "@/lib/cantadas.functions";

export const Route = createFileRoute("/cantadas")({
  head: () => ({
    meta: [
      { title: "Cantadas em Etapas — ScanSocial" },
      { name: "description", content: "A IA monta a conversa inteira: setup, resposta dela, punchline e continuação." },
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
  Engraçada: { dot: "#f5b14a", label: "humor + zoeira" },
  "Flertando": { dot: "var(--violet)", label: "tensão sutil" },
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

function MyMsg({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-background/40 ring-1 ring-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-accent">você · {label}</span>
        <CopyBtn text={text} />
      </div>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function HerMsg({ text }: { text: string }) {
  return (
    <div className="pl-4 border-l border-border/60 ml-1 py-1">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
        ela provavelmente responde
      </div>
      <p className="text-sm italic text-muted-foreground">"{text}"</p>
    </div>
  );
}

function Sequencia({ s, onCopyAll }: { s: CantadaSequencia; onCopyAll: () => void }) {
  const [step, setStep] = useState(1); // 1=setup, 2=+resposta, 3=+punch, 4=+cont
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
        <MyMsg label="1ª mensagem" text={s.setup} />

        {step >= 2 ? (
          <HerMsg text={s.resposta_provavel} />
        ) : (
          <button
            onClick={() => setStep(2)}
            className="w-full rounded-2xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40 transition"
          >
            Simular resposta dela →
          </button>
        )}

        {step >= 2 && (step >= 3 ? (
          <MyMsg label="punchline" text={s.punchline} />
        ) : (
          <button
            onClick={() => setStep(3)}
            className="w-full rounded-2xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40 transition"
          >
            Próxima etapa → punchline
          </button>
        ))}

        {step >= 3 && (step >= 4 ? (
          <MyMsg label="continuação" text={s.continuacao} />
        ) : (
          <button
            onClick={() => setStep(4)}
            className="w-full rounded-2xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground hover:text-foreground hover:border-accent/40 transition"
          >
            Continuar conversa →
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
    navigator.clipboard.writeText(
      `${s.setup}\n\n[ela: ${s.resposta_provavel}]\n\n${s.punchline}\n\n${s.continuacao}`,
    );
  };

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-8 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Cantadas em Etapas
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[28ch]">
          Manda o print. A IA monta exatamente o que falar.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ela lê a situação e cria a conversa inteira: primeira mensagem → resposta dela → continuação → fechamento. Em 3 abordagens: natural, engraçada, flertando.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/70">
          Sem frase pronta. Sem cantada forçada. Só o que combina com o contexto.
        </p>
      </header>

      <div className="space-y-4 animate-fade-up">
        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={3}
          placeholder="Story, foto, print, perfil ou contexto: 'story dela na academia', 'matchei no tinder, só foto de praia', 'ela respondeu meu story com kkk'…"
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
              + anexar story / foto / print (opcional)
            </button>
          )}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (!contexto.trim() && !preview)}
          className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
        >
          {mutation.isPending ? "IA lendo o contexto…" : "⚡ Montar conversa"}
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
            Gerar novas
          </button>
        </section>
      )}
    </main>
  );
}
