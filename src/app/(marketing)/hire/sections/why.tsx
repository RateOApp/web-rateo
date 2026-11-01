import type { CSSProperties } from "react";
import { CountUp } from "./count-up";
import { Ic, Stars } from "./svg-icon";
import { Reveal } from "./reveal";

const BARS: [string, string, string][] = [
  ["Reliability", "96%", "4.9"],
  ["Teamwork", "92%", "4.7"],
  ["Initiative", "94%", "4.8"],
  ["Culture fit", "90%", "4.6"],
];

export function Why() {
  return (
    <section id="why">
      <div className="w">
        <Reveal className="hd">
          <span className="eye">Why employers choose Rate’O</span>
          <h2>Stop hiring on guesswork.</h2>
          <p>
            A CV tells you what someone claims. Rate’O shows you what the people who worked with
            them say.
          </p>
        </Reveal>
        <Reveal className="bento">
          <div className="bx b1">
            <span className="eye">Transparency</span>
            <h3>Open, honest workplace relationships</h3>
            <p>Real feedback from real colleagues and managers, before you make an offer.</p>
            <div className="rv">
              <div>
                <Ic id="quote" />
                Proactive, approachable and full of innovative ideas. A true asset to any team.
              </div>
              <div>
                <Ic id="quote" />
                Delivered on time, every time, and lifted the whole team.
              </div>
            </div>
          </div>
          <div className="bx b2">
            <span className="eye">Precise metrics</span>
            <h3>Data-powered ratings and reviews</h3>
            <div className="big">
              <CountUp to={4.9} />
              <Stars style={{ paddingBottom: 14 }} />
            </div>
          </div>
          <div className="bx b3">
            <span className="eye">Community</span>
            <h3>Join professionals and businesses</h3>
            <div className="ring">
              <i style={{ background: "#123C38" }}>TA</i>
              <i style={{ background: "#2B6F68" }}>FA</i>
              <i className="you">YOU</i>
              <i style={{ background: "#141414" }}>KB</i>
              <i style={{ background: "#7A4B0A" }}>SO</i>
            </div>
          </div>
          <div className="bx b4">
            <span className="eye">Fairness</span>
            <h3>Driving fair employment practices across Nigeria</h3>
            <div className="bars">
              {BARS.map(([label, w, score]) => (
                <div key={label}>
                  {label}
                  <s style={{ "--w": w } as CSSProperties} />
                  <span>{score}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
