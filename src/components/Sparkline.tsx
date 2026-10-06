import { useUid } from './ui';

/** Curva de evolucao com area preenchida e marcador no ultimo ponto (grafico "Evolucao do campeonato"). */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const gradientId = useUid('spark');
  if (values.length < 2) return null;

  const width = 320;
  const height = 80;
  const padTop = 6;
  const padBottom = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * width;
  const y = (v: number) => padTop + (1 - (v - min) / span) * (height - padTop - padBottom);

  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" fill="none" role="img" aria-label="grafico de evolucao" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#E10600" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#E10600" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={width} y1={height * 0.25} y2={height * 0.25} stroke="#262C3A" strokeDasharray="2 3" strokeWidth="0.75" />
      <line x1="0" x2={width} y1={height * 0.62} y2={height * 0.62} stroke="#262C3A" strokeDasharray="2 3" strokeWidth="0.75" />
      <polygon fill={`url(#${gradientId})`} points={`0,${height} ${points.join(' ')} ${width},${height}`} />
      <polyline fill="none" points={points.join(' ')} stroke="#E10600" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r="4" fill="#FFFFFF" />
      <circle cx={lastX} cy={lastY} r="7" fill="none" stroke="#E10600" strokeWidth="2" />
    </svg>
  );
}
