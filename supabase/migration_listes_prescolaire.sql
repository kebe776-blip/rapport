/* =========================================================================
   MIGRATION — 4ᵉ type de liste : écoles PRÉSCOLAIRES
   -------------------------------------------------------------------------
   À exécuter UNE FOIS dans Supabase > SQL Editor (après listes.sql).

   • la contrainte CHECK de `listes.type` accepte désormais
     ('ecole', 'codec', 'commune', 'ecole_prescolaire')
   • amorçage idempotent des 24 écoles préscolaires de l'inspection
     (CPCE / CTP / EM) qui alimentent le champ « Nom de l'école » du
     « RAPPORT DE SUCCINCT DE RENTRÉE » (succinct-prescolaire.html) :
     la saisie hors liste est REFUSÉE à la validation du formulaire.

   Sans cette migration, l'ajout d'une école préscolaire depuis l'espace
   Inspection échoue sur « check constraint » (db.js affiche alors le
   message invitant à exécuter CE fichier).

   Fichier idempotent : ré-exécution sans danger.
   ========================================================================= */

/* 1. Contrainte CHECK : on retombe toutes les contraintes CHECK de la
      table puis on remet celle qui accepte les 4 types.
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
  check (type in ('ecole', 'codec', 'commune', 'ecole_prescolaire'));

/* 2. Amorçage des 24 écoles préscolaires (tri alphabétique).
      Idempotent : `on conflict do nothing` ne duplique jamais et ne
      remet jamais une école retirée depuis l'espace Inspection. -------- */
insert into public.listes (type, valeur) values
  ('ecole_prescolaire', 'CPCE DJISSA ALIOU'),
  ('ecole_prescolaire', 'CPCE EL HADJI OUSMANE DIALLO'),
  ('ecole_prescolaire', 'CPCE KEUR AMATH SEYDOU'),
  ('ecole_prescolaire', 'CPCE KEUR BIRANE NDOUY'),
  ('ecole_prescolaire', 'CPCE KEUR DAME'),
  ('ecole_prescolaire', 'CPCE KEUR MADIABEL 1'),
  ('ecole_prescolaire', 'CPCE KEUR MADIABEL 2'),
  ('ecole_prescolaire', 'CPCE KEUR MADIABEL 3'),
  ('ecole_prescolaire', 'CPCE KEUR MADIABEL 4'),
  ('ecole_prescolaire', 'CPCE KEUR MANDONGO'),
  ('ecole_prescolaire', 'CPCE KEUR YORO KHODIA'),
  ('ecole_prescolaire', 'CPCE MANDERA'),
  ('ecole_prescolaire', 'CPCE NDIAGNE WALO'),
  ('ecole_prescolaire', 'CPCE THILLA GRAND'),
  ('ecole_prescolaire', 'CPCE WACK NGOUNA'),
  ('ecole_prescolaire', 'CTP BOWE'),
  ('ecole_prescolaire', 'CTP KEUR ASSANE DIASSE'),
  ('ecole_prescolaire', 'CTP KEUR MABA DIAKHOU'),
  ('ecole_prescolaire', 'CTP KEUR MADIABEL'),
  ('ecole_prescolaire', 'CTP NDRAME ESCALE'),
  ('ecole_prescolaire', 'CTP SABOYA'),
  ('ecole_prescolaire', 'CTP WACK NGOUNA'),
  ('ecole_prescolaire', 'EM KEUR MADIABEL'),
  ('ecole_prescolaire', 'EM SABOYA')
on conflict do nothing;

/* 3. Vérification ------------------------------------------------------- */
/* select type, count(*) from public.listes group by type order by type;
   — doit afficher 24 lignes pour 'ecole_prescolaire' ------------------- */
