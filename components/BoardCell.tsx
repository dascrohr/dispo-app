'use client';

type CellProps = {
  status: 'verfuegbar' | 'krank' | 'urlaub' | 'helfer';
  isFriday: boolean;
  totalMin: number;     // geplante Minuten
  feierabendMin: number; // Schwelle (z. B. 540 für 9h)
  closed?: boolean;      // Tag manuell abgeschlossen
};

function isFullDay(totalMin: number, feierabendMin: number, closed?: boolean) {
  if (closed) return true;
  // Voll wenn mindestens 8h geplant UND der definierte Feierabend 17:00 (>= 540 Min) ist
  return totalMin >= 480 && feierabendMin >= 540;
}

function solidBg(
  status: CellProps['status'],
  isFriday: boolean,
  totalMin: number,
  feierabendMin: number,
  closed?: boolean
) {
  if (status === 'krank' || status === 'urlaub' || status === 'helfer') return 'bg-blue-200';
  if (isFriday && totalMin === 0) return 'bg-green-200';
  if (totalMin === 0) return 'bg-red-200';
  if (isFullDay(totalMin, feierabendMin, closed)) {
    // Voll oder manuell abgeschlossen => vollständig gelb
    return totalMin > feierabendMin ? 'bg-yellow-400' : 'bg-yellow-200';
  }
  // partial wird separat als Gradient gezeichnet
  return '';
}

export default function BoardCell(props: CellProps) {
  const { status, isFriday, totalMin, feierabendMin, closed } = props;

  const partial =
    status === 'verfuegbar' &&
    totalMin > 0 &&
    !isFullDay(totalMin, feierabendMin, closed) &&
    !(isFriday && totalMin === 0);

  const bgClass = solidBg(status, isFriday, totalMin, feierabendMin, closed);
  const hours = (totalMin / 60).toFixed(1);

  // Farben an Tailwind angelehnt:
  // Gelb ≈ #FDE68A (yellow-300), Rot ≈ #FECACA (red-200)
  const style = partial
    ? { backgroundImage: 'linear-gradient(135deg, #FDE68A 50%, #FECACA 50%)' }
    : undefined;

  return (
    <div
      className={`${bgClass} border border-white text-xs h-10 flex items-center justify-center`}
      style={style}
      title={`${hours}h geplant${closed ? ' • abgeschlossen' : ''}`}
    >
      {hours}h
    </div>
  );
}