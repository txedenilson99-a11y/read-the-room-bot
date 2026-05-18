import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — ScanSocial" },
      { name: "description", content: "Recupere o acesso à sua conta." },
    ],
  }),
  component: RecuperarPage,
});

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) { toast.error("Email inválido"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) { toast.error("Não rolou. Tenta de novo."); return; }
    setSent(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">← Entrar</Link>
        <div className="mt-8 mb-8">
          <h1 className="text-3xl font-medium tracking-tight">Esqueci a senha</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Te mando um link pra criar uma nova.
          </p>
        </div>

        {sent ? (
          <div className="p-5 rounded-2xl bg-accent/10 ring-1 ring-accent/20 text-sm">
            Olha tua caixa de entrada. O link tá lá.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-foreground text-background font-medium py-3.5 rounded-2xl disabled:opacity-40 transition"
            >
              {submitting ? "Mandando…" : "Mandar link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
