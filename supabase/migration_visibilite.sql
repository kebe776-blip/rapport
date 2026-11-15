/* =========================================================================
   MIGRATION — VISIBILITÉ DES RAPPORTS SUR LA PAGE D'ACCUEIL
   -------------------------------------------------------------------------
   À exécuter UNE FOIS dans Supabase > SQL Editor (après schema.sql).

   La table `type_visibilite` mémorise, depuis l'Espace Inspection, quels
   types de rapport sont Masqués de la page d'accueil (index.html) :

      • anon (visiteur du site)   → SELECT uniquement (l'accueil lit les
                                    états pour masquer les cartes)
      • authenticated (l'Inspection) → INSERT / UPDATE / DELETE

   Règle de fonctionnement : un type ABSENT de la table est ACTIF
   (aucune ligne d'amorçage nécessaire — l'accueil n'a rien à masquer
   tant que l'Inspecteur n'a rien désactivé).

   Sans cette migration, l'accueil reste entièrement affiché (fail-open)
   et le bouton de l'Espace Inspection affiche ce message invitant à
   exécuter CE fichier.

   Fichier idempotent : ré-exécution sans danger.
   ========================================================================= */

create table if not exists public.type_visibilite (
  type   text primary key
         check (type in ('succinct-prescolaire', 'succinct-elementaire',
                         'succinct-moyen', 'general-prescolaire',
                         'general-elementaire', 'general-moyen')),
  actif  boolean     not null default true,
  maj_le timestamptz not null default now()
);

alter table public.type_visibilite enable row level security;

/* Lecture : la page d'accueil (visiteur sans compte) doit savoir quels
   masquer ; l'Espace Inspection lit l'état courant. */
drop policy if exists type_visibilite_select on public.type_visibilite;
create policy type_visibilite_select
  on public.type_visibilite for select
  to anon, authenticated
  using (true);

/* Écriture : réservée à l'Inspection authentifiée (activer/désactiver
   un rapport depuis admin.html). */
drop policy if exists type_visibilite_insert_auth on public.type_visibilite;
create policy type_visibilite_insert_auth
  on public.type_visibilite for insert
  to authenticated
  with check (true);

drop policy if exists type_visibilite_update_auth on public.type_visibilite;
create policy type_visibilite_update_auth
  on public.type_visibilite for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists type_visibilite_delete_auth on public.type_visibilite;
create policy type_visibilite_delete_auth
  on public.type_visibilite for delete
  to authenticated
  using (true);

/* Vérification ------------------------------------------------------- */
/* select * from public.type_visibilite order by type;
   — doit renvoyer 0 ligne à l'installation (tout est actif par défaut) - */
