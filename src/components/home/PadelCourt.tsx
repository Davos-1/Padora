"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { CourtController } from "./court-scene";
import { ZONE_IDS, ZONES, type ZoneId, type ZoneSelection } from "./court-zones";

type Props = {
  active: ZoneSelection;
  onZoneChange: (zone: ZoneSelection) => void;
};

/** Interactive 3D padel court with hotspots (three.js is loaded lazily, client only). */
export function PadelCourt({ active, onZoneChange }: Props) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const spots = useRef<Record<ZoneId, HTMLButtonElement | null>>({ glas: null, gitter: null, racket: null });
  const controller = useRef<CourtController | null>(null);
  const activeRef = useRef(active);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    activeRef.current = active;
    controller.current?.setActive(active);
  }, [active]);

  useEffect(() => {
    let cancelled = false;
    let ctrl: CourtController | null = null;
    Promise.all([import("three"), import("./court-scene")])
      .then(([THREE, scene]) => {
        if (cancelled || !canvasHost.current || !overlay.current) return;
        ctrl = scene.createCourt(THREE, canvasHost.current, overlay.current, spots.current, activeRef.current);
        controller.current = ctrl;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      ctrl?.dispose();
      controller.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={canvasHost} className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" />

      <div ref={overlay} className="pointer-events-none absolute inset-0">
        {status !== "ready" && (
          <p role="status" className="absolute inset-0 grid place-items-center text-sm text-neutral">
            {status === "loading" ? "Court wird geladen …" : "3D-Ansicht nicht verfügbar"}
          </p>
        )}

        {ZONE_IDS.map((id) => {
          const on = active === id;
          return (
            <button
              key={id}
              ref={(el) => {
                spots.current[id] = el;
              }}
              type="button"
              aria-label={ZONES[id].label}
              aria-pressed={on}
              onClick={() => onZoneChange(on ? "" : id)}
              style={{ transform: "translate(-9999px,0)" }}
              className="group pointer-events-auto absolute top-0 left-0 flex items-center gap-2 p-1 will-change-transform"
            >
              <span
                className={cn(
                  "relative grid size-10 place-items-center rounded-full border transition-colors duration-(--duration-base)",
                  on ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink",
                )}
              >
                {!on && (
                  <span aria-hidden="true" className="absolute -inset-1 rounded-full border border-surface motion-safe:animate-ping" />
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  className={cn("transition-transform duration-(--duration-base)", on && "rotate-45")}
                >
                  <path d="M8 2v12M2 8h12" />
                </svg>
              </span>
              <span
                className={cn(
                  "rounded-(--radius-pill) border border-line bg-surface px-3 py-2 text-sm font-medium whitespace-nowrap text-ink transition-opacity duration-(--duration-base) group-hover:opacity-100 group-focus-visible:opacity-100",
                  on ? "opacity-100" : "opacity-0",
                )}
              >
                {ZONES[id].label}
              </span>
            </button>
          );
        })}

        <div className="pointer-events-auto absolute right-3 bottom-3 flex items-center gap-2 md:right-6 md:bottom-6">
          <span className="hidden rounded-(--radius-pill) bg-surface/80 px-3 py-2 text-xs text-neutral sm:inline">
            Ziehen zum Drehen
          </span>
          <Button variant="secondary" className="bg-surface" onClick={() => onZoneChange("")}>
            Ganzer Court
          </Button>
        </div>
      </div>
    </div>
  );
}
