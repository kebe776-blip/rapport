# Rapport Général de Rentrée Élémentaire 2025/2026
### Collecte KoboToolbox → Téléchargement automatique du PDF officiel

Cette application permet aux directeurs d'écoles du Sénégal (IEF de Nioro du Rip /
Inspection d'Académie de Kaolack) de remplir le formulaire officiel sur
**KoboToolbox** puis de **télécharger automatiquement leur rapport en PDF,
strictement identique au modèle administratif**, sans connexion à un compte,
sans sélection d'école : tout se déclenche au clic sur **Soumettre**.

### Mise en page du PDF (conforme au modèle)

* Format **A4 PAYSAGE** (297 × 210 mm)
* **6 pages exactement comme le modèle** :
  1. En-tête officiel + **A** + **B** + **C** + **D**
  2. **E** + **F** + **G**
  3. **H** (personnel 20 lignes numérotées + suppléants + malades + récapitulation)
  4. **I** + **J**
  5. **K**
  6. **L** + **M** + **N** + signature *Le Directeur*
* Aucune section n'est coupée entre deux pages.

---

## 1. Fonctionnement

```
┌─────────────────────────┐      ┌──────────────────────────────┐
│ 1. Le directeur remplit  │      │ 3. Kobo redirige vers        │
│    le formulaire Kobo    │ ───► │    GET /pdf  (return_url)    │
│    (web form, sans login)│      └──────────────┬───────────────┘
└─────────────────────────┘                     │
                                                ▼
                                 ┌──────────────────────────────┐
                                 │ 4. Le serveur récupère la     │
                                 │    soumission la plus récente │
                                 │    via l'API Kobo, génère le  │
                                 │    PDF officiel et le         │
                                 │    TÉLÉCHARGE automatiquement │
                                 └──────────────────────────────┘
```

* Aucune connexion ni sélection d'école de la part du directeur.
* La génération se fait **côté serveur** : l'appareil du directeur (2G/3G faible)
  ne reçoit qu'un seul petit fichier PDF (≈ 40 Ko).

---

## 2. Contenu du projet

| Fichier | Rôle |
|---|---|
| `create_xlsform.py` | Génère le formulaire Kobo (sections A → N) |
| `formulaire_rentree.xlsx` | Formulaire XLSForm à importer dans KoboToolbox |
| `app.py` | Application web : lecture API Kobo + génération PDF |
| `templates/rapport.html` | Mise en page officielle du rapport (sections A → N) |
| `templates/index.html` | Page de configuration / statut |
| `sample_data.json` | Jeu de données d'exemple (école KEUR MABA DIAKHOU) |
| `render.yaml` | Déploiement gratuit lié au dépôt GitHub |

---

## 3. Mise en route

### Étape 1 — Importer le formulaire dans KoboToolbox

1. Connectez-vous sur https://kf.kobotoolbox.org
2. **New project → Import an XLSForm**
3. Sélectionnez `formulaire_rentree.xlsx` puis déployez le formulaire.
4. (Optionnel) Regénérez le fichier après modification :
   ```bash
   pip install -r requirements.txt
   python create_xlsform.py
   ```

### Étape 2 — Récupérer les identifiants Kobo

1. **Account → Settings → API token** → copiez le jeton (`KOBO_TOKEN`).
2. Ouvrez le formulaire déployé, copiez son URL :
   `https://kf.kobotoolbox.org/#/forms/<UID>` → `<UID>` = `KOBO_ASSET_UID`.

### Étape 3 — Lancer l'application

```bash
set KOBO_TOKEN=votre_jeton
set KOBO_ASSET_UID=xxxxxxxxxxxxxxxx
python app.py
```
Puis ouvrez http://127.0.0.1:5000

Sans configuration Kobo, l'application fonctionne en **mode démonstration**
(`sample_data.json`).

### Étape 4 — Activer le téléchargement automatique dans Kobo

1. Dans le formulaire : **Collect data**
2. Choisissez le mode **Online-Only (single submission)**
3. Ajoutez le paramètre de redirection à votre lien de formulaire :

```
https://ee.kobotoolbox.org/x/<UID>?return_url=https://VOTRE-APPLICATION/pdf
```

➡ Dès que le directeur clique sur **Soumettre**, Kobo l'envoie vers `/pdf`,
qui fabrique son PDF officiel et le télécharge **automatiquement**.

---

## 4. Publication sur GitHub (gratuit)

```bash
git init
git add .
git commit -m "Rapport de rentrée élémentaire - KoboToolbox + PDF officiel"
git remote add origin https://github.com/VOTRE-COMPTE/rapport-rentree.git
git push -u origin main
```

### Hébergement gratuit lié à GitHub — Render

1. Allez sur https://render.com → **New → Web Service**
2. Connectez votre dépôt GitHub.
3. Render détecte automatiquement `render.yaml` (installation des dépendances
   et démarrage inclus).
4. Dans **Environment**, ajoutez :
   * `KOBO_TOKEN` = votre jeton Kobo
   * `KOBO_ASSET_UID` = UID du formulaire
5. Copiez l'URL obtenue (ex. `https://rapport-rentree.onrender.com`) et
   remplacez-la dans le `return_url` de l'étape 4.

> **Important** : la page GitHub Pages seule ne peut pas interroger l'API Kobo
> (sécurité CORS) — c'est pourquoi le petit serveur lié au dépôt GitHub est
> nécessaire. Le code reste, lui, entièrement hébergé sur GitHub.

---

## 5. Personnalisation

| Variable d'environnement | Défaut | Rôle |
|---|---|---|
| `KOBO_API_URL` | `https://kf.kobotoolbox.org` | Instance Kobo |
| `KOBO_TOKEN` | — | Jeton d'API |
| `KOBO_ASSET_UID` | — | UID du formulaire |
| `MINISTERE` | `MINISTÈRE DE L'ÉDUCATION NATIONALE` | En-tête |
| `INSPECTION` | `INSPECTION D'ACADÉMIE DE KAOLACK` | En-tête |
| `IEF` | `INSPECTION DE L'ÉDUCATION ET DE LA FORMATION DE NIORO DU RIP` | En-tête |
| `ANNEE_SCOLAIRE` | `2025/2026` | Titre du rapport |
| `MAX_AGE_MINUTES` | `30` | Fraîcheur minimale de la soumission |

* **Logo officiel** : déposez un fichier `static/logo.png` (armoiries / logo
  MEN) — il apparaîtra automatiquement dans l'en-tête du PDF.
* **Modèle visuel** : tout se règle dans `templates/rapport.html`.

---

## 6. Tests intégrés

```bash
python -c "import app; c=app.app.test_client(); print(c.get('/demo/pdf').status_code)"   # 200
curl -I http://127.0.0.1:5000/pdf    # Content-Disposition: attachment → téléchargement auto
```

| URL | Rôle |
|---|---|
| `/` | Statut et instructions |
| `/demo` | Aperçu HTML du rapport (données d'exemple) |
| `/demo/pdf` | Téléchargement du PDF de démonstration |
| `/pdf` | **Point d'entrée automatique Kobo** |
| `/rapport` | Aperçu de la dernière soumission Kobo |
| `/health` | Vérification rapide |

---

## 7. Robustesse réseau (2G/3G faible)

* La saisie reste 100 % Kobo (web form mis en cache par le navigateur,
  tolérant aux coupures).
* Le PDF est fabriqué **par le serveur** : le directeur ne télécharge qu'un
  fichier de ~40 Ko au lieu d'interroger l'API Kobo depuis sa tablette.
* En cas d'échec réseau, `/pdf` réessaie automatiquement une fois avant
  d'afficher une page de message claire avec un bouton de nouvelle tentative.
