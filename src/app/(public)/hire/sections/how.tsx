import Link from "next/link";
import { Ic } from "./svg-icon";
import { Reveal } from "./reveal";

const STEPS: { icon: string; title: string; body: string }[] = [
  { icon: "user", title: "Create your account", body: "Simple, secure and ready in minutes." },
  {
    icon: "build",
    title: "Set up your company",
    body: "Find your workplace on Rate’O or add it if it isn’t listed.",
  },
  { icon: "brief", title: "Post your roles", body: "Describe the job and who you want to reach." },
  {
    icon: "shield",
    title: "Review and hire",
    body: "Compare candidates with verified ratings and reviews.",
  },
];

export function How() {
  return (
    <section className="dark" id="how">
      <div className="w sw">
        <Reveal className="stage">
          <div className="phone">
            <div className="scr" style={{ background: "#F3F3F0" }}>
              <div className="ph-top" style={{ paddingBottom: 12 }}>
                <small>Swipe to find talent</small>
                <h4 style={{ margin: 0 }}>Matches today</h4>
              </div>
              <div className="card-sw c2">
                <div className="lg" style={{ background: "#F89C1C", color: "#141414" }}>
                  OL
                </div>
                <h6>Operations Lead</h6>
                <span style={{ color: "#777" }}>Abuja · Full-time</span>
                <div>
                  <span className="chip">Verified</span>
                  <span className="chip">4.8 rated</span>
                  <span className="chip">5 yrs</span>
                </div>
                <div className="sal">Strong fit</div>
                <div className="acts">
                  <i>✕</i>
                  <i className="m">✓</i>
                </div>
              </div>
              <div className="card-sw c1">
                <div className="lg" style={{ background: "#1C6F66" }}>
                  AO
                </div>
                <h6>Adaeze O.</h6>
                <span style={{ color: "#777" }}>Product Manager · Lagos</span>
                <div>
                  <span className="chip">Verified</span>
                  <span className="chip">4.9 rated</span>
                  <span className="chip">7 yrs</span>
                </div>
                <div className="sal">Top match</div>
                <div className="acts">
                  <i>✕</i>
                  <i className="m">✓</i>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="hd" style={{ marginBottom: 30 }}>
            <span className="eye">How it works</span>
            <h2>From sign-up to first hire in four steps</h2>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="st" key={s.title}>
                <div className="n">
                  <Ic id={s.icon} />
                </div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 30 }}>
            <Link className="btn or" href="/register/company">
              Get started free <Ic id="arrow" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
