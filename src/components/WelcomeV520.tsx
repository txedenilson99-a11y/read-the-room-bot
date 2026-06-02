import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "welcome_v5_20_seen";

export function WelcomeV520() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(KEY)) {
        const t = setTimeout(() => setOpen(true), 500);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 animate-fade-up"
      style={{ background: "color-mix(in oklab, black 70%, transparent)", backdropFilter: "blur(8px)" }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md card-premium p-6 md:p-7 overflow-hidden"
      >
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 size-56 rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }}
        />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 12px var(--accent)" }} />
            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-foreground/80">
              Novidade · v5.20
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-medium tracking-tight leading-tight">
            🚀 Bem-vindo à <span className="shimmer-text">Versão 5.20</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A IA agora entende melhor contexto, imagens, stories e conversas.
          </p>

          <ul className="mt-5 space-y-2 text-sm">
            {[
              "IA Honesta",
              "Melhor leitura de prints",
              "Menos conclusões sem evidências",
              "Chat Scan melhorado",
              "Story Scan melhorado",
              "Foto → Mensagem melhorado",
              "Flow mais natural",
              "Perfis & Memória aprimorado",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="text-accent mt-0.5">✓</span>
                <span className="text-foreground/90">{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={close}
              className="w-full bg-foreground text-background font-medium px-5 py-3 rounded-full transition hover:opacity-90"
            >
              Começar
            </button>
            <Link
              to="/novidades"
              onClick={close}
              className="text-center text-xs text-muted-foreground hover:text-foreground transition"
            >
              Ver todas as novidades →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
