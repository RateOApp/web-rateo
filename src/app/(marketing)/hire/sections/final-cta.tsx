import Link from "next/link";
import { Ic } from "./svg-icon";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <div className="fin">
      <div className="w">
        <Reveal className="box">
          <h2>Hire people you can vouch for.</h2>
          <p>Join the Nigerian employers building trust into every hire.</p>
          <Link className="btn or" href="/register/company">
            Create employer account <Ic id="arrow" />
          </Link>
          <div className="stores">
            Or get the app:{" "}
            <a
              href="https://apps.apple.com/ng/app/rateo/id6745558274"
              target="_blank"
              rel="noreferrer noopener"
            >
              App Store
            </a>
            ·
            <a
              href="https://play.google.com/store/apps/details?id=com.rateo.mobile"
              target="_blank"
              rel="noreferrer noopener"
            >
              Google Play
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
