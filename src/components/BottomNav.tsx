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
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-card/80 backdrop-blur-xl p-1.5 rounded-full ring-1 ring-border shadow-2xl">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "px-4 py-2 text-sm font-medium rounded-full transition-colors " +
                (active
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
