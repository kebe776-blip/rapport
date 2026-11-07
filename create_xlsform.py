# -*- coding: utf-8 -*-
"""
Génère le fichier XLSForm officiel : formulaire_rentree.xlsx
Sections A a N du "RAPPORT GENERAL DE RENTREE ELEMENTAIRE 2025/2026"
Importable directement dans KoboToolbox (New project -> Import an XLSForm).
"""
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

survey = []   # feuille survey
choices = []  # feuille choices


def q(type_, name, label, **kw):
    row = {"type": type_, "name": name, "label": label}
    row.update(kw)
    survey.append(row)


def gb(name, label):
    q("begin_group", name, label)


def ge():
    q("end_group", "", "")


def rb(name, label):
    q("begin_repeat", name, label)


def re():
    q("end_repeat", "", "")


def ch(list_name, name, label):
    choices.append({"list_name": list_name, "name": name, "label": label})


# ---------------------------------------------------------------------------
# LISTES DE CHOIX
# ---------------------------------------------------------------------------
for n, l in [("public", "PUBLIC"), ("prive", "PRIVE"), ("communautaire", "COMMUNAUTAIRE")]:
    ch("statut", n, l)
for n, l in [("titulaire", "TITULAIRE"), ("interimaire", "INTERIMAIRE")]:
    ch("statut_directeur", n, l)
for n, l in [("oui", "OUI"), ("non", "NON")]:
    ch("oui_non", n, l)
for n, l in [("wolof", "WOLOF"), ("pulaar", "PULAAR"), ("serere", "SERERE"),
             ("diola", "DIOLA"), ("mandinka", "MANDINKA"), ("soninke", "SONINKE"),
             ("manjak", "MANJAK"), ("balant", "BALANT"), ("noon", "NOON"),
             ("koulack", "KOULACK"), ("autre", "AUTRE")]:
    ch("langue", n, l)
for n, l in [("simple", "SIMPLE"), ("cmg", "CMG"), ("cdf", "CDF")]:
    ch("type_classe", n, l)
for n, l in [("francais", "FRANCAIS"), ("arabe", "ARABE")]:
    ch("discipline", n, l)
for n, l in [("etat", "ETAT"), ("cge", "CGE"), ("caritas", "CARITAS"),
             ("plan_international", "PLAN INTERNATIONAL"), ("relit", "RELIT"),
             ("pame", "PAME"), ("onu", "ONU"), ("bailleur", "BAILLEUR"),
             ("autre", "AUTRE")]:
    ch("provenance", n, l)
for n, l in [("bon", "BON"), ("acceptable", "ACCEPTABLE"), ("mauvais", "MAUVAIS"),
             ("neant", "NEANT")]:
    ch("etat", n, l)
for n, l in [("senelec", "SENELEC"), ("solaire", "SOLAIRE"),
             ("groupe_electrogene", "GROUPE ELECTROGENE"), ("neant", "NEANT")]:
    ch("source_electricite", n, l)

MOBILIER = [
    ("tables_bancs", "Tables bancs"),
    ("tables_bureaux", "Tables bureaux Maitres"),
    ("chaises", "Chaises"),
    ("armoires", "Armoires"),
    ("placards", "Placards"),
    ("tableaux", "Tableaux"),
    ("ordinateurs", "Ordinateurs"),
    ("imprimantes", "Imprimantes"),
    ("video_projecteur", "Video projecteur"),
    ("photocopieuses", "Photocopieuses"),
    ("autres_mobilier", "Autres"),
]
for n, l in MOBILIER:
    ch("mobilier_list", n, l)

COURS = [("ci", "CI"), ("cp", "CP"), ("ce1", "CE1"),
         ("ce2", "CE2"), ("cm1", "CM1"), ("cm2", "CM2")]
for n, l in COURS:
    ch("cours_list", n, l)

# ---------------------------------------------------------------------------
# A. IDENTIFICATION DE L'ECOLE
# ---------------------------------------------------------------------------
gb("identification", "A. IDENTIFICATION DE L'ECOLE")
q("text", "nom_ecole", "Nom de l'ecole", required=True)
q("select_one statut", "statut", "Statut", required=True)
q("text", "date_creation", "Date de creation (annee)", hint="Ex : 1962")
q("text", "commune", "Commune de", required=True)
q("text", "district", "District de", required=True)
q("text", "codec", "CODEC de", required=True)
q("text", "villages_polarises", "Villages polarises")
q("select_one langue", "langue_nationale", "Langue nationale")
ge()

# ---------------------------------------------------------------------------
# B. SITUATION DES CLASSES PEDAGOGIQUES
# ---------------------------------------------------------------------------
gb("classes_pedagogiques", "B. SITUATION DES CLASSES PEDAGOGIQUES")
q("integer", "nb_cours", "Nombre de cours", required=True)
q("integer", "nb_classes_simples", "Nombre de classes simples", required=True)
q("integer", "nb_cmg", "Nombre de CMG", required=True)
q("integer", "nb_cdf", "Nombre de CDF", required=True)
q("text", "cours_jumeles", "Preciser les cours jumeles")
ge()

# ---------------------------------------------------------------------------
# C. SITUATION DES CLASSES PHYSIQUES
# ---------------------------------------------------------------------------
gb("classes_physiques", "C. SITUATION DES CLASSES PHYSIQUES")
q("integer", "salles_bonnes", "Salles en dur - BONNES", required=True)
q("integer", "salles_acceptables", "Salles en dur - ACCEPTABLES", required=True)
q("integer", "salles_mauvaises", "Salles en dur - MAUVAISES", required=True)
q("integer", "salles_totale", "Salles en dur - TOTALE", required=True)
q("integer", "salles_utilisees", "Utilisees", required=True)
q("integer", "salles_non_utilisees", "Non utilisees", required=True)
q("integer", "abris_provisoires", "Abris provisoires", required=True)
q("integer", "a_rehabiliter", "A rehabiliter", required=True)
q("integer", "cours_construction", "Nombre de classes en cours de construction ou inachevees")
q("text", "programme_construction", "Programme et annee (si construction)")
ge()

# ---------------------------------------------------------------------------
# D. RENSEIGNEMENTS SUR LE DIRECTEUR
# ---------------------------------------------------------------------------
gb("directeur", "D. RENSEIGNEMENTS SUR LE DIRECTEUR")
q("text", "prenom_nom", "Prenom et Nom", required=True)
q("text", "grade", "Grade", hint="Ex : IP/3, 12/4, MC/11")
q("text", "matricule", "Matricule", required=True)
q("text", "date_naissance", "Date de naissance", hint="jj/mm/aaaa")
q("text", "lieu_naissance", "Lieu de naissance")
q("text", "diplome_academique", "Diplome Acad.")
q("text", "diplome_professionnel", "Diplome Prof.")
q("text", "date_entree_enseignement", "Date d'entree dans l'enseignement", hint="jj/mm/aaaa")
q("text", "date_affectation", "Date d'affectation a l'ecole", hint="jj/mm/aaaa")
q("text", "references_affectation", "References de l'acte d'affectation")
q("select_one statut_directeur", "statut_directeur", "Statut (Titulaire ou Interimaire)")
q("text", "position", "Position (Charge : Titulaire de classe)")
q("select_one oui_non", "decharge", "Decharge ?")
q("text", "telephone1", "Numero de contact (1er)")
q("text", "telephone2", "Numero de contact (2eme possible)")
q("text", "whatsapp", "Numero WhatsApp")
ge()

# ---------------------------------------------------------------------------
# E. SITUATION DES OUVRAGES ANNEXES
# ---------------------------------------------------------------------------
gb("ouvrages_annexes", "E. SITUATION DES OUVRAGES ANNEXES")
q("select_one oui_non", "toilettes", "Existence de toilettes")
q("integer", "nb_blocs", "Nombre de blocs")
q("integer", "nb_cabines", "Nombre de cabines")
q("integer", "cabines_fonctionnelles", "Cabines fonctionnelles")
q("integer", "cabines_non_fonctionnelles", "Cabines non fonctionnelles")
q("text", "bailleur_toilettes", "Bailleur (toilettes)", hint="Mairie / Communaute / Autre")
q("select_one oui_non", "point_eau", "Existence d'un point d'eau")
q("integer", "nb_robinets", "Nombre de robinets")
q("select_one etat", "etat_point_eau", "Etat du point d'eau")
q("text", "bailleur_point_eau", "Bailleur (point d'eau)")
q("select_one oui_non", "senelec", "Alimentation en electricite - Senelec ?")
q("select_one etat", "etat_electricite", "Etat des installations electriques")
q("select_one oui_non", "branchement_collectif", "Branchement collectif ?")
q("select_one source_electricite", "source_electricite", "Source d'electricite")
q("select_one oui_non", "internet", "L'ecole dispose-t-elle d'une connexion internet ?")
q("select_one oui_non", "modem_wifi_men", "Benefice d'un modem wifi du MEN ?")
q("select_one oui_non", "bureau", "Bureau ?")
q("text", "bailleur_bureau", "Bailleur (bureau)")
q("select_one oui_non", "magasin", "Magasin ?")
q("text", "bailleur_magasin", "Bailleur (magasin)")
q("select_one oui_non", "cloture", "Cloture ?")
q("text", "bailleur_cloture", "Bailleur (cloture)")
q("select_one oui_non", "cuisine", "Cuisine ?")
q("text", "bailleur_cuisine", "Bailleur (cuisine)")
q("select_one oui_non", "logement", "Logement ?")
q("text", "bailleur_logement", "Bailleur (logement)")
ge()

# ---------------------------------------------------------------------------
# F. ACTIVITES PERI ET PARA SCOLAIRES
# ---------------------------------------------------------------------------
gb("activites", "F. ACTIVITES PERI ET PARA SCOLAIRES")
q("select_one oui_non", "cge", "1. L'ecole dispose-t-elle d'un CGE fonctionnel ?")
q("text", "cge_date_mise_en_place", "Date de mise en place du bureau (mandat en cours)")
q("text", "cge_mandat", "Mandat en cours", hint="Ex : 2025")
q("text", "cge_president", "Le President")
q("text", "cge_tel", "Tel. du President")
q("select_one oui_non", "cge_deux_mandats", "A-t-il fait deja deux mandats consecutifs ?")
q("text", "programmes_intervenants", "2. Programme(s) intervenant dans l'ecole et impact",
  hint="Ex : PASED, RELIT, PAIRE L'ECOLE, PAAME")
q("select_one oui_non", "cantine", "3. Une cantine scolaire ?")
q("text", "bailleur_cantine", "Bailleur (cantine)")
q("select_one oui_non", "cooperative", "Une cooperative scolaire ?")
q("select_one oui_non", "jardin", "Un jardin scolaire ?")
q("text", "bailleur_jardin", "Bailleur (jardin)")
q("select_one oui_non", "champ_communaute", "Un champ communautaire ?")
q("select_one oui_non", "mallette_pedagogique", "Une mallette pedagogique ?")
q("integer", "nb_mallettes", "Nombre de mallettes")
q("select_one oui_non", "bibliotheque", "Une bibliotheque ?")
q("select_one oui_non", "terrain_sport", "Un terrain de sport ?")
q("select_one oui_non", "boite_pharmacie", "Une boite pharmacie ?")
ge()

# ---------------------------------------------------------------------------
# G. OBSERVATIONS DU DIRECTEUR
# ---------------------------------------------------------------------------
gb("observations", "G. OBSERVATIONS DU DIRECTEUR")
q("text", "obs_materiel", "1. Sur le plan materiel", appearance="multiline")
q("text", "obs_personnel", "2. Sur le plan du personnel", appearance="multiline")
q("text", "obs_pedagogique", "3. Sur le plan pedagogique", appearance="multiline")
ge()

# ---------------------------------------------------------------------------
# H. SITUATION DU PERSONNEL ENSEIGNANT
# ---------------------------------------------------------------------------
gb("personnel", "H. SITUATION DU PERSONNEL ENSEIGNANT (Inscrire le Directeur et mettre le titre qu'il tient ou s'il est decharge)")

rb("enseignant", "Enseignants titulaires / charges")
q("integer", "num_ligne", "Numero")
q("text", "prenom", "Prenom", required=True)
q("text", "nom", "Nom", required=True)
q("text", "grade", "Grade")
q("text", "matricule", "Matricule")
q("select_one discipline", "discipline", "Discipline")
q("text", "diplome_acad", "DIPL. ACAD.")
q("text", "diplome_prof", "DIPL. PROF.")
q("text", "date_entree", "Date d'entree dans l'enseignement")
q("text", "date_affectation", "Date d'affectation a l'ecole")
q("text", "cours_tenu", "Cours tenu")
q("text", "contact", "Contact")
re()

rb("suppleant", "Suppleants")
q("integer", "num_ligne", "Numero")
q("text", "prenom", "Prenom")
q("text", "nom", "Nom")
q("text", "grade", "Grade")
q("text", "matricule", "Matricule")
q("select_one discipline", "discipline", "Discipline")
q("text", "diplome_acad", "DIPL. ACAD.")
q("text", "diplome_prof", "DIPL. PROF.")
q("text", "date_entree", "Date d'entree dans l'enseignement")
q("text", "date_affectation", "Date d'affectation a l'ecole")
q("text", "cours_tenu", "Cours tenu")
q("text", "contact", "Contact")
re()

rb("malade", "Malades / Conges de maternite")
q("integer", "num_ligne", "Numero")
q("text", "prenom", "Prenom")
q("text", "nom", "Nom")
q("text", "grade", "Grade")
q("text", "matricule", "Matricule")
q("select_one discipline", "discipline", "Discipline")
q("text", "diplome_acad", "DIPL. ACAD.")
q("text", "diplome_prof", "DIPL. PROF.")
q("text", "date_entree", "Date d'entree dans l'enseignement")
q("text", "date_affectation", "Date d'affectation a l'ecole")
q("text", "cours_tenu", "Cours tenu")
q("text", "contact", "Contact")
re()

# Recapitulation
gb("recap_personnel", "H-bis. RECAPITULATION (Prendre en compte le Directeur)")
gb("recap_francais", "FRANCAIS")
q("integer", "inst_h", "Instituteurs - H")
q("integer", "inst_f", "Instituteurs - F")
q("integer", "inst_t", "Instituteurs - T")
q("integer", "inst_adj_h", "Instituteurs adjoints - H")
q("integer", "inst_adj_f", "Instituteurs adjoints - F")
q("integer", "inst_adj_t", "Instituteurs adjoints - T")
q("integer", "mc_h", "Maitres contractuels - H")
q("integer", "mc_f", "Maitres contractuels - F")
q("integer", "mc_t", "Maitres contractuels - T")
ge()
gb("recap_arabe", "ARABE")
q("integer", "arabe_inst_h", "Instituteurs - H")
q("integer", "arabe_inst_f", "Instituteurs - F")
q("integer", "arabe_inst_t", "Instituteurs - T")
q("integer", "arabe_inst_adj_h", "Instituteurs adjoints - H")
q("integer", "arabe_inst_adj_f", "Instituteurs adjoints - F")
q("integer", "arabe_inst_adj_t", "Instituteurs adjoints - T")
q("integer", "arabe_mc_h", "Maitres contractuels - H")
q("integer", "arabe_mc_f", "Maitres contractuels - F")
q("integer", "arabe_mc_t", "Maitres contractuels - T")
ge()
ge()
ge()

# ---------------------------------------------------------------------------
# I. SITUATION DES EFFECTIFS (6 cours fixes)
# ---------------------------------------------------------------------------
gb("effectifs", "I. SITUATION DES EFFECTIFS")
for key, label in COURS:
    gb("eff_" + key, label)
    q("integer", "eff_g", "Effectif - Garcons", required=True)
    q("integer", "eff_f", "Effectif - Filles", required=True)
    q("integer", "eff_t", "Effectif - Total", required=True)
    q("integer", "red_g", "Redoublants - G")
    q("integer", "red_f", "Redoublants - F")
    q("integer", "red_t", "Redoublants - T")
    q("integer", "hand_g", "Handicapes - G")
    q("integer", "hand_f", "Handicapes - F")
    q("integer", "hand_t", "Handicapes - T")
    q("integer", "sans_etat_g", "Sans piece d'etat civil - G")
    q("integer", "sans_etat_f", "Sans piece d'etat civil - F")
    q("integer", "sans_etat_t", "Sans piece d'etat civil - T")
    q("select_one type_classe", "type_classe", "Type de classe")
    q("integer", "maitre_liste", "Maitre N. sur la liste")
    ge()
ge()

# ---------------------------------------------------------------------------
# J. MOBILIER SCOLAIRE (lignes fixes)
# ---------------------------------------------------------------------------
gb("mobilier", "J. MOBILIER SCOLAIRE")
for key, label in MOBILIER:
    gb("mob_" + key, label)
    q("integer", "bon", "Bon")
    q("integer", "a_reparer", "A reparer")
    q("integer", "total", "Total")
    q("integer", "defecat", "Defecat")
    ge()
ge()

# ---------------------------------------------------------------------------
# K. RECENSESEMENT DES MANUELS
# ---------------------------------------------------------------------------
gb("manuels", "K. RECENSESEMENT DES MANUELS")
rb("manuel", "Manuel")
q("text", "titre", "Titre", required=True)
q("integer", "quantite", "Quantite")
q("select_one provenance", "provenance", "Provenance")
q("text", "besoins", "Besoins")
q("text", "observations", "Observations")
re()
ge()

# ---------------------------------------------------------------------------
# L. AUTRES MANUELS DISPONIBLES A L'ECOLE
# ---------------------------------------------------------------------------
gb("autres_manuels", "L. AUTRES MANUELS DISPONIBLES A L'ECOLE")
rb("autre_manuel", "Autre manuel")
q("text", "titre", "Titre", required=True)
q("integer", "quantite", "Quantite")
q("select_one provenance", "provenance", "Provenance")
q("text", "besoins", "Besoins")
q("text", "observations", "Observations")
re()
ge()

# ---------------------------------------------------------------------------
# M. RECENSESEMENT DU MATERIEL DIDACTIQUE
# ---------------------------------------------------------------------------
gb("materiel_didactique", "M. RECENSESEMENT DU MATERIEL DIDACTIQUE")
rb("materiel", "Materiel didactique")
q("text", "designation", "Designation", required=True)
q("integer", "quantite", "Quantite")
q("select_one provenance", "provenance", "Provenance")
q("text", "besoins", "Besoins")
q("text", "observations", "Observations")
re()
ge()

# ---------------------------------------------------------------------------
# N. AUTRES MATERIEL DISPONIBLE A L'ECOLE
# ---------------------------------------------------------------------------
gb("autres_materiels", "N. AUTRES MATERIEL DISPONIBLE A L'ECOLE")
rb("autre_materiel", "Autre materiel")
q("text", "designation", "Designation", required=True)
q("integer", "quantite", "Quantite")
q("select_one provenance", "provenance", "Provenance")
q("text", "besoins", "Besoins")
q("text", "observations", "Observations")
re()
ge()

# ---------------------------------------------------------------------------
# ECRITURE DU CLASSEUR
# ---------------------------------------------------------------------------
wb = Workbook()

ws = wb.active
ws.title = "survey"
survey_cols = ["type", "name", "label", "hint", "appearance"]
ws.append(survey_cols)
for row in survey:
    ws.append([row.get(c, "") for c in survey_cols])

wc = wb.create_sheet("choices")
wc.append(["list_name", "name", "label"])
for row in choices:
    wc.append([row.get("list_name", ""), row.get("name", ""), row.get("label", "")])

wset = wb.create_sheet("settings")
wset.append(["setting", "value"])
wset.append(["form_title", "RAPPORT GENERAL DE RENTREE ELEMENTAIRE 2025/2026"])
wset.append(["form_id", "rapport_rentree_elementaire_2025_2026"])
wset.append(["version", "v1.0"])
wset.append(["default_language", "French (fr)"])
wset.append(["style", "pages"])

# Mise en forme simple
header_fill = PatternFill("solid", fgColor="1F4E79")
header_font = Font(bold=True, color="FFFFFF")
thin = Side(style="thin", color="B0B0B0")
border = Border(left=thin, right=thin, top=thin, bottom=thin)

for sheet in (ws, wc, wset):
    for cell in sheet[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
    for row in sheet.iter_rows(min_row=1, max_row=sheet.max_row, max_col=sheet.max_column):
        for cell in row:
            cell.border = border
    sheet.freeze_panes = "A2"

ws.column_dimensions["A"].width = 24
ws.column_dimensions["B"].width = 26
ws.column_dimensions["C"].width = 52
ws.column_dimensions["D"].width = 40
ws.column_dimensions["E"].width = 14
wc.column_dimensions["A"].width = 20
wc.column_dimensions["B"].width = 22
wc.column_dimensions["C"].width = 30

OUT = "formulaire_rentree.xlsx"
wb.save(OUT)
print(f"OK : {OUT} genere avec {len(survey)} lignes survey et {len(choices)} choix.")
