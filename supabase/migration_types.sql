/* =========================================================================
   MIGRATION — Type de rapport (succinct / général × degré)
   -------------------------------------------------------------------------
   À exécuter UNE FOIS dans Supabase > SQL Editor (après schema.sql).

   Chaque type de rapport possède sa propre ligne par école :
     • la clé primaire devient (type, ecole_code, annee)
     • les fonctions sauver_rapport / rapport_existe reçoivent p_type
       (l'anti-doublon s'applique donc PAR TYPE : une école peut avoir
        un rapport succinct ET un rapport général sans se bloquer)

   Les rapports déjà enregistrés deviennent 'general-elementaire'
   (valeur par défaut) : aucune donnée n'est perdue.

   Fichier idempotent : ré-exécution sans danger.
   ========================================================================= */

/* 1. Colonne type + nouvelle clé primaire ------------------------------ */
alter table public.rapports
  add column if not exists type text not null default 'general-elementaire';

alter table public.rapports drop constraint if exists rapports_pkey;
alter table public.rapports add primary key (type, ecole_code, annee);

drop index if exists rapports_type_idx;
create index if not exists rapports_type_idx
  on public.rapports (type, maj_le desc);

/* 2. Fonctions d'écriture : + p_type ------------------------------------ */
drop function if exists public.sauver_rapport(text, text, text, jsonb);
create or replace function public.sauver_rapport(
  p_type       text,
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
             where type = p_type
               and ecole_code = p_ecole_code
               and annee = p_annee) then
    update public.rapports
       set ecole_nom = p_ecole_nom, donnees = p_donnees, maj_le = now()
     where type = p_type
       and ecole_code = p_ecole_code
       and annee = p_annee;
    return 'maj';
  end if;
  insert into public.rapports
    (type, ecole_code, ecole_nom, annee, donnees, maj_le)
  values
    (p_type, p_ecole_code, p_ecole_nom, p_annee, p_donnees, now());
  return 'insere';
end $$;

/* 3. Vérification d'existence (anti-doublon) : PAR TYPE ------------------ */
drop function if exists public.rapport_existe(text, text);
create or replace function public.rapport_existe(
  p_type       text,
  p_ecole_code text,
  p_annee      text default '2026/2027'
) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.rapports
                 where type = p_type
                   and ecole_code = p_ecole_code
                   and annee = p_annee);
$$;

/* 4. Droits (les anciennes signatures ont été supprimées) --------------- */
grant execute on function public.sauver_rapport(text, text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.rapport_existe(text, text, text)
  to anon, authenticated;

/* 5. Vérification ------------------------------------------------------- */
/* select type, count(*) from public.rapports group by type; */
