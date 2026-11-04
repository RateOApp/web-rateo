import { CountUp } from "./count-up";
import { Ic, Stars } from "./svg-icon";
import { StartHiringLink } from "./start-hiring-link";

const FACES: { t: string; bg: string; color?: string }[] = [
  { t: "TA", bg: "#123C38" },
  { t: "FA", bg: "#F89C1C", color: "#141414" },
  { t: "KB", bg: "#2B6F68" },
  { t: "SO", bg: "#141414" },
];

const CANDS: { a: string; bg: string; color?: string; name: string; role: string; score: string }[] = [
  { a: "AO", bg: "#1C6F66", name: "Adaeze O.", role: "Product Manager", score: "4.9" },
  { a: "TB", bg: "#F89C1C", color: "#141414", name: "Tunde B.", role: "Software Engineer", score: "4.8" },
  { a: "CE", bg: "#2B6F68", name: "Chioma E.", role: "Operations Lead", score: "4.7" },
  { a: "IY", bg: "#141414", name: "Ibrahim Y.", role: "Sales Manager", score: "4.7" },
];

export function Hero() {
  return (
    <section className="hero" style={{ paddingBottom: 90 }}>
      <div className="w">
        <div>
          <div className="pill">
            <b />
            Rate’O is live on iOS and Android
          </div>
          <h1>
            Hire people you can <u>actually trust.</u>
          </h1>
          <p className="lead">
            Rate’O brings verified work reviews to Nigerian hiring. See how candidates have
            performed, and show them what it’s like to work for you.
          </p>
          <div className="cta">
            <StartHiringLink location="hero" className="btn" >
              Create employer account <Ic id="arrow" />
            </StartHiringLink>
            <a className="btn ghost" href="#how">
              See how it works
            </a>
          </div>
          <div className="proof">
            <div className="faces">
              {FACES.map((f) => (
                <i key={f.t} style={{ background: f.bg, color: f.color }}>
                  {f.t}
                </i>
              ))}
            </div>
            <span>
              Professionals and companies building trust together. <b>Free to join.</b>
            </span>
          </div>
        </div>
        <div className="stage">
          <div className="fl a1">
            <div className="row">
              <div className="ic">
                <Ic id="shield" />
              </div>
              <div>
                <b>Verified review</b>
                <span style={{ color: "var(--muted)" }}>From a past employer</span>
              </div>
            </div>
          </div>
          <div className="phone">
            <div className="scr">
              <div className="ph-top">
                <small>Hello, Employer</small>
                <h4>Find your next hire</h4>
                <div className="srch">
                  <Ic id="search" />
                  Search roles or skills
                </div>
              </div>
              <div className="ph-body">
                <h5>Top rated candidates</h5>
                {CANDS.map((c, i) => (
                  <div className="cd" key={c.a}>
                    <div className="a" style={{ background: c.bg, color: c.color }}>
                      {c.a}
                    </div>
                    <div>
                      <b>{c.name}</b>
                      <span>{c.role}</span>
                    </div>
                    <em>
                      <Ic id="star" size={14} />
                      {i === 0 ? (
                        <CountUp
                          to={4.9}
                          initial={4.9}
                          style={{ color: "inherit", fontSize: "inherit" }}
                        />
                      ) : (
                        c.score
                      )}
                    </em>
                  </div>
                ))}
              </div>
              <div className="tab">
                <Ic id="home" className="i on" size={20} />
                <Ic id="search" size={20} />
                <Ic id="msg" size={20} />
                <Ic id="user" size={20} />
              </div>
            </div>
          </div>
          <div className="fl a2">
            <div className="row">
              <div className="ic" style={{ background: "#fff" }}>
                <Ic id="heart" />
              </div>
              <div>
                <b>New match</b>
                Operations Lead · Abuja
              </div>
            </div>
          </div>
          <div className="fl a3">
            <b style={{ fontSize: 26, letterSpacing: "-.04em" }}>
              4.9 <Stars />
            </b>
            Average candidate trust score
          </div>
        </div>
      </div>
    </section>
  );
}
