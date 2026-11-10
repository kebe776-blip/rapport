# Rapport Général de Rentrée Élémentaire 2025/2026

**IEF de Nioro du Rip — Inspection d'Académie de Kaolack**

Système de collecte du rapport de rentrée : chaque directeur remplit le
formulaire officiel dans son navigateur, clique sur **Soumettre**, et le
**PDF officiel (6 pages, A4 paysage) se télécharge automatiquement** —
strictement identique au modèle administratif, sans compte, sans sélection
d'école.

> **Architecture : GitHub Pages + Supabase uniquement.**
> KoboToolbox et le serveur Flask ont été **abandonnés** (voir *Version
> antérieure* en bas de page).

---

## 1. Comment ça marche

| Étape | Ce qui se passe |
|---|---|
| **1. Saisie** | Le directeur ouvre la page d'accueil `index.html` et remplit les sections **A → N**. Fonctionne **sans réseau** : la saisie est enregistrée en permanence sur l'appareil (brouillon). |
| **2. Soumission** | Un clic sur **Soumettre** : les données partent vers Supabase, ou — si le réseau est absent — sont mises en **file d'attente** et envoyées automatiquement au prochain accès. **Anti-doublon** : si l'école a déjà déposé son rapport, un message demande de confirmer — *OK* remplace le rapport (mise à jour), *Annuler* abandonne **sans envoi ni PDF**. |
| **3. PDF automatique** | Le PDF est construit **dans le navigateur** (html2canvas + jsPDF) puis téléchargé immédiatement. Aucun serveur n'est nécessaire pour le téléchargement. |
| **4. Suivi** | L'Inspection se connecte à `admin.html` pour voir les écoles ayant soumis et retélécharger n'importe quel rapport. |

### Mise en page du PDF (conforme au modèle)

* Format **A4 PAYSAGE** (297 × 210 mm), zone utile 275 × 194 mm
* **6 pages, exactement comme le modèle** — aucune section n'est coupée :

| Page | Contenu |
|---|---|
| **1** | En-tête officiel (République du Sénégal, MEN, IA de Kaolack, IEF de Nioro du Rip) + **A** Identification + **B** Classes pédagogiques + **C** Classes physiques + **D** Directeur |
| **2** | **E** Ouvrages annexes + **F** Activités péri/para scolaires + **F**/**G** Observations |
| **3** | **H** Personnel enseignant (20 lignes numérotées) + suppléants + malades + récapitulation FR/AR |
| **4** | **I** Effectifs + **J** Mobilier scolaire |
| **5** | **K** Recensement des manuels |
| **6** | **L** Autres manuels + **M** Matériel didactique + **N** Autres matériels + signature *Le Directeur* |

Le nom de fichier généré est toujours :
`Rapport_Rentree_NOM_ECOLE_2025-2026.pdf`

### Résistance au réseau 2G/3G

* Saisie **entièrement hors-ligne** (brouillon local, restauration automatique)
* Envoi **différé** en file d'attente si le réseau tombe, puis synchronisation automatique
* Le PDF est **généré localement** : son téléchargement ne consomme aucune donnée mobile
* Bibliothèques embarquées dans le dépôt (aucun CDN externe) → le site se met en cache après la première visite

### Passage à l'échelle : 500 écoles

* Supabase (PostgreSQL) : un rapport pèse 10 à 50 Ko → **≈ 25 Mo pour 500 écoles** (l'offre gratuite en stocke 500 Mo)
* Clé primaire `(ecole_code, annee)` : une école qui soumet deux fois **met à jour** sa ligne, pas de doublon
* Contrôle **avant** envoi (fonction SQL `rapport_existe`) : le directeur est prévenu dès la soumission si son école a déjà déposé — hors-ligne, ce contrôle est simplement ignoré et la file se synchronise plus tard
* GitHub Pages : ~1,5 Mo de site, servi depuis le CDN GitHub (100 Go/mois offerts)
* Aucun serveur à maintenir, aucun coût

---

## 2. Fichiers du projet

```
index.html              Page d'accueil = formulaire du directeur (A → N) + soumission + PDF
saisie.html             Redirection vers index.html (anciens liens conservés)
apercu.html             Aperçu / régénération du rapport (démo ou brouillon)
admin.html              Espace Inspection (connexion Supabase, liste, PDF)

assets/css/rapport.css  Mise en page officielle du rapport (partagée écran/PDF)
assets/css/app.css      Styles de l'interface et du formulaire
assets/js/config.js     ★ CONFIGURATION (URL Supabase, clé, année scolaire)
assets/js/lib.js        Construction du contexte du rapport (portage de build_context)
assets/js/rapport.js    Génération HTML des 6 pages officielles
assets/js/pdf.js        Génération du PDF A4 paysage dans le navigateur
assets/js/champs.js     Définition déclarative du formulaire (sections A → N)
assets/js/form.js       Rendu, collecte, brouillon hors-ligne, soumission
assets/js/db.js         Accès Supabase + file d'attente hors-ligne
assets/vendor/          supabase-js, html2canvas, jsPDF (embarqués, hors-ligne)
assets/demo.json        Données d'exemple (rapport complet)
supabase/schema.sql     Table `rapports` + règles de sécurité (RLS)
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
3. **Authentication → Users → Add user** : créez le compte de l'Inspection
   (email + mot de passe) — c'est la seule connexion requise
4. **Project Settings → API Keys → View legacy API keys** : copiez l'**Project
   URL** (`https://xxxx.supabase.co`) et la **anon public key**

> ⚠️ Le rôle `anon` n'a **pas** de droit SELECT : les écritures passent par la
> fonction SQL `sauver_rapport` (SECURITY DEFINER). N'ajoutez pas de policy
> SELECT pour `anon`, sinon n'importe qui pourrait télécharger tous les
> rapports avec la clé publique.

### 3.2 Configuration du site

Ouvrez `assets/js/config.js` et renseignez :

```js
SUPABASE_URL: "https://xxxxxxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi..."
```

Tant que ces deux valeurs sont vides, **le formulaire fonctionne quand même** :
les saisies restent sur l'appareil et le PDF se télécharge normalement.

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
# puis http://localhost:8099/            (la saisie = page d'accueil)
#      http://localhost:8099/apercu.html?demo=1   (rapport d'exemple)
```

---

## 4. Utilisation quotidienne

**Directeur** : ouvrir le lien → remplir A → N → **Soumettre et télécharger le
PDF officiel** → remettre le fichier à l'Inspecteur (ou l'envoyer par WhatsApp
dès que le réseau le permet).

**Inspection** : ouvrir `admin.html` → se connecter → liste des écoles
ayant soumis → *Voir / PDF* pour consulter ou retélécharger un rapport.

---

## 5. Version antérieure (abandonnée)

Les fichiers suivants constituent l'ancienne implémentation
**KoboToolbox + Flask**, conservée pour archive. **Ils ne sont plus utilisés.**

| Fichier | Rôle ancien |
|---|---|
| `app.py` | Serveur Flask (récupération Kobo + PDF xhtml2pdf) |
| `templates/` | Anciens gabarits Jinja |
| `create_xlsform.py`, `formulaire_rentree.xlsx` | Formulaire XLSForm pour KoboToolbox |
| `render.yaml`, `requirements.txt`, `demarrer.bat` | Déploiement Render / lancement local |
| `sample_data.json` | Données d'exemple (copiées dans `assets/demo.json`) |

Le nouveau système ne dépend ni de Python, ni de KoboToolbox, ni d'un serveur.

---

## 6. Sécurité

* La **clé anon** Supabase est publique (normal : elle est dans le JS).
  Les règles **RLS** du `schema.sql` limitent ce qu'elle peut faire :
  * `anon` → **insert / update** uniquement (pas de lecture, pas de suppression)
  * `authenticated` → **select / delete** (réservé à l'Inspection)
* Aucun mot de passe de directeur : le formulaire est public, les données sont
  des données administratives non nominatives sensibles (effectifs, personnels).
* Pour renforcer : activer dans Supabase **Authentication → Providers → Email**
  et éventuellement limiter l'accès au site par un mot de passe GitHub Pages.
