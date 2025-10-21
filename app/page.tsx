
'use client';

import { useMemo, useState } from 'react';
import MonthBoard from '@/components/MonthBoard';

type Technician = { id: string; name: string };

function firstFridayOfMonth(year:number, month:number, day:number) {
  const d = new Date(year, month-1, day);
  return d.getDay() === 5; // 5 = Friday
}

export default function Page() {
  const [year, setYear] = useState<number>(Number(process.env.DEFAULT_YEAR) || 2025);
  const [month, setMonth] = useState<number>(Number(process.env.DEFAULT_MONTH) || 7);

  // Mocked technicians for starter preview
  const technicians: Technician[] = [
    { id: 't1', name: 'Nouraddin' },
    { id: 't2', name: 'Mohammed' },
    { id: 't3', name: 'Mostafa' },
    { id: 't4', name: 'Amin' },
  ];

  // Mocked data with variety
  const data = useMemo(() => {
    const feierabendMin = 9*60; // 8:00-17:00 = 9h
    const obj: Record<string, Record<number, any>> = {};
    for (const t of technicians) {
      obj[t.id] = {};
      for (let d=1; d<=31; d++) {
        const isFri = firstFridayOfMonth(year, month, d);
        obj[t.id][d] = { status: 'verfuegbar', totalMin: 0, feierabendMin, isFriday: isFri };
      }
    }
    // sample planning
    obj['t1'][2].totalMin = 120;
    obj['t1'][3].totalMin = feierabendMin;
    obj['t1'][4].totalMin = feierabendMin + 60;
    obj['t2'][7].status = 'krank';
    obj['t3'][10].status = 'helfer';
    obj['t4'][5].status = 'urlaub';
    return obj;
  }, [year, month]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Monats-Dispo (Starter)</h1>
      <div className="flex gap-4 items-center">
        <label className="text-sm">Jahr</label>
        <input type="number" className="border rounded px-2 py-1 w-24" value={year}
               onChange={e=>setYear(Number(e.target.value)||2025)} />
        <label className="text-sm">Monat</label>
        <input type="number" className="border rounded px-2 py-1 w-16" value={month}
               onChange={e=>setMonth(Number(e.target.value)||7)} />
        <span className="text-sm text-gray-500">Feierabend: 17:00 • Rundung: 15 Min • Freitag = Nachzügler</span>
      </div>
      <MonthBoard year={year} month={month} technicians={[...technicians]} data={data} />
      <p className="text-sm text-gray-500">
        Dies ist eine Vorschau mit Mock-Daten. Im nächsten Schritt verbinden wir Supabase und ersetzen die Mock-Daten durch echte Jobs/Status.
      </p>
    </div>
  );
}
