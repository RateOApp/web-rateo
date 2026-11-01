import { Ic } from "./svg-icon";
import { Reveal } from "./reveal";

const FAQS: [string, string][] = [
  [
    "What is Rate’O?",
    "Rate’O is a platform where professionals and companies leave verified, fair reviews of each other. Job seekers discover workplaces and roles. Employers hire with more confidence and build a trusted brand.",
  ],
  [
    "Is it free to get started?",
    "Yes. The app is free to download and you can create your account in minutes.",
  ],
  [
    "How do reviews stay honest?",
    "Rate’O is built around fair, verified reviews in both directions. Reviewers can stay anonymous, which helps people be candid.",
  ],
  [
    "Can I add my company if it isn’t listed?",
    "Yes. Search for your workplace and add it if it isn’t already on Rate’O.",
  ],
  [
    "Where can I use Rate’O?",
    "On the App Store and Google Play, and on the web at app.rateo.ng.",
  ],
];

export function Faq() {
  return (
    <section id="faq" style={{ paddingTop: 20 }}>
      <div className="w">
        <Reveal className="hd">
          <span className="eye">FAQ</span>
          <h2>Questions employers ask</h2>
        </Reveal>
        <Reveal className="fq">
          {FAQS.map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>
                  <Ic id="plus" />
                </span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
