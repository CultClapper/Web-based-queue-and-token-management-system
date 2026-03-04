import React, { useEffect, useMemo, useState } from 'react';

export default React.memo(function LiveProgress({
  start,
  expectedMinutes,
  className = '',
  barClassName = '',
}) {
  const startMs = useMemo(() => (start ? new Date(start).getTime() : NaN), [start]);
  const expectedMs =
    typeof expectedMinutes === 'number' && expectedMinutes > 0
      ? expectedMinutes * 60 * 1000
      : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [start]);

  if (!start || !expectedMs || Number.isNaN(startMs)) return null;

  const elapsed = Math.max(0, now - startMs);
  const pct = Math.min(100, (elapsed / expectedMs) * 100);

  return (
    <div className={className}>
      <div className="h-2 w-full rounded bg-slate-800">
        <div
          className={`h-2 rounded bg-emerald-400 transition-[width] duration-500 ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});

