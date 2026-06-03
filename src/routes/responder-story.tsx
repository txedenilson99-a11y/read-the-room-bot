import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { responderStory, type ResponderStoryResult } from "@/lib/responder-story.functions";

export const Route = createFileRoute("/responder-story")({
  head: () => ({
    meta: [
      { title: "Reação a Stories — ScanSocial" },
      { name: "description", content: "Responda stories de forma natural, sem parecer forçado. IA lê a vibe e devolve respostas reais." },
    ],
  }),
  component: ResponderStoryPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    r.readAsDataURL(file);
  });
}

const MODOS = [
  { key: "calmo", emoji: "😌", label: "Calmo", sub: "Leve e confortável" },
  { key: "ironico", emoji: "😏", label: "Irônico", sub: "Provocação suave" },
  { key: "observador", emoji: "🧠", label: "Observador", sub: "Contexto inteligente" },
  { key: "ousado", emoji: "🔥", label: "Ousado", sub: "Confiança e tensão leve" },
] as const;

const VELOCIDADES = [
  { key: "rapida", label: "Rápida" },
  { key: "normal", label: "Normal" },
  { key: "pensada", label: "Pensada" },
] as const;

const SLIDERS = [
  { key: "flertar", label: "Flertar", min: "amigável", max: "tensão" },
  { key: "confianca", label: "Confiança", min: "discreto", max: "direto" },
  { key: "misterio", label: "Mistério", min: "previsível", max: "instigante" },
] as const;

type SliderKey = typeof SLIDERS[number]["key"];
type ModoKey = typeof MODOS[number]["key"];
type VelKey = typeof VELOCIDADES[number]["key"];

function ResponderStoryPage() {
  const fn = useServerFn(responderStory);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "video" | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [link, setLink] = useState("");
  const [legenda, setLegenda] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [modo, setModo] = useState<ModoKey>("calmo");
  const [velocidade, setVelocidade] = useState<VelKey>("normal");
  const [sliders, setSliders] = useState<Record<SliderKey, number>>({
    flertar: 40,
    confianca: 60,
    misterio: 50,
  });

  const mutation = useMutation({
    mutationFn: () => fn({ data: { imageDataUrl, link, legenda, modo, velocidade, sliders } }),
  });

  const result = mutation.data?.result as ResponderStoryResult | undefined;

  const handleFile = async (file: File) => {
    if (file.size > 12_000_000) {
      alert("Arquivo muito grande. Tenta um menor.");
      return;
    }
    const url = await fileToDataUrl(file);
    setPreview(url);
    if (file.type.startsWith("video/")) {
      setFileKind("video");
      setImageDataUrl(undefined);
    } else {
      setFileKind("image");
      setImageDataUrl(url);
    }
    mutation.reset();
  };

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  const canSubmit = (!!imageDataUrl || link.trim().length > 0 || legenda.trim().length > 0) && !mutation.isPending;

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-violet mb-3">
          Reação a Stories
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Responda stories sem parecer forçado.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Cola o link, manda o print ou o vídeo. A IA lê o que realmente aparece e te devolve 4 respostas naturais.
        </p>
      </header>

      {/* Upload + link */}
      <section className="grid gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative overflow-hidden rounded-3xl ring-1 ring-violet/25 bg-gradient-to-br from-violet/10 to-accent/5 hover:ring-violet/45 transition-all p-6 text-left"
        >
          {preview ? (
            <div className="flex items-center gap-4">
              {fileKind === "video" ? (
                <video src={preview} className="w-24 h-24 object-cover rounded-2xl ring-1 ring-border" muted playsInline />
              ) : (
                <img src={preview} alt="" className="w-24 h-24 object-cover rounded-2xl ring-1 ring-border" />
              )}
              <div>
                <div className="text-sm font-medium text-foreground">
                  {fileKind === "video" ? "Vídeo carregado" : "Print carregado"}
                </div>
                <div className="text-xs text-muted-foreground">Toca pra trocar</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-foreground">📎 Anexar print ou vídeo do story</div>
              <div className="text-xs text-muted-foreground mt-1">JPG, PNG ou MP4 até 12MB</div>
            </div>
          )}
        </button>

        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="ou cola o link do story aqui"
          className="w-full rounded-2xl bg-card/50 ring-1 ring-border focus:ring-accent/40 px-4 py-3 text-sm outline-none transition"
        />

        <textarea
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          rows={2}
          placeholder="contexto opcional: legenda do story, música tocando, o que tá rolando…"
          className="w-full rounded-2xl bg-card/50 ring-1 ring-border focus:ring-accent/40 px-4 py-3 text-sm outline-none transition resize-none"
        />
      </section>

      {/* Modos */}
      <section className="mt-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Modo
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MODOS.map((m) => {
            const active = modo === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setModo(m.key)}
                className={`text-left p-3 rounded-2xl ring-1 transition ${
                  active
                    ? "ring-violet/60 bg-violet/10"
                    : "ring-border bg-card/30 hover:ring-violet/30"
                }`}
              >
                <div className="text-sm font-medium text-foreground">
                  {m.emoji} {m.label}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sliders */}
      <section className="mt-6 p-5 rounded-3xl ring-1 ring-border bg-card/30">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Ajustes
        </div>
        <div className="grid gap-4">
          {SLIDERS.map((s) => (
            <label key={s.key} className="block">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-foreground">{s.label}</span>
                <span className="text-muted-foreground tabular-nums">{sliders[s.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliders[s.key]}
                onChange={(e) => setSliders((p) => ({ ...p, [s.key]: Number(e.target.value) }))}
                className="w-full accent-violet"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{s.min}</span>
                <span>{s.max}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Velocidade
          </div>
          <div className="flex gap-2">
            {VELOCIDADES.map((v) => {
              const active = velocidade === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVelocidade(v.key)}
                  className={`flex-1 py-2 rounded-xl text-xs ring-1 transition ${
                    active
                      ? "ring-accent/60 bg-accent/10 text-foreground"
                      : "ring-border text-muted-foreground hover:ring-accent/30"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => mutation.mutate()}
        className="mt-6 w-full py-4 rounded-2xl font-medium text-base bg-gradient-to-r from-violet to-accent text-background disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition shadow-[0_0_40px_-10px_var(--violet)]"
      >
        {mutation.isPending ? "IA lendo o story…" : "⚡ GERAR RESPOSTAS"}
      </button>

      {mutation.isError && (
        <div className="mt-4 p-4 rounded-2xl ring-1 ring-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(mutation.error as Error)?.message ?? "Deu ruim. Tenta de novo."}
        </div>
      )}

      {/* Result */}
      {result && (
        <section className="mt-10 grid gap-5 animate-fade-up">
          <div className="p-5 rounded-3xl ring-1 ring-violet/25 bg-violet/5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-violet mb-2">Leitura</div>
            <p className="text-sm text-foreground">{result.leitura}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div>
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Vibe</div>
                <div className="text-foreground mt-0.5">{result.vibe}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Contexto</div>
                <div className="text-foreground mt-0.5">{result.intencao}</div>
              </div>
            </div>
            <div className="mt-4 text-xs">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Evitar</div>
              <div className="text-foreground mt-0.5">{result.evitar}</div>
            </div>
          </div>

          <div className="grid gap-3">
            {result.respostas.map((r, i) => (
              <div
                key={i}
                className="group p-4 rounded-2xl ring-1 ring-border bg-card/40 hover:ring-accent/30 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-accent">{r.tipo}</span>
                  <button
                    onClick={() => copy(r.texto, i)}
                    className="text-[11px] px-2.5 py-1 rounded-full ring-1 ring-border hover:ring-accent/40 hover:text-accent transition"
                  >
                    {copied === i ? "copiado ✓" : "copiar"}
                  </button>
                </div>
                <p className="text-[15px] text-foreground leading-snug">{r.texto}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full py-3 rounded-2xl text-sm ring-1 ring-violet/30 text-violet hover:bg-violet/5 transition disabled:opacity-50"
          >
            {mutation.isPending ? "Gerando outra leva…" : "↻ Regenerar respostas"}
          </button>
        </section>
      )}
    </main>
  );
}
