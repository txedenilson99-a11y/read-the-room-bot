import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  gerarLabia,
  outraLabia,
  type LabiaResult,
  type ModoLabia,
  type CategoriaLabia,
} from "@/lib/labia.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/labia")({
  head: () =>
    seoHead({
      path: "/labia",
      title: "Lábia de Cachorro — resposta curta e natural na hora | ScanSocial",
      description:
        "Cola a mensagem e a IA devolve na hora a resposta curta, natural e com personalidade que mantém o papo vivo. Dopamina rápida, zero enrolação.",
    }),
  component: LabiaPage,
});

const MODO_LABEL: Record<ModoLabia, string> = {
  provocar: "😏 Provocar",
  fazer_rir: "😂 Fazer rir",
  criar_curiosidade: "👀 Criar curiosidade",
  flertar: "🔥 Flertar",
  virar_o_jogo: "🧠 Virar o jogo",
  uma_linha: "⚡ 1 Linha",
};

const CATEGORIA_LABEL: Record<CategoriaLabia, string> = {
  natural: "Natural",
  engracada: "Engraçada",
  confiante: "Confiante",
  flertando: "Flertando",
  provocadora: "Provocadora",
  misteriosa: "Misteriosa",
};

const RISCO_UI: Record<LabiaResult["leitura"]["risco_forcado"], { label: string; color: string }> = {
  baixo: { label: "🟢 Baixo", color: "var(--accent)" },
  medio: { label: "🟡 Médio", color: "oklch(0.82 0.16 90)" },
  alto: { label: "🔴 Alto", color: "var(--destructive)" },
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

function CopyBtn({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* clipboard bloqueado */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={`text-[11px] text-muted-foreground hover:text-foreground transition ${className}`}
    >
      {copied ? "Copiado ✓" : "Copiar"}
    </button>
  );
}

function LineCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-card/50 ring-1 ring-border p-4 hover:ring-accent/30 transition">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</div>
      <p className="text-sm text-foreground/90 leading-relaxed">"{text}"</p>
      <CopyBtn text={text} className="mt-3 block" />
    </div>
  );
}

function saveToHistory(input: string, reading: string) {
  if (typeof window === "undefined") return;
  try {
    const key = "scansocial.history";
    const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
    const next = [
      { id: crypto.randomUUID(), tool: "gerar-resposta", input, reading, at: Date.now() },
      ...prev,
    ].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function LabiaPage() {
  const fn = useServerFn(gerarLabia);
  const outraFn = useServerFn(outraLabia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [melhor, setMelhor] = useState<string | null>(null);
  const [usadas, setUsadas] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { mensagem, images } }),
  });

  const result = mutation.data?.result as LabiaResult | undefined;

  const regen = useMutation({
    mutationFn: () =>
      outraFn({
        data: {
          contexto: result?.leitura.contexto_detectado ?? "",
          abordagem: result?.leitura.melhor_abordagem ?? "",
          usadas,
        },
      }),
    onSuccess: (d) => {
      setMelhor(d.texto);
      setUsadas((p) => [...p, d.texto].slice(-20));
    },
  });

  useEffect(() => {
    if (!result) return;
    setMelhor(result.melhor.texto);
    setUsadas([result.melhor.texto]);
    saveToHistory(
      mensagem || `${images.length} print(s)`,
      `${result.melhor.texto}\n\n${result.leitura.contexto_detectado}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const canSubmit = !mutation.isPending && (mensagem.trim().length > 0 || images.length > 0);

  const handleFiles = async (files: FileList) => {
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6 - images.length);
    const urls = await Promise.all(arr.map(fileToDataUrl));
    setImages((p) => [...p, ...urls].slice(0, 6));
  };

  const risco = result ? RISCO_UI[result.leitura.risco_forcado] : null;

  return (
    <main className="max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Central
      </Link>

      <header className="mt-6 md:mt-8 mb-8 md:mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Lábia de Cachorro
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight max-w-[26ch]">
          🐶 Dopamina rápida.
          <br />
          Zero enrolação.
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[52ch]">
          Cola a mensagem. A IA encontra a resposta que mantém o papo vivo.
        </p>
      </header>

      <section className="space-y-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <label htmlFor="labia-msg" className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">
          O que a pessoa mandou?
        </label>
        <textarea
          id="labia-msg"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={5}
          placeholder="Cola aqui a mensagem ou manda o print..."
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {images.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center hover:border-accent/40 hover:bg-card/60 transition"
          >
            <div className="text-sm font-medium text-foreground">Anexar print da conversa (opcional)</div>
            <div className="text-xs text-muted-foreground mt-1">Até 6 imagens</div>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-border bg-card/60">
                <img src={src} alt={`Print ${i + 1} da conversa`} className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1.5 right-1.5 size-6 rounded-full bg-background/80 backdrop-blur text-xs ring-1 ring-border"
                  aria-label={`Remover print ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground transition"
              >
                + print
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
        >
          {mutation.isPending ? "IA montando a lábia…" : "🐶 GERAR LÁBIA"}
        </button>

        {mutation.isError && (
          <div className="p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}
      </section>

      {result && melhor && risco && (
        <section className="mt-10 space-y-8 animate-fade-up">
          {/* MELHOR RESPOSTA — primeiro, sem explicação antes */}
          <div
            className="card-premium p-5 md:p-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--accent) 16%, transparent), transparent 65%)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3">🏆 Melhor resposta</div>
            <p className="text-xl md:text-2xl font-medium leading-snug text-foreground">"{melhor}"</p>
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(melhor);
                  } catch {
                    /* ignore */
                  }
                }}
                className="bg-foreground text-background text-sm font-medium px-4 py-2 rounded-full transition"
              >
                Copiar
              </button>
              <button
                onClick={() => regen.mutate()}
                disabled={regen.isPending}
                className="text-sm px-4 py-2 rounded-full ring-1 ring-border bg-card/50 hover:ring-accent/40 disabled:opacity-40 transition"
              >
                {regen.isPending ? "gerando…" : "🔥 Outra"}
              </button>
            </div>
            {regen.isError && (
              <p className="mt-3 text-xs text-destructive">{(regen.error as Error).message}</p>
            )}
          </div>

          {/* MODOS */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Modos</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.modos.map((m, i) => (
                <LineCard key={i} label={MODO_LABEL[m.modo] ?? m.modo} text={m.texto} />
              ))}
            </div>
          </div>

          {/* VARIAÇÕES */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              Mais 6 opções
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.variacoes.map((v, i) => (
                <LineCard key={i} label={CATEGORIA_LABEL[v.categoria] ?? v.categoria} text={v.texto} />
              ))}
            </div>
          </div>

          {/* LEITURA RÁPIDA */}
          <div className="rounded-2xl bg-card/50 ring-1 ring-border p-5 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet">Leitura rápida</div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mb-1">
                Contexto detectado
              </div>
              <p className="text-sm text-foreground/90">{result.leitura.contexto_detectado}</p>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mb-1">
                Melhor abordagem
              </div>
              <p className="text-sm text-foreground/90">{result.leitura.melhor_abordagem}</p>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] mb-1">
                Risco de parecer forçado
              </div>
              <p className="text-sm font-medium" style={{ color: risco.color }}>
                {risco.label}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Boa pra manter o papo vivo — resposta dela nunca é garantia.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
