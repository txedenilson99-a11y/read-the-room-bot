import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  analisarPerfilInstagram,
  type PerfilIGResult,
  type Veredito,
} from "@/lib/perfil-instagram.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/perfil-ig")({
  head: () =>
    seoHead({
      path: "/perfil-ig",
      title: "Análise de Perfil Instagram por IA | ScanSocial",
      description:
        "Manda prints do perfil e a IA analisa se ele é forte, atraente, carente ou fake. Diagnóstico honesto, sem maquiar.",
    }),
  component: PerfilIGPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler a imagem."));
    r.readAsDataURL(file);
  });
}

const VEREDITO_LABEL: Record<Veredito, string> = {
  forte: "Perfil forte",
  atraente: "Atraente",
  interessante: "Interessante",
  fraco: "Fraco",
  carente: "Carente",
  fake: "Cheira a fake",
  "sem-presenca": "Sem presença",
};

const VEREDITO_TONE: Record<Veredito, "good" | "mid" | "bad"> = {
  forte: "good",
  atraente: "good",
  interessante: "mid",
  fraco: "bad",
  carente: "bad",
  fake: "bad",
  "sem-presenca": "bad",
};

const RADAR_AXES: { key: keyof PerfilIGResult["radar"]; label: string }[] = [
  { key: "aparencia", label: "Aparência" },
  { key: "bio", label: "Bio" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "social", label: "Social" },
  { key: "presenca", label: "Presença" },
  { key: "confianca", label: "Confiança" },
];

const NOTAS_LABELS: { key: keyof PerfilIGResult["notas"]; label: string }[] = [
  { key: "geral", label: "Nota geral" },
  { key: "atracao", label: "Atração" },
  { key: "social", label: "Nível social" },
  { key: "confianca", label: "Confiança" },
  { key: "autenticidade", label: "Autenticidade" },
  { key: "interesse", label: "Chance de interesse" },
];

function PerfilIGPage() {
  const fn = useServerFn(analisarPerfilInstagram);
  const inputRef = useRef<HTMLInputElement>(null);
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [contexto, setContexto] = useState("");
  const [imagens, setImagens] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { handle, bio, contexto, imagens } }),
  });

  const result = mutation.data?.result;

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 6 - imagens.length);
    const urls = await Promise.all(arr.filter((f) => f.type.startsWith("image/")).map(fileToDataUrl));
    setImagens((prev) => [...prev, ...urls].slice(0, 6));
  };

  const remove = (i: number) => setImagens((p) => p.filter((_, idx) => idx !== i));

  return (
    <main className="max-w-4xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-violet mb-3">
          Análise de Perfil IG
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Joga o perfil aqui. Eu te falo a real.
        </h1>
      </header>

      {!result && (
        <div className="space-y-4 animate-fade-up">
          <div className="rounded-2xl bg-card/60 ring-1 ring-border focus-within:ring-violet/40 transition px-4 py-3 flex items-center gap-2">
            <span className="text-muted-foreground">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="usuario_do_insta"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
            />
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Cola a bio do perfil (opcional)…"
            className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-violet/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
          />

          <textarea
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            rows={2}
            placeholder="Contexto extra: tipo de post, vibe geral, quem é a pessoa…"
            className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-violet/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />

          <div className="rounded-2xl bg-card/40 ring-1 ring-dashed ring-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">
                Prints do perfil ({imagens.length}/6)
              </div>
              {imagens.length < 6 && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-xs px-3 py-1 rounded-full bg-secondary hover:bg-secondary/70 transition"
                >
                  + Adicionar
                </button>
              )}
            </div>
            {imagens.length === 0 ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full text-center py-6 text-sm text-muted-foreground hover:text-foreground transition"
              >
                Toca pra subir prints da bio, feed ou fotos
              </button>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {imagens.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remover print"
                      onClick={() => remove(i)}
                      className="absolute top-1 right-1 bg-background/80 backdrop-blur rounded-full w-6 h-6 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (!handle && !bio && imagens.length === 0)}
            className="w-full bg-gradient-to-r from-violet to-accent text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
          >
            {mutation.isPending ? "IA escaneando o perfil…" : "Analisar perfil"}
          </button>
        </div>
      )}

      {mutation.isError && (
        <div className="mt-8 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      {result && (
        <section className="space-y-10 animate-fade-up">
          <VeredictoCard result={result} handle={handle} />

          <RadarPanel radar={result.radar} />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {NOTAS_LABELS.map(({ key, label }) => (
              <StatCard key={key} label={label} value={result.notas[key]} />
            ))}
          </div>

          <FlagsPanel flags={result.flags} redFlags={result.red_flags} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ListCard title="O que tá ruim" items={result.ruim} tone="danger" />
            <ListCard title="O que melhorar" items={result.melhorar} />
            <ListCard title="Pra parecer mais interessante" items={result.parecer_interessante} tone="accent" />
          </div>

          <SuggestionBlock title="Nova bio (pronta pra colar)" items={result.nova_bio} copyable />
          <SuggestionBlock title="Ideias de foto" items={result.ideias_fotos} />
          <SuggestionBlock title="Frases pra destaque" items={result.frases_destaque} copyable />
          <SuggestionBlock title="Dicas pra subir engajamento" items={result.dicas_engajamento} />

          <div className="p-5 rounded-3xl bg-card/60 ring-1 ring-border">
            <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-2">
              Comparado a perfis populares
            </div>
            <p className="text-sm leading-relaxed">{result.comparacao}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => mutation.mutate()}
              className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
            >
              Regenerar
            </button>
            <button
              onClick={() => { mutation.reset(); }}
              className="rounded-full bg-card/60 ring-1 ring-border px-4 py-2 text-sm hover:bg-card transition"
            >
              Analisar outro
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function VeredictoCard({ result, handle }: { result: PerfilIGResult; handle: string }) {
  const tone = VEREDITO_TONE[result.veredito];
  const label = VEREDITO_LABEL[result.veredito];
  const color =
    tone === "good"
      ? "var(--accent)"
      : tone === "mid"
        ? "var(--violet)"
        : "var(--destructive)";
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 md:p-8 ring-1"
      style={{
        background: `linear-gradient(135deg, color-mix(in oklab, ${color} 12%, transparent), transparent)`,
        borderColor: `color-mix(in oklab, ${color} 30%, transparent)`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] font-medium uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            color,
            background: `color-mix(in oklab, ${color} 15%, transparent)`,
          }}
        >
          {label}
        </span>
        {handle && (
          <span className="text-xs text-muted-foreground">@{handle}</span>
        )}
      </div>
      <h2 className="text-2xl md:text-3xl font-medium text-balance leading-snug mb-3">
        {result.titulo}
      </h2>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {result.leitura}
      </p>
      <div
        className="mt-6 flex items-end gap-3"
        style={{ color }}
      >
        <div className="text-5xl md:text-6xl font-medium leading-none">
          {Math.round(result.notas.geral)}
        </div>
        <div className="text-xs uppercase tracking-widest mb-2 opacity-70">/100</div>
      </div>
    </div>
  );
}

function RadarPanel({ radar }: { radar: PerfilIGResult["radar"] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const axes = RADAR_AXES;
  const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;

  const point = (i: number, value: number) => {
    const a = angle(i);
    const dist = (value / 100) * r;
    return [cx + Math.cos(a) * dist, cy + Math.sin(a) * dist] as const;
  };

  const dataPath = axes
    .map(({ key }, i) => {
      const [x, y] = point(i, radar[key] ?? 0);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5 md:p-6">
      <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-5">
        Radar social
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          {gridLevels.map((lvl, gi) => (
            <polygon
              key={gi}
              points={axes
                .map((_, i) => {
                  const [x, y] = point(i, lvl * 100);
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="color-mix(in oklab, var(--violet) 15%, transparent)"
              strokeWidth={0.6}
            />
          ))}
          {axes.map((_, i) => {
            const [x, y] = point(i, 100);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="color-mix(in oklab, var(--violet) 12%, transparent)"
                strokeWidth={0.6}
              />
            );
          })}
          <path
            d={dataPath}
            fill="color-mix(in oklab, var(--violet) 25%, transparent)"
            stroke="var(--violet)"
            strokeWidth={1.5}
            style={{ filter: "drop-shadow(0 0 8px color-mix(in oklab, var(--violet) 60%, transparent))" }}
          />
          {axes.map(({ key }, i) => {
            const [x, y] = point(i, radar[key] ?? 0);
            return <circle key={i} cx={x} cy={y} r={3} fill="var(--accent)" />;
          })}
          {axes.map(({ label }, i) => {
            const a = angle(i);
            const lx = cx + Math.cos(a) * (r + 18);
            const ly = cy + Math.sin(a) * (r + 18);
            return (
              <text
                key={label}
                x={lx}
                y={ly}
                fontSize={10}
                fill="currentColor"
                className="text-muted-foreground"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {label}
              </text>
            );
          })}
        </svg>

        <div className="flex-1 w-full space-y-3">
          {axes.map(({ key, label }) => {
            const v = Math.round(radar[key] ?? 0);
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{v}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${v}%`,
                      background: "linear-gradient(90deg, var(--violet), var(--accent))",
                      boxShadow: "0 0 10px color-mix(in oklab, var(--violet) 50%, transparent)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="rounded-2xl bg-card/60 ring-1 ring-border p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-medium text-foreground">{v}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${v}%`,
            background: "linear-gradient(90deg, var(--violet), var(--accent))",
            boxShadow: "0 0 8px color-mix(in oklab, var(--accent) 50%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

function FlagsPanel({
  flags,
  redFlags,
}: {
  flags: PerfilIGResult["flags"];
  redFlags: string[];
}) {
  const items: { key: keyof typeof flags; label: string }[] = [
    { key: "fake", label: "Detector de fake" },
    { key: "carencia", label: "Detector de carência" },
    { key: "ego", label: "Excesso de ego" },
  ];
  return (
    <div className="rounded-3xl bg-card/60 ring-1 ring-border p-5 md:p-6">
      <div className="text-[10px] font-medium uppercase tracking-widest text-destructive mb-5">
        Red flags
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {items.map(({ key, label }) => {
          const v = Math.max(0, Math.min(100, Math.round(flags[key] ?? 0)));
          const danger = v >= 50;
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{v}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${v}%`,
                    background: danger
                      ? "linear-gradient(90deg, var(--destructive), oklch(0.75 0.18 25))"
                      : "linear-gradient(90deg, var(--violet), var(--accent))",
                    boxShadow: danger
                      ? "0 0 10px color-mix(in oklab, var(--destructive) 50%, transparent)"
                      : "0 0 10px color-mix(in oklab, var(--violet) 40%, transparent)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {redFlags.length > 0 && (
        <ul className="space-y-2">
          {redFlags.map((f, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span className="text-destructive mt-1">▲</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "danger" | "accent";
}) {
  const color =
    tone === "danger" ? "text-destructive" : tone === "accent" ? "text-accent" : "text-violet";
  const ring =
    tone === "danger" ? "ring-destructive/20" : tone === "accent" ? "ring-accent/20" : "ring-border";
  return (
    <div className={`p-5 rounded-2xl bg-card/60 ring-1 ${ring}`}>
      <div className={`text-[10px] font-medium uppercase tracking-widest mb-3 ${color}`}>{title}</div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-sm leading-relaxed flex gap-2">
            <span className="text-muted-foreground">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionBlock({
  title,
  items,
  copyable,
}: {
  title: string;
  items: string[];
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-3">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it, i) => (
          <div key={i} className="p-4 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-violet/30 transition flex items-start gap-3">
            <p className="text-sm leading-relaxed flex-1">{it}</p>
            {copyable && (
              <button
                onClick={() => copy(it, i)}
                className="text-[11px] text-muted-foreground hover:text-foreground shrink-0"
              >
                {copied === i ? "✓" : "Copiar"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
