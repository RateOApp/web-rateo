import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "./theme-toggle";
import { StartHiringLink } from "./start-hiring-link";

export function SiteHeader() {
  return (
    <header>
      <div className="w nav">
        <Link className="logo" href="/hire" aria-label="Rate’O home">
          <Logo height={26} priority />
        </Link>
        <div className="nav-r">
          <nav aria-label="Main">
            <a href="#why">Why Rate’O</a>
            <a href="#how">How it works</a>
            <a href="#talent">Talent</a>
            <a href="#faq">FAQ</a>
            <Link className="login" href="/login">
              Log in
            </Link>
            <StartHiringLink location="header" className="btn" >
              Start hiring
            </StartHiringLink>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
