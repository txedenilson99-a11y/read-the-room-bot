import { useMemo } from "react";

/**
 * Camada premium de partículas + aurora.
 * Fica fixa atrás do conteúdo (z-0). Sem interação.
 */
export function Particles({ count = 28 }: { count?: number }) {
  const dots = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * -14;
      const dur = 10 + Math.random() * 12;
      const violet = Math.random() > 0.55;
      const lg = Math.random() > 0.75;
      return { i, top, left, delay, dur, violet, lg };
    });
  }, [count]);

  return (
    <div className="particles" aria-hidden>
      <div className="aurora" />
      {dots.map((d) => (
        <span
          key={d.i}
          className={`p ${d.violet ? "v" : ""} ${d.lg ? "lg" : ""}`}
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
