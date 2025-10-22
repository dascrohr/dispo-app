'use client';

import { useEffect, useMemo, useState } from 'react';

type Opt = { id: string; label: string };
type Job = {
  id?: string; meldungsnummer?: string; von?: string; bis?: string; dauer_min?: number;
  aufgabe_id?: string; objekt_id?: string; ort_id?: string; plz?: string; helfer_id?: string; bemerkung?: string;
};

function timeOptions() {
  const arr:string[] = [];
  for (let m=8*60; m<=21*60; m+=15) {
    const h = String(Math.floor(m/60)).padStart(2,'0');
    const mm = String(m%60).padStart(2,'0');
    arr.push(`${h}:${mm}`);
  }
  return arr;
}
const TIMES = timeOptions();

export default function TagDrawer(props: {
  open: boolean;
  onClose: () => void;
  year: number; month: number; day: number;
  technikerId: string; technikerName: string;
  onChanged: () => void; // refetch board
}) {
  const { open, onClose, year, month, day, technikerId, technikerName, onChanged } = props;
  const [loading, setLoading] = useState(false);
  const [tagId, setTagId] = useState<string|undefined>();
  const [status, setStatus] = useState<string>('verfuegbar');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aufgaben, setAufgaben] = useState<Opt[]>([]);
  const [objekte, setObjekte] = useState<Opt[]>([]);
  const [orte, setOrte] = useState<Opt[]>([]);
  const [helfer, setHelfer] = useState<Opt[]>([]);
  const [newJob, setNewJob] = useState<Job>({ von:'08:00', bis:'09:00' });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/day?year=${year}&month=${month}&day=${day}&technikerId=${technikerId}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        setTagId(json.tagId);
        setStatus(json.status ?? 'verfuegbar');
        setJobs(json.jobs ?? []);
        setAufgaben((json.aufgaben||[]).map((a:any)=>({id:a.id,label:a.code})));
        setObjekte((json.objekte||[]).map((a:any)=>({id:a.id,label:a.code})));
        setOrte((json.orte||[]).map((o:any)=>({id:o.id,label:`${o.plz} ${o.ort}`})));
        setHelfer((json.techniker||[]).map((t:any)=>({id:t.id,label:t.name})));
      }).finally(()=>setLoading(false));
  }, [open, year, month, day, technikerId]);

  async function saveJob() {
    if (!tagId) return;
    const res = await fetch('/api/job', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tagId, technikerId, ...newJob })
    });
    const j = await res.json();
    if (res.ok) {
      // reload jobs
      const r = await fetch(`/api/day?year=${year}&month=${month}&day=${day}&technikerId=${technikerId}`, { cache: 'no-store' });
      const js = await r.json();
      setJobs(js.jobs || []);
      setNewJob({ von:'08:00', bis:'09:00' });
      onChanged();
    } else {
      alert(j.error || 'Fehler beim Speichern');
    }
  }

  async function saveStatus(next:string) {
    if (!tagId) return;
    const res = await fetch('/api/status', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tagId, technikerId, status: next })
    });
    if (res.ok) { setStatus(next); onChanged(); }
  }

  if (!open) return null;

  const dstr = `${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}.${year}`;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose}/>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-gray-500">Planungstag</div>
            <div className="font-semibold">{technikerName} • {dstr}</div>
          </div>
          <button className="text-sm px-3 py-1 rounded border" onClick={onClose}>Schließen</button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Status</div>
          <div className="flex gap-2 flex-wrap">
            {['verfuegbar','krank','urlaub','helfer'].map(s=>(
              <button key={s}
                onClick={()=>saveStatus(s)}
                className={`px-3 py-1 rounded border text-sm ${status===s?'bg-gray-900 text-white':''}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs vorhandene */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Vorhandene Einsätze</div>
          <ul className="space-y-1 text-sm">
            {jobs.map(j=>(
              <li key={j.id} className="border rounded p-2">
                <div className="font-medium">{j.von}–{j.bis} • {j.meldungsnummer || 'ohne Meldung'}</div>
                <div className="text-gray-600">{j.bemerkung}</div>
              </li>
            ))}
            {!jobs.length && <li className="text-gray-500">Keine Einsätze</li>}
          </ul>
        </div>

        {/* Neuer Job */}
        <div className="mb-2 font-semibold">Neuer Einsatz</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-xs">Meldungsnummer</label>
            <input className="w-full border rounded px-2 py-1"
              value={newJob.meldungsnummer||''}
              onChange={e=>setNewJob(v=>({...v, meldungsnummer:e.target.value}))}/>
          </div>
          <div>
            <label className="text-xs">Von</label>
            <select className="w-full border rounded px-2 py-1"
              value={newJob.von} onChange={e=>setNewJob(v=>({...v, von:e.target.value}))}>
              {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs">Bis</label>
            <select className="w-full border rounded px-2 py-1"
              value={newJob.bis} onChange={e=>setNewJob(v=>({...v, bis:e.target.value}))}>
              {TIMES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs">Aufgabe</label>
            <select className="w-full border rounded px-2 py-1"
              value={newJob.aufgabe_id||''}
              onChange={e=>setNewJob(v=>({...v, aufgabe_id:e.target.value||undefined}))}>
              <option value="">–</option>
              {aufgaben.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs">Objekt</label>
            <select className="w-full border rounded px-2 py-1"
              value={newJob.objekt_id||''}
              onChange={e=>setNewJob(v=>({...v, objekt_id:e.target.value||undefined}))}>
              <option value="">–</option>
              {objekte.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs">Ort</label>
            <select className="w-full border rounded px-2 py-1"
              value={newJob.ort_id||''}
              onChange={e=>setNewJob(v=>({...v, ort_id:e.target.value||undefined}))}>
              <option value="">–</option>
              {orte.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs">PLZ</label>
            <input className="w-full border rounded px-2 py-1"
              value={newJob.plz||''}
              onChange={e=>setNewJob(v=>({...v, plz:e.target.value}))}/>
          </div>

          <div>
            <label className="text-xs">Helfer</label>
            <select className="w-full border rounded px-2 py-1"
              value={newJob.helfer_id||''}
              onChange={e=>setNewJob(v=>({...v, helfer_id:e.target.value||undefined}))}>
              <option value="">–</option>
              {helfer.map(h=><option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs">Bemerkung</label>
            <textarea className="w-full border rounded px-2 py-1"
              value={newJob.bemerkung||''}
              onChange={e=>setNewJob(v=>({...v, bemerkung:e.target.value}))}/>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="px-3 py-2 rounded bg-black text-white text-sm" onClick={saveJob}>
            Einsatz speichern
          </button>
          <button className="px-3 py-2 rounded border text-sm" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}