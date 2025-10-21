
'use client';

import BoardCell from './BoardCell';
import { daysInMonth } from '@/lib/month';

type Technician = { id: string; name: string };
type DayData = { status: 'verfuegbar'|'krank'|'urlaub'|'helfer'; totalMin: number; feierabendMin: number; isFriday: boolean };

type Props = {
  year: number;
  month: number; // 1-12
  technicians: Technician[];
  data: Record<string, Record<number, DayData>>; // data[technicianId][day]
};

export default function MonthBoard({year, month, technicians, data}: Props) {
  const dim = daysInMonth(year, month);
  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[900px]">
        <div className="grid" style={{gridTemplateColumns: `200px repeat(${dim}, minmax(34px,1fr))`}}>
          <div className="sticky left-0 z-10 bg-gray-50 border p-2 font-medium">Techniker</div>
          {Array.from({length: dim}, (_,i)=>i+1).map(day => (
            <div key={day} className="border p-2 text-center font-medium">{day}</div>
          ))}
          {technicians.map(t => (
            <>
              <div key={t.id} className="sticky left-0 z-10 bg-gray-50 border p-2">{t.name}</div>
              {Array.from({length: dim}, (_,i)=>i+1).map(day => {
                const dd = data[t.id]?.[day];
                return (
                  <BoardCell key={`${t.id}-${day}`}
                    status={dd?.status ?? 'verfuegbar'}
                    isFriday={dd?.isFriday ?? false}
                    totalMin={dd?.totalMin ?? 0}
                    feierabendMin={dd?.feierabendMin ?? 540}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
