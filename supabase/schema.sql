/* =========================================================================
   SCHÉMA SUPABASE — Rapport général de rentrée élémentaire 2025/2026
   -------------------------------------------------------------------------
   À exécuter une seule fois dans Supabase > SQL Editor.

   Sécurité (RLS) :
     • anon (le directeur, sans compte)  → INSERT / UPDATE uniquement
     • authenticated (l'Inspection)     → SELECT
     • personne                         → DELETE (aucune suppression)
   ========================================================================= */

create table if not exists public.rapports (
  ecole_code  text        not null,          -- CODEC ou nom d'école normalisé
  ecole_nom   text        not null default '',
  annee       text        not null default '2025/2026',
  donnees     jsonb       not null,          -- formulaire complet (forme sample_data.json)
  maj_le      timestamptz not null default now(),
  primary key (ecole_code, annee)
);

create index if not exists rapports_maj_le_idx on public.rapports (maj_le desc);

alter table public.rapports enable row level security;

drop policy if exists rapports_insert_anon on public.rapports;
create policy rapports_insert_anon
  on public.rapports for insert
  to anon
  with check (true);

drop policy if exists rapports_update_anon on public.rapports;
create policy rapports_update_anon
  on public.rapports for update
  to anon
  using (true)
  with check (true);

drop policy if exists rapports_select_auth on public.rapports;
create policy rapports_select_auth
  on public.rapports for select
  to authenticated
  using (true);

drop policy if exists rapports_delete_auth on public.rapports;
create policy rapports_delete_auth
  on public.rapports for delete
  to authenticated
  using (true);
