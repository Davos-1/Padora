"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ModelViewer } from "./ModelViewer";
import { useVariantColor } from "./VariantProvider";

/** Tint for products that have a model but no colour variants. */
const DEFAULT_MODEL_COLOR = "#8A8F98";

type Props = {
  images: string[];
  alt: string;
  /** Optional `.pdm` mesh; shown as an interactive 3D view in the first slot. */
  model?: string;
};

export function Gallery({ images, alt, model }: Props) {
  const [active, setActive] = useState(0);
  const color = useVariantColor(DEFAULT_MODEL_COLOR);

  // With a model the first slot is the viewer and the photos shift by one.
  const modelSlots = model ? 1 : 0;
  const showModel = modelSlots === 1 && active === 0;
  const poster = images[0];
  const currentImage = images[active - modelSlots] ?? poster;

  return (
    <div className="flex flex-col gap-3">
      {model && (
        // Kept mounted while a photo is shown so the WebGL context survives.
        <div hidden={!showModel}>
          <ModelViewer src={model} poster={poster} alt={alt} color={color} priority />
        </div>
      )}

      {!showModel && (
        <div className="card relative aspect-square overflow-hidden">
          <Image
            key={currentImage}
            src={currentImage}
            alt={`${alt} – Bild ${active - modelSlots + 1}`}
            fill
            priority={modelSlots === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {images.length + modelSlots > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label="Weitere Ansichten">
          {model && (
            <li>
              <Thumbnail
                src={poster}
                active={showModel}
                label="3D-Ansicht anzeigen"
                onClick={() => setActive(0)}
              >
                <span className="absolute inset-x-0 bottom-0 bg-ink/70 py-0.5 text-center text-[10px] font-medium text-paper">
                  3D
                </span>
              </Thumbnail>
            </li>
          )}
          {images.map((src, i) => (
            <li key={src}>
              <Thumbnail
                src={src}
                active={active === i + modelSlots}
                label={`Bild ${i + 1} anzeigen`}
                onClick={() => setActive(i + modelSlots)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumbnail({
  src,
  active,
  label,
  onClick,
  children,
}: {
  src: string;
  active: boolean;
  label: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active}
      className={cn(
        "relative block size-16 overflow-hidden rounded-(--radius-button) border bg-line",
        active ? "border-brand" : "border-line hover:border-neutral",
      )}
    >
      <Image src={src} alt="" fill sizes="64px" className="object-cover" />
      {children}
    </button>
  );
}
