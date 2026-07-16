import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/cadastro")({
  head: () =>
    seoHead({
      path: "/cadastro",
      title: "Criar conta — ScanSocial",
      description:
        "Crie sua conta gratuita no ScanSocial e comece a ler stories, prints e conversas com IA em segundos.",
    }),
  component: CadastroPage,
});

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Nome curto demais").max(100),
    username: z
      .string()
      .trim()
      .min(3, "Usuário curto demais")
      .max(24, "Usuário longo demais")
      .regex(/^[a-zA-Z0-9_]+$/, "Use só letras, números e _"),
    email: z.string().trim().email("Email inválido").max(255),
    password: z.string().min(6, "Senha precisa de 6+ caracteres").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não batem",
    path: ["confirm"],
  });

function CadastroPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Manda uma imagem."); return; }
    if (f.size > 4 * 1024 * 1024) { toast.error("Foto até 4MB."); return; }
    setAvatar(f);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);

    // Check username taken (RLS: select restrita ao próprio, então fazemos via signup metadata — o trigger gera fallback se já existir)
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          username: parsed.data.username,
        },
      },
    });

    if (error) {
      setSubmitting(false);
      const msg = error.message.includes("already registered") || error.message.includes("User already")
        ? "Esse email já tem conta. Tenta entrar."
        : error.message.includes("Password")
        ? "Senha fraca demais."
        : "Não rolou criar a conta. Tenta de novo.";
      toast.error(msg);
      return;
    }

    // Upload avatar (se tiver e se já tiver sessão — pode ser que precise confirmar email)
    if (avatar && data.user && data.session) {
      const ext = avatar.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${data.user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatar, { upsert: true, contentType: avatar.type });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", data.user.id);
      }
    }

    setSubmitting(false);

    if (data.session) {
      toast.success("Conta criada. Bem-vindo.");
      navigate({ to: "/" });
    } else {
      toast.success("Conta criada. Confirma teu email pra entrar.");
      navigate({ to: "/login" });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Voltar</Link>
        <div className="mt-8 mb-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-accent mb-2">
            Nova conta
          </div>
          <h1 className="text-3xl font-medium tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-2">Leva 30 segundos.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative size-24 rounded-full bg-card/60 ring-1 ring-border hover:ring-accent/40 transition overflow-hidden flex items-center justify-center"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">+ foto</span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </div>

          <input
            placeholder="Nome completo"
            value={form.full_name}
            onChange={update("full_name")}
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <input
            placeholder="Nome de usuário"
            value={form.username}
            onChange={update("username")}
            autoCapitalize="none"
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={update("password")}
            autoComplete="new-password"
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            value={form.confirm}
            onChange={update("confirm")}
            autoComplete="new-password"
            className="w-full bg-card/60 ring-1 ring-border focus:ring-accent/40 outline-none rounded-2xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/60"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground text-background font-medium py-3.5 rounded-2xl disabled:opacity-40 transition"
          >
            {submitting ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
