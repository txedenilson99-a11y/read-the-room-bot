import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/use-auth";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — ScanSocial" },
      { name: "description", content: "Sua conta e preferências." },
    ],
  }),
  component: PerfilPage,
});

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
    if (upErr) {
      setUploading(false);
      toast.error("Não consegui subir a foto.");
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBust = `${pub.publicUrl}?t=${Date.now()}`;
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({ avatar_url: cacheBust })
      .eq("id", user.id);
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

  return (
    <main className="max-w-3xl mx-auto px-6 pt-16 pb-40">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Central
      </Link>

      <header className="mt-8 mb-10 flex items-center gap-5">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative size-20 rounded-full bg-card/60 ring-1 ring-border hover:ring-accent/40 transition overflow-hidden flex items-center justify-center"
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
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">
            {profile?.full_name || "Sua conta"}
          </h1>
          {profile?.username && (
            <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
          )}
        </div>
      </header>

      <div className="space-y-3">
        <div className="p-5 rounded-2xl bg-card/40 ring-1 ring-border">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Email
          </div>
          <p className="text-sm text-foreground">{profile?.email ?? user?.email}</p>
        </div>

        <div className="p-5 rounded-2xl bg-card/40 ring-1 ring-border">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Modo de leitura
          </div>
          <p className="text-foreground font-medium">Observador</p>
          <p className="text-sm text-muted-foreground mt-1">Direto, sem rodeio, com peso social.</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-4 p-4 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 text-destructive font-medium hover:bg-destructive/20 transition"
        >
          Sair da conta
        </button>
      </div>
    </main>
  );
}
