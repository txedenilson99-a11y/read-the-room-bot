import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { analisarFoto, type MensagemResult } from "@/lib/foto.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/foto-mensagem")({
  head: () =>
    seoHead({
      path: "/foto-mensagem",
      title: "Print → Resposta — Mensagens de IA a partir de prints | ScanSocial",
      description:
        "Manda o print da conversa. A IA entende o contexto, o clima e cria respostas naturais que fazem sentido para aquela troca.",
    }),
  component: FotoMensagemPage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não consegui ler a imagem."));
    reader.readAsDataURL(file);
  });
}

function FotoMensagemPage() {
  const fn = useServerFn(analisarFoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (imageDataUrl: string) =>
      fn({ data: { mode: "mensagem", imageDataUrl, extra } }),
  });

  const result = mutation.data?.result as MensagemResult | undefined;

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
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Print → Resposta
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-balance leading-tight max-w-[26ch]">
          Manda o print. A IA entende o contexto.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Ela lê a conversa e cria respostas naturais.</p>
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
          className="w-full rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center hover:border-accent/40 hover:bg-card/60 transition-all animate-fade-up"
        >
          <div className="text-base font-medium text-foreground mb-1">Enviar Foto</div>
          <div className="text-sm text-muted-foreground">Toca aqui pra escolher uma imagem</div>
        </button>
      ) : (
        <div className="space-y-5 animate-fade-up">
          <div className="relative rounded-3xl overflow-hidden ring-1 ring-border bg-card/60">
            <img src={preview} alt="preview" className="w-full max-h-[60vh] object-contain" />
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
            placeholder="Contexto opcional: onde encontrou, o que você sabe da pessoa…"
            className="w-full resize-none rounded-2xl bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none p-4 text-sm placeholder:text-muted-foreground/60"
          />

          <button
            onClick={() => preview && mutation.mutate(preview)}
            disabled={mutation.isPending}
            className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full disabled:opacity-40 transition"
          >
            {mutation.isPending ? "IA lendo o print…" : "Gerar resposta"}
          </button>
        </div>
      )}

      {mutation.isError && (
        <div className="mt-8 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-sm">
          {(mutation.error as Error).message}
        </div>
      )}

      {result && (
        <section className="mt-12 space-y-8 animate-fade-up">
          <div className="border-t border-border pt-8">
            <span className="inline-block px-3 py-1 rounded-full bg-secondary text-[10px] font-medium uppercase tracking-wider text-muted-foreground ring-1 ring-border mb-4">
              Leitura
            </span>
            <p className="text-xl md:text-2xl font-medium text-balance leading-snug">{result.leitura}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.mensagens.map((m, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card/60 ring-1 ring-border hover:ring-accent/30 transition">
                <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">
                  {m.tipo}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">{m.texto}</p>
                <button
                  onClick={() => copy(m.texto, i)}
                  className="text-xs text-muted-foreground hover:text-foreground transition"
                >
                  {copied === i ? "Copiado ✓" : "Copiar"}
                </button>
              </div>
            ))}
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
