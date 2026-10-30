'use client';

type Day = { label: string; v: number };

export default function TrajChart({
  days,
  max,
  color = '#8FD8C4',
  gid = 'mt',
  pctMode = false,
}: {
  days: Day[];
  max: number;
  color?: string;
  gid?: string;
  pctMode?: boolean;
}) {
  const W = 560;
  const H = 170;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 26;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const n = days.length;
  const mx = max || 1;

  const pts = days.map((d, i) => {
    const x = padL + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
    const y = padT + ih - (Math.min(d.v, mx) / mx) * ih;
    return [x, y] as const;
  });

  const area = pts.length
    ? `M${pts[0][0]},${padT + ih}` +
      pts.map((p) => ` L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') +
      ` L${pts[pts.length - 1][0]},${padT + ih} Z`
    : '';

  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  const step = Math.ceil(n / 6) || 1;
  const labels = days.map((d, j) => ({ d, j })).filter(({ j }) => j % step === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`tg${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".34" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[1, 2, 3].map((g) => {
        const gy = padT + ih - (ih * g) / 3;
        return (
          <line
            key={g}
            x1={padL}
            y1={gy}
            x2={W - padR}
            y2={gy}
            stroke="rgba(247,241,225,.08)"
            strokeWidth="1"
          />
        );
      })}

      {area && <path d={area} fill={`url(#tg${gid})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map((p, i) => {
        const last = i === pts.length - 1;
        return (
          <g key={i}>
            <circle
              cx={p[0].toFixed(1)}
              cy={p[1].toFixed(1)}
              r={last ? 4 : 2.4}
              fill={last ? '#FFF' : '#1B2044'}
              stroke={color}
              strokeWidth="1.6"
            />
            {last && (
              <text
                x={p[0]}
                y={p[1] - 11}
                textAnchor="middle"
                fontSize="12"
                fill="#F0D394"
                fontFamily="serif"
              >
                {Math.round(days[i].v * 10) / 10}
                {pctMode ? '%' : ''}
              </text>
            )}
          </g>
        );
      })}

      {labels.map(({ d, j }) => (
        <text
          key={j}
          x={padL + (n === 1 ? iw / 2 : (j * iw) / (n - 1))}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill="rgba(247,241,225,.4)"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}
