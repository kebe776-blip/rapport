/* =========================================================================
   MIGRATION — 7ᵉ TYPE : « RAPPORT DES ÉVALUATIONS » (evaluations)
   -------------------------------------------------------------------------
   À exécuter UNE FOIS dans Supabase > SQL Editor, APRÈS
   migration_visibilite.sql (la table `type_visibilite` doit exister).

   Étend la contrainte CHECK de la colonne `type` au nouveau type
   'evaluations' : sans elle, l'Espace Inspection ne peut pas masquer /
   réafficher la carte « Rapports d'évaluation » sur la page d'accueil
   (erreur 23514 « type_visibilite_type_check »).

   Remarque : la table `rapports` n'a AUCUNE contrainte sur `type` —
   l'enregistrement des soumissions d'évaluations fonctionne donc déjà ;
   cette migration concerne uniquement la visibilité sur l'accueil.

   Fichier idempotent : ré-exécution sans danger (drop if exists).
   ========================================================================= */

alter table public.type_visibilite
  drop constraint if exists type_visibilite_type_check;

alter table public.type_visibilite
  add constraint type_visibilite_type_check
  check (type in ('succinct-prescolaire', 'succinct-elementaire',
                  'succinct-moyen', 'general-prescolaire',
                  'general-elementaire', 'general-moyen',
                  'evaluations'));

/* Vérification ------------------------------------------------------- */
/* select conname, pg_get_constraintdef(oid)
     from pg_constraint
    where conrelid = 'public.type_visibilite'::regclass;
   — doit afficher le CHECK avec les 7 types, dont 'evaluations'.       */
