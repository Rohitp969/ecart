import { useEffect, useState } from "react";

// Countdown for "resend" buttons: [secondsLeft, start(seconds)]
const useCooldown = (initialSeconds = 0) => {
  const [until, setUntil] = useState(() => (initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : 0));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) return undefined;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [until]);

  const secondsLeft = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
  const start = (seconds) => {
    const current = Date.now();
    setNow(current);
    setUntil(current + seconds * 1000);
  };
  return [secondsLeft, start];
};

export default useCooldown;
