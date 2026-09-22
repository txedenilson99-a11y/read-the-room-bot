import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { seoHead } from "@/lib/seo";
import { definirAcesso, listarLogs, listarUsuarios } from "@/lib/access.functions";

export const Route = createFileRoute("/admin")({
  head: () =>
    seoHead({
      path: "/admin",
      title: "Painel do administrador — ScanSocial",
      description: "Área restrita: liberar ou bloquear o acesso das contas do ScanSocial.",
      noindex: true,
    }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const fetchUsuarios = useServerFn(listarUsuarios);
  const fetchLogs = useServerFn(listarLogs);
  const salvar = useServerFn(definirAcesso);

  const usuarios = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: () => fetchUsuarios({}),
    retry: false,
  });
  const logs = useQuery({
    queryKey: ["admin-logs"],
    queryFn: () => fetchLogs({}),
    retry: false,
  });

  const mutar = useMutation({
    mutationFn: (vars: { userId: string; aprovar: boolean }) => salvar({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.aprovar ? "Usuário liberado." : "Usuário bloqueado.");
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    },
    onError: (e: Error) => toast.error(e.message || "Não rolou."),
  });

  const agir = (userId: string, email: string, aprovar: boolean) => {
    const ok = window.confirm(
      `${aprovar ? "Liberar" : "Bloquear"} o acesso de ${email}?`,
    );
    if (!ok) return;
    mutar.mutate({ userId, aprovar });
  };

  if (usuarios.isError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-medium">Área restrita</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Só a conta administradora pode abrir esse painel.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm text-accent hover:underline">
            Voltar pra Central
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-10 pb-28 max-w-2xl mx-auto">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Central</Link>

      <div className="mt-6 mb-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-2">
          Modo privado
        </div>
        <h1 className="text-3xl font-medium tracking-tight">Painel do administrador</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Libere ou bloqueie o acesso de cada conta. Novos cadastros entram bloqueados.
        </p>
      </div>

      <section className="space-y-2">
        {usuarios.isLoading && (
          <div className="text-xs text-muted-foreground tracking-widest uppercase">Carregando…</div>
        )}
        {usuarios.data?.usuarios.map((u) => (
          <div
            key={u.id}
            className="bg-card/60 ring-1 ring-border rounded-2xl px-4 py-3.5 flex items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate">{u.email}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {u.aprovado ? "🟢 Liberado" : "🔒 Bloqueado"}
                {u.admin && " · administrador"}
              </div>
            </div>
            {u.admin ? (
              <span className="text-xs text-muted-foreground">protegido</span>
            ) : u.aprovado ? (
              <button
                onClick={() => agir(u.id, u.email, false)}
                disabled={mutar.isPending}
                className="text-xs font-medium rounded-full border border-border px-4 py-2 hover:bg-secondary disabled:opacity-40"
              >
                Bloquear
              </button>
            ) : (
              <button
                onClick={() => agir(u.id, u.email, true)}
                disabled={mutar.isPending}
                className="text-xs font-medium rounded-full bg-foreground text-background px-4 py-2 disabled:opacity-40"
              >
                Desbloquear
              </button>
            )}
          </div>
        ))}
      </section>

      <h2 className="mt-10 mb-3 text-sm font-medium">Histórico de ações</h2>
      <div className="space-y-1.5">
        {logs.data?.logs.length === 0 && (
          <div className="text-xs text-muted-foreground">Nenhuma ação registrada ainda.</div>
        )}
        {logs.data?.logs.map((l) => (
          <div key={l.id} className="text-xs text-muted-foreground">
            {new Date(l.created_at).toLocaleString("pt-BR")} — {l.admin_email ?? "admin"}{" "}
            {l.action} {l.target_email ?? "usuário"}
          </div>
        ))}
      </div>
    </main>
  );
}
