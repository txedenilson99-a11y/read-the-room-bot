import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { responderStory, type ResponderStoryResult } from "@/lib/responder-story.functions";

export const Route = createFileRoute("/responder-story")({
  head: () => ({
    meta: [
      { title: "Responder Story — ScanSocial" },
      { name: "description", content: "Cola o link, manda o print ou o vídeo. 8 respostas sem parecer carente." },
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

const SLIDERS = [
  { key: "humor", label: "Humor" },
  { key: "misterio", label: "Mistério" },
  { key: "provocacao", label: "Provocação" },
  { key: "dominancia", label: "Dominância" },
  { key: "naturalidade", label: "Naturalidade" },
] as const;

type SliderKey = typeof SLIDERS[number]["key"];

function ResponderStoryPage() {
  const fn = useServerFn(responderStory);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "video" | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [link, setLink] = useState("");
  const [legenda, setLegenda] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [sliders, setSliders] = useState<Record<SliderKey, number>>({
    humor: 60,
    misterio: 40,
    provocacao: 50,
    dominancia: 55,
    naturalidade: 80,
  });

  const mutation = useMutation({
    mutationFn: () => fn({ data: { imageDataUrl, link, legenda, sliders } }),
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
      // gemini não consome vídeo aqui — só usamos a vibe via legenda/link
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
          Responder Story
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Responde o story sem parecer carente.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Cola o link, joga o print ou o vídeo. Eu leio a vibe e te dou 8 respostas — humano, leve, desapegado.
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

      {/* Sliders */}
      <section className="mt-6 p-5 rounded-3xl ring-1 ring-border bg-card/30">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Ajuste IA
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
            </label>
          ))}
        </div>
      </section>

      {/* CTA */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => mutation.mutate()}
        className="mt-6 w-full py-4 rounded-2xl font-medium text-base bg-gradient-to-r from-violet to-accent text-background disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition shadow-[0_0_40px_-10px_var(--violet)]"
      >
        {mutation.isPending ? "IA lendo o story…" : "RESPONDER STORY"}
      </button>

      {mutation.isError && (
        <div className="mt-4 p-4 rounded-2xl ring-1 ring-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(mutation.error as Error)?.message ?? "Deu ruim. Tenta de novo."}
        </div>
      )}

      {/* Result */}
      {result && (() => {
        const ranking = result.ranking;
        const tagsPorIdx = new Map<number, string[]>();
        const add = (i: number, tag: string) => {
          const arr = tagsPorIdx.get(i) ?? [];
          arr.push(tag);
          tagsPorIdx.set(i, arr);
        };
        add(result.melhor_indice, "🏆 Melhor");
        add(ranking.engracada, "😂 Engraçada");
        add(ranking.ousada, "😏 Ousada");
        add(ranking.misteriosa, "👀 Misteriosa");
        add(ranking.segura, "🛡️ Segura");

        const corBar = (v: number, invert = false) => {
          const ok = invert ? v <= 20 : v >= 70;
          const mid = invert ? v <= 40 : v >= 50;
          return ok ? "bg-emerald-400" : mid ? "bg-amber-400" : "bg-red-400";
        };

        return (
        <section className="mt-10 grid gap-5 animate-fade-up">
          {/* Nível de Confiança + Identificação */}
          <div className="p-5 rounded-3xl ring-1 ring-emerald-400/25 bg-emerald-400/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">Nível de Confiança</div>
              <span className="text-foreground tabular-nums text-sm font-medium">{result.nivel_confianca}%</span>
            </div>
            <div className="h-2 rounded-full bg-card overflow-hidden mb-5">
              <div
                className={`h-full ${corBar(result.nivel_confianca)} transition-all`}
                style={{ width: `${result.nivel_confianca}%` }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2">✓ O que foi identificado</div>
                <ul className="grid gap-1.5">
                  {result.identificado.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-emerald-400 shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-red-400 mb-2">✗ O que não pode ser confirmado</div>
                <ul className="grid gap-1.5">
                  {result.nao_confirmado.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-red-400 shrink-0">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>


          {/* Detector de Tipo de Story */}
          <div className="p-5 rounded-3xl ring-1 ring-accent/30 bg-gradient-to-br from-accent/10 to-violet/5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-accent">Tipo Detectado</div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                confiança {result.nivel_confianca}%
              </span>
            </div>
            <div className="text-xl font-medium text-foreground mb-4">{result.tipo_story}</div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2">Assuntos que dá pra usar</div>
                <ul className="grid gap-1.5">
                  {result.tipo_assuntos_usar.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex gap-2">
                      <span className="text-emerald-400 shrink-0">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-red-400 mb-2">O que evitar</div>
                <ul className="grid gap-1.5">
                  {result.tipo_assuntos_evitar.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-red-400 shrink-0">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {result.intencao_incerta && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/30 text-xs text-amber-200">
                ⚠️ Não tenho elementos suficientes pra afirmar a intenção. Vou focar só no que aparece no story.
              </div>
            )}
          </div>

          <div className="p-5 rounded-3xl ring-1 ring-violet/25 bg-violet/5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-violet mb-2">Leitura</div>
            <p className="text-sm text-foreground">{result.leitura}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div>
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Vibe</div>
                <div className="text-foreground mt-0.5">{result.vibe}</div>
              </div>
              <div>
                <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Intenção</div>
                <div className="text-foreground mt-0.5">{result.intencao}</div>
              </div>
            </div>
            <div className="mt-4 text-xs">
              <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Evitar</div>
              <div className="text-foreground mt-0.5">{result.evitar}</div>
            </div>
          </div>

          {/* Detector de assunto */}
          <div className="p-5 rounded-3xl ring-1 ring-accent/25 bg-accent/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-accent">Detector de Assunto</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full ring-1 ring-accent/40 text-accent">
                {result.duracao_estimada}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Potencial de Conversa</span>
              <span className="text-foreground tabular-nums">{result.potencial_conversa}/100</span>
            </div>
            <div className="h-2 rounded-full bg-card overflow-hidden">
              <div
                className={`h-full ${corBar(result.potencial_conversa)} transition-all`}
                style={{ width: `${result.potencial_conversa}%` }}
              />
            </div>
          </div>

          {/* Melhor resposta destaque */}
          {result.respostas[result.melhor_indice] && (
            <div className="p-5 rounded-3xl ring-2 ring-violet bg-gradient-to-br from-violet/15 to-accent/5 shadow-[0_0_40px_-10px_var(--violet)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-violet font-medium">🏆 Melhor Resposta</span>
                <button
                  onClick={() => copy(result.respostas[result.melhor_indice].texto, -1)}
                  className="text-[11px] px-3 py-1 rounded-full bg-violet text-background hover:brightness-110 transition"
                >
                  {copied === -1 ? "copiado ✓" : "copiar"}
                </button>
              </div>
              <p className="text-[17px] text-foreground leading-snug font-medium">
                {result.respostas[result.melhor_indice].texto}
              </p>
              <p className="text-xs text-muted-foreground mt-3 italic">
                {result.melhor_motivo}
              </p>
            </div>
          )}

          {/* Todas as respostas com scores */}
          <div className="grid gap-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Todas as respostas</div>
            {result.respostas.map((r, i) => {
              const tags = tagsPorIdx.get(i) ?? [];
              return (
                <div
                  key={i}
                  className="group p-4 rounded-2xl ring-1 ring-border bg-card/40 hover:ring-accent/30 transition"
                >
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-accent">{r.tipo}</span>
                      {tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet/15 text-violet">
                          {t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => copy(r.texto, i)}
                      className="text-[11px] px-2.5 py-1 rounded-full ring-1 ring-border hover:ring-accent/40 hover:text-accent transition"
                    >
                      {copied === i ? "copiado ✓" : "copiar"}
                    </button>
                  </div>
                  <p className="text-[15px] text-foreground leading-snug mb-3">{r.texto}</p>

                  {/* Score de humanidade */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      { label: "Naturalidade", v: r.naturalidade, invert: false },
                      { label: "Originalidade", v: r.originalidade, invert: false },
                      { label: "Carência", v: r.carencia, invert: true },
                      { label: "Chance Resposta", v: r.chance_resposta, invert: false },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="text-foreground tabular-nums">{m.v}</span>
                        </div>
                        <div className="h-1 rounded-full bg-card overflow-hidden">
                          <div className={`h-full ${corBar(m.v, m.invert)}`} style={{ width: `${m.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
        );
      })()}
    </main>
  );
}
