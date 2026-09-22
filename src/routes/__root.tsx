import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { BottomNav } from "@/components/BottomNav";
import { Particles } from "@/components/Particles";
import { useAuth } from "@/lib/use-auth";
import { useAcesso } from "@/lib/use-acesso";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_PATHS = new Set(["/login", "/cadastro", "/recuperar-senha", "/reset-password"]);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-semibold tracking-tight text-foreground">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Essa página não existe ou foi tirada do ar.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar pra Central
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-medium text-foreground">Algo travou aqui.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tenta de novo ou volta pra Central.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-secondary">
            Central
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ScanSocial — leitura social por IA" },
      { name: "description", content: "Cola o print, conta a situação. A IA lê a intenção, o ego e o jogo social por trás." },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:title", content: "ScanSocial — leitura social por IA" },
      { property: "og:description", content: "A IA que lê o subtexto das suas conversas." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Carregando() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xs text-muted-foreground tracking-widest uppercase">Carregando…</div>
    </div>
  );
}

function ContaBloqueada({ email }: { email: string | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sair = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-3">
          Acesso privado
        </div>
        <h1 className="text-2xl font-medium tracking-tight">Conta bloqueada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O ScanSocial está em modo privado. Sua conta{email ? ` (${email})` : ""} precisa ser
          liberada pelo administrador antes de usar as ferramentas.
        </p>
        <button
          onClick={sair}
          className="mt-6 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-secondary"
        >
          Sair
        </button>
      </div>
    </main>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isPublic = PUBLIC_PATHS.has(pathname);
  const acesso = useAcesso(!!session && !isPublic);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  useEffect(() => {
    if (!loading && !session && !isPublic) {
      navigate({ to: "/login" });
    }
  }, [loading, session, isPublic, navigate]);

  if (loading) return <Carregando />;

  if (!session && !isPublic) return null;

  if (session && !isPublic) {
    if (acesso.isLoading || (!acesso.data && !acesso.isError)) return <Carregando />;
    if (acesso.isError || !acesso.data?.aprovado) {
      return <ContaBloqueada email={acesso.data?.email ?? session.user.email ?? null} />;
    }
  }

  return (
    <>
      {children}
      {session && !isPublic && <BottomNav />}
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        <Particles />
        <div className="relative z-10">
          <AuthGate>
            <Outlet />
          </AuthGate>
        </div>
        <Toaster theme="dark" />
      </div>
    </QueryClientProvider>
  );
}
