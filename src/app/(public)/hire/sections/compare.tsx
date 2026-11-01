import { Ic } from "./svg-icon";
import { Reveal } from "./reveal";

const NO = [
  "CVs and interviews you can’t verify",
  "Slow, unreliable reference checks",
  "Great candidates who never apply",
  "Costly hires that don’t work out",
];

const YES = [
  "Verified reviews from past workplaces",
  "Ratings you can compare at a glance",
  "Reach professionals who swipe through jobs",
  "An employer profile candidates trust",
];

export function Compare() {
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="w">
        <Reveal className="hd">
          <span className="eye">The difference</span>
          <h2>Trust changes how you hire.</h2>
        </Reveal>
        <Reveal className="cmp">
          <div className="cp no">
            <h3>Without Rate’O</h3>
            <ul>
              {NO.map((t) => (
                <li key={t}>
                  <Ic id="x" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="cp yes">
            <h3>With Rate’O</h3>
            <ul>
              {YES.map((t) => (
                <li key={t}>
                  <Ic id="check" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
