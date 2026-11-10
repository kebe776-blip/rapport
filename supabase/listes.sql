/* =========================================================================
   LISTES FERMÉES — ÉCOLES ET CODEC
   -------------------------------------------------------------------------
   À exécuter UNE FOIS dans Supabase > SQL Editor (après schema.sql).

   La table `listes` alimente les deux listes déroulantes filtrables du
   formulaire (Nom de l'école, CODEC) depuis l'espace Inspection :

     • anon (directeur, sans compte)  → SELECT uniquement (les noms d'écoles)
     • authenticated (l'Inspection)   → SELECT / INSERT / DELETE

   La table `rapports` reste INTACTE : aucun droit anon n'y est ajouté.

   Le fichier est idempotent et l'amorçage n'a lieu QUE si la table est
   vide : le ré-exécuter ne remet donc jamais une école supprimée.
   ========================================================================= */

create table if not exists public.listes (
  type   text        not null check (type in ('ecole', 'codec')),
  valeur text        not null,
  maj_le timestamptz not null default now(),
  primary key (type, valeur)
);

create index if not exists listes_type_idx on public.listes (type, valeur);

alter table public.listes enable row level security;

/* Lecture : la liste des noms d'écoles est nécessaire au formulaire. */
drop policy if exists listes_select on public.listes;
create policy listes_select
  on public.listes for select
  to anon, authenticated
  using (true);

/* Écriture : réservée à l'Inspection authentifiée. */
drop policy if exists listes_insert_auth on public.listes;
create policy listes_insert_auth
  on public.listes for insert
  to authenticated
  with check (true);

drop policy if exists listes_delete_auth on public.listes;
create policy listes_delete_auth
  on public.listes for delete
  to authenticated
  using (true);

/* =========================================================================
   AMORÇAGE — uniquement si la table est vide (101 écoles + 15 CODEC)
   ========================================================================= */
do $$
begin
  if not exists (select 1 from public.listes) then

    insert into public.listes (type, valeur) values
      ('ecole', 'BOWE'),
      ('ecole', 'DARA MODERNE MATAM'),
      ('ecole', 'DAROU SALAM MOURIDE'),
      ('ecole', 'DJISSA ALIOU'),
      ('ecole', 'EFA NGAYÉNE SINE'),
      ('ecole', 'EFA CHEIKH ABOUBACAR GASSAMA'),
      ('ecole', 'EFA KEUR MADIABEL 3'),
      ('ecole', 'EFA KEUR TAPHA'),
      ('ecole', 'EFA KEUR TERI'),
      ('ecole', 'EFA MBAKERY'),
      ('ecole', 'EFA NDIBA'),
      ('ecole', 'EFA NGUER BABOU'),
      ('ecole', 'EFA THIAMBENE'),
      ('ecole', 'EFA THIAMENE DIOGO'),
      ('ecole', 'EFA WACK NGOUNA'),
      ('ecole', 'EL HADJI OUSMANE DIALLO EX VELINGARA WALO'),
      ('ecole', 'FETTO'),
      ('ecole', 'GORIA'),
      ('ecole', 'KEUR ABDOU DIAFFE'),
      ('ecole', 'KEUR AMADY NGUENAR'),
      ('ecole', 'KEUR AMATH SEYDOU'),
      ('ecole', 'KEUR BIRANE'),
      ('ecole', 'KEUR DAME'),
      ('ecole', 'KEUR DIAGA DIALE'),
      ('ecole', 'KEUR FODÉ'),
      ('ecole', 'KEUR GORY'),
      ('ecole', 'KEUR LAHINE SAKHO'),
      ('ecole', 'KEUR MABA DIAKHOU'),
      ('ecole', 'KEUR MADIABEL 1'),
      ('ecole', 'KEUR MADIABEL 2'),
      ('ecole', 'KEUR MADIABEL 4'),
      ('ecole', 'KEUR MADIABEL 5'),
      ('ecole', 'KEUR MADY YACINE'),
      ('ecole', 'KEUR MALICK RAMATA'),
      ('ecole', 'KEUR MALO'),
      ('ecole', 'KEUR MAMADOU NENE'),
      ('ecole', 'KEUR MAMOUR COUMBA'),
      ('ecole', 'KEUR MANDONGO'),
      ('ecole', 'KEUR MANIEBE'),
      ('ecole', 'KEUR MODOU BONGUEL'),
      ('ecole', 'KEUR MOMAR ANTA'),
      ('ecole', 'KEUR NDONGO'),
      ('ecole', 'KEUR NGOR'),
      ('ecole', 'KEUR SACOUMBA'),
      ('ecole', 'KEUR SAMBA KA'),
      ('ecole', 'KEUR SAMBA YACINE'),
      ('ecole', 'KEUR SAROKHY'),
      ('ecole', 'KEUR SERIGNE BA'),
      ('ecole', 'KEUR YORO KHODIA'),
      ('ecole', 'KOTENETE'),
      ('ecole', 'KOUDOM EFA'),
      ('ecole', 'KOURANKO'),
      ('ecole', 'KOUTANGO'),
      ('ecole', 'LOUMENE OUSMANE'),
      ('ecole', 'MANDERA'),
      ('ecole', 'MBOULEDJI'),
      ('ecole', 'MEDINA THIAMENE'),
      ('ecole', 'MERALA'),
      ('ecole', 'MISSIRAH DINI'),
      ('ecole', 'NAOULEROU'),
      ('ecole', 'NDEME'),
      ('ecole', 'NDEMENEL'),
      ('ecole', 'NDIAGNE WALO'),
      ('ecole', 'NDIAGO 1'),
      ('ecole', 'NDIAGO 2'),
      ('ecole', 'NDIAYE COUNDA'),
      ('ecole', 'NDIAYENE KADD'),
      ('ecole', 'NDIAYENE MOMATH'),
      ('ecole', 'NDIAYENE POSTE'),
      ('ecole', 'NDIENGHENE IBRA'),
      ('ecole', 'NDIENGGUENE MODY'),
      ('ecole', 'NDIOBENE K GAYE'),
      ('ecole', 'NDIOBENE WALO'),
      ('ecole', 'NDRAMÉ DIMB'),
      ('ecole', 'NDRAMÉ ESCALE'),
      ('ecole', 'NDRAME PEULH'),
      ('ecole', 'NGUÉYENE MAMADY'),
      ('ecole', 'NIANGHÉNE KEUR MABA'),
      ('ecole', 'NIASSENE WALO'),
      ('ecole', 'PANE ABDOULAYE DIOP'),
      ('ecole', 'PANE SADER'),
      ('ecole', 'SABOYA'),
      ('ecole', 'SAMAKO TOUCOULEUR'),
      ('ecole', 'SAMBOUMBA'),
      ('ecole', 'SANTHIE MAKHA'),
      ('ecole', 'SANTHIE NDIOBENE'),
      ('ecole', 'SANTHIE OMAR DIAGNE'),
      ('ecole', 'TAIBA MBAYENE'),
      ('ecole', 'THIAMENE KEUR MASSAMBA'),
      ('ecole', 'THIAMENE MAKA'),
      ('ecole', 'THIAMENE MOMATH BINTA'),
      ('ecole', 'THIAMENE OUSMANE'),
      ('ecole', 'THIARENE DJISSA'),
      ('ecole', 'THIARENE MATAR'),
      ('ecole', 'THILLA GALLO'),
      ('ecole', 'THILLA GRAND'),
      ('ecole', 'THILLA NDIAYE'),
      ('ecole', 'THIOYENE'),
      ('ecole', 'THIWALO'),
      ('ecole', 'TOUBA 2'),
      ('ecole', 'WACK NGOUNA'),

      ('codec', 'KEUR DAME'),
      ('codec', 'KEUR MABA DIAKHOU'),
      ('codec', 'KEUR MADIABEL 1'),
      ('codec', 'KEUR MADIABEL 2'),
      ('codec', 'KEUR MADY YACINE'),
      ('codec', 'KEUR YORO'),
      ('codec', 'KOUTANGO'),
      ('codec', 'MANDERA'),
      ('codec', 'NDIOBENE WALO'),
      ('codec', 'NDRAMÉ ESCALE'),
      ('codec', 'NDRAME PEULH'),
      ('codec', 'TAIBA MBAYENE'),
      ('codec', 'THILLA GRAND'),
      ('codec', 'VELINGARA WALO'),
      ('codec', 'WACK NGOUNA')
    on conflict do nothing;

  end if;
end $$;
