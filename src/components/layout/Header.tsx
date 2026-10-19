import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { CartIcon } from "./CartIcon";
import { navigation } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo className="text-base" />
        <nav aria-label="Hauptnavigation" className="flex items-center gap-1">
          {navigation.main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${"hideOnMobile" in item ? "hidden sm:flex" : "flex"} min-h-12 items-center px-3 text-sm font-medium text-ink transition-colors duration-(--duration-fast) hover:text-brand-dark`}
            >
              {item.label}
            </Link>
          ))}
          <CartIcon />
        </nav>
      </Container>
    </header>
  );
}
