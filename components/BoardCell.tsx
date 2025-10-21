
'use client';

type CellProps = {
  status: 'verfuegbar' | 'krank' | 'urlaub' | 'helfer';
  isFriday: boolean;
  totalMin: number; // planned minutes that day
  feierabendMin: number; // threshold (e.g. 540 for 9h from 8-17)
};

function bgFor(props: CellProps): string {
  const { status, isFriday, totalMin, feierabendMin } = props;
  if (status === 'krank' || status === 'urlaub' || status === 'helfer') return 'bg-blue-200';
  if (isFriday && totalMin === 0) return 'bg-green-200';
  if (totalMin === 0) return 'bg-red-200';
  if (totalMin >= feierabendMin) {
    // Full or overbooked: darker yellow if overbooked
    return totalMin > feierabendMin ? 'bg-yellow-400' : 'bg-yellow-200';
  }
  return 'bg-yellow-100';
}

export default function BoardCell(props: CellProps) {
  const bg = bgFor(props);
  const hours = (props.totalMin/60).toFixed(1);
  return (
    <div className={`${bg} border border-white text-xs p-1 h-10 flex items-center justify-center`}
         title={`${hours}h geplant`}>
      {hours}h
    </div>
  );
}
