
'use client';

import { useEffect, useState } from 'react';
import MonthBoard from '@/components/MonthBoard';

type Technician = { id: string; name: string };
type ApiData = {
  technicians: Technician[];
  data: Record<string, Record<string, { status:string, totalMin:number, feierabendMin:number, isFriday:boolean }>>;
  year: number; month: number;
};

function daysInMonth(year:number, month:number) { return new Date(year, month, 0).getDate(); }
function isFriday(y:number,m:number,d:number){ return new Date(y, m-1, d).getDay()===5; }

export default function Page() {
  const [year, setYear] = useState<number>(Number(process.env.DEFAULT_YEAR) || 2025);
  const [month, setMonth] = useState<number>(Number(process.env.DEFAULT_MONTH) || 7);

  const [techs, setTechs] = useState<Technician[]>([]);
  const [grid, setGrid] = useState<Record<string, Record<number, any>>>({});
  const [loading, setLoading] = useState(false);
  const feierabendMin = 9*60;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/board?year=${year}&month=${month}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`API ${r.status}`);
        const json: ApiData = await r.json();
        if (cancelled) return;
        const dim = daysInMonth(year, month);
        const tg = json.technicians;
        const out: Record<string, Record<number, any>> = {};
        for (const t of tg) {
          out[t.id] = {};
          for (let d=1; d<=dim; d++) {
            const ymd = new Date(year, month-1, d).toISOString().slice(0,10);
            const cell = json.data[t.id]?.[ymd];
            out[t.id][d] = cell ? {
              status: cell.status as any,
              isFriday: cell.isFriday,
              totalMin: cell.totalMin,
              feierabendMin: cell.feierabendMin
            } : { status:'verfuegbar', isFriday:isFriday(year,month,d), totalMin:0, feierabendMin };
          }
        }
        setTechs(tg);
        setGrid(out);
      } catch (e) {
        // fallback: nothing
        setTechs([]);
        setGrid({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [year, month]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Monats-Dispo (Echt-Daten)</h1>
      <div className="flex gap-4 items-center flex-wrap">
        <label className="text-sm">Jahr</label>
        <input type="number" className="border rounded px-2 py-1 w-24" value={year}
               onChange={e=>setYear(Number(e.target.value)||year)} />
        <label className="text-sm">Monat</label>
        <input type="number" className="border rounded px-2 py-1 w-16" value={month}
               onChange={e=>setMonth(Number(e.target.value)||month)} />
        {loading && <span className="text-sm text-gray-500">lädt…</span>}
      </div>
      <MonthBoard year={year} month={month} technicians={techs} data={grid} />
      <p className="text-sm text-gray-500">
        Datenquelle: Supabase. Leere Zellen = 0 Minuten. Freitag grün solange ungeplant.
      </p>
    </div>
  );
}
