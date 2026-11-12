/* =========================================================================
   SCHÉMA SUPABASE — Rapport général de rentrée élémentaire 2026/2027
   -------------------------------------------------------------------------
   À exécuter une seule fois dans Supabase > SQL Editor.

   Sécurité (RLS) :
     • anon (le directeur, sans compte)  → INSERT / UPDATE uniquement
     • authenticated (l'Inspection)     → SELECT / DELETE
     • anon                             → ni SELECT ni DELETE
   ========================================================================= */

create table if not exists public.rapports (
  ecole_code  text        not null,          -- CODEC ou nom d'école normalisé
  ecole_nom   text        not null default '',
  annee       text        not null default '2026/2027',
  donnees     jsonb       not null,          -- formulaire complet (sections A → N)
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

/* =========================================================================
   FONCTIONS D'ÉCRITURE ( rôle anon = directeur, sans compte )
   -------------------------------------------------------------------------
   Le rôle anon n'a PAS de policy SELECT (les données restent illisibles
   depuis le navigateur), ce qui bloquait deux opérations PostgREST :
     • upsert (INSERT ... ON CONFLICT) → erreur 42501
     • update  → 0 ligne affectée
   Ces fonctions SECURITY DEFINER s'exécutent avec les droits du
   propriétaire de la table (contournent le RLS) SANS ouvrir la lecture.
   ========================================================================= */

create or replace function public.sauver_rapport(
  p_ecole_code text,
  p_ecole_nom  text default '',
  p_annee      text default '2026/2027',
  p_donnees    jsonb default '{}'::jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.rapports
             where ecole_code = p_ecole_code and annee = p_annee) then
    update public.rapports
       set ecole_nom = p_ecole_nom, donnees = p_donnees, maj_le = now()
     where ecole_code = p_ecole_code and annee = p_annee;
    return 'maj';
  end if;
  insert into public.rapports (ecole_code, ecole_nom, annee, donnees, maj_le)
  values (p_ecole_code, p_ecole_nom, p_annee, p_donnees, now());
  return 'insere';
end $$;

/* Vérification d'existence (anti-doublon) : renvoie true/false uniquement,
   aucune donnée d'école n'est exposée. */
create or replace function public.rapport_existe(
  p_ecole_code text,
  p_annee text default '2026/2027'
) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.rapports
                 where ecole_code = p_ecole_code and annee = p_annee);
$$;

grant execute on function public.sauver_rapport(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.rapport_existe(text, text) to anon, authenticated;
