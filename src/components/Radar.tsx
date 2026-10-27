interface Axis { label: string; value: number } // value 0..100

/** Gráfico radar en SVG puro (sin dependencias), con tema claro/oscuro vía currentColor. */
export default function Radar({ axes, size = 300 }: { axes: Axis[]; size?: number }) {
  const c = size / 2, r = size / 2 - 52, n = axes.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)] as const;
  };
  const poly = (v: (i: number) => number) => axes.map((_, i) => pt(i, v(i)).join(',')).join(' ');
  return (
    <svg viewBox={`-50 0 ${size + 100} ${size}`} className="mx-auto w-full max-w-sm" role="img"
      aria-label={'Perfil: ' + axes.map((a) => `${a.label} ${a.value}%`).join(', ')}>
      {[25, 50, 75, 100].map((g) => (
        <polygon key={g} points={poly(() => g)} fill="none" stroke="currentColor" strokeOpacity=".15" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="currentColor" strokeOpacity=".15" />;
      })}
      <polygon points={poly((i) => axes[i].value)} fill="#6366f1" fillOpacity=".3" stroke="#6366f1" strokeWidth="2" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, a.value);
        const [lx, ly] = pt(i, 122);
        return (
          <g key={a.label}>
            <circle cx={x} cy={y} r="3.5" fill="#6366f1" />
            <text x={lx} y={ly} fontSize="10.5" textAnchor="middle" dominantBaseline="middle" fill="currentColor">
              {a.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
