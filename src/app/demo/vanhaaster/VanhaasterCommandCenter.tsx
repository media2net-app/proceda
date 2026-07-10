"use client";

import { Suspense } from "react";
import { VanhaasterShell } from "./VanhaasterShell";

function ShellFallback() {
  return (
    <div className="vanhaaster-demo">
      <div className="vn-shell-loading">Laden…</div>
    </div>
  );
}

export function VanhaasterCommandCenter() {
  return (
    <Suspense fallback={<ShellFallback />}>
      <VanhaasterShell />
    </Suspense>
  );
}
