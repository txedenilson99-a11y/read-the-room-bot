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

const BADGES = [
  { label: "Observador", tone: "accent" as const },
  { label: "Frame Holder", tone: "violet" as const },
  { label: "Sem Carência", tone: "accent" as const },
];

// Radar comportamental — 5 eixos
const RADAR = [
  { axis: "Frame", value: 82 },
  { axis: "Humor", value: 74 },
  { axis: "Mistério", value: 68 },
  { axis: "Provocação", value: 61 },
  { axis: "Naturalidade", value: 88 },
];

function RadarChart({ data }: { data: { axis: string; value: number }[] }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 86;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const points = data.map((d, i) => {
    const a = angle(i);
    const rr = (d.value / 100) * r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
  });
  const polygon = points.map((p) => p.join(",")).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--violet)" stopOpacity="0.15" />
        </radialGradient>
      </defs>
      {rings.map((k, idx) => (
        <polygon
          key={idx}
          points={Array.from({ length: n })
            .map((_, i) => {
              const a = angle(i);
              return `${cx + Math.cos(a) * r * k},${cy + Math.sin(a) * r * k}`;
            })
            .join(" ")}
          fill="none"
          stroke="color-mix(in oklab, white 8%, transparent)"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: n }).map((_, i) => {
        const a = angle(i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="color-mix(in oklab, white 6%, transparent)"
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={polygon}
        fill="url(#radarFill)"
        stroke="var(--accent)"
        strokeWidth={1.5}
        style={{ filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--accent) 60%, transparent))" }}
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="var(--accent)" />
      ))}
      {data.map((d, i) => {
        const a = angle(i);
        const lx = cx + Math.cos(a) * (r + 16);
        const ly = cy + Math.sin(a) * (r + 16);
        return (
          <text
            key={d.axis}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="color-mix(in oklab, var(--foreground) 75%, transparent)"
            style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            {d.axis}
          </text>
        );
      })}
    </svg>
  );
}

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
          className="relative size-24 rounded-full overflow-hidden group"
        >
          {/* aura neon */}
          <span
            className="absolute -inset-2 rounded-full glow-breath pointer-events-none"
            style={{
              background: "conic-gradient(from 0deg, var(--accent), var(--violet), var(--accent))",
              filter: "blur(14px)",
              opacity: 0.55,
            }}
          />
          <span className="absolute inset-0 rounded-full ring-1 ring-accent/40" />
          <span
            className="absolute inset-[3px] rounded-full bg-card/80 grid place-items-center overflow-hidden"
            style={{ boxShadow: "inset 0 0 0 1px color-mix(in oklab, white 8%, transparent)" }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">foto</span>
            )}
          </span>
          {uploading && (
            <div className="absolute inset-[3px] rounded-full bg-background/70 grid place-items-center text-[10px]">…</div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight truncate">{name}</h1>
          {username && <p className="text-sm text-muted-foreground mt-1">@{username}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 ring-1 ring-accent/25">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 10px var(--accent)" }} />
              <span className="text-[10px] uppercase tracking-[0.22em] text-accent">Modo · Observador</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1"
              style={{
                background: "color-mix(in oklab, var(--violet) 10%, transparent)",
                borderColor: "color-mix(in oklab, var(--violet) 30%, transparent)",
              }}
            >
              <span className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--violet)" }}>Nível · 3 / Decifrador</span>
            </span>
          </div>
        </div>
      </header>

      {/* badges */}
      <section className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: "40ms" }}>
        {BADGES.map((b) => {
          const c = b.tone === "violet" ? "var(--violet)" : "var(--accent)";
          return (
            <span
              key={b.label}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[12px] font-medium"
              style={{ color: c, boxShadow: `0 0 18px color-mix(in oklab, ${c} 18%, transparent)` }}
            >
              <span className="size-1.5 rounded-full animate-pulse" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
              {b.label}
            </span>
          );
        })}
      </section>

      {/* stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {STATS.map((s, i) => (
          <div key={i} className="card-premium p-4">
            <div className="text-2xl font-medium text-foreground tracking-tight">{s.n}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </section>

      {/* radar comportamental */}
      <section className="card-premium p-5 md:p-6 mb-3 animate-fade-up overflow-hidden" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
            <span className="text-[10px] uppercase tracking-[0.22em] text-accent">Radar comportamental</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">energia dominante · frame</span>
        </div>
        <RadarChart data={RADAR} />
      </section>

      {/* estilo */}
      <section className="card-premium p-5 mb-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="size-1.5 rounded-full" style={{ background: "var(--violet)", boxShadow: "0 0 10px var(--violet)" }} />
          <span className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--violet)" }}>Estilo detectado</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ESTILO.map((tag) => (
            <span key={tag} className="px-3 py-1.5 rounded-full glass text-[13px] text-foreground/90">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <div className="card-premium p-5 mb-3">
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
