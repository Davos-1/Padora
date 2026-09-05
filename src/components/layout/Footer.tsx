import Link from "next/link";
import { Container } from "./Container";
import { navigation, site } from "@/lib/site";

const paymentMethods = ["TWINT", "Visa", "Mastercard", "Rechnung"] as const;

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-ink text-paper">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="wordmark text-base">PADORA</p>
          <p className="mt-3 max-w-sm text-sm text-neutral">
            {site.tagline}. Eigenentwickelte Halterungen und ausgewählte Padel-Produkte.
            Versand nur innerhalb der Schweiz.
          </p>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-12 items-center gap-2 text-sm text-paper transition-colors duration-(--duration-fast) hover:text-neutral"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            Instagram
          </a>
        </div>

        <FooterColumn title="Shop" links={navigation.footerShop} />
        <FooterColumn title="Rechtliches" links={navigation.footerLegal} />
      </Container>

      <div className="border-t border-paper/10">
        <Container className="flex flex-col gap-4 py-6 text-xs text-neutral md:flex-row md:items-center md:justify-between">
          <p>© {year} {site.name} · Alle Preise in CHF inkl. MwSt.</p>
          <ul aria-label="Zahlungsarten" className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <li
                key={method}
                className="rounded-(--radius-button) border border-paper/20 px-2 py-1 font-medium text-paper/80"
              >
                {method}
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <nav aria-label={title}>
      <h2 className="font-body text-sm font-medium text-paper">{title}</h2>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-10 items-center text-sm text-neutral transition-colors duration-(--duration-fast) hover:text-paper"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
