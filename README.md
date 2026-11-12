# Rapport Général de Rentrée Élémentaire 2026/2027

**IEF de KEUR MADIABEL — Inspection d'Académie de Kaolack**

Système de collecte du rapport de rentrée : chaque directeur remplit le
formulaire officiel dans son navigateur, clique sur **Soumettre**, et le
**PDF officiel (6 pages, A4 paysage) se télécharge automatiquement** —
strictement identique au modèle administratif, sans compte, sans sélection
d'école.

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

### Résistance au réseau 2G/3G

* Saisie **entièrement hors-ligne** (brouillon local, restauration automatique)
* Envoi **différé** en file d'attente si le réseau tombe, puis synchronisation automatique
* Le PDF est **généré localement** : son téléchargement ne consomme aucune donnée mobile
* Bibliothèques embarquées dans le dépôt (aucun CDN externe) → le site se met en cache après la première visite

### Passage à l'échelle : 500 écoles

* Supabase (PostgreSQL) : un rapport pèse 10 à 50 Ko → **≈ 25 Mo pour 500 écoles** (l'offre gratuite en stocke 500 Mo)
* Clé primaire `(ecole_code, annee)` où `ecole_code` = **slug du nom de l'école** : une école qui soumet deux fois **met à jour** sa ligne, pas de doublon. Le **CODEC ne sert jamais de clé** — plusieurs écoles peuvent partager le même CODEC (c'est leur regroupement) et déposent chacune leur propre rapport
* Contrôle **avant** envoi (fonction SQL `rapport_existe`) : le directeur est prévenu dès la soumission si son école a déjà déposé — hors-ligne, ce contrôle est simplement ignoré et la file se synchronise plus tard
* GitHub Pages : ~1,5 Mo de site, servi depuis le CDN GitHub (100 Go/mois offerts)
* Aucun serveur à maintenir, aucun coût

### Listes fermées : écoles, CODEC et communes

Les champs **Nom de l'école**, **CODEC** et **Commune** (section A) sont des
listes déroulantes **filtrables** : on tape quelques lettres, la liste réduit,
on choisit. Le filtrage est **insensible aux accents et à la casse**
(`ndrame` → `NDRAMÉ DIMB`, `fode` → `KEUR FODÉ`).

* **`assets/js/ecoles.js`** contient les trois tableaux de repli :
  `RR_ECOLES` (**101 écoles**), `RR_CODECS` (**15 CODEC**) et
  `RR_COMMUNES` (**5 communes** : KEUR MABA DIAKHOU, KEUR MADIABEL,
  KEUR MANDONGO, NDRAMÉ ESCALE, WACK NGOUNA). La source de
  vérité est la table Supabase **`listes`** (voir `supabase/listes.sql`).
* **Blocage** : une valeur absente de la liste est **refusée à la
  soumission** — message d'erreur, aucun envoi réseau, aucun PDF.
* **CODEC et Commune facultatifs** : le champ peut rester vide, mais s'il
  est saisi il doit figer dans la liste.
* **Gestion depuis l'espace Inspection** : la carte *« Listes des écoles
  et des CODEC »* donne les **trois colonnes** (écoles, CODEC, communes)
  pour ajouter ou supprimer une valeur sans toucher au code (voir § 4).
* **Repli hors-ligne** : serveur → cache localStorage → `ecoles.js`.

---

## 2. Fichiers du projet

```
index.html              Page d'accueil : menu des 6 rapports (succinct/général ×
                        préscolaire/élémentaire/moyen) + Espace Inspection
                        (chaque carte possède ses liens 🔒 Espace / 📊 Analyse)
general-elementaire.html  Formulaire du directeur (A → N) + soumission + PDF
saisie.html             Redirection vers general-elementaire.html (anciens liens conservés)
apercu.html             Aperçu / régénération du rapport (brouillon local ou rapport en base)
admin.html              Espace Inspection (connexion Supabase, liste, PDF, export XLSX)
                        — partagé entre les 6 types : admin.html?type=<id>
analyse.html            Exploitation des données (filtres, KPI, graphiques, synthèse, export XLSX)
                        — partagée entre les 6 types : analyse.html?type=<id>

assets/css/rapport.css  Mise en page officielle du rapport (partagée écran/PDF)
assets/css/app.css      Styles de l'interface et du formulaire
assets/css/analyse.css  Styles de la page d'analyse (filtres, graphiques, mini-barres)
assets/js/config.js     ★ CONFIGURATION (URL Supabase, clé, année scolaire)
assets/js/lib.js        Construction du contexte du rapport (portage de build_context)
assets/js/rapport.js    Génération HTML des 6 pages officielles
assets/js/pdf.js        Génération du PDF A4 paysage dans le navigateur
assets/js/champs.js     Définition déclarative du formulaire (sections A → N)
assets/js/ecoles.js     ★ LISTES FERMÉES : 101 écoles + 15 CODEC + 5 communes (combos du formulaire)
assets/js/form.js       Rendu, collecte, brouillon hors-ligne, soumission
assets/js/db.js         Accès Supabase + file d'attente hors-ligne
assets/js/analyse.js    Exploitation : agrégation, graphiques SVG maison, synthèse, export XLSX
assets/js/xlsx-export.js Export Excel : classeur 8 feuilles depuis l'Espace Inspection
assets/js/xlsx-modele.js En-têtes / fusions / largeurs des 6 feuilles du modèle officiel
assets/vendor/          supabase-js, html2canvas, jsPDF, SheetJS (embarqués, hors-ligne ;
                        jsPDF + html2canvas et SheetJS sont chargés à la demande, au clic)
assets/logo_men.png     ★ Logo officiel du MEN (en-tête haut droit du rapport)
assets/drapeau.png      ★ Drapeau du Sénégal (en-tête haut gauche du rapport)
supabase/schema.sql     Table `rapports` + règles de sécurité (RLS)
supabase/migration_types.sql  Colonne `type` + PK (type, ecole_code, annee) + RPC avec p_type
supabase/listes.sql     Table `listes` (écoles / CODEC / communes) + amorçage des 121 entrées
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
5. **Authentication → Users → Add user** : créez le compte de l'Inspection
   (email + mot de passe) — c'est la seule connexion requise
6. **Project Settings → API Keys → View legacy API keys** : copiez l'**Project
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
ayant soumis. Trois actions par école :

| Action | Effet |
|---|---|
| **Voir / PDF** | aperçu des 6 pages + téléchargement du PDF officiel |
| **✏ Modifier** | charge le rapport enregistré dans le formulaire de saisie ; l'Inspection corrige puis re-soumet — le rapport existant est **remplacé** et le nouveau PDF téléchargé |
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
- garde-fous : **Voir / PDF**, **✏ Modifier** et **⬇ Export XLSX** ne sont
  actifs que pour `general-elementaire` (seul type disposant à ce jour du
  modèle et d'un formulaire) — les autres affichent « à venir ».

**Export Excel** : le bouton **⬇ Export XLSX** (barre d'outils) télécharge
`Rapport_Rentree_2026-2027.xlsx` — un classeur de **8 feuilles**
(1. Identification · 2. Effectifs et cours · puis les 6 feuilles du
modèle officiel « Structures et effectifs élémentaires » : Type de
classe, Personnel enseignant, Liste du personnel, Ouvrages annexes,
Mobilier et équipements, Manuels et matériel didactique) avec tous les
rapports soumis, triés par commune puis école, sous-totaux
« Total COM. … » + TOTAL GÉNÉRAL, nombres somables et dates en
jj/mm/aaaa. La feuille *Effectifs et cours* suit le
modèle officiel : en-têtes fusionnés (N°, Etablissement, CI → CM2 avec
Nombre / EFFECTIFS / REDOUBLANTS / HANDICAPÉS / SANS ÉTAT CIVIL) puis
**TOTAL ÉTABLISSEMENT**. Si aucun rapport n'est déposé, un message
s'affiche sans fichier.

### Exploitation des données — la page « 📊 Analyse »

`analyse.html` est la page d'**analyse et d'exploitation** des rapports
déposés. Elle n'a **aucun formulaire de connexion** : elle n'est accessible
que par le bouton **📊 Analyse** de la barre de l'Espace Inspection, qui
n'apparaît **qu'après connexion**. Si l'URL est ouverte à la main sans
session, la page affiche un simple message et un lien de retour (aucune
donnée n'est lue sans session).

**Filtres combinables** (recalcul instantané) : **Commune → CODEC → École**
(en cascade) et **Sexe** (Garçons / Filles / les deux — appliqué aux
effectifs et au personnel ; les tableaux restent complets).

**Contenu :**

| Bloc | Détail |
|---|---|
| **Cartes KPI** | écoles analysées · élèves G/F + % filles · cours/classes (simples/CMG/CDF) · taux de redoublants · handicapés & sans état civil · personnel H/F |
| **Graphiques SVG** (faits main, aucun CDN) | effectifs par niveau **CI → CM2** en barres groupées G/F · types de classes empilés · personnel **H/F** (français + arabe) · **mobilier** bon / à réparer / déficit · **infrastructures** en % d'écoles · **couverture des manuels** en % d'écoles |
| **Taux par école** | % filles, % redoublants, % handicapés, % sans état civil, élèves/classe — **triable** (clic sur un en-tête) avec mini-barres |
| **Synthèse** | regroupement au choix **Commune / CODEC / École**, sous-totaux « Total COM. … » / « Total CODEC … » puis **TOTAL GÉNÉRAL** (même convention que l'export XLSX) |
| **⬇ Export XLSX** | classeur `Analyse_Rentree_2026-2027.xlsx`, feuille unique **« Synthèse »**, tableau exactement tel qu'affiché, **nombres restant des nombres** (somables). SheetJS (930 Ko) n'est téléchargé **qu'au clic**, comme les autres pages |

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

### Gérer les listes des écoles, des CODEC et des communes

Dans `admin.html`, la carte **« Listes des écoles et des CODEC »** (sous le
tableau de bord) donne les **trois colonnes** (écoles, CODEC, communes),
avec recherche, ajout et suppression :

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
