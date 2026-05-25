"use client";

import { useEffect, useState } from "react";

export function useTypewriter(
  text: string,
  options?: { speedMs?: number; enabled?: boolean; delayMs?: number },
) {
  const enabled = options?.enabled ?? true;
  const speedMs = options?.speedMs ?? 14;
  const delayMs = options?.delayMs ?? 0;
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);
    let index = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const startTimeout = setTimeout(() => {
      intervalId = setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setDone(true);
        }
      }, speedMs);
    }, delayMs);

    return () => {
      clearTimeout(startTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, enabled, speedMs, delayMs]);

  return { displayed, done };
}
