
-- Seed für echte Testdaten

insert into techniker (name) values
('Nouraddin'), ('Mohammed'), ('Mostafa'), ('Amin')
on conflict do nothing;

insert into planungsmonat (jahr, monat, freitag_nachzuegler, feierabend_global)
values (2025, 7, true, time '17:00')
on conflict do nothing;

do $$
declare d date := date '2025-07-01';
begin
  while d <= date '2025-07-31' loop
    insert into tag (planungsmonat_id, datum)
    select id, d from planungsmonat where jahr=2025 and monat=7
    on conflict do nothing;
    d := d + interval '1 day';
  end loop;
end$$;

with t as (select id from techniker where name='Mohammed')
insert into tag_status (tag_id, techniker_id, status)
select tg.id, (select id from t), 'krank'::dispo_status
from tag tg
where tg.datum = date '2025-07-07'
on conflict do nothing;

with tx as (select id from techniker where name='Nouraddin')
insert into job (tag_id, techniker_id, meldungsnummer, "von", "bis", dauer_min, bemerkung)
select tg.id, (select id from tx), 'MN-1001', time '08:00', time '10:00', 120, 'RT EHKV'
from tag tg where tg.datum = date '2025-07-02'
on conflict do nothing;

with tx as (select id from techniker where name='Nouraddin')
insert into job (tag_id, techniker_id, meldungsnummer, "von", "bis", dauer_min, bemerkung)
select tg.id, (select id from tx), 'MN-1002', time '08:00', time '17:00', 540, 'Ganztag'
from tag tg where tg.datum = date '2025-07-03'
on conflict do nothing;

with tx as (select id from techniker where name='Nouraddin')
insert into job (tag_id, techniker_id, meldungsnummer, "von", "bis", dauer_min, bemerkung)
select tg.id, (select id from tx), 'MN-1003', time '08:00', time '18:00', 600, 'Überstunden'
from tag tg where tg.datum = date '2025-07-04'
on conflict do nothing;
