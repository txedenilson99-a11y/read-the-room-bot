import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Modo privado: só usuários liberados pelo administrador podem usar as ferramentas.
 * Validação 100% server-side — conhecer a URL interna não basta.
 */
export const requireAprovado = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase.rpc("is_approved", {
      _user_id: context.userId,
    });
    if (error) throw new Error("Não foi possível validar seu acesso.");
    if (data !== true) {
      throw new Error("Sua conta ainda não foi liberada pelo administrador.");
    }
    return next();
  });

/** Só administradores. */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || data !== true) throw new Error("Acesso restrito ao administrador.");
    return next();
  });
