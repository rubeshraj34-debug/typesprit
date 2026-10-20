interface LineProps {
  values: number[];
  labels?: string[];
  color?: string;
  suffix?: string;
  height?: number;
  min?: number;
  max?: number;
  goal?: number;
}

export function LineChart({ values, labels, color = '#ff5a1f', suffix = '', height = 220, min, max, goal }: LineProps) {
  const W = 640;
  const H = height;
  const P = { l: 40, r: 14, t: 16, b: 26 };
  if (!values.length) return null;
  let lo = min ?? Math.min(...values, goal ?? Infinity);
  let hi = max ?? Math.max(...values, goal ?? -Infinity);
  if (hi === lo) {
    hi += 5;
    lo = Math.max(0, lo - 5);
  }
  if (min === undefined) lo = Math.max(0, Math.floor(lo - (hi - lo) * 0.15));
  if (max === undefined) hi = Math.ceil(hi + (hi - lo) * 0.1);
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const x = (i: number) => P.l + (values.length === 1 ? iw / 2 : (i * iw) / (values.length - 1));
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * ih;
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${x(0)},${P.t + ih} ${pts} ${x(values.length - 1)},${P.t + ih}`;
  const ticks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Line chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#0e0e0e" strokeOpacity="0.1" strokeDasharray="4 4" />
          <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fontFamily="JetBrains Mono" fill="#5c5c5c">
            {Math.round(t)}
          </text>
        </g>
      ))}
      {goal !== undefined && goal >= lo && goal <= hi && (
        <g>
          <line x1={P.l} x2={W - P.r} y1={y(goal)} y2={y(goal)} stroke="#0a8f4f" strokeWidth="2" strokeDasharray="8 5" />
          <text x={W - P.r} y={y(goal) - 6} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#0a8f4f">
            GOAL {goal}{suffix}
          </text>
        </g>
      )}
      <polygon points={area} fill={color} fillOpacity="0.12" />
      <polyline points={pts} fill="none" stroke="#0e0e0e" strokeWidth="3" strokeLinejoin="round" />
      {values.map((v, i) => (
        <rect key={i} x={x(i) - 5} y={y(v) - 5} width="10" height="10" fill={color} stroke="#0e0e0e" strokeWidth="2">
          <title>{`${labels?.[i] ? labels[i] + ': ' : ''}${Math.round(v * 10) / 10}${suffix}`}</title>
        </rect>
      ))}
      {labels && labels.length > 0 && (
        <>
          <text x={x(0)} y={H - 6} fontSize="11" fontFamily="JetBrains Mono" fill="#5c5c5c" textAnchor="start">{labels[0]}</text>
          {labels.length > 1 && (
            <text x={x(labels.length - 1)} y={H - 6} fontSize="11" fontFamily="JetBrains Mono" fill="#5c5c5c" textAnchor="end">{labels[labels.length - 1]}</text>
          )}
        </>
      )}
    </svg>
  );
}

export function BarChart({ data, color = '#0a8f4f', suffix = '', height = 200, goal }: { data: { label: string; value: number }[]; color?: string; suffix?: string; height?: number; goal?: number }) {
  const W = 640;
  const H = height;
  const P = { l: 36, r: 10, t: 16, b: 26 };
  const hi = Math.max(1, goal ?? 0, ...data.map((d) => d.value)) * 1.1;
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const bw = iw / data.length;
  const y = (v: number) => P.t + (1 - v / hi) * ih;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Bar chart">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={P.l} x2={W - P.r} y1={y(hi * f)} y2={y(hi * f)} stroke="#0e0e0e" strokeOpacity="0.1" strokeDasharray="4 4" />
          <text x={P.l - 6} y={y(hi * f) + 4} textAnchor="end" fontSize="11" fontFamily="JetBrains Mono" fill="#5c5c5c">{Math.round(hi * f)}</text>
        </g>
      ))}
      {goal !== undefined && (
        <line x1={P.l} x2={W - P.r} y1={y(goal)} y2={y(goal)} stroke="#ff5a1f" strokeWidth="2" strokeDasharray="8 5" />
      )}
      {data.map((d, i) => {
        const h = (d.value / hi) * ih;
        const show = data.length <= 7 || i % 2 === (data.length - 1) % 2;
        return (
          <g key={i}>
            <rect x={P.l + i * bw + bw * 0.18} y={P.t + ih - h} width={bw * 0.64} height={Math.max(h, d.value > 0 ? 2 : 0)} fill={d.value >= (goal ?? Infinity) ? '#ff5a1f' : color} stroke="#0e0e0e" strokeWidth={d.value > 0 ? 2 : 0}>
              <title>{`${d.label}: ${d.value}${suffix}`}</title>
            </rect>
            {show && (
              <text x={P.l + i * bw + bw / 2} y={H - 6} fontSize="10" fontFamily="JetBrains Mono" fill="#5c5c5c" textAnchor="middle">{d.label.split(' ')[0]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
