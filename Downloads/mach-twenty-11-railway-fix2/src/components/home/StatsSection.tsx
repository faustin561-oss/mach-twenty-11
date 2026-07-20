"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 4200, suffix: "+", label: "Verified Carriers" },
  { value: 38, suffix: "", label: "Countries Served" },
  { value: 15, suffix: "", label: "Shipment Types" },
  { value: 12, suffix: "min", label: "Avg. Quote Time" },
  { value: 96, suffix: "%", label: "On-Time Delivery" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const duration = 1200;
        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="hp-mono text-3xl font-semibold text-white md:text-4xl">
      {display.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="bg-hpnavy px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <Counter value={s.value} suffix={s.suffix} />
            <p className="hp-body mt-2 text-xs uppercase tracking-wide text-white/50">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
