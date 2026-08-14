import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  responderStory,
  outraLabiaStory,
  type ResponderStoryResult,
  type ModoLabiaStory,
} from "@/lib/responder-story.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/responder-story")({
  head: () =>
    seoHead({
      path: "/responder-story",
      title: "Lábia de Cachorro — Story | resposta pronta na hora | ScanSocial",
      description:
        "Manda o print do story e recebe na hora uma resposta curta e natural, baseada num detalhe real da imagem. Dopamina rápida, zero enrolação.",
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

const MODO_LABEL: Record<ModoLabiaStory, string> = {
  fazer_rir: "😂 Fazer rir",
  provocar: "😏 Provocar",
  criar_curiosidade: "👀 Criar curiosidade",
  flertar: "🔥 Flertar",
  inteligente: "🧠 Inteligente",
  curta: "⚡ Curta",
};

const RISCO_UI: Record<"baixo" | "medio" | "alto", { label: string; cls: string }> = {
  baixo: { label: "🟢 Baixo", cls: "text-emerald-300" },
  medio: { label: "🟡 Médio", cls: "text-amber-300" },
  alto: { label: "🔴 Alto", cls: "text-red-300" },
};

function ResponderStoryPage() {
  const fn = useServerFn(responderStory);
  const outraFn = useServerFn(outraLabiaStory);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "video" | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [link, setLink] = useState("");
  const [legenda, setLegenda] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [melhor, setMelhor] = useState<string | null>(null);
  const [usadas, setUsadas] = useState<string[]>([]);
  const [verAnalise, setVerAnalise] = useState(false);
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

  const regen = useMutation({
    mutationFn: () =>
      outraFn({
        data: {
          detalhe: result?.labia_detalhe ?? "",
          assunto: result?.labia_assunto ?? "",
          abordagem: result?.labia_abordagem ?? "",
          detalhes: result?.detalhes_encontrados ?? [],
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
    setMelhor(result.labia_melhor);
    setUsadas([result.labia_melhor]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

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

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard bloqueado */
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const canSubmit = (!!imageDataUrl || link.trim().length > 0 || legenda.trim().length > 0) && !mutation.isPending;

  const corBar = (v: number, invert = false) => {
    const ok = invert ? v <= 20 : v >= 70;
    const mid = invert ? v <= 40 : v >= 50;
    return ok ? "bg-emerald-400" : mid ? "bg-amber-400" : "bg-red-400";
  };

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-violet mb-3">
          Lábia de Cachorro — Story
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          🐶📸 Dopamina rápida.
          <br />
          Zero enrolação.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Manda o print do story. A primeira coisa que você recebe é uma resposta boa pra mandar agora — baseada num detalhe real da imagem.
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
                <img src={preview} alt="Print do story enviado" className="w-24 h-24 object-cover rounded-2xl ring-1 ring-border" />
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
              <div className="text-sm font-medium text-foreground">📸 Enviar print do story</div>
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
        {mutation.isPending ? "🤖 Analisando o story…" : "🐶 GERAR LÁBIA"}
      </button>

      {mutation.isError && (
        <div className="mt-4 p-4 rounded-2xl ring-1 ring-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(mutation.error as Error)?.message ?? "Deu ruim. Tenta de novo."}
        </div>
      )}

      {/* Result */}
      {result && melhor && (() => {
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

        const risco = RISCO_UI[result.labia_risco] ?? RISCO_UI.medio;

        return (
        <section className="mt-10 grid gap-5 animate-fade-up">
          {/* 🏆 MELHOR RESPOSTA — primeiro de tudo */}
          <div className="p-5 md:p-6 rounded-3xl ring-2 ring-violet bg-gradient-to-br from-violet/15 to-accent/5 shadow-[0_0_40px_-10px_var(--violet)]">
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet font-medium mb-3">
              🏆 Melhor resposta
            </div>
            <p className="text-xl md:text-2xl text-foreground leading-snug font-medium">"{melhor}"</p>
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => copy(melhor, "melhor")}
                className="text-sm px-4 py-2 rounded-full bg-violet text-background font-medium hover:brightness-110 transition"
              >
                {copied === "melhor" ? "copiado ✓" : "Copiar"}
              </button>
              <button
                onClick={() => regen.mutate()}
                disabled={regen.isPending}
                className="text-sm px-4 py-2 rounded-full ring-1 ring-border bg-card/50 hover:ring-violet/40 disabled:opacity-40 transition"
              >
                {regen.isPending ? "gerando…" : "🔥 Outra"}
              </button>
            </div>
            {regen.isError && (
              <p className="mt-3 text-xs text-destructive">{(regen.error as Error).message}</p>
            )}
          </div>

          {/* 🐶 MODOS DE LÁBIA */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
              🐶 Modos de lábia
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.labia_modos.map((m, i) => (
                <div key={i} className="p-4 rounded-2xl ring-1 ring-border bg-card/40 hover:ring-violet/30 transition">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-violet mb-2">
                    {MODO_LABEL[m.modo] ?? m.modo}
                  </div>
                  <p className="text-[15px] text-foreground leading-snug">"{m.texto}"</p>
                  <button
                    onClick={() => copy(m.texto, `modo-${i}`)}
                    className="mt-3 text-[11px] text-muted-foreground hover:text-foreground transition"
                  >
                    {copied === `modo-${i}` ? "copiado ✓" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 🔎 LEITURA RÁPIDA */}
          <div className="p-5 rounded-3xl ring-1 ring-accent/25 bg-accent/5 grid gap-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-accent">Leitura rápida</div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">🔎 Detalhe encontrado</div>
              <p className="text-sm text-foreground">{result.labia_detalhe}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">💬 Melhor assunto</div>
                <p className="text-sm text-foreground">{result.labia_assunto}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">⚡ Abordagem</div>
                <p className="text-sm text-foreground">{result.labia_abordagem}</p>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">🎯 Risco de parecer forçado</div>
              <p className={`text-sm font-medium ${risco.cls}`}>{risco.label}</p>
            </div>
          </div>

          {/* MAIS RESPOSTAS */}
          <div className="grid gap-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Mais 8 opções</div>
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
                      onClick={() => copy(r.texto, `resp-${i}`)}
                      className="text-[11px] px-2.5 py-1 rounded-full ring-1 ring-border hover:ring-accent/40 hover:text-accent transition"
                    >
                      {copied === `resp-${i}` ? "copiado ✓" : "Copiar"}
                    </button>
                  </div>
                  <p className="text-[15px] text-foreground leading-snug">"{r.texto}"</p>
                </div>
              );
            })}
          </div>

          {/* ANÁLISE COMPLETA (opcional, escondida) */}
          <div className="rounded-3xl ring-1 ring-border bg-card/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setVerAnalise((v) => !v)}
              className="w-full px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition flex items-center justify-between"
            >
              <span>Análise completa</span>
              <span>{verAnalise ? "−" : "+"}</span>
            </button>

            {verAnalise && (
              <div className="px-5 pb-5 grid gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-400">Nível de confiança</div>
                    <span className="text-sm text-foreground tabular-nums">{result.nivel_confianca}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-card overflow-hidden">
                    <div className={`h-full ${corBar(result.nivel_confianca)}`} style={{ width: `${result.nivel_confianca}%` }} />
                  </div>
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

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-violet mb-2">Tipo detectado</div>
                  <div className="text-lg text-foreground mb-3">{result.tipo_story}</div>
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
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Detalhes encontrados</div>
                  <ul className="grid gap-1.5">
                    {result.detalhes_encontrados.map((item, i) => (
                      <li key={i} className="text-sm text-foreground flex gap-2">
                        <span className="text-violet shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Potencial de conversa</div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{result.duracao_estimada}</span>
                    <span className="text-foreground tabular-nums">{result.potencial_conversa}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-card overflow-hidden">
                    <div className={`h-full ${corBar(result.potencial_conversa)}`} style={{ width: `${result.potencial_conversa}%` }} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Leitura</div>
                  <p className="text-sm text-foreground">{result.leitura}</p>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">O que não mandar</div>
                  <p className="text-sm text-foreground">{result.evitar}</p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full py-3 rounded-2xl text-sm ring-1 ring-violet/30 text-violet hover:bg-violet/5 transition disabled:opacity-50"
          >
            {mutation.isPending ? "Analisando de novo…" : "↻ Analisar story de novo"}
          </button>
        </section>
        );
      })()}
    </main>
  );
}
