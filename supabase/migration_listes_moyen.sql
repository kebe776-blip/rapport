/* =========================================================================
   MIGRATION — 5ᵉ type de liste : ÉTABLISSEMENTS MOYENS
   -------------------------------------------------------------------------
   À exécuter UNE FOIS dans Supabase > SQL Editor (après listes.sql et
   migration_listes_prescolaire.sql).

   • la contrainte CHECK de `listes.type` accepte désormais
     ('ecole', 'codec', 'commune', 'ecole_prescolaire', 'ecole_moyen')
   • amorçage idempotent des 17 établissements moyens de l'inspection
     (11 CEM, 5 lycées, 1 CFA) qui alimentent le champ
     « Nom de l'établissement » du RAPPORT GÉNÉRAL DE RENTRÉE MOYEN &
     SECONDAIRE (general-moyen.html) : la saisie hors liste est REFUSÉE
     à la validation du formulaire.

   Sans cette migration, l'ajout ou la suppression d'un établissement
   moyen depuis l'espace Inspection échoue sur « check constraint »
   (db.js affiche alors le message invitant à exécuter CE fichier).

   Fichier idempotent : ré-exécution sans danger. Aucune autre liste et
   aucun rapport existant ne sont touchés.
   ========================================================================= */

/* 1. Contrainte CHECK : on retombe toutes les contraintes CHECK de la
      table puis on remet celle qui accepte les 5 types.
      Aucune valeur existante n'est touchée. ------------------------------ */
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.listes'::regclass and contype = 'c'
  loop
    execute format('alter table public.listes drop constraint %I',
                   c.conname);
  end loop;
end $$;

alter table public.listes
  add constraint listes_type_check
  check (type in ('ecole', 'codec', 'commune', 'ecole_prescolaire',
                  'ecole_moyen'));

/* 2. Amorçage des 17 établissements moyens (tri alphabétique).
      Idempotent : `on conflict do nothing` ne duplique jamais et ne
      remet jamais un établissement retiré depuis l'espace Inspection. -- */
insert into public.listes (type, valeur) values
  ('ecole_moyen', 'CEM KEUR MADIABEL'),
  ('ecole_moyen', 'CEM KEUR MADIABEL COMMUNE'),
  ('ecole_moyen', 'CEM KEUR MADY YACINE'),
  ('ecole_moyen', 'CEM KEUR MANDONGO'),
  ('ecole_moyen', 'CEM KEUR YORO KHODIA'),
  ('ecole_moyen', 'CEM KOUTANGO'),
  ('ecole_moyen', 'CEM MATAR KALLA DRAME'),
  ('ecole_moyen', 'CEM NDIAYENE POSTE'),
  ('ecole_moyen', 'CEM NDRAME ESCALE'),
  ('ecole_moyen', 'CEM SABOYA'),
  ('ecole_moyen', 'CEM THILLAGRAND'),
  ('ecole_moyen', 'CFA WACK NGOUNA'),
  ('ecole_moyen', 'LYCEE FA KEUR MADIABEL'),
  ('ecole_moyen', 'LYCEE KEUR MABA DIAKHOU'),
  ('ecole_moyen', 'LYCEE KEUR MADIABEL'),
  ('ecole_moyen', 'LYCEE VELINGARA WALO'),
  ('ecole_moyen', 'LYCEE WACK NGOUNA')
on conflict do nothing;

/* 3. Vérification ------------------------------------------------------- */
/* select type, count(*) from public.listes group by type order by type;
   — doit afficher 17 lignes pour 'ecole_moyen' ------------------------- */
