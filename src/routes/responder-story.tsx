import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  responderStory,
  regenerarRespostas,
  type ResponderStoryResult,
  type RespostasObj,
  type NivelQualitativo,
} from "@/lib/responder-story.functions";

export const Route = createFileRoute("/responder-story")({
  head: () => ({
    meta: [
      { title: "Responder Story — ScanSocial" },
      { name: "description", content: "1 print, 1 análise, 8 respostas. Modo Economia." },
    ],
  }),
  component: ResponderStoryPage,
});

// ===========================================================================
// CACHE LOCAL — 30 dias. 1 imagem = 1 entrada. Histórico nunca dispara IA.
// ===========================================================================
const CACHE_KEY = "responder-story:cache:v720";
const CACHE_MS = 30 * 24 * 60 * 60 * 1000;

type CacheEntry = { hash: string; ts: number; result: ResponderStoryResult; thumb?: string };

function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(36)}_${s.length.toString(36)}`;
}

function loadCache(): CacheEntry[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as CacheEntry[];
    const now = Date.now();
    return arr.filter((e) => now - e.ts < CACHE_MS);
  } catch {
    return [];
  }
}

function saveCache(arr: CacheEntry[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(arr.slice(0, 30)));
  } catch {
    /* quota — silencioso */
  }
}

function upsertCache(entry: CacheEntry) {
  const arr = loadCache().filter((e) => e.hash !== entry.hash);
  arr.unshift(entry);
  saveCache(arr);
}

// ===========================================================================
// FILE → DATA URL
// ===========================================================================
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    r.readAsDataURL(file);
  });
}

// Thumb pequeno pra histórico (não estoura quota)
async function makeThumb(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 160;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve("");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}

// ===========================================================================
// SLIDERS — puro front. Reorganiza ordem das categorias por afinidade.
// Nunca dispara IA.
// ===========================================================================
type Sliders = {
  humor: number;
  misterio: number;
  provocacao: number;
  dominancia: number;
  naturalidade: number;
};

const CATEGORIAS: Array<keyof RespostasObj> = [
  "natural",
  "debochada",
  "ironica",
  "flow",
  "anti_gado",
  "misteriosa",
  "lider",
  "ousada",
];

const LABEL: Record<keyof RespostasObj, string> = {
  natural: "Natural",
  debochada: "Debochada",
  ironica: "Irônica",
  flow: "Flow",
  anti_gado: "Anti-Gado",
  misteriosa: "Misteriosa",
  lider: "Líder",
  ousada: "Ousada",
};

// peso de cada slider em cada categoria (0-1)
const PESOS: Record<keyof RespostasObj, Partial<Record<keyof Sliders, number>>> = {
  natural: { naturalidade: 1 },
  debochada: { humor: 0.9, provocacao: 0.4 },
  ironica: { humor: 0.6, provocacao: 0.5, misterio: 0.2 },
  flow: { naturalidade: 0.7, humor: 0.3 },
  anti_gado: { dominancia: 0.8, provocacao: 0.3 },
  misteriosa: { misterio: 1 },
  lider: { dominancia: 1 },
  ousada: { provocacao: 1, dominancia: 0.3 },
};

function scoreCategoria(cat: keyof RespostasObj, s: Sliders): number {
  const p = PESOS[cat];
  let sum = 0;
  for (const k in p) sum += (p[k as keyof Sliders] ?? 0) * (s[k as keyof Sliders] / 100);
  return sum;
}

// ===========================================================================
// VISUAL — escala qualitativa
// ===========================================================================
const NIVEL_COR: Record<NivelQualitativo, string> = {
  "Muito Baixo": "bg-red-400/15 text-red-300 ring-red-400/30",
  Baixo: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  "Médio": "bg-yellow-400/15 text-yellow-300 ring-yellow-400/30",
  Alto: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  "Muito Alto": "bg-emerald-400/20 text-emerald-200 ring-emerald-400/40",
};

const NIVEL_RISCO_COR: Record<NivelQualitativo, string> = {
  "Muito Baixo": "bg-emerald-400/20 text-emerald-200 ring-emerald-400/40",
  Baixo: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  "Médio": "bg-yellow-400/15 text-yellow-300 ring-yellow-400/30",
  Alto: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  "Muito Alto": "bg-red-400/15 text-red-300 ring-red-400/30",
};

function NivelChip({ nivel, invert = false }: { nivel: NivelQualitativo; invert?: boolean }) {
  const cor = invert ? NIVEL_RISCO_COR[nivel] : NIVEL_COR[nivel];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ring-1 ${cor}`}>{nivel}</span>;
}

// ===========================================================================
// PAGE
// ===========================================================================
function ResponderStoryPage() {
  const fnAnalise = useServerFn(responderStory);
  const fnRegen = useServerFn(regenerarRespostas);
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [result, setResult] = useState<ResponderStoryResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [historico, setHistorico] = useState<CacheEntry[]>([]);
  const [sliders, setSliders] = useState<Sliders>({
    humor: 50,
    misterio: 50,
    provocacao: 50,
    dominancia: 50,
    naturalidade: 50,
  });

  useEffect(() => {
    setHistorico(loadCache());
  }, []);

  // -------- 1) Analisar (1 chamada Vision) --------
  const analise = useMutation({
    mutationFn: async (imageDataUrl: string) => {
      const h = hashStr(imageDataUrl);
      // cache hit → ZERO chamadas Gemini
      const hit = loadCache().find((e) => e.hash === h);
      if (hit) return { result: hit.result, hash: h, cached: true };
      const r = await fnAnalise({ data: { imageDataUrl } });
      const thumb = await makeThumb(imageDataUrl);
      upsertCache({ hash: h, ts: Date.now(), result: r.result, thumb });
      return { result: r.result, hash: h, cached: false };
    },
    onSuccess: (d) => {
      setResult(d.result);
      setHash(d.hash);
      setHistorico(loadCache());
    },
  });

  // -------- 2) Regenerar respostas (text-only, sem Vision) --------
  const regen = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error("Analise um story primeiro.");
      return fnRegen({
        data: {
          detalhe_raro: result.detalhe_raro,
          melhor_assunto: result.melhor_assunto,
          leitura_observavel: result.leitura_observavel,
          tipo_detectado: result.tipo_detectado,
          respostas_anteriores: result.respostas,
        },
      });
    },
    onSuccess: (d) => {
      if (!result || !hash) return;
      const novo = { ...result, respostas: d.respostas };
      setResult(novo);
      // atualiza cache mantendo a mesma hash da imagem
      const arr = loadCache();
      const i = arr.findIndex((e) => e.hash === hash);
      if (i >= 0) {
        arr[i] = { ...arr[i], result: novo, ts: Date.now() };
        saveCache(arr);
        setHistorico(arr);
      }
    },
  });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return alert("Modo Economia: só foto.");
    if (file.size > 12_000_000) return alert("Arquivo muito grande.");
    const url = await fileToDataUrl(file);
    setPreview(url);
    setResult(null);
    setHash(null);
    analise.mutate(url);
  };

  const abrirDoHistorico = (e: CacheEntry) => {
    setPreview(e.thumb ?? null);
    setHash(e.hash);
    setResult(e.result);
    analise.reset();
  };

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // categorias reordenadas pelos sliders (puro local)
  const ordemCategorias = useMemo(() => {
    return [...CATEGORIAS].sort((a, b) => scoreCategoria(b, sliders) - scoreCategoria(a, sliders));
  }, [sliders]);

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
        ← Central
      </Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-violet mb-3">
          Responder Story · v7.20 Modo Economia
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          1 print. 1 análise. 8 respostas.
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-[52ch]">
          Uma chamada Gemini por imagem. Histórico salvo 30 dias. Regenerar não reanalisa a foto.
        </p>
      </header>

      <section className="grid gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
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
              <img src={preview} alt="" className="w-24 h-24 object-cover rounded-2xl ring-1 ring-border" />
              <div>
                <div className="text-sm font-medium text-foreground">Print carregado</div>
                <div className="text-xs text-muted-foreground">Toca pra trocar</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium text-foreground">📎 Anexar print do story</div>
              <div className="text-xs text-muted-foreground mt-1">JPG ou PNG até 12MB</div>
            </div>
          )}
        </button>
      </section>

      {analise.isPending && (
        <div className="mt-6 p-4 rounded-2xl ring-1 ring-violet/30 bg-violet/5 text-sm text-violet animate-pulse">
          IA lendo o story…
        </div>
      )}

      {analise.isError && (
        <div className="mt-4 p-4 rounded-2xl ring-1 ring-destructive/40 bg-destructive/5 text-sm text-destructive">
          {(analise.error as Error)?.message ?? "Deu ruim. Tenta de novo."}
        </div>
      )}

      {analise.data?.cached && (
        <div className="mt-4 text-[11px] text-emerald-400 uppercase tracking-wider">✓ Lido do cache · 0 chamadas Gemini</div>
      )}

      {/* ============== RESULT ============== */}
      {result && (
        <section className="mt-10 grid gap-5 animate-fade-up">
          {/* O que foi identificado / não confirmado */}
          <div className="p-5 rounded-3xl ring-1 ring-emerald-400/25 bg-emerald-400/5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2">✓ Identificado</div>
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
                <div className="text-[10px] uppercase tracking-wider text-red-400 mb-2">✗ Não pode ser confirmado</div>
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

          {/* Detalhe raro + Melhor assunto */}
          <div className="p-5 rounded-3xl ring-1 ring-violet/25 bg-gradient-to-br from-violet/8 to-accent/5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-violet mb-2">🔍 Detalhe Raro</div>
                <p className="text-sm text-foreground leading-snug">{result.detalhe_raro}</p>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2">🎯 Melhor Assunto</div>
                <p className="text-sm text-foreground font-medium leading-snug">{result.melhor_assunto}</p>
              </div>
            </div>
          </div>

          {/* Leitura observável + Possíveis leituras */}
          <div className="p-5 rounded-3xl ring-1 ring-violet/25 bg-violet/5 grid gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-violet mb-1.5">Leitura Observável</div>
              <p className="text-sm text-foreground">{result.leitura_observavel}</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Possíveis Leituras</div>
              <p className="text-sm text-muted-foreground italic">{result.possiveis_leituras}</p>
            </div>
          </div>

          {/* Tipo + Detector qualitativo */}
          <div className="p-5 rounded-3xl ring-1 ring-accent/30 bg-gradient-to-br from-accent/10 to-violet/5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-accent mb-1">Tipo Detectado</div>
                <div className="text-xl font-medium text-foreground">{result.tipo_detectado}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-accent mb-1">Detector de Assunto</div>
                <NivelChip nivel={result.detector_assunto} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2">Assuntos que dá pra usar</div>
                <ul className="grid gap-1.5">
                  {result.assuntos_usar.map((item, i) => (
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
                  {result.assuntos_evitar.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-red-400 shrink-0">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Métricas qualitativas */}
          <div className="p-5 rounded-3xl ring-1 ring-border bg-card/40">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Métricas</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(
                [
                  { k: "naturalidade", label: "Naturalidade", invert: false },
                  { k: "originalidade", label: "Originalidade", invert: false },
                  { k: "chance_resposta", label: "Chance de Resposta", invert: false },
                  { k: "risco_social", label: "Risco Social", invert: true },
                ] as const
              ).map((m) => (
                <div key={m.k} className="grid gap-1.5">
                  <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  <NivelChip nivel={result.metricas[m.k]} invert={m.invert} />
                </div>
              ))}
            </div>
          </div>

          {/* Melhor resposta */}
          <div className="p-5 rounded-3xl ring-2 ring-violet bg-gradient-to-br from-violet/15 to-accent/5 shadow-[0_0_40px_-10px_var(--violet)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-violet font-medium">🏆 Melhor Resposta</span>
              <button
                onClick={() => copy(result.melhor_resposta, "best")}
                className="text-[11px] px-3 py-1 rounded-full bg-violet text-background hover:brightness-110 transition"
              >
                {copied === "best" ? "copiado ✓" : "copiar"}
              </button>
            </div>
            <p className="text-[17px] text-foreground leading-snug font-medium">{result.melhor_resposta}</p>
            <p className="text-xs text-muted-foreground mt-3 italic">{result.porque_funciona}</p>
          </div>

          {/* Sliders locais */}
          <div className="p-5 rounded-3xl ring-1 ring-border bg-card/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reordenar (local)</div>
              <span className="text-[10px] text-emerald-400">✓ sem IA</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  ["humor", "Humor"],
                  ["misterio", "Mistério"],
                  ["provocacao", "Provocação"],
                  ["dominancia", "Dominância"],
                  ["naturalidade", "Naturalidade"],
                ] as Array<[keyof Sliders, string]>
              ).map(([k, label]) => (
                <label key={k} className="grid gap-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{label}</span>
                    <span className="tabular-nums text-foreground">{sliders[k]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliders[k]}
                    onChange={(e) => setSliders((s) => ({ ...s, [k]: Number(e.target.value) }))}
                    className="w-full accent-violet"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* 8 respostas */}
          <div className="grid gap-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Respostas · ordem por sliders</div>
            {ordemCategorias.map((cat) => (
              <div key={cat} className="group p-4 rounded-2xl ring-1 ring-border bg-card/40 hover:ring-accent/30 transition">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-accent">{LABEL[cat]}</span>
                  <button
                    onClick={() => copy(result.respostas[cat], cat)}
                    className="text-[11px] px-2.5 py-1 rounded-full ring-1 ring-border hover:ring-accent/40 hover:text-accent transition"
                  >
                    {copied === cat ? "copiado ✓" : "copiar"}
                  </button>
                </div>
                <p className="text-[15px] text-foreground leading-snug">{result.respostas[cat]}</p>
              </div>
            ))}
          </div>

          {/* Regenerar — text-only */}
          <button
            type="button"
            onClick={() => regen.mutate()}
            disabled={regen.isPending}
            className="w-full py-3 rounded-2xl text-sm ring-1 ring-violet/30 text-violet hover:bg-violet/5 transition disabled:opacity-50"
          >
            {regen.isPending ? "Gerando outra leva…" : "↻ Regenerar respostas (sem reanalisar foto)"}
          </button>
          {regen.isError && (
            <div className="text-xs text-destructive">{(regen.error as Error)?.message}</div>
          )}
        </section>
      )}

      {/* ============== HISTÓRICO ============== */}
      {historico.length > 0 && (
        <section className="mt-12 grid gap-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Histórico · 30 dias · 0 chamadas Gemini
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {historico.map((e) => (
              <button
                key={e.hash}
                onClick={() => abrirDoHistorico(e)}
                className="aspect-square rounded-xl ring-1 ring-border hover:ring-violet/40 overflow-hidden bg-card/40 transition"
                title={new Date(e.ts).toLocaleString()}
              >
                {e.thumb ? (
                  <img src={e.thumb} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[10px] text-muted-foreground">
                    {e.result.tipo_detectado}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
