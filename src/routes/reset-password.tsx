import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — ScanSocial" },
      { name: "description", content: "Defina uma nova senha." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Senha precisa de 6+ caracteres"); return; }
    if (password !== confirm) { toast.error("As senhas não batem"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { toast.error("Link expirado ou inválido. Pede outro."); return; }
    toast.success("Senha atualizada.");
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className="text-3xl font-medium tracking-tight mb-2">Nova senha</h1>
        <p className="text-sm text-muted-foreground mb-8">Define uma nova e pronto.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <input
            type="password"
            placeholder="Confirmar"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background font-medium py-3.5 rounded-2xl disabled:opacity-40 transition"
          >
            {submitting ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </div>
    </main>
  );
}
