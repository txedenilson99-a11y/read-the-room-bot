import { Link, useRouterState } from "@tanstack/react-router";

const items = [
  { to: "/", label: "Central" },
  { to: "/memoria", label: "Memória" },
  { to: "/historico", label: "Histórico" },
  { to: "/perfil", label: "Perfil" },
] as const;


export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div
        className="relative flex items-center gap-1 glass-strong p-1.5 rounded-full ring-1 ring-border shadow-2xl"
        style={{ boxShadow: "0 20px 60px -20px rgba(0,0,0,0.7), 0 0 30px color-mix(in oklab, var(--accent) 12%, transparent)" }}
      >
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 " +
                (active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 22%, transparent), color-mix(in oklab, var(--violet) 18%, transparent))",
                    boxShadow: "inset 0 1px 0 color-mix(in oklab, white 12%, transparent), 0 0 20px color-mix(in oklab, var(--accent) 35%, transparent)",
                  }}
                />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
