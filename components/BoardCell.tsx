'use client';

type CellProps = {
  status: 'verfuegbar' | 'krank' | 'urlaub' | 'helfer';
  isFriday: boolean;
  totalMin: number;     // geplante Minuten
  feierabendMin: number; // Schwelle (z. B. 540 für 9h)
};

function solidBg(status: CellProps['status'], isFriday: boolean, totalMin: number, feierabendMin: number) {
  if (status === 'krank' || status === 'urlaub' || status === 'helfer') return 'bg-blue-200';
  if (isFriday && totalMin === 0) return 'bg-green-200';
  if (totalMin === 0) return 'bg-red-200';
  if (totalMin >= feierabendMin) return totalMin > feierabendMin ? 'bg-yellow-400' : 'bg-yellow-200';
  // partial wird separat als Gradient gezeichnet
  return '';
}

export default function BoardCell(props: CellProps) {
  const { status, isFriday, totalMin, feierabendMin } = props;

  const isPartial =
    status === 'verfuegbar' &&
    totalMin > 0 &&
    totalMin < feierabendMin &&
    !(isFriday && totalMin === 0);

  const bgClass = solidBg(status, isFriday, totalMin, feierabendMin);
  const hours = (totalMin / 60).toFixed(1);

  // Farben an Tailwind angelehnt:
  // Gelb ≈ #FDE68A (yellow-300), Rot ≈ #FECACA (red-200)
  const style = isPartial
    ? { backgroundImage: 'linear-gradient(135deg, #FDE68A 50%, #FECACA 50%)' }
    : undefined;

  return (
    <div
      className={`${bgClass} border border-white text-xs h-10 flex items-center justify-center`}
      style={style}
      title={`${hours}h geplant`}
    >
      {hours}h
    </div>
  );
}