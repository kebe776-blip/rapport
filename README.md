# Rapports de Rentrée 2026/2027

**IEF de KEUR MADIABEL — Inspection d'Académie de Kaolack**

Système de collecte des rapports de rentrée : chaque directeur remplit le
formulaire officiel dans son navigateur, clique sur **Soumettre**, et le
**PDF officiel se télécharge automatiquement** — strictement identique au
modèle administratif, sans compte, sans sélection d'école.

Deux formulaires sont disponibles à ce jour :

| Type | Formulaire | PDF |
|---|---|---|
| **Rapport général de rentrée élémentaire** | `general-elementaire.html` (sections A → N) | **6 pages A4 paysage** |
| **Rapport général de rentrée préscolaire** | `general-prescolaire.html` (sections A → L) | **5 pages A4 paysage** |
| **Rapport succinct de rentrée préscolaire** | `succinct-prescolaire.html` (modèle condensé) | **2 pages A4 mixtes** : page 1 **paysage**, page 2 **portrait** |

> **Architecture : GitHub Pages + Supabase uniquement** — aucun serveur,
> aucun compte, aucune dépendance externe.

---

## 1. Comment ça marche

| Étape | Ce qui se passe |
|---|---|
| **1. Saisie** | Le directeur ouvre la page d'accueil `index.html` (menu des rapports), choisit **Rapport général de rentrée élémentaire** et remplit les sections **A → N**. Fonctionne **sans réseau** : la saisie est enregistrée en permanence sur l'appareil (brouillon). |
| **2. Soumission** | Un clic sur **Soumettre** : les données partent vers Supabase, ou — si le réseau est absent — sont mises en **file d'attente** et envoyées automatiquement au prochain accès. **Anti-doublon** : si l'école a déjà déposé son rapport, un message demande de confirmer — *OK* remplace le rapport (mise à jour), *Annuler* abandonne **sans envoi ni PDF**. |
| **3. PDF automatique** | Le PDF est construit **dans le navigateur** (html2canvas + jsPDF) puis téléchargé immédiatement. Aucun serveur n'est nécessaire pour le téléchargement. Ces deux bibliothèques (≈ 550 Ko) ne sont téléchargées qu'au 1er clic sur un bouton PDF, pas à l'ouverture de la page (gain important sur connexion lente, type 2G). |
| **4. Suivi** | L'Inspection se connecte à `admin.html` pour voir les écoles ayant soumis et, pour chacune : **Voir / PDF**, **Modifier** (corrige le rapport puis régénère le PDF) ou **Supprimer**. |
| **5. Analyse** | Après connexion à l'Espace Inspection, le bouton **📊 Analyse** ouvre `analyse.html` : exploitation par **école / CODEC / commune / sexe** (KPI, graphiques SVG, taux par école, synthèse) et export **XLSX**. |

### Mise en page du PDF (conforme au modèle)

* Format **A4 PAYSAGE** (297 × 210 mm), zone utile 275 × 194 mm
* **6 pages, exactement comme le modèle** — aucune section n'est coupée :

| Page | Contenu |
|---|---|
| **1** | En-tête officiel (République du Sénégal, MEN, IA de Kaolack, IEF de KEUR MADIABEL) + **A** Identification + **B** Classes pédagogiques + **C** Classes physiques + **D** Directeur |
| **2** | **E** Ouvrages annexes + **F** Activités péri/para scolaires + **F**/**G** Observations |
| **3** | **H** Personnel enseignant (20 lignes numérotées) + suppléants + malades + récapitulation FR/AR |
| **4** | **I** Effectifs + **J** Mobilier scolaire |
| **5** | **K** Recensement des manuels |
| **6** | **L** Autres manuels + **M** Matériel didactique + **N** Autres matériels + signature *Le Directeur* |

Le nom de fichier généré est toujours :
`Rapport_Rentree_NOM_ECOLE_2026-2027.pdf`

### Le rapport succinct préscolaire — 2 pages strictement

`succinct-prescolaire.html` applique le modèle officiel **« RAPPORT DE
SUCCINCT DE RENTRÉE — Petite Enfance »**, relevé sur le papier
administratif. Le PDF contient **exactement 2 pages** (aucune page 3) :

| Page | Format | Contenu |
|---|---|---|
| **1** | **A4 PAYSAGE** (275 × 194 mm) | En-tête officiel (République du Sénégal, MEN, IA de Kaolack, IEF) + titre *RAPPORT DE SUCCINCT DE RENTRÉE* / *Petite Enfance* / ANNÉE SCOLAIRE · ligne `EM – CTP – CPE – CPCE : école : Commune : Arrondissement` · sections et bâtiments (nb sections, bâtiments 1/2/3 cl, abris, CMG, cours jumelés) · directeur (prénoms/nom/matricule/grade, Titulaire `[X]` / Intérimaire `[ ]`, diplômes, contacts Orange/Tigo/Expresso) · tableau **effectifs PS / MS / GS / TOTAL × G F T** + colonnes maître (nom, diplômes, date d'arrivée) · handicapés physiques · tableau du **personnel** (4 lignes fixes : suppléants, maître d'arabe, malade indéfinible, personnel de service) |
| **2** | **A4 PORTRAIT** (188 × 281 mm) | *OBSERVATIONS GÉNÉRALES SUR LA SITUATION DE L'ÉCOLE* : 1. situation des locaux (dur / abris, réhabilitation, salles inoccupées, observations) · 2. eau (robinets, puits) · 3. électricité (réseau, plaques solaires `OUI [X] – NON [ ]`) · 4. équipement informatique · 5. mobilier scolaire (7 lignes : bon / à réparer / total / déficit) · 6. équipement et jeux (4 lignes) · 7. cantine / coop. scolaire / jardin / projet d'école · 8. observations du directeur + *Fait à …, le …* + *Déposer 1 rapport à l'IEF au plus tard le 15 Novembre 2026* + *Le Directeur* · tableau Équipements scolaires (vestiaires, magasins, régimes, toilettes « Nbre de boxes », cuisines, locaux, autres) |

**Saisie minimale** (tout le reste est facultatif, le PDF met « — ») :
nom d'école · commune · nom du directeur · **au moins un contact**
(Orange / Tigo / Expresso) · **au moins un maître** renseigné sur PS, MS
ou GS. Le champ **Nom de l'école** est une **liste fermée** de 24 écoles
préscolaires (CPCE / CTP / EM) gérable depuis l'Espace Inspection.

**Garantie « pas de page 3 »** : contenu borné (lignes fixes +
`maxlength` sur les zones libres) + auto-ajustement (compression de
−0,25 pt par palier, 3 paliers maximum, puis `overflow: hidden` +
`transform: scale()`) + garde-fou logique : la soumission et le
retéléchargement **refusent** tout gabarit qui ne tient pas sur
exactement 2 pages.

**Isolation du code** : le moteur est un fichier **dédié**
(`assets/js/form-succinct.js` + `champs-succinct.js` +
`rapport-succinct.js`). `form.js`, `champs.js`, `rapport.js` et `lib.js`
ne sont **pas modifiés** : `succinct-prescolaire.html` ne charge ni
`form.js` ni `champs.js`, et le rendu passe par le registre
`RR_MODELES[type]` — le rapport élémentaire reste donc strictement
identique. Le gabarit dédié (`rapport-succinct.js`) n'est téléchargé par
l'Espace Inspection **qu'au moment d'afficher un rapport de ce type** :
aucune page existante ne gagne le moindre octet, et jsPDF / html2canvas /
SheetJS restent, eux, chargés uniquement au clic.

### Le rapport général préscolaire — 5 pages strictes

`general-prescolaire.html` applique le modèle officiel **« RAPPORT GÉNÉRAL
DE RENTRÉE PRÉSCOLAIRE »**, relevé verbatim sur le `.docx` 2024/2025 et
confronté aux captures du modèle 2026/2027 (`RG 1-5 prescolaire.PNG`).
Le PDF contient **exactement 5 pages A4 paysage** (sections **A → L**) :

| Page | Contenu |
|---|---|
| **1** | En-tête officiel + **A** Identification (sans le CODEC) + **B** Classes pédagogiques (3 colonnes) + **C** Classes physiques (ETAT/ANCTP/COM./PLAN/PRIVE/APE + Total auto + abris + à réhabiliter + note *« Ne mettez pas de croix… »*) + **D** Directeur (avec WhatsApp) |
| **2** | **E** Ouvrages annexes (cabines adaptées/non adaptées, *Bloc administratif*, Senelec + plaques solaires seuls, robinet/puits Oui-Non + État + Bailleur) + **F** Activités (ligne « 2 » du modèle Word non reproduite) + **G** Observations + *LE DIRECTEUR (signature et cachet)* |
| **3** | **H** Personnel enseignant **10 lignes** (colonne *Section tenue*) + **MALADES 2 lignes** + récapitulation FR/AR + **SERVICE 5 lignes** |
| **4** | **I** Effectifs **10 lignes libres** (EFFECTIF / HANDICAPÉ / SANS ÉTAT CIVIL × G F T + *Type : Simple/  /CMG* + ligne **TOTAL** calculée, sans colonne N°Maître) + **J** **MOBLIERS 16 lignes** (Bon / A réparer / Total auto / Déficit) |
| **5** | **K** **RECENSEMENT DES MANUELS 10 lignes** (*Désignation / Quantité / Provenances / Besoins / Observations*) + **L** **RECENSEMENT DU MATÉRIEL 14 lignes** (*Désignation / Quantité / Provenance / Besoins / Observations*) — tableaux sans colonne N° + pied de page |

Décisions de conformité (modèle 2026/2027) : **page 5 = K + L** ajoutée
sur demande (libellés verbatim du `.docx` : « Provenances » au pluriel pour
K, « Provenance » au singulier pour L), **CODEC facultatif non
imprimé** sur le PDF (il sert uniquement au groupement de l'Analyse),
colonne **« N°Maître » non reprise**.

**Garantie « 5 pages »** : lignes fixes + auto-ajustement (compression de
−0,25 pt par palier, 3 paliers maximum, puis `overflow: hidden` +
`transform: scale()`) + garde-fou logique : la soumission et le
retéléchargement **refusent** tout gabarit qui ne tient pas sur
exactement 5 pages (`pages.length !== 5`).

**Isolation du code** : moteur 100 % dédié (`champs-general-prescolaire.js`
+ `form-general-prescolaire.js` + `rapport-general-prescolaire.js` +
`general-prescolaire.html`). `form.js`, `champs.js`, `rapport.js` et
`lib.js` restent **intacts** : le gabarit dédié n'est chargé qu'à la
demande (registre `RR_MODELES[type]`), comme pour le succinct.
**Périmètre** : PDF + Espace Inspection uniquement — l'**Analyse** et
l'**Export XLSX** de ce type sont déclarés *« en préparation »*
(`analyse: false`, `xlsx: false` dans `config.js`).

### Résistance au réseau 2G/3G

* Saisie **entièrement hors-ligne** (brouillon local, restauration automatique)
* Envoi **différé** en file d'attente si le réseau tombe, puis synchronisation automatique
* Le PDF est **généré localement** : son téléchargement ne consomme aucune donnée mobile
* Bibliothèques embarquées dans le dépôt (aucun CDN externe) → le site se met en cache après la première visite

### Passage à l'échelle : 500 écoles

* Supabase (PostgreSQL) : un rapport pèse 10 à 50 Ko → **≈ 25 Mo pour 500 écoles** (l'offre gratuite en stocke 500 Mo)
* Clé primaire `(type, ecole_code, annee)` où `ecole_code` = **slug du nom de l'école** : une école qui soumet deux fois **met à jour** sa ligne, pas de doublon — et l'anti-doublon s'applique **par type** (un rapport succinct n'en bloque pas un général). Le **CODEC ne sert jamais de clé** — plusieurs écoles peuvent partager le même CODEC (c'est leur regroupement) et déposent chacune leur propre rapport
* Contrôle **avant** envoi (fonction SQL `rapport_existe`) : le directeur est prévenu dès la soumission si son école a déjà déposé — hors-ligne, ce contrôle est simplement ignoré et la file se synchronise plus tard
* GitHub Pages : ~1,5 Mo de site, servi depuis le CDN GitHub (100 Go/mois offerts)
* Aucun serveur à maintenir, aucun coût

### Listes fermées : écoles, CODEC, communes et écoles préscolaires

Les champs **Nom de l'école**, **CODEC** et **Commune** (section A) sont des
listes déroulantes **filtrables** : on tape quelques lettres, la liste réduit,
on choisit. Le filtrage est **insensible aux accents et à la casse**
(`ndrame` → `NDRAMÉ DIMB`, `fode` → `KEUR FODÉ`).

* **`assets/js/ecoles.js`** contient les quatre tableaux de repli :
  `RR_ECOLES` (**101 écoles**), `RR_CODECS` (**15 CODEC**),
  `RR_COMMUNES` (**5 communes** : KEUR MABA DIAKHOU, KEUR MADIABEL,
  KEUR MANDONGO, NDRAMÉ ESCALE, WACK NGOUNA) et
  `RR_ECOLES_PRESCOLAIRE` (**24 écoles préscolaires** : CPCE / CTP / EM,
  liste fermée du rapport succinct). La source de
  vérité est la table Supabase **`listes`** (voir `supabase/listes.sql`).
* **Blocage** : une valeur absente de la liste est **refusée à la
  soumission** — message d'erreur, aucun envoi réseau, aucun PDF.
* **CODEC et Commune facultatifs** : le champ peut rester vide, mais s'il
  est saisi il doit figer dans la liste.
* **Gestion depuis l'espace Inspection** : la carte *« Listes des écoles
  et des CODEC »* donne les **quatre colonnes** (écoles, CODEC, communes,
  écoles préscolaires) pour ajouter ou supprimer une valeur sans toucher au
  code (voir § 4).
* **Repli hors-ligne** : serveur → cache localStorage → `ecoles.js`.

---

## 2. Fichiers du projet

```
index.html              Page d'accueil : menu des rapports (succinct/général ×
                        préscolaire/élémentaire/moyen) + Espace Inspection
                        (chaque carte possède ses liens 🔒 Espace / 📊 Analyse)
general-elementaire.html  Formulaire du directeur (A → N) + soumission + PDF 6 pages
general-prescolaire.html  ★ Formulaire du « RAPPORT GÉNÉRAL DE RENTRÉE
                        PRÉSCOLAIRE » (A → L) + soumission + PDF 5 pages paysage
succinct-prescolaire.html Formulaire du « RAPPORT DE SUCCINCT DE RENTRÉE »
                        préscolaire + soumission + PDF 2 pages (paysage + portrait)
saisie.html             Redirection vers general-elementaire.html (anciens liens conservés)
apercu.html             Aperçu / régénération du rapport — TYPE-AWARE :
                        ?type=<id> charge le gabarit, le brouillon et le nombre
                        de pages du type (défaut = élémentaire, inchangé)
admin.html              Espace Inspection (connexion Supabase, liste, PDF, export XLSX)
                        — partagé entre les 6 types : admin.html?type=<id>
analyse.html            Exploitation des données (filtres, KPI, graphiques, synthèse, export XLSX)
                        — partagée entre les 6 types : analyse.html?type=<id>

assets/css/rapport.css  Mise en page officielle du rapport (partagée écran/PDF)
                        + styles du succinct (page 2 portrait, aperçu mixte)
assets/css/app.css      Styles de l'interface et du formulaire
assets/css/analyse.css  Styles de la page d'analyse (filtres, graphiques, mini-barres)
assets/js/config.js     ★ CONFIGURATION (URL Supabase, clé, année scolaire, TYPES
                        avec capacités pdf/xlsx/analyse/pages/ecoles/form/modif/modele)
assets/js/lib.js        Construction du contexte du rapport (portage de build_context)
assets/js/rapport.js    Génération HTML des 6 pages officielles (élémentaire)
assets/js/rapport-succinct.js  ★ Modèle du succinct préscolaire : 2 pages
                        (paysage + portrait), registre RR_MODELES[type]
assets/js/rapport-general-prescolaire.js  ★ Modèle du général préscolaire :
                        5 pages paysage (A → L), registre RR_MODELES[type]
assets/js/pdf.js        Génération du PDF A4 dans le navigateur (orientation
                        PAR PAGE : paysage par défaut, portrait sur demande)
assets/js/champs.js     Définition déclarative du formulaire (sections A → N)
assets/js/champs-succinct.js   ★ Définition du modèle succinct (sections + tableaux)
assets/js/champs-general-prescolaire.js  ★ Définition du général préscolaire
                        (sections A → L, personnel 10/2/5, effectifs 10,
                        mobiliers 16, recensements K 10 / L 14 lignes,
                        CODEC facultatif non imprimé)
assets/js/ecoles.js     ★ LISTES FERMÉES : 101 écoles + 15 CODEC + 5 communes +
                        24 écoles préscolaires (combos du formulaire)
assets/js/form.js       Rendu, collecte, brouillon hors-ligne, soumission
assets/js/form-succinct.js     ★ Moteur DÉDIÉ du succinct : rendu, combos,
                        validation minimale, brouillon, soumission 2 pages
assets/js/form-general-prescolaire.js  ★ Moteur DÉDIÉ du général préscolaire :
                        rendu A → L, calculs (T=G+F, totaux I, Total mobilier),
                        brouillon dédié, soumission 5 pages + anti-doublon
assets/js/db.js         Accès Supabase + file d'attente hors-ligne + listes
assets/js/analyse.js    Exploitation : agrégation, graphiques SVG maison, synthèse, export XLSX
                         — moteur partagé + registre RR_ANALYSE[type] des modules dédiés
assets/js/analyse-succinct.js  ★ Module d'analyse du succinct préscolaire (KPI, graphiques,
                         taux, synthèse, titres) chargé à la demande après la session
assets/js/xlsx-export.js Export Excel : classeur 8 feuilles depuis l'Espace Inspection
assets/js/xlsx-modele.js En-têtes / fusions / largeurs des 6 feuilles du modèle officiel
assets/js/xlsx-succinct.js ★ Classeur du modèle officiel 3 feuilles (succinct préscolaire),
                         en-têtes copiés du modèle, chargé à la demande au clic
assets/vendor/          supabase-js, html2canvas, jsPDF, SheetJS (embarqués, hors-ligne ;
                        jsPDF + html2canvas et SheetJS sont chargés à la demande, au clic)
assets/logo_men.png     ★ Logo officiel du MEN (en-tête haut droit du rapport)
assets/drapeau.png      ★ Drapeau du Sénégal (en-tête haut gauche du rapport)
supabase/schema.sql     Table `rapports` + règles de sécurité (RLS)
supabase/migration_types.sql  Colonne `type` + PK (type, ecole_code, annee) + RPC avec p_type
supabase/listes.sql     Table `listes` (écoles / CODEC / communes) + amorçage des 121 entrées
supabase/migration_listes_prescolaire.sql  Contrainte CHECK à 4 types +
                        amorçage idempotent des 24 écoles préscolaires
```

---

## 3. Mise en route (une seule fois)

### 3.1 Base de données Supabase — 5 minutes

1. Créez un projet gratuit sur [supabase.com](https://supabase.com)
   (ou réutilisez un projet existant : l'organisation gratuite est limitée
   à **2 projets actifs**)
2. **SQL Editor → New query** → collez le contenu de `supabase/schema.sql` → **Run**
   (table `rapports` + règles RLS + fonctions `sauver_rapport` /
   `rapport_existe`)
3. **Reprenez « New query »** → collez le contenu de `supabase/listes.sql` → **Run**
   (table `listes` : 101 écoles + 15 CODEC + 5 communes). L'amorçage des
   écoles/CODEC n'a lieu **que si la table est vide** (le ré-exécuter ne
   remet jamais une école supprimée) ; les **communes** sont, elles,
   ré-amorcées à chaque exécution sans jamais dupliquer, et la contrainte
   `type` accepte les 3 types même sur une base ancienne.
4. **Puis, une seule fois aussi** → collez le contenu de
   `supabase/migration_types.sql` → **Run** : ajoute la colonne `type`,
   passe la clé primaire à `(type, ecole_code, annee)` et met à jour les
   fonctions `sauver_rapport` / `rapport_existe` (anti-doublon **par type**).
   Les rapports déjà enregistrés deviennent `general-elementaire` automatiquement.
   ⚠️ À exécuter **avant** (ou en même temps que) la mise en ligne du code :
   l'ancien code n'appelle plus les nouvelles signatures.
5. **Et pour le rapport succinct préscolaire** → collez le contenu de
   `supabase/migration_listes_prescolaire.sql` → **Run** : la contrainte
   `listes.type` accepte le 4ᵉ type `ecole_prescolaire` et les **24 écoles
   préscolaires** sont amorcées (idempotent : le ré-exécuter ne duplique
   rien et ne remet jamais une école retirée). Sans cette étape, l'ajout
   d'une école préscolaire depuis l'Espace Inspection échoue sur
   « check constraint ».
6. **Authentication → Users → Add user** : créez le compte de l'Inspection
   (email + mot de passe) — c'est la seule connexion requise
7. **Project Settings → API Keys → View legacy API keys** : copiez l'**Project
   URL** (`https://xxxx.supabase.co`) et la **anon public key**

> ⚠️ Le rôle `anon` n'a **pas** de droit SELECT sur `rapports` : les écritures
> passent par la fonction SQL `sauver_rapport` (SECURITY DEFINER). N'ajoutez pas
> de policy SELECT pour `anon` **sur `rapports`**, sinon n'importe qui pourrait
> télécharger tous les rapports avec la clé publique. Seule la table `listes`
> (noms d'écoles / CODEC, sans aucune donnée de rapport) est lisible par `anon`.

### 3.2 Configuration du site

Ouvrez `assets/js/config.js` et renseignez :

```js
SUPABASE_URL: "https://xxxxxxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi..."
```

Les autres réglages de ce fichier :

```js
ANNEE: "2026/2027",                 // titre du rapport + nom du PDF + colonne en base
INSPECTION: "…KAOLACK",             // en-tête officiel (page 1)
IEF: "…FORMATION DE KEUR MADIABEL", // en-tête officiel (page 1)
LOGO: "assets/logo_men.png",        // logo MEN en haut à droite ("" = bloc « LOGO MEN »)
DRAPEAU: "assets/drapeau.png",      // drapeau en haut à gauche ("" = drapeau dessiné en CSS)
```

> Le logo est affiché en `74 × 46 px` et le drapeau en `51 × 34 px`, avec
> `object-fit: contain` : conservez des PNG **transparents**, de préférence
> larges (le rendu reste net). Si un fichier est absent du dépôt, le rapport
> affiche automatiquement le bloc `LOGO MEN` ou le drapeau dessiné en CSS
> au lieu d'une image cassée.

Tant que `SUPABASE_URL` / `SUPABASE_ANON_KEY` sont vides, **le formulaire
fonctionne quand même** : les saisies restent sur l'appareil et le PDF se
télécharge normalement.

### 3.3 Publication sur GitHub Pages

```bash
git remote add origin https://github.com/VOTRE-COMPTE/rapport-rentree.git
git push -u origin main
```

Puis : **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
L'adresse `https://VOTRE-COMPTE.github.io/rapport-rentree/` est à donner aux
directeurs (à raccourcir avec un lien type `bit.ly` pour les villages).

### 3.4 Tester localement

```bash
python -m http.server 8099
# puis http://localhost:8099/            (page d'accueil = menu des rapports)
```

---

## 4. Utilisation quotidienne

**Directeur** : ouvrir le lien → choisir son école dans la **liste
déroulante** (tapez pour filtrer) → remplir A → N → **Soumettre et
télécharger le PDF officiel** → remettre le fichier à l'Inspecteur (ou
l'envoyer par WhatsApp dès que le réseau le permet).

**Inspection** : ouvrir `admin.html` → se connecter → liste des écoles
ayant soumis. Trois actions par école (selon les capacités du type, voir
`config.js` → `TYPES`) :

| Action | Effet |
|---|---|
| **Voir / PDF** | aperçu des pages du gabarit + téléchargement du PDF officiel (6 pages pour l'élémentaire, 4 pour le général préscolaire, 2 pour le succinct préscolaire) — le gabarit dédié du type est chargé à la demande (`typeInfo.modele`) |
| **✏ Modifier** | charge le rapport enregistré dans le formulaire de **ce** type ; l'Inspection corrige puis re-soumet — le rapport existant est **remplacé** et le nouveau PDF téléchargé (clé de reprise dédiée par type : `RR_MODIF`, `RR_MODIF_SUCCINCT`, `RR_MODIF_GENERAL_PRESCOLAIRE`, …) |
| **🗑 Supprimer** | confirmation native, puis suppression définitive du rapport de l'école |

### Un espace et une Analyse PAR TYPE de rapport

Chaque type de rapport possède **son propre Espace Inspection et sa propre
Analyse**, distingués par le paramètre d'URL `?type=<id>` :

```
admin.html?type=succinct-prescolaire    analyse.html?type=succinct-prescolaire
admin.html?type=succinct-elementaire    analyse.html?type=succinct-elementaire
admin.html?type=succinct-moyen          analyse.html?type=succinct-moyen
admin.html?type=general-prescolaire     analyse.html?type=general-prescolaire
admin.html?type=general-elementaire     analyse.html?type=general-elementaire   ← défaut
admin.html?type=general-moyen           analyse.html?type=general-moyen
```

- **Accueil** : chaque carte du menu porte deux liens **🔒 Espace** et
  **📊 Analyse** ouvrant l'espace de *ce* type ;
- **Sélecteur « Type »** dans la barre supérieure des deux pages : bascule
  d'un type à l'autre sans repasser par l'accueil ;
- URL **sans paramètre ou valeur inconnue** → type par défaut
  `general-elementaire` (tous les liens existants restent valides) ;
- le **titre, le sous-titre, les liens de retour** (Espace ↔ Analyse, même
  type) et **la lecture des rapports** suivent le type choisi ;
- l'**anti-doublon s'applique par type** : une école peut déposer un
  rapport succinct ET un rapport général sans se bloquer ;
- les **capacités sont déclarées par type** dans `config.js` → `TYPES` :
  `pdf`, `xlsx`, `analyse`, `pages`, `ecoles`, `form`, `modif`,
  `brouillon` (clé du brouillon local), `modele` (gabarit dédié),
  `analyse_js` (module d'analyse dédié), `xlsx_js` (classeur dédié).
  À ce jour **Voir / PDF** et **✏ Modifier** sont actifs pour
  `general-elementaire` (6 pages), `succinct-prescolaire` (2 pages) **et**
  `general-prescolaire` (5 pages) ; **⬇ Export XLSX** et la page
  **📊 Analyse** sont actifs pour `general-elementaire` **et**
  `succinct-prescolaire` (modules dédiés chargés à la demande).
  `general-prescolaire` a `xlsx: false` et `analyse: false` : son Espace
  Inspection affiche « 5 pages » et ouvre le bon gabarit, mais l'Export
  XLSX est **désactivé** et la page Analyse affiche **« Analyse en
  préparation pour ce type »** avec un lien de retour (aucune donnée lue).
  Pour un type sans capacité, l'Espace affiche
  « à venir ».

**Export Excel** : le bouton **⬇ Export XLSX** (barre d'outils) télécharge
le classeur du type, chargé à la demande :

- **`general-elementaire`** → `Rapport_Rentree_2026-2027.xlsx`, un
  classeur de **8 feuilles** (1. Identification · 2. Effectifs et cours ·
  puis les 6 feuilles du modèle officiel « Structures et effectifs
  élémentaires » : Type de classe, Personnel enseignant, Liste du
  personnel, Ouvrages annexes, Mobilier et équipements, Manuels et
  matériel didactique) avec tous les rapports soumis, triés par commune
  puis école, sous-totaux « Total COM. … » + TOTAL GÉNÉRAL, nombres
  somables et dates en jj/mm/aaaa. La feuille *Effectifs et cours* suit
  le modèle officiel : en-têtes fusionnés (N°, Etablissement, CI → CM2
  avec Nombre / EFFECTIFS / REDOUBLANTS / HANDICAPÉS / SANS ÉTAT CIVIL)
  puis **TOTAL ÉTABLISSEMENT** ;
- **`succinct-prescolaire`** → `Rapport_Succinct_Prescolaire_2026-2027.xlsx`,
  le **modèle officiel 3 feuilles** (`assets/js/xlsx-succinct.js`) :
  *COURS ET EFFECTIFS* (78 colonnes), *OUVRAGES ET ACTIVITES ANNEXES*
  (22), *MOBILIERS ET EQUIPEMENTS* (66) — en-têtes, titres et fusions
  **copiés verbatim** du fichier modèle, effectifs/personnel en nombres,
  rubriques non collectées à 0, sous-colonnes non distinguées laissées
  vides, statut Pu/COM par préfixe d'école, N° **recommençant par
  commune**, mêmes sous-totaux « Total COM. … » + TOTAL GÉNÉRAL, **aucune
  ligne PU/COM/ARRDT** du modèle.

Si aucun rapport n'est déposé, un message s'affiche sans fichier.

### Exploitation des données — la page « 📊 Analyse »

`analyse.html` est la page d'**analyse et d'exploitation** des rapports
déposés. Elle n'a **aucun formulaire de connexion** : elle n'est accessible
que par le bouton **📊 Analyse** de la barre de l'Espace Inspection, qui
n'apparaît **qu'après connexion**. Si l'URL est ouverte à la main sans
session, la page affiche un simple message et un lien de retour (aucune
donnée n'est lue sans session).

**Filtres combinables** (recalcul instantané) : **Commune → CODEC → École**
(en cascade) et **Sexe** (Garçons / Filles / les deux — appliqué aux
KPI et aux graphiques ; les tableaux restent complets). Le filtre
**CODEC** (et l'option de groupement « CODEC ») est **masqué** pour les
types qui n'en ont pas (`succinct-prescolaire`).

**Moteur partagé + module dédié par type** : `analyse.js` est identique
pour les 6 types ; un type peut fournir son module
`analyse_js` (`assets/js/analyse-succinct.js` → registre
`RR_ANALYSE[type]`, chargé à la demande **après la session**) qui pilote
ses **titres de graphiques**, son sous-titre, sa note *Sexe*, ses
colonnes du tableau **Taux** et de la **Synthèse**, ainsi que son titre
d'export. Sans module (`mod = null`), le rendu élémentaire reste
strictement inchangé.

**Contenu :**

| Bloc | Détail |
|---|---|
| **Cartes KPI** | écoles analysées · élèves G/F + % filles · cours/classes (simples/CMG/CDF) · taux de redoublants · handicapés & sans état civil · personnel H/F — *succinct : enfants PS/MS/GS · sections · salles d'activités · maîtres renseignés · handicapés déclarés* |
| **Graphiques SVG** (faits main, aucun CDN) | effectifs par niveau **CI → CM2** en barres groupées G/F · types de classes empilés · personnel **H/F** (français + arabe) · **mobilier** bon / à réparer / déficit · **infrastructures** en % d'écoles · **couverture des manuels** en % d'écoles — *succinct : effectifs PS/MS/GS · salles d'activités · eau & électricité · mobilier & jeux · équipements scolaires · structure de l'école* |
| **Taux par école** | % filles, % redoublants, % handicapés, % sans état civil, élèves/classe — **triable** (clic sur un en-tête) avec mini-barres — *succinct : enfants, % filles, sections, salles, maîtres, enfants/section* |
| **Synthèse** | regroupement au choix **Commune / CODEC / École**, sous-totaux « Total COM. … » / « Total CODEC … » puis **TOTAL GÉNÉRAL** (même convention que l'export XLSX) — *succinct : regroupement Commune / École, colonnes PS · MS · GS · Total · Maîtres · Sections · Handicap.* |
| **⬇ Export XLSX** | classeur `Analyse_Rentree_2026-2027.xlsx`, feuille unique **« Synthèse »**, tableau exactement tel qu'affiché, **nombres restant des nombres** (somables), titre du type. SheetJS (930 Ko) n'est téléchargé **qu'au clic**, comme les autres pages |

Poids au chargement : **≈ 312 Ko** (dont 215 Ko de supabase-js) — les
autres pages ne changent pas.

### Les 4 cartes du tableau de bord

| Carte | Calcul |
|---|---|
| **Écoles déclarées** | nombre de rapports en base |
| **En attente d'envoi** | **écoles de la liste (table `listes`) qui n'ont aucun rapport en base** — comparaison des noms **normalisés** (ni casse, ni accents, ni espaces). Une école retirée de la liste mais déjà déclarée compte comme *déclarée*, jamais comme *en attente* |
| **Dernière soumission** | date la plus récente de `maj_le` |
| **File locale** | saisies hors-ligne de **cet appareil** pas encore envoyées (file d'attente locale) |

Le compteur « En attente d'envoi » est **recalculé** à chaque changement :
chargement des rapports, chargement des listes, ajout ou suppression d'une
école. Hors-ligne, la carte porte la mention **« (liste locale) »** car la
liste vient alors du cache ou de `ecoles.js`.

> L'ancien libellé « En attente d'envoi » affichait la file locale ; ce
> compteur a été renommé **« File locale »** pour lever l'ambiguïté.

### Gérer les listes des écoles, des CODEC, des communes et des écoles préscolaires

Dans `admin.html`, la carte **« Listes des écoles et des CODEC »** (sous le
tableau de bord) donne les **quatre colonnes** (écoles, CODEC, communes,
écoles préscolaires), avec recherche, ajout et suppression :

| Action | Effet |
|---|---|
| **＋ Ajouter** | écrit dans Supabase (table `listes`) puis met à jour la liste. **Doublon refusé** même si la casse ou les accents diffèrent (`ecole de test` ≡ `ECOLE DE TEST`), valeur vide refusée |
| **🗑** (par ligne) | confirmation native → suppression. Si l'école a **déjà déposé des rapports**, un avertissement rappelle qu'ils restent consultables mais qu'elle ne pourra plus soumettre |
| **Rechercher** | filtre la colonne affichée (le total reste visible) |

À chaque changement, le formulaire du directeur (déjà ouvert ou non) utilise
la nouvelle liste : une école ajoutée est **sélectionnable aussitôt**, une
école supprimée est **refusée à la soumission**.

> Les droits RLS : `anon` (le directeur) ne peut que **lire** `listes`,
> seuls les comptes `authenticated` (l'Inspection) peuvent insérer ou
> supprimer. Sans réseau, le formulaire retombe sur le cache puis sur
> `ecoles.js`.

---

## 5. Sécurité

* La **clé anon** Supabase est publique (normal : elle est dans le JS).
  Les règles **RLS** du `schema.sql` limitent ce qu'elle peut faire :
  * `anon` → **insert / update** uniquement sur `rapports` (pas de lecture,
    pas de suppression) ; **select** uniquement sur `listes` (noms d'écoles
    et de CODEC, sans aucune donnée de rapport)
  * `authenticated` → **select / delete** sur `rapports`, **select / insert /
    delete** sur `listes` (réservé à l'Inspection)
* Aucun mot de passe de directeur : le formulaire est public, les données sont
  des données administratives non nominatives sensibles (effectifs, personnels).
* Pour renforcer : activer dans Supabase **Authentication → Providers → Email**
  et éventuellement limiter l'accès au site par un mot de passe GitHub Pages.
