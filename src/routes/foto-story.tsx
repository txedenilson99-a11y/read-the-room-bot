import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { analisarFoto, type StoryResult } from "@/lib/foto.functions";

export const Route = createFileRoute("/foto-story")({
  head: () => ({
    meta: [
      { title: "Foto Story — ScanSocial" },
      { name: "description", content: "Mande o print do story, a IA decifra e te entrega a melhor resposta." },
    ],
  }),
  component: FotoStoryPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não consegui ler a imagem."));
    reader.readAsDataURL(file);
  });
}

const MODO_COR: Record<string, string> = {
  Natural: "text-accent",
  "Engraçada": "text-violet",
  "Low profile": "text-muted-foreground",
  "Provocação leve": "text-accent",
};

function FotoStoryPage() {
  const fn = useServerFn(analisarFoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (imageDataUrl: string) =>
      fn({ data: { mode: "story", imageDataUrl, extra } }),
  });

  const result = mutation.data?.result as StoryResult | undefined;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = await fileToDataUrl(file);
    setPreview(url);
    mutation.reset();
  };

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <header className="mt-8 mb-10 animate-fade-up">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-violet mb-3">
          Foto Story
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[30ch]">
          Manda o print do story. Eu leio a vibe e te dou 4 respostas naturais.
        </h1>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center hover:border-violet/40 hover:bg-card/60 transition-all animate-fade-up"
        >
          <div className="text-base font-medium text-foreground mb-1">Enviar Story</div>
          <div className="text-sm text-muted-foreground">Toca aqui pra subir o print</div>
        </button>
      ) : (
        <div className="space-y-5 animate-fade-up">
          <div className="relative rounded-3xl overflow-hidden ring-1 ring-border bg-card/60">
            <img src={preview} alt="preview" className="w-full max-h-[60vh] object-contain" />
            {mutation.isPending && (
              <>
                <div className="scan-line pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet/5 to-transparent pointer-events-none" />
              </>
            )}
            <button
              onClick={() => { setPreview(null); mutation.reset(); }}
              className="absolute top-3 right-3 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs ring-1 ring-border"
            >
              Trocar
            </button>
          </div>

          <textarea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={2}
            placeholder="Contexto opcional: quem postou, o que rolou antes…"
            className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-violet/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
          />

          <button
            onClick={() => preview && mutation.mutate(preview)}
            disabled={mutation.isPending}
            className="w-full bg-gradient-to-r from-violet to-accent text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
          >
            {mutation.isPending ? "IA analisando o story…" : "Decifrar Story"}
          </button>
        </div>
      )}

      {mutation.isError && (
        <div className="mt-8 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      {result && (
        <section className="mt-12 space-y-10 animate-fade-up">
          <div className="border-t border-border pt-8 space-y-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border mb-3">
                O que aparece
              </span>
              <p className="text-base md:text-lg text-foreground leading-snug">{result.o_que_aparece}</p>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border mb-3">
                Provável contexto
              </span>
              <p className="text-base md:text-lg text-foreground leading-snug">{result.provavel_contexto}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-card/60 ring-1 ring-border">
                <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">Melhor ângulo</div>
                <p className="text-sm text-foreground leading-relaxed">{result.melhor_angulo}</p>
              </div>
              <div className="p-4 rounded-2xl bg-card/60 ring-1 ring-border">
                <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Evitar</div>
                <p className="text-sm text-foreground leading-relaxed">{result.evitar}</p>
              </div>
            </div>
          </div>



          <div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-violet mb-4">
              Respostas prontas
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.respostas.map((r, i) => (
                <div key={i} className="p-5 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-violet/30 transition">
                  <div className={`text-[10px] font-medium uppercase tracking-widest mb-2 ${MODO_COR[r.modo] ?? "text-accent"}`}>
                    {r.modo}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">{r.texto}</p>
                  <button
                    onClick={() => copy(r.texto, i)}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {copied === i ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => preview && mutation.mutate(preview)}
            className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-secondary/70 transition"
          >
            Regenerar
          </button>
        </section>
      )}
    </main>
  );
}

