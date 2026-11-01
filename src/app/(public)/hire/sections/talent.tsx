import Link from "next/link";
import { Ic } from "./svg-icon";
import { Reveal } from "./reveal";
import { TalentGrid } from "./talent-grid";

export function Talent() {
  return (
    <section id="talent">
      <div className="w">
        <Reveal className="hd">
          <span className="eye">Top talent</span>
          <h2>Get matched with top talent</h2>
          <p>
            Browse vetted candidates, compare work history and reviews, and reach out to your top
            picks with confidence.
          </p>
        </Reveal>
        <TalentGrid />
        <div className="tmore">
          <Link className="btn" href="/register/company">
            See more candidates <Ic id="arrow" />
          </Link>
          <p className="note">
            Sample profiles for illustration. Create a free account to browse real, verified talent.
          </p>
        </div>
      </div>
    </section>
  );
}
