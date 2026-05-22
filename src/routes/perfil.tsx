import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/use-auth";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — ScanSocial" },
      { name: "description", content: "Sua conta e estilo detectado pela IA." },
    ],
  }),
  component: PerfilPage,
});

const STATS = [
  { n: "42", label: "leituras" },
  { n: "18", label: "stories analisados" },
  { n: "91", label: "respostas criadas" },
  { n: "6", label: "matches gerados" },
];

const ESTILO = ["low profile", "humor seco", "direto", "provocação leve"];

function PerfilPage() {
  const { user } = useAuth();
  const { profile, setProfile } = useProfile(user);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (!f.type.startsWith("image/")) { toast.error("Manda uma imagem."); return; }
    if (f.size > 4 * 1024 * 1024) { toast.error("Foto até 4MB."); return; }
    setUploading(true);
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, f, { upsert: true, contentType: f.type });
    if (upErr) { setUploading(false); toast.error("Não consegui subir a foto."); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBust = `${pub.publicUrl}?t=${Date.now()}`;
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: cacheBust }).eq("id", user.id);
    setUploading(false);
    if (dbErr) { toast.error("Salvou a foto mas não atualizou o perfil."); return; }
    setProfile((p) => (p ? { ...p, avatar_url: cacheBust } : p));
    toast.success("Foto atualizada.");
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Até.");
    navigate({ to: "/login" });
  };

  const name = profile?.full_name || "Sua conta";
  const username = profile?.username;

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
        <div className="absolute top-4 right-0 w-[360px] h-[360px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Voltar
      </Link>

      <header className="mt-6 mb-8 flex items-center gap-5 animate-fade-up">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative size-20 rounded-full bg-card/60 ring-1 ring-accent/30 hover:ring-accent/60 transition overflow-hidden flex items-center justify-center"
          style={{ boxShadow: "0 0 30px color-mix(in oklab, var(--accent) 25%, transparent)" }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">foto</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/70 grid place-items-center text-[10px]">…</div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        <div>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">{name}</h1>
          {username && <p className="text-sm text-muted-foreground mt-1">@{username}</p>}
          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 ring-1 ring-accent/25">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 10px var(--accent)" }} />
            <span className="text-[10px] uppercase tracking-[0.22em] text-accent">Modo · Observador</span>
          </div>
        </div>
      </header>

      {/* stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {STATS.map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-card/40 ring-1 ring-border">
            <div className="text-2xl font-medium text-foreground">{s.n}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </section>

      {/* estilo */}
      <section className="p-5 rounded-2xl bg-card/40 ring-1 ring-border mb-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="size-1.5 rounded-full" style={{ background: "var(--violet)", boxShadow: "0 0 10px var(--violet)" }} />
          <span className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--violet)" }}>Estilo detectado</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ESTILO.map((tag) => (
            <span key={tag} className="px-3 py-1.5 rounded-full bg-background/60 ring-1 ring-border text-[13px] text-foreground/85">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <div className="p-5 rounded-2xl bg-card/30 ring-1 ring-border mb-3">
        <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Email</div>
        <p className="text-sm text-foreground">{profile?.email ?? user?.email}</p>
      </div>

      <button
        onClick={onLogout}
        className="w-full mt-4 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-destructive font-medium hover:bg-destructive/20 transition"
      >
        Sair da conta
      </button>
    </main>
  );
}
