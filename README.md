# Rapports de Rentrée 2026/2027

**IEF de KEUR MADIABEL — Inspection d'Académie de Kaolack**

Système de collecte des rapports de rentrée : chaque directeur remplit le
formulaire officiel dans son navigateur, clique sur **Soumettre**, et le
**PDF officiel se télécharge automatiquement** — strictement identique au
modèle administratif, sans compte, sans sélection d'école.

Cinq types de rapports sont disponibles à ce jour (plus les types
« bientôt disponibles ») :

| Type | Formulaire | PDF |
|---|---|---|
| **Rapport général de rentrée élémentaire** | `general-elementaire.html` (sections A → P) | **7 pages A4 paysage** |
| **Rapport général de rentrée préscolaire** | `general-prescolaire.html` (sections A → M) | **5 pages A4 paysage** |
| **Rapport général de rentrée moyen & secondaire** | `general-moyen.html` (11 feuilles officielles) | **14 pages A4 mixtes** : 6 portraits + 8 paysages |
| **Rapport succinct de rentrée préscolaire** | `succinct-prescolaire.html` (modèle condensé) | **2 pages A4 mixtes** : page 1 **paysage**, page 2 **portrait** |
| **Rapport des évaluations (T1 / T2 / T3)** | `evaluations.html` (sections A → G) | **2 pages A4 portrait** (210 × 297 mm, marges 0) |

> **Architecture : GitHub Pages + Supabase uniquement** — aucun serveur,
> aucun compte, aucune dépendance externe.

---

## 1. Comment ça marche

| Étape | Ce qui se passe |
|---|---|
| **1. Saisie** | Le directeur ouvre la page d'accueil `index.html` (menu des rapports), choisit **Rapport général de rentrée élémentaire** et remplit les sections **A → P**. Fonctionne **sans réseau** : la saisie est enregistrée en permanence sur l'appareil (brouillon). |
| **2. Soumission** | Un clic sur **Soumettre** : les données partent vers Supabase, ou — si le réseau est absent — sont mises en **file d'attente** et envoyées automatiquement au prochain accès. **Anti-doublon** : si l'école a déjà déposé son rapport, un message demande de confirmer — *OK* remplace le rapport (mise à jour), *Annuler* abandonne **sans envoi ni PDF**. |
| **3. PDF automatique** | Le PDF est construit **dans le navigateur** (html2canvas + jsPDF) puis téléchargé immédiatement. Aucun serveur n'est nécessaire pour le téléchargement. Ces deux bibliothèques (≈ 550 Ko) ne sont téléchargées qu'au 1er clic sur un bouton PDF, pas à l'ouverture de la page (gain important sur connexion lente, type 2G). |
| **4. Suivi** | L'Inspection se connecte à `admin.html` pour voir les écoles ayant soumis et, pour chacune : **Voir / PDF**, **Modifier** (corrige le rapport puis régénère le PDF) ou **Supprimer**. |
| **5. Analyse** | Après connexion à l'Espace Inspection, le bouton **📊 Analyse** ouvre `analyse.html` : exploitation par **école / CODEC / commune / sexe** (KPI, graphiques SVG, taux par école, synthèse) et export **XLSX**. |

### Mise en page du PDF (conforme au modèle)

* Format **A4 PAYSAGE** (297 × 210 mm), zone utile 275 × 194 mm
* **7 pages, exactement comme le modèle** — aucune section n'est coupée :

| Page | Contenu |
|---|---|
| **1** | En-tête officiel (République du Sénégal, MEN, IA de Kaolack, IEF de KEUR MADIABEL) + **A** Identification + **B** Classes pédagogiques + **C** Classes physiques + **D** Directeur |
| **2** | **E** Ouvrages annexes + **F** Activités péri/para scolaires + **F**/**G** Observations |
| **3** | **H** Classes double-flux (6 niveaux) + **I** Classes multigrades (15 combinaisons) |
| **4** | **J** Personnel enseignant (20 lignes numérotées) + suppléants + malades + récapitulation FR/AR |
| **5** | **K** Effectifs + **L** Mobilier scolaire |
| **6** | **M** Recensement des manuels |
| **7** | **N** Autres manuels + **O** Matériel didactique + **P** Autres matériels + signature *Le Directeur* |

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
DE RENTRÉE PRÉSCOLAIRE »**, relevé sur le `.docx` officiel et la capture de
la page 4 fournie pour le modèle 2026/2027 (`RG 1-5 prescolaire.PNG`).
Le PDF contient **exactement 5 pages A4 paysage** (sections **A → M**) :

| Page | Contenu |
|---|---|
| **1** | En-tête officiel + **A** Identification (sans le CODEC) + **B** Classes pédagogiques (3 colonnes) + **C** Classes physiques (ETAT/ANCTP/COM./PLAN/PRIVE/APE + Total auto + abris + à réhabiliter + note *« Ne mettez pas de croix… »*) + **D** Directeur (avec WhatsApp) |
| **2** | **E** Ouvrages annexes (cabines adaptées/non adaptées, *Bloc administratif*, Senelec + plaques solaires seuls, robinet/puits Oui-Non + État + Bailleur) + **F** Activités (ligne « 2 » du modèle Word non reproduite) + **G** Observations + *LE DIRECTEUR (signature et cachet)* |
| **3** | **H** Personnel enseignant **10 lignes** (colonne *Section tenue*) + **MALADES 2 lignes** + récapitulation FR/AR + **SERVICE 5 lignes** |
| **4** | **I** Effectifs **3 lignes fixes P.S / M.S / G.S** (**Nbr Classe** + EFFECTIF / PASSANTS / REDOUBLANTS / TRANSFERTS ENTRANTS / TRANSFERTS SORTANTS / SANS ÉTAT CIVIL × G F T + ligne **TOTAL** calculée) + **J** **SITUATION DES HANDICAPÉS** (8 catégories × G F T + TOTAL) + **K** **MOBILIERS 16 lignes** (Bon / A réparer / Total auto / Déficit) |
| **5** | **L** **RECENSEMENT DES MANUELS 10 lignes** (*Désignation / Quantité / Provenances / Besoins / Observations*) + **M** **RECENSEMENT DU MATÉRIEL 14 lignes** (*Désignation / Quantité / Provenance / Besoins / Observations*) — tableaux sans colonne N° + pied de page |

Décisions de conformité (modèle 2026/2027) : **page 4 = I + J + K** et
**page 5 = L + M** (libellés verbatim du `.docx` : « Provenances » au
pluriel pour L, « Provenance » au singulier pour M), **champ CODEC retiré
du formulaire** (il n'était déjà pas imprimé sur le PDF ; les anciens
rapports restent lisibles, aucune migration), colonne **« N°Maître » non
reprise**.

**Navigation clavier** : toutes les sections sont ouvertes au chargement ;
les flèches **↑ ↓ ← →** déplacent d'un champ à l'autre, **←/→** agissant en
début ou en fin de texte. Les listes déroulantes et les zones de texte
gardent leurs flèches natives.

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
**Périmètre** : PDF, Espace Inspection et **Export XLSX** (9 feuilles
officielles) ; l'**Analyse** reste *« en préparation »*
(`analyse: false`).

### Le rapport général moyen & secondaire — 14 pages strictes

`general-moyen.html` applique le classeur officiel 2026/2027 **« RAPPORT
GÉNÉRAL DE RENTRÉE — Enseignement Moyen & Secondaire »** (**11 feuilles**).
Le PDF contient **exactement 14 pages A4** : chaque feuille commence sur une
nouvelle page, et les trois feuilles nominatives continuent sur plusieurs
pages.

| Page | Format | Feuille / contenu |
|---|---|---|
| **1** | Portrait (210 × 297 mm) | `1 - PAGE D'ENTRÉE` : identification (dont Code administratif et Code Chapitre), effectifs personnels / élèves, CGE, PE, gouvernement scolaire, cellules, clubs (dont EVF), chef d'établissement |
| **2** | Paysage (297 × 210 mm) | `2 - INFORMATIONS ELEVES VULNERAB` : groupes pédagogiques (Total / Dont FA) et 11 indicateurs handicap / vulnérabilité / violences, en G / F par niveau |
| **3** | Portrait | `3 - STRUCTURES & EQUIPEMENTS` : accessibilité, clôture, sanitaires, laboratoire, eau / énergie, connexions, salles, équipements, manuels (18 disciplines), supports numériques |
| **4** | Portrait | `SITUATION DU TICE` : compétences numériques, personnes ressources, partenaires, financements, contraintes / stratégies / recommandations |
| **5** | Paysage | `5-EFFECTIF ELEVES MOYEN` : 6ème → 3ème, Total et Dont FA, effectifs / passants / redoublants, LV2 par niveau |
| **6** | Paysage | `6-EFFECTIF SECONDAIRE` : Seconde (L / LA / S / SA), Première et Terminale (L1 / LA / L2 / L'1 / S1 / S1A / S2 / S2A), LV2 par série |
| **7** | Portrait | `7- RÉSULTATS EXAMENS 2025/2026` : BFEM et baccalauréat, colonnes **Dont FA**, pourcentages, mentions (8 séries) |
| **8-9** | Paysage | `8- PERSONNEL ADMINISTRATIF` : **52 lignes** réparties **26 + 26**, en-tête et pied répétés |
| **10-12** | Paysage | `9- PERSONNEL ENSEIGNANT` : **69 lignes** réparties **23 + 23 + 23** |
| **13** | Portrait | `10 - PERSONNEL DE SERVICE` : **20 lignes** nominatives |
| **14** | Portrait | `11 - OBSERVATIONS CHEF D'ETAB` : observations + cachet et signature |

**Reprise des anciens brouillons** : `migrerDonnees()` convertit
automatiquement une saisie de l'ancien modèle 8 feuilles vers le nouveau
modèle (effectifs moyen / secondaire, Dont FA à zéro, séries LA / S1A / S2A
vides, caméra / webcam reprises du tableau des équipements). Aucune donnée
n'est perdue.

**Liste fermée** : le champ *Nom de l'établissement* propose les **17
établissements moyens** de l'inspection (11 CEM, 5 lycées, 1 CFA) via
`RR_ECOLES_MOYEN`. Toute valeur hors liste est **refusée à la validation**.
La liste se gère depuis l'Espace Inspection, comme les écoles préscolaires.

**Isolation du code** : moteur 100 % dédié (`champs-general-moyen.js` +
`form-general-moyen.js` + `rapport-general-moyen.js`). `form.js`,
`champs.js` et `rapport.js` restent **intacts**. Le gabarit n'est chargé par
l'Espace Inspection qu'au moment d'afficher un rapport de ce type. Ce type
n'a **ni export XLSX ni page Analyse** (`xlsx: false`, `analyse: false`).

### Le rapport des évaluations - 2 pages A4 portrait strictes

`evaluations.html` applique le modèle officiel **« RAPPORT DES ÉVALUATIONS
DU 1er / 2e / 3e TRIMESTRE »** (relevé verbatim sur
`rapport_evaluations_T1_modele_1.pdf`) : **exactement 2 pages A4 PORTRAIT**
(210 × 297 mm, marges 0 — le gabarit dépose son image à 0/0, géométrie
identique au modèle).

| Page | Contenu |
|---|---|
| **1** | En-tête souligné (IA / IEF / DISTRICT / CODEC / ECOLE / ANNEE SCOLAIRE, valeurs à x = 73 et x = 139) + logo officiel (78 × 36 pt) + titre **« RAPPORT DES ÉVALUATIONS DU … TRIMESTRE »** (18 pt gras souligné, aligné sur la baseline 133,9) + tableau 144 → 794 : **EFFECTIF TOTAL** (CI → CM2, G / F / T auto) puis 3 matières (LANGUE ET COMMUNICATION · MATHÉMATIQUES · INITIATION SCIENTIFIQUE ET TECHNOLOGIQUE) × 3 statistiques (**NOMBRE D'ÉLÈVES AYANT COMPOSÉ / AYANT LA MOYENNE / POURCENTAGE**) × G / F / T |
| **2** | **COMMENTAIRES** (4 lignes pointillées, texte en surimpression) + **PROBLEMES SOULEVES** et **SOLUTIONS MISES EN ŒUVRE** (cases 1 → 6 sur 2 colonnes) + **LE DIRECTEUR DE L'ÉCOLE** centré et souligné (baseline 444) |

Détails de conformité relevés sur le modèle : colonnes 120 + 6 × (25 lettre +
47 chiffre) = 551 pt, en-tête 44 pt, EFFECTIF TOTAL 54 pt, bandes matières
22 pt, sous-lignes 18 pt, libellés de statistique **coupés en 3 lignes
manuelles** (`nowrap`, « POURCENTAGE DES » touche les bordures comme dans le
modèle) ; couleurs relevées pixel par pixel — bandes `#FBE5D6`, cellules
lettre `#E2F0D9`, chiffres G `#17365D` / F `#C00000` / T noir.

**Tout se saisit dans le formulaire** : effectifs G / F (T = G + F) et
statistiques par classe ; le **pourcentage est calculé automatiquement**
(MOYENNE ÷ COMPOSÉ × 100, arrondi, borné 0 → 100), même ressaisi à la main.
L'en-tête (IA / IEF / année) est **pré-rempli depuis `config.js`** ; seul le
titre du PDF change selon le trimestre choisi (**B. TRIMESTRE** →
`Rapport_Evaluations_T<n>_ECOLE_ANNEE.pdf`).

**Isolation du code** : moteur 100 % dédié (`champs-evaluations.js` +
`form-evaluations.js` + `rapport-evaluations.js` + `evaluations.html`),
brouillon local dédié (`rr_brouillon_evaluations_v1`), clé de reprise dédiée
(`RR_MODIF_EVALUATIONS`). `form.js`, `champs.js`, `rapport.js` et `lib.js`
restent **intacts** ; le gabarit n'est chargé qu'à la demande (registre
`RR_MODELES[type]`). **Périmètre** : PDF + Espace Inspection — pas d'export
XLSX (`xlsx: false`), Analyse « en préparation » (`analyse: false`).
`pdf.js` n'a été étendu que par des attributs **optionnels**
(`data-mm-*`, `data-marge-*`, `ctx.meta.fichier_prefixe`) dont les défauts
sont strictement préservés : les autres types rendent à l'identique.

> **Base de données** : exécuter une fois
> `supabase/migration_visibilite_evaluations.sql` (SQL Editor) pour ajouter
> `'evaluations'` à la contrainte CHECK de `type_visibilite` — sans elle,
> seul le masquage de la carte depuis l'Espace Inspection échoue (l'envoi des
> rapports fonctionne : `rapports.type` n'a aucune contrainte).

### Résistance au réseau 2G/3G

* Saisie **entièrement hors-ligne** (brouillon local, restauration automatique)
* Envoi **différé** en file d'attente si le réseau tombe, puis synchronisation automatique
* Le PDF est **généré localement** : son téléchargement ne consomme aucune donnée mobile
* Bibliothèques embarquées dans le dépôt (aucun CDN externe) → le site se met en cache après la première visite

### Lisibilité des tableaux sur mobile (≤ 700 px)

* Les tableaux de saisie (sections **H → N** : personnel, effectifs, mobilier, recensements…) affichent des **cases à la largeur du contenu** : titres de colonne sur une ligne entière, nombres et dates jamais coupés — et les **titres officiels de K** (jusqu'à « Cahier d'exercices mathematiques (PAAME) CM1 ») s'affichent **en entier** (champ porté à 320 px)
* Correctif **CSS uniquement** dans `assets/css/app.css` (media query `max-width: 700px`) : `width: max-content` + `!important` pour neutraliser les largeurs fixes émises par `form.js` — **aucun fichier JS modifié**, le PDF officiel et le rendu desktop sont strictement inchangés
* Si une ligne dépasse la largeur de l'écran, le défilement horizontal `.table-defilement` fait voir le reste (jamais de cellule perdue) — cas typique : la section **I. SITUATION DES EFFECTIFS du préscolaire**, dont la ligne TOTAL chiffrée garde la largeur d'un nombre (84 px) au lieu d'élargir toutes les colonnes à 240 px
* Le même style profite aux formulaires général-préscolaire, succinct **et évaluations** (classes communes, tableaux enveloppés dans `.table-defilement`)

### Passage à l'échelle : 500 écoles

* Supabase (PostgreSQL) : un rapport pèse 10 à 50 Ko → **≈ 25 Mo pour 500 écoles** (l'offre gratuite en stocke 500 Mo)
* Clé primaire `(type, ecole_code, annee)` où `ecole_code` = **slug du nom de l'école** : une école qui soumet deux fois **met à jour** sa ligne, pas de doublon — et l'anti-doublon s'applique **par type** (un rapport succinct n'en bloque pas un général). Le **CODEC ne sert jamais de clé** — plusieurs écoles peuvent partager le même CODEC (c'est leur regroupement) et déposent chacune leur propre rapport
* Contrôle **avant** envoi (fonction SQL `rapport_existe`) : le directeur est prévenu dès la soumission si son école a déjà déposé — hors-ligne, ce contrôle est simplement ignoré et la file se synchronise plus tard
* GitHub Pages : ~1,5 Mo de site, servi depuis le CDN GitHub (100 Go/mois offerts)
* Aucun serveur à maintenir, aucun coût

### Listes fermées : écoles, CODEC, communes, préscolaire et moyen

Les champs **Nom de l'école** et **Commune** — et **CODEC** dans les
formulaires qui le proposent — sont des listes déroulantes **filtrables** :
on tape quelques lettres, la liste réduit,
on choisit. Le filtrage est **insensible aux accents et à la casse**
(`ndrame` → `NDRAMÉ DIMB`, `fode` → `KEUR FODÉ`).

* **`assets/js/ecoles.js`** contient les cinq tableaux de repli :
  `RR_ECOLES` (**101 écoles**), `RR_CODECS` (**15 CODEC**),
  `RR_COMMUNES` (**5 communes** : KEUR MABA DIAKHOU, KEUR MADIABEL,
  KEUR MANDONGO, NDRAMÉ ESCALE, WACK NGOUNA),
  `RR_ECOLES_PRESCOLAIRE` (**24 écoles préscolaires** : CPCE / CTP / EM)
  et `RR_ECOLES_MOYEN` (**17 établissements moyens** : 11 CEM, 5 lycées,
  1 CFA). La source de vérité est la table Supabase **`listes`**
  (voir `supabase/listes.sql` et les migrations).
* **Blocage** : une valeur absente de la liste est **refusée à la
  soumission** — message d'erreur, aucun envoi réseau, aucun PDF.
* **Commune facultative** (et CODEC là où le champ existe) : le champ peut
  rester vide, mais s'il est saisi il doit figurer dans la liste.
* **Gestion depuis l'espace Inspection** : la carte *« Listes des écoles
  et des CODEC »* donne les **cinq colonnes** (écoles, CODEC, communes,
  écoles préscolaires, établissements moyens) pour ajouter ou supprimer une
  valeur sans toucher au code (voir § 4).
* **Repli hors-ligne** : serveur → cache localStorage → `ecoles.js`.

---

## 2. Fichiers du projet

```
index.html              Page d'accueil : menu des rapports (succinct/général ×
                        préscolaire/élémentaire/moyen + 📝 évaluations)
                        + Espace Inspection (chaque carte possède ses liens 🔒 Espace / 📊 Analyse)
general-elementaire.html  Formulaire du directeur (A → P) + soumission + PDF 7 pages
general-prescolaire.html  ★ Formulaire du « RAPPORT GÉNÉRAL DE RENTRÉE
                        PRÉSCOLAIRE » (A → M) + soumission + PDF 5 pages paysage
general-moyen.html      ★ Formulaire du « RAPPORT GÉNÉRAL DE RENTRÉE —
                        ENSEIGNEMENT MOYEN & SECONDAIRE » (11 feuilles)
                        + soumission + PDF 14 pages (6 portraits + 8 paysages)
succinct-prescolaire.html Formulaire du « RAPPORT DE SUCCINCT DE RENTRÉE »
                        préscolaire + soumission + PDF 2 pages (paysage + portrait)
evaluations.html        ★ Formulaire du « RAPPORT DES ÉVALUATIONS » (A → G,
                        trimestre T1/T2/T3) + soumission + PDF 2 pages portrait
saisie.html             Redirection vers general-elementaire.html (anciens liens conservés)
apercu.html             Aperçu / régénération du rapport — TYPE-AWARE :
                        ?type=<id> charge le gabarit, le brouillon et le nombre
                        de pages du type (défaut = élémentaire, inchangé)
admin.html              Espace Inspection (connexion Supabase, liste, PDF, export XLSX)
                        — partagé entre les 7 types : admin.html?type=<id>
analyse.html            Exploitation des données (filtres, KPI, graphiques, synthèse, export XLSX)
                        — partagée entre les 7 types : analyse.html?type=<id>

assets/css/rapport.css  Mise en page officielle du rapport (partagée écran/PDF)
                        + styles du succinct (page 2 portrait, aperçu mixte)
                        + styles des évaluations (.a4-plein, .ev-*)
                        + styles du général moyen (14 pages A4, portraits/paysages)
assets/css/app.css      Styles de l'interface et du formulaire
assets/css/analyse.css  Styles de la page d'analyse (filtres, graphiques, mini-barres)
assets/js/config.js     ★ CONFIGURATION (URL Supabase, clé, année scolaire, TYPES
                        avec capacités pdf/xlsx/analyse/pages/ecoles/form/modif/modele)
assets/js/lib.js        Construction du contexte du rapport (portage de build_context)
assets/js/rapport.js    Génération HTML des 7 pages officielles (élémentaire)
assets/js/rapport-succinct.js  ★ Modèle du succinct préscolaire : 2 pages
                        (paysage + portrait), registre RR_MODELES[type]
assets/js/rapport-general-prescolaire.js  ★ Modèle du général préscolaire :
                        5 pages paysage (A → M), registre RR_MODELES[type]
assets/js/rapport-general-moyen.js  ★ Modèle du général moyen & secondaire :
                        14 pages A4 (6 portraits + 8 paysages), 11 feuilles,
                        feuilles 8/9/10 sur plusieurs pages, RR_MODELES[type]
assets/js/rapport-evaluations.js  ★ Modèle du rapport des évaluations :
                        2 pages A4 portrait 210 × 297 (marge 0), registre RR_MODELES[type]
assets/js/pdf.js        Génération du PDF A4 dans le navigateur (orientation
                        PAR PAGE : paysage par défaut, portrait sur demande ;
                        dimensions/marges surchargeables par page via
                        data-mm-* / data-marge-*, défauts inchangés)
assets/js/champs.js     Définition déclarative du formulaire (sections A → P)
assets/js/champs-succinct.js   ★ Définition du modèle succinct (sections + tableaux)
assets/js/champs-evaluations.js  ★ Définition des évaluations (A/B, classes
                        CI → CM2, 3 matières × 3 statistiques, commentaires)
assets/js/champs-general-prescolaire.js  ★ Définition du général préscolaire
                        (sections A → M, personnel 10/2/5, effectifs I et
                        handicapés J à lignes fixes, mobiliers K 16,
                        recensements L 10 / M 14 lignes)
assets/js/champs-general-moyen.js  ★ Définition du général moyen & secondaire
                        (11 feuilles, 52 administratifs / 69 enseignants /
                        20 agents de service, élèves vulnérables, effectifs
                        moyen et secondaire, examens, TICE, manuels)
assets/js/ecoles.js     ★ LISTES FERMÉES : 101 écoles + 15 CODEC + 5 communes +
                        24 écoles préscolaires + 17 établissements moyens
assets/js/form.js       Rendu, collecte, brouillon hors-ligne, soumission
assets/js/form-succinct.js     ★ Moteur DÉDIÉ du succinct : rendu, combos,
                        validation minimale, brouillon, soumission 2 pages
assets/js/form-general-prescolaire.js  ★ Moteur DÉDIÉ du général préscolaire :
                        rendu A → M, calculs (T=G+F, totaux I et J,
                        Total mobilier), brouillon dédié, soumission
                        5 pages + anti-doublon
assets/js/form-general-moyen.js  ★ Moteur DÉDIÉ du général moyen & secondaire :
                        rendu 11 sections, 52/69/20 lignes nominatives,
                        calculs moyen/secondaire, brouillon dédié,
                        soumission 14 pages + anti-doublon
assets/js/form-evaluations.js  ★ Moteur DÉDIÉ des évaluations : rendu A → G,
                        combos, calculs (T = G+F, pourcentage MOYENNE/COMPOSÉ),
                        brouillon dédié, soumission 2 pages + anti-doublon,
                        pré-remplissage IA / IEF / année
assets/js/db.js         Accès Supabase + file d'attente hors-ligne + listes
assets/js/analyse.js    Exploitation : agrégation, graphiques SVG maison, synthèse, export XLSX
                         — moteur partagé + registre RR_ANALYSE[type] des modules dédiés
assets/js/analyse-succinct.js  ★ Module d'analyse du succinct préscolaire (KPI, graphiques,
                         taux, synthèse, titres) chargé à la demande après la session
assets/js/xlsx-export.js Export Excel : classeur 8 feuilles depuis l'Espace Inspection
assets/js/xlsx-modele.js En-têtes / fusions / largeurs des 6 feuilles du modèle officiel
assets/js/xlsx-succinct.js ★ Classeur du modèle officiel 3 feuilles (succinct préscolaire),
                         en-têtes copiés du modèle, chargé à la demande au clic
assets/js/xlsx-general-prescolaire.js ★ Classeur du général préscolaire :
                         9 feuilles officielles, chargé à la demande au clic
assets/js/xlsx-modele-general-prescolaire.js ★ En-têtes / fusions / largeurs
                         des 9 feuilles du modèle général préscolaire
assets/vendor/          supabase-js, html2canvas, jsPDF, SheetJS (embarqués, hors-ligne ;
                        jsPDF + html2canvas et SheetJS sont chargés à la demande, au clic)
assets/logo_men.png     ★ Logo officiel du MEN (en-tête haut droit du rapport)
assets/drapeau.png      ★ Drapeau du Sénégal (en-tête haut gauche du rapport)
assets/logo_evaluations.jpeg  ★ Logo officiel du rapport des évaluations
                        (page 1, 78 × 36 pt en haut à droite)
supabase/schema.sql     Table `rapports` + règles de sécurité (RLS)
supabase/migration_types.sql  Colonne `type` + PK (type, ecole_code, annee) + RPC avec p_type
supabase/listes.sql     Table `listes` (écoles / CODEC / communes) + amorçage des 121 entrées
supabase/migration_listes_prescolaire.sql  Contrainte CHECK à 4 types +
                        amorçage idempotent des 24 écoles préscolaires
supabase/migration_listes_moyen.sql  Contrainte CHECK à 5 types +
                        amorçage idempotent des 17 établissements moyens
supabase/migration_visibilite.sql  Table `type_visibilite` : activer / désactiver
                        l'affichage des rapports sur la page d'accueil
supabase/migration_visibilite_evaluations.sql  7ᵉ type (« evaluations »)
                        ajouté à la contrainte CHECK de `type_visibilite`
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
6. **Et pour le rapport général moyen & secondaire** → collez le contenu de
   `supabase/migration_listes_moyen.sql` → **Run** : la contrainte
   `listes.type` accepte le 5ᵉ type `ecole_moyen` et les **17 établissements
   moyens** sont amorcés (idempotent). Sans cette étape, l'ajout ou la
   suppression d'un établissement moyen depuis l'Espace Inspection échoue
   sur « check constraint ».
7. **Et pour l'activation / désactivation des rapports sur l'accueil** →
   collez le contenu de `supabase/migration_visibilite.sql` → **Run** : la
   table `type_visibilite` mémorise les types masqués depuis l'Espace
   Inspection. Un type **absent de la table est actif** (aucune ligne
   d'amorçage) ; sans cette étape, l'accueil reste complet (fail-open)
   et la bascule de l'Espace affiche le message invitant à exécuter ce
   fichier.
8. **Et pour le rapport des évaluations** → collez le contenu de
   `supabase/migration_visibilite_evaluations.sql` → **Run** : le 7ᵉ type
   `'evaluations'` rejoint la contrainte CHECK de `type_visibilite`
   (idempotent). Sans cette étape, les soumissions d'évaluations fonctionnent
   normalement mais la bascule *« Masquer de l'accueil »* de ce type échoue
   sur `type_visibilite_type_check`.
9. **Authentication → Users → Add user** : créez le compte de l'Inspection
   (email + mot de passe) — c'est la seule connexion requise
10. **Project Settings → API Keys → View legacy API keys** : copiez l'**Project
    URL** (`https://xxxx.supabase.co`) et la **anon public key**

> ⚠️ Le rôle `anon` n'a **pas** de droit SELECT sur `rapports` : les écritures
> passent par la fonction SQL `sauver_rapport` (SECURITY DEFINER). N'ajoutez pas
> de policy SELECT pour `anon` **sur `rapports`**, sinon n'importe qui pourrait
> télécharger tous les rapports avec la clé publique. Seules les tables `listes`
> (noms d'écoles / CODEC) et `type_visibilite` (visibilité des cartes de
> l'accueil), sans aucune donnée de rapport, sont lisibles par `anon`.

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
déroulante** (tapez pour filtrer) → remplir A → P → **Soumettre et
télécharger le PDF officiel** → remettre le fichier à l'Inspecteur (ou
l'envoyer par WhatsApp dès que le réseau le permet).

**Inspection** : ouvrir `admin.html` → se connecter → liste des écoles
ayant soumis. Trois actions par école (selon les capacités du type, voir
`config.js` → `TYPES`) :

| Action | Effet |
|---|---|
| **Voir / PDF** | aperçu des pages du gabarit + téléchargement du PDF officiel (7 pages pour l'élémentaire, 5 pour le général préscolaire, 2 pour le succinct préscolaire, **2 pages portrait pour les évaluations**) — le gabarit dédié du type est chargé à la demande (`typeInfo.modele`) |
| **✏ Modifier** | charge le rapport enregistré dans le formulaire de **ce** type ; l'Inspection corrige puis re-soumet — le rapport existant est **remplacé** et le nouveau PDF téléchargé (clé de reprise dédiée par type : `RR_MODIF`, `RR_MODIF_SUCCINCT`, `RR_MODIF_GENERAL_PRESCOLAIRE`, `RR_MODIF_EVALUATIONS`, …) |
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
admin.html?type=evaluations             analyse.html?type=evaluations
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
  rapport succinct ET un rapport général (ou un rapport d'évaluations)
  sans se bloquer ;
- les **capacités sont déclarées par type** dans `config.js` → `TYPES` :
  `pdf`, `xlsx`, `analyse`, `pages`, `ecoles`, `form`, `modif`,
  `brouillon` (clé du brouillon local), `modele` (gabarit dédié),
  `analyse_js` (module d'analyse dédié), `xlsx_js` (classeur dédié).
  À ce jour **Voir / PDF** et **✏ Modifier** sont actifs pour
  `general-elementaire` (7 pages), `succinct-prescolaire` (2 pages),
  `general-prescolaire` (5 pages), `general-moyen` (14 pages mixtes)
  **et `evaluations`** (2 pages portrait) ;
  **⬇ Export XLSX** est actif pour `general-elementaire` (8 feuilles),
  `succinct-prescolaire` (modèle 3 feuilles) et `general-prescolaire`
  (9 feuilles officielles), modules chargés à la demande.
  La page **📊 Analyse** est active pour `general-elementaire` et
  `succinct-prescolaire`. `general-prescolaire`, `general-moyen` et
  `evaluations` ont `analyse: false` : leur page Analyse affiche
  **« Analyse en préparation pour ce type »** avec un lien de retour
  (aucune donnée lue). `general-moyen` et `evaluations` ont en plus
  `xlsx: false`.
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
  puis **TOTAL ÉTABLISSEMENT**. La feuille *Type de classe* reprend les
  compteurs et effectifs H/I : **15 combinaisons multigrades**, **6 niveaux
  double-flux**, effectifs **GP1/GP2 en G/F/T** et leurs totaux ;
  « Nombre de classes » = classes simples + CMG + CDF. Les colonnes
  propres aux classes simples restent vides (non collectées séparément) ;
  les anciens rapports sans H/I exportent 0 dans ces colonnes ;
- **`general-prescolaire`** → `Rapport_General_Prescolaire_2026-2027.xlsx`,
  le **modèle officiel 9 feuilles** : `COURS ET EFFECTIFS`,
  `SITUATION HANDICAPE`, `SITUATION ELEVE SANS ETAT CIVIL`,
  `LISTE DES PERSONNELS ENSEIGNANT`, `MALADES`, `SUPPLEANTS`,
  `SERVICE`, `OUVRAGES ET ACTIVITES ANNEXES`, `MOBILIERS ET EQUIPEMENTS`.
  Les effectifs détaillés, handicaps, sans état civil et listes nominatives
  sont donc exportés dans les feuilles officielles. La feuille SUPPLEANTS
  reste vide (pas de tableau suppléants dans le formulaire) ; les manuels,
  le matériel et les champs hors modèle ne sont pas repris ;
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

### Activer / désactiver un rapport depuis l'accueil

Le bouton **👁 Masquer de l'accueil** de la barre supérieure de l'Espace
Inspection (visible une fois connecté) retire la carte du type courant de
la page d'accueil — **pour tous les visiteurs** :

- état stocké dans la table Supabase **`type_visibilite`**
  (`supabase/migration_visibilite.sql`, exécutée dans le SQL Editor) :
  un type **absent de la table est actif** — aucune ligne d'amorçage ;
- bascule **👁 Masquer de l'accueil** ⇄ **👁 Afficher sur l'accueil**,
  confirmation demandée avant le masquage, état affiché dès l'ouverture
  de l'espace ;
- seul l'accueil change : l'Espace Inspection, l'URL directe du
  formulaire et la page Analyse restent accessibles ; la carte masquée
  emporte ses liens 🔒 Espace / 📊 Analyse, et si une section entière
  est masquée son titre l'est aussi ;
- l'accueil lit la table en **API REST anonyme** (aucun script
  supplémentaire) et reste **fail-open** : réseau absent, timeout (5 s)
  ou table non migrée → toutes les cartes restent affichées ;
- les **6 types** de `config.js` → `TYPES` sont masquables (cartes
  « Disponible » **et** « Bientôt disponible »).

### Valeurs saisies : nombres et provenance

- **Quantité** et **Besoins** sont des **champs numériques** :
  sur mobile, le **pavé numérique** s'ouvre automatiquement
  (`inputmode="numeric"` + `min="0"`) et la valeur est stockée comme un
  nombre — sections M/N/O/P du général élémentaire comme recensements du
  général préscolaire ;
- la liste déroulante **Provenance** propose désormais **MAIRIE, APE,
  NEBEDAY** ; **ONU** et **BAILLEUR** ont été retirés de la liste
  (`champs.js`) ;
- les rapports déjà enregistrés avec ONU / BAILLEUR restent lisibles :
  leurs libellés sont conservés en legacy (`lib.js`) — seuls les *choix
  proposés* à la saisie ont changé ;
- le **PDF officiel** n'est pas affecté par ce changement de liste :
  l'intitulé imprimé vient de `LABELS.provenance` (MAIRIE / APE / NEBEDAY
  ajoutés).

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

### Gérer les listes des écoles, des CODEC, des communes, du préscolaire et du moyen

Dans `admin.html`, la carte **« Listes des écoles, CODEC et établissements »** (sous le
tableau de bord) donne les **cinq colonnes** (écoles, CODEC, communes,
écoles préscolaires, établissements moyens), avec recherche, ajout et
suppression :

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
