# -*- coding: utf-8 -*-
"""
RAPPORT GENERAL DE RENTREE ELEMENTAIRE 2025/2026
Application de generation automatique de PDF officiels a partir des
soumissions KoboToolbox.

Workflow automatique :
  1. Le directeur remplit le formulaire KoboToolbox (web form).
  2. Kobo redirige automatiquement vers GET /pdf  (paramètre return_url).
  3. /pdf récupère la soumission la plus récente (ou celle de ?id=...),
     génère le PDF au modèle officiel et le télécharge automatiquement.

Configuration (variables d'environnement) :
  KOBO_API_URL   : https://kf.kobotoolbox.org  (ou votre instance)
  KOBO_TOKEN     : jeton d'API KoboToolbox (Account > Settings > API token)
  KOBO_ASSET_UID : identifiant du formulaire déployé (UID, ou ID numérique)
"""
import io
import json
import os
import re
import time
from datetime import datetime, timezone

import requests
from flask import (Flask, Response, abort, jsonify, render_template,
                   request, url_for)

app = Flask(__name__)

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
KOBO_API_URL = os.environ.get("KOBO_API_URL", "https://kf.kobotoolbox.org").rstrip("/")
KOBO_TOKEN = os.environ.get("KOBO_TOKEN", "")
KOBO_ASSET = os.environ.get("KOBO_ASSET_UID", os.environ.get("KOBO_ASSET_ID", ""))

ANNEE_SCOLAIRE = os.environ.get("ANNEE_SCOLAIRE", "2025/2026")
INSPECTION = os.environ.get(
    "INSPECTION", "INSPECTION D'ACADÉMIE DE KAOLACK")
IEF = os.environ.get(
    "IEF", "INSPECTION DE L'ÉDUCATION ET DE LA FORMATION DE NIORO DU RIP")
MINISTERE = os.environ.get("MINISTERE", "MINISTÈRE DE L'ÉDUCATION NATIONALE")
# Minutes au-delà desquelles la dernière soumission est considérée comme trop ancienne
MAX_AGE_MINUTES = int(os.environ.get("MAX_AGE_MINUTES", "30"))

# ---------------------------------------------------------------------------
# LIBELLÉS DES OPTIONS KOBO
# ---------------------------------------------------------------------------
LABELS = {
    "statut": {"public": "PUBLIC", "prive": "PRIVÉ", "communautaire": "COMMUNAUTAIRE"},
    "oui_non": {"oui": "OUI", "non": "NON"},
    "langue": {"wolof": "WOLOF", "pulaar": "PULAAR", "serere": "SERÈRE",
               "diola": "DIOLA", "mandinka": "MANDINKA", "soninke": "SONINKÉ",
               "manjak": "MANJAK", "balant": "BALANT", "noon": "NOON",
               "koulack": "KOULACK", "autre": "AUTRE"},
    "type_classe": {"simple": "SIMPLE", "cmg": "CMG", "cdf": "CDF"},
    "statut_directeur": {"titulaire": "TITULAIRE", "interimaire": "INTÉRIMAIRE"},
    "discipline": {"francais": "FRANÇAIS", "arabe": "ARABE"},
    "provenance": {"etat": "ÉTAT", "cge": "CGE", "caritas": "CARITAS",
                   "plan_international": "PLAN INTERNATIONAL", "relit": "RELIT",
                   "pame": "PAME", "onu": "ONU", "bailleur": "BAILLEUR",
                   "autre": "AUTRE"},
    "etat": {"bon": "BON", "acceptable": "ACCEPTABLE",
             "mauvais": "MAUVAIS", "neant": "NÉANT"},
    "source_electricite": {"senelec": "SENELEC", "solaire": "SOLAIRE",
                           "groupe_electrogene": "GROUPE ÉLECTROGÈNE",
                           "neant": "NÉANT"},
}

MOBILIER = [
    ("mob_tables_bancs", "Tables bancs"),
    ("mob_tables_bureaux", "Tables bureaux Maîtres"),
    ("mob_chaises", "Chaises"),
    ("mob_armoires", "Armoires"),
    ("mob_placards", "Placards"),
    ("mob_tableaux", "Tableaux"),
    ("mob_ordinateurs", "Ordinateurs"),
    ("mob_imprimantes", "Imprimantes"),
    ("mob_video_projecteur", "Vidéo projecteur"),
    ("mob_photocopieuses", "Photocopieuses"),
    ("mob_autres_mobilier", "Autres"),
]

COURS = [("eff_ci", "CI"), ("eff_cp", "CP"), ("eff_ce1", "CE1"),
         ("eff_ce2", "CE2"), ("eff_cm1", "CM1"), ("eff_cm2", "CM2")]


# ---------------------------------------------------------------------------
# UTILITAIRES DE LECTURE DES SOUMISSIONS
# ---------------------------------------------------------------------------
def flatten(obj, prefix=""):
    """Aplatit les groupes Kobo : {'g': {'q': 1}} -> {'g/q': 1}.
    Les listes (repeat groups) sont conservées telles quelles."""
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            p = f"{prefix}/{k}" if prefix else k
            out.update(flatten(v, p))
    elif isinstance(obj, list):
        out[prefix] = obj
    else:
        out[prefix] = obj
    return out


def val(flat, name, within=None, default=""):
    """Valeur scalaire : name = dernière partie du chemin, within = chemin parent."""
    for path, v in flat.items():
        if isinstance(v, (list, dict)):
            continue
        if path.split("/")[-1] != name:
            continue
        if within and within not in path:
            continue
        return v if v is not None else default
    return default


def rows(flat, name, *aliases):
    """Lignes d'un repeat group (liste imbriquée OU clés indexées à plat)."""
    for candidate in (name,) + aliases:
        for path, v in flat.items():
            if path.split("/")[-1] == candidate and isinstance(v, list):
                return [flatten(item) for item in v]
    # format plat : groupe/0/champ
    idx = {}
    for path, v in flat.items():
        parts = path.split("/")
        if len(parts) >= 3 and parts[-2].isdigit() and parts[-3] == name:
            idx.setdefault(int(parts[-2]), {})[parts[-1]] = v
    if idx:
        return [idx[k] for k in sorted(idx)]
    return []


def num(v, default=0):
    try:
        if v in (None, ""):
            return default
        return int(float(str(v).strip().replace(" ", "")))
    except (ValueError, TypeError):
        return default


def lab(kind, value, default=""):
    """Convertit la valeur Kobo en libellé lisible."""
    if value in (None, ""):
        return default
    return LABELS.get(kind, {}).get(str(value).strip().lower(), str(value).upper())


# ---------------------------------------------------------------------------
# CONSTRUCTION DU CONTEXTE DU RAPPORT
# ---------------------------------------------------------------------------
def build_context(raw, submission_id=None):
    f = flatten(raw)

    # --- A. Identification ---
    a = {
        "nom_ecole": str(val(f, "nom_ecole") or "").upper(),
        "statut": lab("statut", val(f, "statut"), "—"),
        "date_creation": val(f, "date_creation", default="—"),
        "commune": str(val(f, "commune") or "—").upper(),
        "district": str(val(f, "district") or "—").upper(),
        "codec": str(val(f, "codec") or "—").upper(),
        "villages_polarises": val(f, "villages_polarises", default="—"),
        "langue_nationale": lab("langue", val(f, "langue_nationale"), "—"),
    }

    # --- B. Classes pédagogiques ---
    b = {
        "nb_cours": num(val(f, "nb_cours")),
        "nb_classes_simples": num(val(f, "nb_classes_simples")),
        "nb_cmg": num(val(f, "nb_cmg")),
        "nb_cdf": num(val(f, "nb_cdf")),
        "cours_jumeles": str(val(f, "cours_jumeles") or "NÉANT").upper(),
    }

    # --- C. Classes physiques ---
    c = {k: num(val(f, k)) for k in (
        "salles_bonnes", "salles_acceptables", "salles_mauvaises",
        "salles_totale", "salles_utilisees", "salles_non_utilisees",
        "abris_provisoires", "a_rehabiliter", "cours_construction")}
    c["programme_construction"] = str(val(f, "programme_construction") or "NÉANT").upper()

    # --- D. Directeur ---
    d = {
        "prenom_nom": str(val(f, "prenom_nom", within="directeur") or "—").upper(),
        "grade": val(f, "grade", within="directeur", default="—"),
        "matricule": val(f, "matricule", within="directeur", default="—"),
        "date_naissance": val(f, "date_naissance", default="—"),
        "lieu_naissance": str(val(f, "lieu_naissance") or "—").upper(),
        "diplome_academique": str(val(f, "diplome_academique") or "—").upper(),
        "diplome_professionnel": str(val(f, "diplome_professionnel") or "—").upper(),
        "date_entree_enseignement": val(f, "date_entree_enseignement", default="—"),
        "date_affectation": val(f, "date_affectation", default="—"),
        "references_affectation": val(f, "references_affectation", default="—"),
        "statut_directeur": str(val(f, "statut_directeur") or "—").upper(),
        "position": str(val(f, "position") or "—").upper(),
        "decharge": lab("oui_non", val(f, "decharge"), "—"),
        "telephone1": val(f, "telephone1", default="—"),
        "telephone2": val(f, "telephone2", default="—"),
        "whatsapp": val(f, "whatsapp", default="—"),
    }

    # --- E. Ouvrages annexes ---
    e = {
        "toilettes": lab("oui_non", val(f, "toilettes"), "—"),
        "nb_blocs": num(val(f, "nb_blocs")),
        "nb_cabines": num(val(f, "nb_cabines")),
        "cabines_fonctionnelles": num(val(f, "cabines_fonctionnelles")),
        "cabines_non_fonctionnelles": num(val(f, "cabines_non_fonctionnelles")),
        "bailleur_toilettes": str(val(f, "bailleur_toilettes") or "NÉANT"),
        "point_eau": lab("oui_non", val(f, "point_eau"), "—"),
        "nb_robinets": num(val(f, "nb_robinets")),
        "etat_point_eau": lab("etat", val(f, "etat_point_eau"), "—"),
        "bailleur_point_eau": str(val(f, "bailleur_point_eau") or "NÉANT"),
        "senelec": lab("oui_non", val(f, "senelec"), "—"),
        "etat_electricite": lab("etat", val(f, "etat_electricite"), "—"),
        "branchement_collectif": lab("oui_non", val(f, "branchement_collectif"), "—"),
        "source_electricite": lab("source_electricite", val(f, "source_electricite"), "NÉANT"),
        "internet": lab("oui_non", val(f, "internet"), "—"),
        "modem_wifi_men": lab("oui_non", val(f, "modem_wifi_men"), "—"),
        "bureau": lab("oui_non", val(f, "bureau"), "—"),
        "bailleur_bureau": str(val(f, "bailleur_bureau") or "NÉANT"),
        "magasin": lab("oui_non", val(f, "magasin"), "—"),
        "bailleur_magasin": str(val(f, "bailleur_magasin") or "NÉANT"),
        "cloture": lab("oui_non", val(f, "cloture"), "—"),
        "bailleur_cloture": str(val(f, "bailleur_cloture") or "NÉANT"),
        "cuisine": lab("oui_non", val(f, "cuisine"), "—"),
        "bailleur_cuisine": str(val(f, "bailleur_cuisine") or "NÉANT"),
        "logement": lab("oui_non", val(f, "logement"), "—"),
        "bailleur_logement": str(val(f, "bailleur_logement") or "NÉANT"),
    }

    # --- F. Activités péri et para scolaires ---
    fa = {
        "cge": lab("oui_non", val(f, "cge"), "—"),
        "cge_mandat": val(f, "cge_mandat", default="2025"),
        "cge_date_mise_en_place": val(f, "cge_date_mise_en_place", default="___/___/______"),
        "cge_president": str(val(f, "cge_president") or "—"),
        "cge_tel": val(f, "cge_tel", default="—"),
        "cge_deux_mandats": lab("oui_non", val(f, "cge_deux_mandats"), "—"),
        "programmes_intervenants": val(f, "programmes_intervenants",
                                       default="Néant"),
        "cantine": lab("oui_non", val(f, "cantine"), "—"),
        "bailleur_cantine": str(val(f, "bailleur_cantine") or "NÉANT"),
        "cooperative": lab("oui_non", val(f, "cooperative"), "—"),
        "jardin": lab("oui_non", val(f, "jardin"), "—"),
        "bailleur_jardin": str(val(f, "bailleur_jardin") or "NÉANT"),
        "champ_communaute": lab("oui_non", val(f, "champ_communaute"), "—"),
        "mallette_pedagogique": lab("oui_non", val(f, "mallette_pedagogique"), "—"),
        "nb_mallettes": num(val(f, "nb_mallettes")),
        "bibliotheque": lab("oui_non", val(f, "bibliotheque"), "—"),
        "terrain_sport": lab("oui_non", val(f, "terrain_sport"), "—"),
        "boite_pharmacie": lab("oui_non", val(f, "boite_pharmacie"), "—"),
    }

    # --- G. Observations ---
    g = {
        "obs_materiel": val(f, "obs_materiel", default=""),
        "obs_personnel": val(f, "obs_personnel", default=""),
        "obs_pedagogique": val(f, "obs_pedagogique", default=""),
    }

    # --- H. Personnel ---
    def pers(item):
        return {
            "num": num(item.get("num_ligne")),
            "prenom": str(item.get("prenom") or "").upper(),
            "nom": str(item.get("nom") or "").upper(),
            "grade": item.get("grade") or "",
            "matricule": item.get("matricule") or "",
            "discipline": lab("discipline", item.get("discipline")),
            "diplome_acad": str(item.get("diplome_acad") or "").upper(),
            "diplome_prof": str(item.get("diplome_prof") or "").upper(),
            "date_entree": item.get("date_entree") or "",
            "date_affectation": item.get("date_affectation") or "",
            "cours_tenu": str(item.get("cours_tenu") or "").upper(),
            "contact": item.get("contact") or "",
        }

    personnel = [pers(i) for i in rows(f, "enseignant")]
    suppleants = [pers(i) for i in rows(f, "suppleant")]
    malades = [pers(i) for i in rows(f, "malade")]

    rf_keys = ("inst_h", "inst_f", "inst_t", "inst_adj_h", "inst_adj_f",
               "inst_adj_t", "mc_h", "mc_f", "mc_t")
    ra_keys = ("arabe_inst_h", "arabe_inst_f", "arabe_inst_t",
               "arabe_inst_adj_h", "arabe_inst_adj_f", "arabe_inst_adj_t",
               "arabe_mc_h", "arabe_mc_f", "arabe_mc_t")
    recap_fr = {k: num(val(f, k, within="recap_francais/")) for k in rf_keys}
    recap_ar = {k: num(val(f, k, within="recap_arabe/")) for k in ra_keys}

    # --- I. Effectifs ---
    effectifs = []
    total = {k: 0 for k in ("eff_g", "eff_f", "eff_t", "red_g", "red_f", "red_t",
                            "hand_g", "hand_f", "hand_t", "sans_etat_g",
                            "sans_etat_f", "sans_etat_t")}
    for grp, label in COURS:
        row = {"cours": label}
        for k in total:
            row[k] = num(val(f, k, within=grp + "/"))
            total[k] += row[k]
        row["type_classe"] = lab("type_classe", val(f, "type_classe", within=grp + "/"), "—")
        row["maitre_liste"] = num(val(f, "maitre_liste", within=grp + "/"))
        effectifs.append(row)
    total_row = {"cours": "TOTAL"}
    total_row.update(total)

    # --- J. Mobilier ---
    mobilier = []
    for grp, label in MOBILIER:
        inside = grp + "/"
        mobilier.append({
            "designation": label,
            "bon": num(val(f, "bon", within=inside)),
            "a_reparer": num(val(f, "a_reparer", within=inside)),
            "total": num(val(f, "total", within=inside)),
            "defecat": num(val(f, "defecat", within=inside)),
        })

    # --- K, L, M, N. Manuels & matériel ---
    def stuff(item):
        return {
            "titre": str(item.get("titre") or item.get("designation") or ""),
            "quantite": num(item.get("quantite")),
            "provenance": lab("provenance", item.get("provenance"), "—"),
            "besoins": str(item.get("besoins") or "").strip(),
            "observations": str(item.get("observations") or ""),
        }

    manuels = [stuff(i) for i in rows(f, "manuel", "manuels")]
    autres_manuels = [stuff(i) for i in rows(f, "autre_manuel", "autres_manuels")]
    materiel = [stuff(i) for i in rows(f, "materiel", "materiel_didactique")]
    autres_materiels = [stuff(i) for i in rows(f, "autre_materiel", "autres_materiels")]

    soumission = raw.get("_submission_time", "")
    try:
        soumission = datetime.fromisoformat(str(soumission).replace("Z", "+00:00"))
        if soumission.tzinfo is None:
            soumission = soumission.replace(tzinfo=timezone.utc)
        soumission = soumission.astimezone().strftime("%d/%m/%Y %H:%M")
    except (ValueError, TypeError):
        soumission = str(soumission or "—")

    return {
        "meta": {
            "ecole": a["nom_ecole"],
            "annee": ANNEE_SCOLAIRE,
            "soumission": soumission,
            "id": submission_id or raw.get("_id", ""),
        },
        "insp": {"ministere": MINISTERE, "inspection": INSPECTION, "ief": IEF},
        "a": a, "b": b, "c": c, "d": d, "e": e, "f": fa, "g": g,
        "personnel": personnel,
        "suppleants": suppleants,
        "malades": malades,
        "recap_fr": recap_fr,
        "recap_ar": recap_ar,
        "effectifs": effectifs,
        "effectifs_total": total_row,
        "mobilier": mobilier,
        "manuels": manuels,
        "autres_manuels": autres_manuels,
        "materiel": materiel,
        "autres_materiels": autres_materiels,
    }


# ---------------------------------------------------------------------------
# ACCÈS À L'API KOBO
# ---------------------------------------------------------------------------
def _headers():
    return {"Authorization": f"Token {KOBO_TOKEN}"}


def kobo_configured():
    return bool(KOBO_TOKEN and KOBO_ASSET)


def fetch_submissions(limit=5, submission_id=None):
    """Récupère les soumissions Kobo (v2 avec repli sur v1)."""
    if not kobo_configured():
        raise RuntimeError(
            "KoboToolbox non configuré (KOBO_TOKEN / KOBO_ASSET_UID manquants).")

    data_url = f"{KOBO_API_URL}/api/v2/assets/{KOBO_ASSET}/data/"
    params = {"format": "json", "limit": limit}
    if submission_id:
        params["_id"] = submission_id
    else:
        params["order"] = "-submission_time"

    r = requests.get(data_url, params=params, headers=_headers(), timeout=30)
    r.raise_for_status()
    payload = r.json()

    # v2 : {"count": n, "results": [...]}, v1 : liste
    if isinstance(payload, dict):
        results = payload.get("results") or payload.get("results".lower()) or []
        if not results and payload.get("count") == 0:
            # repli sur l'API v1
            v1 = requests.get(
                f"{KOBO_API_URL}/api/v1/data/{KOBO_ASSET}/",
                params={k: v for k, v in params.items() if k != "order"},
                headers=_headers(), timeout=30)
            v1.raise_for_status()
            results = v1.json()
    else:
        results = payload

    if submission_id and results:
        results = [x for x in results if str(x.get("_id")) == str(submission_id)]
    if not results:
        raise RuntimeError("Aucune soumission trouvée sur KoboToolbox.")
    return results


def fetch_one(submission_id=None, accept_fresh_minutes=MAX_AGE_MINUTES):
    """Renvoie (données, id, est_recent) – la dernière soumission si id absent."""
    subs = fetch_submissions(limit=3, submission_id=submission_id)
    raw = subs[0]
    sid = raw.get("_id")

    recent = True
    if not submission_id:
        try:
            ts = datetime.fromisoformat(
                str(raw.get("_submission_time")).replace("Z", "+00:00"))
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            age_min = (datetime.now(timezone.utc) - ts).total_seconds() / 60
            recent = age_min <= accept_fresh_minutes
        except (ValueError, TypeError):
            recent = True
    return raw, sid, recent


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------
@app.context_processor
def inject_logo():
    """Logo officiel optionnel : déposer static/logo.png pour l'utiliser."""
    path = os.path.join(app.root_path, "static", "logo.png")
    return {"logo_exists": os.path.exists(path), "logo_path": path}


@app.template_filter("pad2")
def pad2(value):
    try:
        return f"{int(value):02d}"
    except (ValueError, TypeError):
        return str(value or "").strip() or "00"


@app.template_filter("nbsp")
def nbsp(value):
    return str(value or "").replace(" ", "\u00a0")


def _pdf_response(context, filename_prefix="Rapport_Rentree"):
    html = render_template("rapport.html", ctx=context, for_pdf=True)
    from xhtml2pdf import pisa
    buf = io.BytesIO()
    result = pisa.CreatePDF(html.encode("utf-8"), dest=buf,
                            path=app.root_path)
    if result.err:
        abort(500, "Erreur de génération du PDF.")
    ecole = re.sub(r"[^A-Za-z0-9]+", "_", context["meta"]["ecole"]).strip("_")
    filename = f"{filename_prefix}_{ecole or 'ECOLE'}_{ANNEE_SCOLAIRE.replace('/', '-')}.pdf"
    return Response(
        buf.getvalue(),
        mimetype="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"',
                 "Cache-Control": "no-store"},
    )


@app.route("/")
def index():
    return render_template("index.html",
                           configured=kobo_configured(),
                           api=KOBO_API_URL,
                           asset=KOBO_ASSET or "(non défini)")


@app.route("/demo")
def demo():
    """Aperçu HTML du rapport avec les données d'exemple."""
    with open(os.path.join(os.path.dirname(__file__), "sample_data.json"),
              encoding="utf-8") as fh:
        raw = json.load(fh)
    ctx = build_context(raw)
    return render_template("rapport.html", ctx=ctx, for_pdf=False,
                           download_url=url_for("demo_pdf"))


@app.route("/demo/pdf")
def demo_pdf():
    with open(os.path.join(os.path.dirname(__file__), "sample_data.json"),
              encoding="utf-8") as fh:
        raw = json.load(fh)
    return _pdf_response(build_context(raw))


@app.route("/rapport")
def rapport_html():
    """Aperçu HTML de la dernière soumission (ou de ?id=...)."""
    sid = request.args.get("id")
    try:
        raw, sid, recent = fetch_one(sid)
    except (RuntimeError, requests.RequestException) as exc:
        msg = str(exc) if isinstance(exc, RuntimeError) else \
            "Impossible de contacter KoboToolbox (réseau ou configuration)."
        return render_template("erreur.html", message=msg,
                               detail=str(exc)), 503
    ctx = build_context(raw, sid)
    dl = url_for("pdf", id=sid) if sid else url_for("pdf")
    return render_template("rapport.html", ctx=ctx, for_pdf=False,
                           recent=recent, download_url=dl)


@app.route("/pdf")
def pdf():
    """
    POINT D'ENTRÉE AUTOMATIQUE.
    À configurer dans KoboToolbox :
      Collect data > Online-Only (single submission)
      Lien du formulaire + ?return_url=https://VOTRE-APP/pdf
    Télécharge automatiquement le PDF officiel de la soumission fraîche.
    """
    sid = request.args.get("id")
    demo = request.args.get("demo")

    if demo:
        with open(os.path.join(os.path.dirname(__file__), "sample_data.json"),
                  encoding="utf-8") as fh:
            raw = json.load(fh)
        return _pdf_response(build_context(raw))

    if not kobo_configured():
        # Mode démonstration tant que Kobo n'est pas configuré
        with open(os.path.join(os.path.dirname(__file__), "sample_data.json"),
                  encoding="utf-8") as fh:
            raw = json.load(fh)
        return _pdf_response(build_context(raw))

    try:
        raw, sid, recent = fetch_one(sid)
    except requests.RequestException:
        # Réseau Kobo indisponible : nouvelle tentative (réseau 2G/3G instable)
        time.sleep(2)
        try:
            raw, sid, recent = fetch_one(sid)
        except Exception as exc:  # noqa: BLE001
            return render_template("erreur.html",
                                   message="Impossible de contacter KoboToolbox. "
                                           "Vérifiez la connexion puis réessayez.",
                                   detail=str(exc)), 503
    except RuntimeError as exc:
        return render_template("erreur.html",
                               message=str(exc), detail=""), 503

    if not recent and not sid:
        # Dernière soumission trop ancienne : on n'envoie pas le mauvais rapport
        return render_template("erreur.html",
                               message="Aucune soumission récente détectée.",
                               detail="Soumettez d'abord le formulaire, puis "
                                       "renvoyez le lien de téléchargement."), 409

    try:
        return _pdf_response(build_context(raw, sid))
    except Exception as exc:  # noqa: BLE001
        return render_template("erreur.html",
                               message="Erreur de génération du PDF.",
                               detail=str(exc)), 500


@app.route("/health")
def health():
    return jsonify(status="ok", kobo=kobo_configured())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("DEBUG") == "1")
