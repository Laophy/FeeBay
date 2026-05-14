type Props = {
  data: { t: number; v: number }[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export function Sparkline({
  data,
  width = 360,
  height = 80,
  stroke = '#37acf3',
  fill = 'rgba(55, 172, 243, 0.18)',
}: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ width, height }}
      >
        No data yet — keep flipping.
      </div>
    );
  }
  const padding = 4;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const min = Math.min(...data.map((d) => d.v));
  const max = Math.max(...data.map((d) => d.v));
  const tMin = data[0].t;
  const tMax = data[data.length - 1].t;
  const range = Math.max(1, max - min);
  const tRange = Math.max(1, tMax - tMin);
  const points = data.map((d) => {
    const x = padding + ((d.t - tMin) / tRange) * w;
    const y = padding + h - ((d.v - min) / range) * h;
    return [x, y] as const;
  });
  if (points.length === 1) {
    points.push([padding + w, points[0][1]]);
  }
  const pathD = points
    .map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`))
    .join(' ');
  const areaD = `${pathD} L ${points[points.length - 1][0]},${padding + h} L ${points[0][0]},${
    padding + h
  } Z`;
  return (
    <svg width={width} height={height} className="block">
      <path d={areaD} fill={fill} />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={1.8} />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={3}
        fill={stroke}
      />
    </svg>
  );
}
