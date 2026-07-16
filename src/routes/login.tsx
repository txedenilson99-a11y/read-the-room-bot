import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    seoHead({
      path: "/login",
      title: "Entrar — ScanSocial",
      description:
        "Entre na sua conta do ScanSocial e acesse as leituras de IA para stories, prints e conversas.",
    }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Senha curta demais").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("Invalid login")
        ? "Email ou senha errados."
        : error.message.includes("Email not confirmed")
        ? "Confirma seu email primeiro. Olha sua caixa de entrada."
        : "Não rolou. Tenta de novo.";
      toast.error(msg);
      return;
    }
    toast.success("Bem-vindo de volta.");
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Voltar</Link>
        <div className="mt-8 mb-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-2">
            ScanSocial
          </div>
          <h1 className="text-3xl font-medium tracking-tight">Entrar</h1>
          <p className="text-sm text-muted-foreground mt-2">Pega tua leitura de volta.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background font-medium py-3.5 rounded-2xl disabled:opacity-40 transition"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <Link to="/recuperar-senha" className="text-muted-foreground hover:text-foreground">
            Esqueci a senha
          </Link>
          <div className="text-muted-foreground">
            Sem conta?{" "}
            <Link to="/cadastro" className="text-accent hover:underline">
              Criar agora
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
