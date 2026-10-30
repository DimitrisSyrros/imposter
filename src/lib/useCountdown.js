import { useEffect, useRef, useState } from "react";

// Counts down from `total` seconds, measured against the clock so it stays exact
// even when the browser slows timers in the background. Starts running.
export function useCountdown(total, enabled) {
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(enabled);
  const endAt = useRef(Date.now() + total * 1000);

  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left * 1000;
    const tick = () => {
      const s = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) setRunning(false);
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // `left` is read only when (re)starting, to resume from where it paused
  }, [running]);

  const toggle = () => {
    if (left > 0) setRunning((r) => !r);
  };

  return { left, running, done: left === 0, toggle };
}
