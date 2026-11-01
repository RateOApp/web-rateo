import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <div className="w">
        <span>© {new Date().getFullYear()} Rateo Technologies</span>
        <span>
          <a href="https://rateo.ng/">rateo.ng</a>
          <Link href="/terms">Terms</Link>
          <Link href="/jobs">Jobs</Link>
          <a href="https://rateo.ng/privacy-policy">Privacy policy</a>
        </span>
      </div>
    </footer>
  );
}
