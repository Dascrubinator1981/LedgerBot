"use client";
import { useRef } from "react";
import type { ForecastPreferences } from "@/lib/forecast-preferences";
import type { Section } from "@/lib/navigation";
const labels: Record<string, string> = {
  Ledger: "Add Transaction",
  Budget: "Budget",
  Accounts: "Accounts",
  Inbox: "Inbox",
  Settings: "Settings",
  "Debt Tools": "Debt Tools",
  "Savings Plan": "Savings Plan",
};
export function QuickActions({
  actions,
  onOpen,
}: {
  actions: ForecastPreferences["quickActions"];
  onOpen: (tab: Section) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    x: number;
    start: number;
    held: boolean;
    swiped: boolean;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const overflow = actions.length > 6;
  function step(direction: number) {
    const button = strip.current?.querySelector("button");
    strip.current?.scrollBy({
      left: direction * ((button?.getBoundingClientRect().width || 130) + 8),
      behavior: "smooth",
    });
  }
  return (
    <nav aria-label="Forecast quick actions" className="quick-actions">
      {overflow && <button onClick={() => step(-1)}>← Back</button>}
      <div
        ref={strip}
        className={overflow ? "quick-strip overflow" : "quick-strip"}
        onPointerDown={(e) => {
          if (!overflow) return;
          const element = e.currentTarget;
          gesture.current = {
            x: e.clientX,
            start: element.scrollLeft,
            held: false,
            swiped: false,
            timer: setTimeout(() => {
              if (gesture.current) gesture.current.held = true;
            }, 350),
          };
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (g?.held && strip.current) {
            if (Math.abs(e.clientX - g.x) > 8) g.swiped = true;
            if (g.swiped) {
              e.preventDefault();
              strip.current.scrollLeft = g.start + g.x - e.clientX;
            }
          }
        }}
        onPointerUp={() => {
          if (gesture.current) clearTimeout(gesture.current.timer);
        }}
        onPointerCancel={() => {
          if (gesture.current) clearTimeout(gesture.current.timer);
          gesture.current = null;
        }}
        onClickCapture={(e) => {
          if (gesture.current?.swiped) {
            e.preventDefault();
            e.stopPropagation();
          }
          gesture.current = null;
        }}
      >
        {actions.map((action, i) => {
          const unavailable =
            action === "Debt Tools" || action === "Savings Plan";
          return (
            <button
              key={`${action}-${i}`}
              disabled={unavailable}
              title={
                unavailable ? "Not implemented in this milestone" : undefined
              }
              onClick={() => onOpen(action as Section)}
            >
              {labels[action]}
              {unavailable && <small>Coming later</small>}
            </button>
          );
        })}
      </div>
      {overflow && <button onClick={() => step(1)}>More →</button>}
    </nav>
  );
}
