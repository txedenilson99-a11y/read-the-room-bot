import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  marcarEncontro,
  type EncontroResult,
  type SinalPositivo,
  type SinalNegativo,
  type TipoEncontro,
  type HorarioIdeal,
} from "@/lib/encontro.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/marcar-encontro")({
  head: () =>
    seoHead({
      path: "/marcar-encontro",
      title: "Marcar Encontro — A IA diz se dá pra convidar | ScanSocial",
      description:
        "A IA lê a conversa, mede compatibilidade e interesse real e diz se já dá pra chamar pra sair — com convites prontos e o que evitar.",
    }),
  component: MarcarEncontroPage,
});

const SINAL_POS_LABEL: Record<SinalPositivo, string> = {
  faz_perguntas: "Faz perguntas",
  mantem_assunto: "Mantém o assunto",
  responde_rapido: "Responde rápido",
  usa_emojis: "Usa emojis",
  demonstra_curiosidade: "Demonstra curiosidade",
  toma_iniciativa: "Toma iniciativa",
};

const SINAL_NEG_LABEL: Record<SinalNegativo, string> = {
  respostas_secas: "Respostas secas",
  demora_constante: "Demora constante",
  falta_de_interesse: "Falta de interesse",
  ignora_perguntas: "Ignora perguntas",
  muda_de_assunto: "Muda de assunto",
};

const ENCONTRO_LABEL: Record<TipoEncontro, string> = {
  cafe: "☕ Café",
  bar: "🍻 Bar",
  jantar: "🍝 Jantar",
  cinema: "🎬 Cinema",
  parque: "🌳 Parque",
  caminhada: "🚶 Caminhada",
  evento: "🎟️ Evento",
  sorvete: "🍦 Sorvete",
};

const HORARIO_LABEL: Record<HorarioIdeal, string> = {
  hoje: "Hoje",
  amanha: "Amanhã",
  fim_de_semana: "Fim de semana",
  depois_do_trabalho: "Depois do trabalho",
  espere_alguns_dias: "Espere alguns dias",
};

const MOMENTO_UI: Record<
  EncontroResult["momento"],
  { label: string; emoji: string; color: string }
> = {
  verde: { label: "Pode convidar", emoji: "🟢", color: "var(--accent)" },
  amarelo: { label: "Melhor esperar", emoji: "🟡", color: "oklch(0.82 0.16 90)" },
  vermelho: { label: "Ainda não é o momento", emoji: "🔴", color: "var(--destructive)" },
};

const CATEGORIA_LABEL: Record<string, string> = {
  natural: "😎 Natural",
  engracado: "😂 Engraçado",
  engracada: "😂 Engraçada",
  flertando: "😏 Flertando",
  inteligente: "🧠 Inteligente",
  confiante: "🔥 Confiante",
  misterioso: "👀 Misterioso",
  elegante: "🎩 Elegante",
  direto: "🎯 Direto",
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

function Meter({
  label,
  value,
  color = "var(--accent)",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span className="uppercase tracking-[0.18em]">{label}</span>
        <span className="font-medium text-foreground tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-card/80 ring-1 ring-border overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(2, Math.min(100, value))}%`,
            background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 55%, transparent))`,
            boxShadow: `0 0 18px color-mix(in oklab, ${color} 45%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

function CopyRow({ label, text, chance }: { label: string; text: string; chance?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl bg-card/50 ring-1 ring-border p-4 hover:ring-accent/30 transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        {typeof chance === "number" && (
          <span className="text-[10px] tabular-nums text-accent">{chance}% aceite</span>
        )}
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">"{text}"</p>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="mt-3 text-[11px] text-muted-foreground hover:text-foreground transition"
      >
        {copied ? "Copiado ✓" : "Copiar"}
      </button>
    </div>
  );
}

function MarcarEncontroPage() {
  const fn = useServerFn(marcarEncontro);
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [conversa, setConversa] = useState("");
  const [contexto, setContexto] = useState("");

  const mutation = useMutation({
    mutationFn: () => fn({ data: { conversa, contexto, images } }),
  });

  const result = mutation.data?.result as EncontroResult | undefined;
  const canSubmit = !mutation.isPending && (conversa.trim().length > 0 || images.length > 0);

  const handleFiles = async (files: FileList) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 6 - images.length);
    const urls = await Promise.all(arr.map(fileToDataUrl));
    setImages((p) => [...p, ...urls].slice(0, 6));
  };

  const momento = result ? MOMENTO_UI[result.momento] : null;

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
        ← Central
      </Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Marcar Encontro
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight max-w-[26ch]">
          Dá pra chamar pra sair
          <br />
          ou ainda é cedo?
        </h1>
        <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-[52ch]">
          A IA lê a conversa, mede compatibilidade e interesse real, e só libera o convite se existir
          contexto de verdade. Sem falsa esperança.
        </p>
      </header>

      <section className="space-y-4 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <textarea
          value={conversa}
          onChange={(e) => setConversa(e.target.value)}
          rows={6}
          placeholder="Cola a conversa aqui (ou anexa os prints abaixo)…"
          className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
        />

        <textarea
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          rows={2}
          placeholder="Contexto opcional: como conheceram, quanto tempo conversam, se já se encontraram…"
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
            className="w-full rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center hover:border-accent/40 hover:bg-card/60 transition"
          >
            <div className="text-sm font-medium text-foreground">Anexar prints da conversa (opcional)</div>
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
          {mutation.isPending ? "IA analisando o contexto…" : "📅 Analisar e montar convite"}
        </button>

        {mutation.isError && (
          <div className="p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
            {(mutation.error as Error).message}
          </div>
        )}
      </section>

      {result && momento && (
        <section className="mt-12 space-y-8 animate-fade-up">
          {/* MOMENTO */}
          <div
            className="card-premium p-5 md:p-6"
            style={{
              background: `linear-gradient(135deg, color-mix(in oklab, ${momento.color} 14%, transparent), transparent 65%)`,
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              Momento ideal
            </div>
            <div className="text-2xl md:text-3xl font-medium" style={{ color: momento.color }}>
              {momento.emoji} {momento.label}
            </div>
            <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{result.momento_motivo}</p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Meter label="Compatibilidade" value={result.compatibilidade} color={momento.color} />
              <Meter label="Confiança da leitura" value={result.confianca} color="var(--violet)" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground italic">{result.compatibilidade_nota}</p>
          </div>

          {/* SINAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card/50 ring-1 ring-border p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3">
                Sinais positivos
              </div>
              <ul className="space-y-2">
                {result.sinais_positivos.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className={s.presente ? "text-accent" : "text-muted-foreground/50"}>
                      {s.presente ? "✓" : "—"}
                    </span>
                    <span className={s.presente ? "text-foreground/90" : "text-muted-foreground/60"}>
                      {SINAL_POS_LABEL[s.sinal] ?? s.sinal}
                      {s.presente && s.evidencia !== "—" && (
                        <span className="block text-[11px] text-muted-foreground">{s.evidencia}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-destructive/5 ring-1 ring-destructive/20 p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-destructive mb-3">
                Sinais de alerta
              </div>
              <ul className="space-y-2">
                {result.sinais_negativos.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className={s.presente ? "text-destructive" : "text-muted-foreground/50"}>
                      {s.presente ? "!" : "—"}
                    </span>
                    <span className={s.presente ? "text-foreground/90" : "text-muted-foreground/60"}>
                      {SINAL_NEG_LABEL[s.sinal] ?? s.sinal}
                      {s.presente && s.evidencia !== "—" && (
                        <span className="block text-[11px] text-muted-foreground">{s.evidencia}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* EVIDÊNCIAS / LIMITES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card/50 ring-1 ring-border p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3">
                ✓ O que foi identificado
              </div>
              <ul className="space-y-1.5 text-sm text-foreground/85">
                {result.confianca_evidencias.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-card/50 ring-1 ring-border p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                ✗ O que não dá pra confirmar
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {result.confianca_limites.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* ENCONTRO + HORÁRIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card/50 ring-1 ring-border p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-violet mb-2">
                Tipo de encontro
              </div>
              <div className="text-xl font-medium">{ENCONTRO_LABEL[result.encontro_ideal]}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{result.encontro_porque}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Alternativa: {ENCONTRO_LABEL[result.encontro_alternativo]}
              </p>
            </div>
            <div className="rounded-2xl bg-card/50 ring-1 ring-border p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-violet mb-2">Quando chamar</div>
              <div className="text-xl font-medium">{HORARIO_LABEL[result.horario_ideal]}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{result.horario_porque}</p>
            </div>
          </div>

          {/* CONVITES */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-4">
              8 convites prontos
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.convites.map((c, i) => (
                <CopyRow
                  key={i}
                  label={CATEGORIA_LABEL[c.categoria] ?? c.categoria}
                  text={c.texto}
                  chance={c.chance}
                />
              ))}
            </div>
          </div>

          {/* SE RECUSAR */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-violet mb-4">
              Se ela recusar — responda assim
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.se_recusar.map((c, i) => (
                <CopyRow key={i} label={CATEGORIA_LABEL[c.categoria] ?? c.categoria} text={c.texto} />
              ))}
            </div>
          </div>

          {/* EVITAR */}
          <div className="rounded-2xl bg-destructive/5 ring-1 ring-destructive/20 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-destructive mb-3">
              O que evitar
            </div>
            <ul className="space-y-2 text-sm">
              {result.evitar.map((e, i) => (
                <li key={i}>
                  <span className="text-foreground/90 font-medium">✗ {e.erro}</span>
                  <span className="block text-[11px] text-muted-foreground">{e.porque}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RESUMO */}
          <div className="card-premium p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-accent mb-2">Veredito da IA</div>
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed">{result.resumo}</p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Gerar novamente
          </button>
        </section>
      )}
    </main>
  );
}
