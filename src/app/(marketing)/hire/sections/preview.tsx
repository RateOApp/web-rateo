import { Ic } from "./svg-icon";
import { Reveal } from "./reveal";
import { StartHiringLink } from "./start-hiring-link";

const SIDE: [string, string][] = [
  ["user", "Candidates"],
  ["brief", "My jobs"],
  ["star", "Reviews"],
  ["chart", "Insights"],
  ["build", "Company page"],
];

const ROWS: { a: string; bg: string; color?: string; name: string; sub: string; score: string }[] = [
  { a: "AO", bg: "#1C6F66", name: "Adaeze O.", sub: "Product Manager · Lagos", score: "4.9" },
  { a: "TB", bg: "#F89C1C", color: "#141414", name: "Tunde B.", sub: "Software Engineer · Lagos", score: "4.8" },
  { a: "CE", bg: "#2B6F68", name: "Chioma E.", sub: "Operations Lead · Abuja", score: "4.7" },
];

const KPIS: [string, string][] = [
  ["4.8", "Company rating"],
  ["12", "Matched candidates"],
  ["3", "Open roles"],
];

export function Preview() {
  return (
    <section id="preview">
      <div className="w">
        <Reveal className="hd">
          <span className="eye">Your hiring view</span>
          <h2>See who you’re hiring before day one.</h2>
          <p>Compare candidates side by side with verified ratings, not just a CV.</p>
        </Reveal>
        <Reveal className="dash">
          <div className="bar">
            <i />
            <i />
            <i />
          </div>
          <div className="dg">
            <div className="side">
              {SIDE.map(([icon, label], i) => (
                <div key={label} className={i === 0 ? "on" : undefined}>
                  <Ic id={icon} />
                  {label}
                </div>
              ))}
            </div>
            <div className="main">
              <div className="kp">
                {KPIS.map(([v, l]) => (
                  <div key={l}>
                    <b>{v}</b>
                    <small>{l}</small>
                  </div>
                ))}
              </div>
              {ROWS.map((r) => (
                <div className="tr" key={r.a}>
                  <div className="a" style={{ background: r.bg, color: r.color }}>
                    {r.a}
                  </div>
                  <div>
                    <b>{r.name}</b>
                    <small>{r.sub}</small>
                  </div>
                  <div>
                    <span className="vf">
                      <Ic id="shield" size={14} />
                      Verified reviews
                    </span>
                  </div>
                  <div className="sc">
                    <Ic id="star" size={18} />
                    {r.score}
                  </div>
                  <StartHiringLink location="preview"
                    className="btn"
                    style={{ padding: "9px 18px", fontSize: 14 }}
                    
                  >
                    View
                  </StartHiringLink>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <p className="note">Illustrative preview with sample profiles.</p>
      </div>
    </section>
  );
}
