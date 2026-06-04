import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { detectorRobo, type DetectorRoboResult } from "@/lib/detector-robo.functions";

export const Route = createFileRoute("/detector-robo")({
  head: () => ({
    meta: [
      { title: "Detector de Robô — ScanSocial" },
      { name: "description", content: "Teste sua mensagem antes de enviar. Veja se soa humana, natural e sem carência." },
    ],
  }),
  component: DetectorRoboPage,
});

function AnimatedScore({ value, label, color, delay = 0 }: { value: number; label: string; color: string; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const duration = 800;
      const startTime = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - startTime) / duration, 1);
        setDisplay(Math.round(value * p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl md:text-4xl font-medium tabular-nums" style={{ color }}>{display}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${ok ? "text-foreground" : "text-muted-foreground/60 line-through"}`}>
      <span className={`inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold ${ok ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"}`}>
        {ok ? "✓" : "✗"}
      </span>
      {label}
    </div>
  );
}

function DetectorRoboPage() {
  const fn = useServerFn(detectorRobo);
  const [mensagem, setMensagem] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { mensagem } }),
  });

  const result = mutation.data?.result as DetectorRoboResult | undefined;

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Detector de Robô
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Testa antes de enviar.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Cole a mensagem que você quer mandar. A IA avalia se soa humana, natural e sem carência.
        </p>
      </header>

      <section className="grid gap-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <textarea
          ref={textareaRef}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
          placeholder="Cole aqui a mensagem que você quer testar…"
          className="w-full rounded-2xl bg-card/50 ring-1 ring-border focus:ring-accent/40 px-4 py-3 text-sm outline-none transition resize-none"
        />

        <button
          type="button"
          disabled={!mensagem.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="w-full py-4 rounded-2xl font-medium text-base bg-gradient-to-r from-violet to-accent text-background disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition shadow-[0_0_40px_-10px_var(--violet)]"
        >
          {mutation.isPending ? "IA analisando…" : "ANALISAR MENSAGEM"}
        </button>
      </section>

      {mutation.isError && (
        <div className="mt-4 p-4 rounded-2xl ring-1 ring-destructive/40 bg-destructive/5 text-sm text-destructive animate-fade-up">
          {(mutation.error as Error)?.message ?? "Deu ruim. Tenta de novo."}
        </div>
      )}

      {result && (
        <section className="mt-10 grid gap-5 animate-fade-up">
          {/* Scores */}
          <div className="p-5 rounded-3xl ring-1 ring-border bg-card/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <AnimatedScore value={result.naturalidade} label="Naturalidade" color="var(--accent)" delay={0} />
              <AnimatedScore value={result.carencia} label="Carência" color="var(--destructive)" delay={100} />
              <AnimatedScore value={result.originalidade} label="Originalidade" color="var(--violet)" delay={200} />
              <AnimatedScore value={result.chance_resposta} label="Chance Resposta" color="var(--accent)" delay={300} />
            </div>
          </div>

          {/* Checks */}
          <div className="p-5 rounded-3xl ring-1 ring-border bg-card/30">
            <div className="grid grid-cols-2 gap-3">
              <CheckItem ok={result.humano} label="Humano" />
              <CheckItem ok={result.sem_carencia} label="Sem Carência" />
              <CheckItem ok={result.sem_cantada_pronta} label="Sem Cantada Pronta" />
              <CheckItem ok={result.liberado} label="Liberado" />
            </div>

            {/* Status badge */}
            <div className="mt-5 flex justify-center">
              {result.liberado ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-medium ring-1 ring-emerald-500/30">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Mensagem aprovada — pode enviar
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/15 text-destructive text-sm font-medium ring-1 ring-destructive/30">
                  <span className="size-2 rounded-full bg-destructive animate-pulse" />
                  Mensagem precisa de ajustes
                </div>
              )}
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="p-5 rounded-3xl ring-1 ring-violet/25 bg-violet/5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-violet mb-2">Diagnóstico</div>
            <p className="text-sm text-foreground">{result.diagnostico}</p>
            {result.sugestao && (
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="text-violet font-medium">Sugestão:</span> {result.sugestao}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setMensagem("");
              mutation.reset();
              textareaRef.current?.focus();
            }}
            className="w-full py-3 rounded-2xl text-sm ring-1 ring-border hover:ring-accent/40 transition"
          >
            ↻ Testar outra mensagem
          </button>
        </section>
      )}
    </main>
  );
}
