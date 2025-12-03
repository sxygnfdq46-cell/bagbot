"use client";

import { memo } from "react";

function GlobalBagbotInscription() {
  return (
    <div className="global-bagbot-inscription" aria-hidden="true">
      <span className="global-bagbot-inscription__halo" />
      <span className="global-bagbot-inscription__label">THE BAGBOT</span>
      <span className="global-bagbot-inscription__glimmer" />
    </div>
  );
}

export default memo(GlobalBagbotInscription);
