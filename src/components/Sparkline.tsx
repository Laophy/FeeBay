import { useLayoutEffect, useRef, useState } from 'react';

type Props = {
  data: { t: number; v: number }[];
  /** Deprecated — the chart now measures its container and scales to fit. */
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export function Sparkline({
  data,
  height = 80,
  stroke = '#37acf3',
  fill = 'rgba(55, 172, 243, 0.18)',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Track the container's real width so the chart scales with the layout
  // instead of overflowing on small screens.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-ink-400">
          No data yet — keep flipping.
        </div>
      ) : width > 0 ? (
        <Chart data={data} width={width} height={height} stroke={stroke} fill={fill} />
      ) : null}
    </div>
  );
}

function Chart({
  data,
  width,
  height,
  stroke,
  fill,
}: {
  data: { t: number; v: number }[];
  width: number;
  height: number;
  stroke: string;
  fill: string;
}) {
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
