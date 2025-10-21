
-- Database schema for Dispo App (PostgreSQL/Supabase)

create type if not exists dispo_status as enum ('verfuegbar','krank','urlaub','helfer');

create table if not exists techniker (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aktiv boolean not null default true,
  feierabend_std_default time
);

create table if not exists aufgabe (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  beschreibung text,
  default_dauer_min int
);

create table if not exists objekt (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  beschreibung text
);

create table if not exists ort (
  id uuid primary key default gen_random_uuid(),
  plz text not null,
  ort text not null,
  region text
);

create table if not exists planungsmonat (
  id uuid primary key default gen_random_uuid(),
  jahr int not null,
  monat int not null check (monat between 1 and 12),
  freitag_nachzuegler boolean not null default true,
  feierabend_global time not null default time '17:00'
);

create table if not exists tag (
  id uuid primary key default gen_random_uuid(),
  planungsmonat_id uuid not null references planungsmonat(id) on delete cascade,
  datum date not null,
  feierabend_uebersteuerung time
);

create table if not exists tag_status (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references tag(id) on delete cascade,
  techniker_id uuid not null references techniker(id) on delete cascade,
  status dispo_status not null default 'verfuegbar',
  hinweis text,
  unique (tag_id, techniker_id)
);

create table if not exists job (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references tag(id) on delete cascade,
  techniker_id uuid not null references techniker(id),
  meldungsnummer text,
  aufgabe_id uuid references aufgabe(id),
  objekt_id uuid references objekt(id),
  anzahl int,
  "von" time not null,
  "bis" time not null,
  dauer_min int not null,
  plz text,
  ort_id uuid references ort(id),
  helfer_id uuid references techniker(id),
  bemerkung text,
  check ("bis" > "von")
);
