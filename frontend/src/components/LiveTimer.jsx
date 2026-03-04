import React, { useEffect, useMemo, useState } from 'react';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${pad2(seconds)}s`;
}

export default React.memo(function LiveTimer({
  start,
  end,
  expectedMinutes,
  className = '',
  prefix = '',
}) {
  const startMs = useMemo(() => (start ? new Date(start).getTime() : NaN), [start]);
  const endMs = useMemo(() => (end ? new Date(end).getTime() : NaN), [end]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start) return undefined;
    if (end) return undefined;

    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [start, end]);

  if (!start || Number.isNaN(startMs)) return null;
  const effectiveEnd = end ? endMs : now;
  const elapsedMs = Math.max(0, effectiveEnd - startMs);

  const expectedMs =
    typeof expectedMinutes === 'number' && expectedMinutes > 0
      ? expectedMinutes * 60 * 1000
      : null;
  const deltaMs = expectedMs ? elapsedMs - expectedMs : null;
  const overBy = deltaMs && deltaMs > 0 ? ` (+${Math.ceil(deltaMs / 60000)}m)` : '';

  return (
    <span className={className}>
      {prefix}
      {formatDuration(elapsedMs)}
      {overBy}
    </span>
  );
});

