import { Fragment } from "react";
import { Ic } from "./svg-icon";

const ITEMS = [
  "Verified work reviews",
  "Fair for employers and professionals",
  "Anonymous, honest feedback",
  "Data-powered ratings",
  "Built for Nigeria",
];

export function Marquee() {
  return (
    <div className="marq" aria-hidden="true">
      <div className="mq">
        {[0, 1].map((k) => (
          <span key={k}>
            {ITEMS.map((t) => (
              <Fragment key={t}>
                {t}
                <Ic id="star" />
              </Fragment>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
