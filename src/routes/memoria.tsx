import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/memoria")({
  head: () => ({
    meta: [
      { title: "Perfis & Memória — ScanSocial" },
      { name: "description", content: "A IA aprende a vibe de cada pessoa." },
    ],
  }),
  component: MemoriaPage,
});

type Origem = "Instagram" | "Tinder" | "Badoo" | "WhatsApp" | "Vida real" | "Outro";
type Vibe = "Low profile" | "Engraçada" | "Fria" | "Debochada" | "Misteriosa" | "Emocional" | "Social";
type Objetivo = "Flertar" | "Criar conexão" | "Conversa casual" | "Match" | "Reconquistar" | "Fazer amizade";

type PersonProfile = {
  id: string;
  nome: string;
  descricao: string;
  origem: Origem;
  vibe: Vibe;
  objetivo: Objetivo;
  interesse: number; // 0-100
  ultimaInteracao?: string;
  memorias: string[];
  createdAt: number;
};

const ORIGENS: Origem[] = ["Instagram", "Tinder", "Badoo", "WhatsApp", "Vida real", "Outro"];
const VIBES: Vibe[] = ["Low profile", "Engraçada", "Fria", "Debochada", "Misteriosa", "Emocional", "Social"];
const OBJETIVOS: Objetivo[] = ["Flertar", "Criar conexão", "Conversa casual", "Match", "Reconquistar", "Fazer amizade"];

const SAMPLE_ULTIMAS = [
  "kkkk pior que sim",
  "vish, sério isso?",
  "depois vejo, tô ocupada",
  "boa kkk",
  "manda aí",
];

const SAMPLE_MEMORIAS = [
  "ela respondeu rápido hoje",
  "usou mais emoji",
  "pareceu mais confortável",
  "demorou 6h pra responder",
  "respondeu com áudio",
  "puxou assunto primeiro",
  "evitou pergunta direta",
];

const KEY = "scansocial.perfis";

function load(): PersonProfile[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersonProfile[]) : [];
  } catch {
    return [];
  }
}
function save(list: PersonProfile[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function MemoriaPage() {
  const [list, setList] = useState<PersonProfile[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PersonProfile | null>(null);

  useEffect(() => {
    setList(load());
    setReady(true);
  }, []);

  const persist = (next: PersonProfile[]) => {
    setList(next);
    save(next);
  };

  const onCreate = (p: PersonProfile) => {
    persist([p, ...list]);
    toast.success("Perfil criado. A IA já tá aprendendo.");
  };

  const onDelete = (id: string) => {
    persist(list.filter((p) => p.id !== id));
    toast.success("Perfil apagado.");
  };

  return (
    <main className="relative max-w-3xl mx-auto px-5 md:px-6 pt-10 md:pt-14 pb-40">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/3 w-[560px] h-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />
        <div className="absolute top-10 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
      </div>

      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Voltar
      </Link>

      <header className="mt-6 mb-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex size-2">
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--violet)", opacity: 0.6 }} />
            <span className="relative rounded-full size-2" style={{ background: "var(--violet)", boxShadow: "0 0 10px var(--violet)" }} />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Cérebro social
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Perfis & Memória</h1>
        <p className="mt-2 text-muted-foreground">A IA aprende a vibe de cada pessoa.</p>
      </header>

      {/* novo perfil button */}
      <button
        onClick={() => { setEditing(null); setOpen(true); }}
        className="group relative w-full mb-8 p-5 rounded-3xl overflow-hidden ring-1 ring-accent/30 hover:ring-accent/60 transition-all animate-fade-up"
        style={{
          background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 16%, transparent), color-mix(in oklab, var(--violet) 14%, transparent))",
          boxShadow: "0 0 40px color-mix(in oklab, var(--accent) 18%, transparent)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="scan-line" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-[0.28em] text-accent mb-1">Adicionar pessoa</div>
            <div className="text-lg md:text-xl font-medium text-foreground">+ Novo Perfil</div>
          </div>
          <span className="size-10 rounded-full bg-accent/20 ring-1 ring-accent/40 grid place-items-center text-accent text-lg group-hover:scale-110 transition-transform">
            +
          </span>
        </div>
      </button>

      {/* list */}
      {ready && list.length === 0 && (
        <EmptyState onCreate={() => { setEditing(null); setOpen(true); }} />
      )}

      <div className="space-y-4">
        {list.map((p, i) => (
          <PersonCard
            key={p.id}
            person={p}
            delay={i * 60}
            onDelete={() => onDelete(p.id)}
            onEdit={() => { setEditing(p); setOpen(true); }}
          />
        ))}
      </div>

      {open && (
        <ProfileModal
          initial={editing}
          onClose={() => setOpen(false)}
          onSave={(p) => {
            if (editing) {
              persist(list.map((x) => (x.id === p.id ? p : x)));
              toast.success("Perfil atualizado.");
            } else {
              onCreate(p);
            }
            setOpen(false);
          }}
        />
      )}
    </main>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const exemplos = [
    { nome: "Ana Academia", vibe: "Low profile · humor seco", origem: "Instagram", interesse: 72 },
    { nome: "Bia do Tinder", vibe: "Debochada · provocadora", origem: "Tinder", interesse: 58 },
    { nome: "Lari Festa", vibe: "Social · engraçada", origem: "Instagram", interesse: 81 },
  ];
  return (
    <div className="space-y-3 mb-2 animate-fade-up">
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">Exemplos do que aparece aqui</div>
      {exemplos.map((e, i) => (
        <div key={i} className="relative p-5 rounded-2xl bg-card/30 ring-1 ring-border overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="text-foreground font-medium">{e.nome}</div>
            <div className="text-[10px] uppercase tracking-widest text-accent">{e.origem}</div>
          </div>
          <div className="text-[13px] text-muted-foreground mb-3">{e.vibe}</div>
          <InteresseBar value={e.interesse} />
        </div>
      ))}
      <button onClick={onCreate} className="w-full mt-3 text-sm text-accent hover:underline">
        Criar primeiro perfil →
      </button>
    </div>
  );
}

function InteresseBar({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Interesse detectado</span>
        <span className="text-[11px] font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-background/60 overflow-hidden ring-1 ring-border">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: "linear-gradient(90deg, var(--accent), var(--violet))",
            boxShadow: "0 0 10px var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

function PersonCard({
  person, delay, onDelete, onEdit,
}: { person: PersonProfile; delay: number; onDelete: () => void; onEdit: () => void }) {
  const [openMem, setOpenMem] = useState(false);
  return (
    <div
      className="relative p-5 md:p-6 rounded-3xl bg-card/40 ring-1 ring-border hover:ring-accent/30 transition-all overflow-hidden animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />

      <div className="relative flex items-start gap-4">
        <div
          className="size-12 shrink-0 rounded-2xl grid place-items-center text-base font-medium text-foreground ring-1 ring-accent/30"
          style={{
            background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 22%, transparent), color-mix(in oklab, var(--violet) 20%, transparent))",
            boxShadow: "0 0 20px color-mix(in oklab, var(--accent) 25%, transparent)",
          }}
        >
          {person.nome.trim().charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-medium text-foreground truncate">{person.nome}</h3>
            <span className="text-[10px] uppercase tracking-widest text-accent shrink-0">{person.origem}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Tag>{person.vibe}</Tag>
            <Tag tone="violet">{person.objetivo}</Tag>
          </div>
          {person.descricao && (
            <p className="mt-2 text-[13px] text-muted-foreground leading-snug line-clamp-2">{person.descricao}</p>
          )}
        </div>
      </div>

      <div className="relative mt-4">
        <InteresseBar value={person.interesse} />
      </div>

      {person.ultimaInteracao && (
        <div className="relative mt-4 p-3 rounded-xl bg-background/40 ring-1 ring-border">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Última interação</div>
          <div className="text-sm text-foreground/90 italic">"{person.ultimaInteracao}"</div>
        </div>
      )}

      <button
        onClick={() => setOpenMem((v) => !v)}
        className="relative mt-4 w-full text-left p-3 rounded-xl bg-background/40 ring-1 ring-border hover:ring-violet/30 transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--violet)", boxShadow: "0 0 8px var(--violet)" }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--violet)" }}>Memória recente</span>
          </div>
          <span className="text-xs text-muted-foreground">{openMem ? "esconder" : `${person.memorias.length} sinais`}</span>
        </div>
        {openMem && (
          <ul className="mt-3 space-y-1.5">
            {person.memorias.map((m, i) => (
              <li key={i} className="text-[13px] text-foreground/85 flex gap-2">
                <span className="text-accent">•</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        )}
      </button>

      {/* actions */}
      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <ActionLink to="/responder-story" label="Ler story" />
        <ActionLink to="/foto-mensagem" label="Ler prints" />
        <ActionLink to="/primeiro-contato" label="Gerar resposta" />
        <ActionLink to="/scan/gerar-resposta" label="Continuar conversa" />
      </div>

      <div className="relative mt-3 flex items-center justify-end gap-3">
        <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground transition">Editar</button>
        <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive transition">Excluir</button>
      </div>
    </div>
  );
}

function Tag({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "violet" }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[11px] ring-1"
      style={{
        background: tone === "violet" ? "color-mix(in oklab, var(--violet) 10%, transparent)" : "color-mix(in oklab, var(--accent) 10%, transparent)",
        color: tone === "violet" ? "var(--violet)" : "var(--accent)",
        borderColor: tone === "violet" ? "color-mix(in oklab, var(--violet) 30%, transparent)" : "color-mix(in oklab, var(--accent) 30%, transparent)",
      }}
    >
      {children}
    </span>
  );
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-center text-[12px] py-2 rounded-xl bg-background/40 ring-1 ring-border hover:ring-accent/40 hover:text-foreground text-muted-foreground transition"
    >
      {label}
    </Link>
  );
}

function ProfileModal({
  initial, onClose, onSave,
}: { initial: PersonProfile | null; onClose: () => void; onSave: (p: PersonProfile) => void }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [origem, setOrigem] = useState<Origem>(initial?.origem ?? "Instagram");
  const [vibe, setVibe] = useState<Vibe>(initial?.vibe ?? "Low profile");
  const [objetivo, setObjetivo] = useState<Objetivo>(initial?.objetivo ?? "Flertar");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!nome.trim()) { toast.error("Põe um nome."); return; }
    setLoading(true);
    // simulated IA processing
    await new Promise((r) => setTimeout(r, 900));
    const interesse = initial?.interesse ?? Math.floor(40 + Math.random() * 50);
    const memorias = initial?.memorias ?? [...SAMPLE_MEMORIAS].sort(() => 0.5 - Math.random()).slice(0, 3);
    const ultimaInteracao = initial?.ultimaInteracao ?? SAMPLE_ULTIMAS[Math.floor(Math.random() * SAMPLE_ULTIMAS.length)];
    onSave({
      id: initial?.id ?? uid(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      origem, vibe, objetivo,
      interesse, ultimaInteracao, memorias,
      createdAt: initial?.createdAt ?? Date.now(),
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end md:place-items-center bg-background/70 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-3xl bg-card/90 ring-1 ring-border overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 0 60px color-mix(in oklab, var(--accent) 25%, transparent)" }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(closest-side, var(--violet), transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent 70%)" }} />

        <div className="relative p-6 md:p-7 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-accent mb-1">{initial ? "Editar" : "Adicionar"}</div>
              <h2 className="text-2xl font-medium text-foreground">{initial ? "Editar Perfil" : "Novo Perfil"}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
          </div>

          <div className="space-y-5">
            <Field label="Nome">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ana Academia"
                className="w-full bg-background/60 rounded-xl px-4 py-3 ring-1 ring-border focus:ring-accent/50 outline-none text-foreground placeholder:text-muted-foreground/60"
              />
            </Field>

            <Field label="Descrição">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Curte arte, low profile e responde seco."
                rows={2}
                className="w-full bg-background/60 rounded-xl px-4 py-3 ring-1 ring-border focus:ring-accent/50 outline-none text-foreground placeholder:text-muted-foreground/60 resize-none"
              />
            </Field>

            <Choice label="Onde se conheceram" options={ORIGENS} value={origem} onChange={setOrigem} />
            <Choice label="Vibe da Pessoa" options={VIBES} value={vibe} onChange={setVibe} tone="violet" />
            <Choice label="Objetivo" options={OBJETIVOS} value={objetivo} onChange={setObjetivo} />
          </div>

          <div className="mt-7 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-background/40 ring-1 ring-border text-muted-foreground hover:text-foreground transition"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="relative flex-1 py-3 rounded-2xl bg-accent text-accent-foreground font-medium hover:shadow-[0_0_30px_var(--accent-glow)] transition disabled:opacity-70 overflow-hidden"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-current animate-pulse" />
                  <span className="size-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "120ms" }} />
                  <span className="size-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: "240ms" }} />
                  <span className="ml-1">IA lendo vibe…</span>
                </span>
              ) : initial ? "Salvar" : "Criar Perfil"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{label}</label>
      {children}
    </div>
  );
}

function Choice<T extends string>({
  label, options, value, onChange, tone = "accent",
}: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void; tone?: "accent" | "violet" }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="px-3 py-1.5 rounded-full text-[13px] ring-1 transition"
              style={
                active
                  ? {
                      background: tone === "violet" ? "color-mix(in oklab, var(--violet) 18%, transparent)" : "color-mix(in oklab, var(--accent) 18%, transparent)",
                      color: tone === "violet" ? "var(--violet)" : "var(--accent)",
                      borderColor: tone === "violet" ? "var(--violet)" : "var(--accent)",
                      boxShadow: `0 0 14px ${tone === "violet" ? "var(--violet)" : "var(--accent)"}`,
                    }
                  : { background: "color-mix(in oklab, var(--background) 60%, transparent)", color: "var(--muted-foreground)", borderColor: "var(--border)" }
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
