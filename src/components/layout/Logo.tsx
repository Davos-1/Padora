import Link from "next/link";
import { cn } from "@/lib/cn";

type LogoProps = { className?: string };

/**
 * Text placeholder for the wordmark until the operator delivers the SVG logo.
 * TODO(logo): replace with the delivered SVG (filled "V" racket neck, frame
 * segments at ~30% opacity, wordmark below).
 */
export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" aria-label="Padora – zur Startseite" className={cn("wordmark inline-flex items-center", className)}>
      PADORA
    </Link>
  );
}
