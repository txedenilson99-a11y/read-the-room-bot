import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdmin } from "./require-aprovado";

export interface MeuAcesso {
  aprovado: boolean;
  admin: boolean;
  email: string | null;
}

/** Status do próprio usuário: liberado? admin? */
export const meuAcesso = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MeuAcesso> => {
    const [{ data: aprovado }, { data: admin }] = await Promise.all([
      context.supabase.rpc("is_approved", { _user_id: context.userId }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    return {
      aprovado: aprovado === true,
      admin: admin === true,
      email: (context.claims as { email?: string } | null)?.email ?? null,
    };
  });

export interface UsuarioAdmin {
  id: string;
  email: string;
  full_name: string | null;
  aprovado: boolean;
  admin: boolean;
  criado_em: string | null;
}

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ usuarios: UsuarioAdmin[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: perfis, error: e1 }, { data: acessos, error: e2 }, { data: papeis, error: e3 }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id, email, full_name, created_at"),
        supabaseAdmin.from("user_access").select("user_id, is_approved"),
        supabaseAdmin.from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
    if (e1 || e2 || e3) throw new Error("Não foi possível carregar os usuários.");

    const aprovados = new Set((acessos ?? []).filter((a) => a.is_approved).map((a) => a.user_id));
    const admins = new Set((papeis ?? []).map((p) => p.user_id));

    const usuarios = (perfis ?? [])
      .map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        aprovado: aprovados.has(p.id) || admins.has(p.id),
        admin: admins.has(p.id),
        criado_em: p.created_at,
      }))
      .sort((a, b) => Number(b.admin) - Number(a.admin) || a.email.localeCompare(b.email));

    return { usuarios };
  });

export const definirAcesso = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { userId?: string; aprovar?: boolean }) => {
    const userId = (input?.userId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Usuário inválido.");
    if (typeof input?.aprovar !== "boolean") throw new Error("Ação inválida.");
    return { userId, aprovar: input.aprovar };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Protege a conta administradora contra bloqueio acidental.
    const { data: ehAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: data.userId,
      _role: "admin",
    });
    if (ehAdmin === true && !data.aprovar) {
      throw new Error("A conta administradora não pode ser bloqueada.");
    }

    const { error } = await supabaseAdmin
      .from("user_access")
      .upsert(
        { user_id: data.userId, is_approved: data.aprovar, updated_by: context.userId },
        { onConflict: "user_id" },
      );
    if (error) throw new Error("Não foi possível atualizar o acesso.");

    const { data: alvo } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    await supabaseAdmin.from("admin_actions").insert({
      admin_id: context.userId,
      admin_email: (context.claims as { email?: string } | null)?.email ?? null,
      target_user_id: data.userId,
      target_email: alvo?.email ?? null,
      action: data.aprovar ? "liberou" : "bloqueou",
    });

    return { ok: true };
  });

export interface LogAdmin {
  id: string;
  admin_email: string | null;
  target_email: string | null;
  action: string;
  created_at: string;
}

export const listarLogs = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ logs: LogAdmin[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_actions")
      .select("id, admin_email, target_email, action, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("Não foi possível carregar o histórico.");
    return { logs: (data ?? []) as LogAdmin[] };
  });
