import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — ScanSocial" },
      { name: "description", content: "Sua conta e preferências." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Central
      </Link>

      <header className="mt-8 mb-12">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">Perfil</div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Você</h1>
      </header>

      <div className="space-y-3">
        <div className="p-6 rounded-2xl bg-card/40 ring-1 ring-border">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Modo de leitura
          </div>
          <p className="text-foreground font-medium">Observador</p>
          <p className="text-sm text-muted-foreground mt-1">Direto, sem rodeio, com peso social.</p>
        </div>

        <div className="p-6 rounded-2xl bg-card/40 ring-1 ring-border">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Idioma
          </div>
          <p className="text-foreground font-medium">Português brasileiro</p>
        </div>

        <div className="p-6 rounded-2xl bg-accent/5 ring-1 ring-accent/15">
          <div className="text-[10px] font-medium uppercase tracking-widest text-accent mb-2">
            Em breve
          </div>
          <p className="text-foreground font-medium">Conta com sincronização</p>
          <p className="text-sm text-muted-foreground mt-1">Histórico salvo na nuvem e leituras ilimitadas.</p>
        </div>
      </div>
    </main>
  );
}
