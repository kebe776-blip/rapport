/* =========================================================================
   champs-general-moyen.js — Définition déclarative du « RAPPORT GÉNÉRAL
   DE RENTRÉE — ENSEIGNEMENT MOYEN & SECONDAIRE » (11 feuilles, 14 pages).
   -------------------------------------------------------------------------
   Libellés relevés sur le modèle officiel 2026/2027 :
     RAPPORT GENERAL DE RENTREE MOYEN & SECONDAIRE_2026-2027.xlsx
   Feuilles :
     1 PAGE D'ENTRÉE · 2 INFORMATIONS ELEVES VULNERAB ·
     3 STRUCTURES & EQUIPEMENTS · 4 SITUATION DU TICE ·
     5 EFFECTIF ELEVES MOYEN · 6 EFFECTIF SECONDAIRE ·
     7 RÉSULTATS EXAMENS · 8 PERSONNEL ADMINISTRATIF ·
     9 PERSONNEL ENSEIGNANT · 10 PERSONNEL DE SERVICE ·
     11 OBSERVATIONS CHEF D'ETAB.
   Fichier DÉDIÉ : form.js / champs.js / rapport.js (élémentaire) ne sont
   ni modifiés ni chargés par general-moyen.html.
   ========================================================================= */
(function (global) {
  "use strict";

  /* --- Listes déroulantes (valeur brute → libellé) --- */
  var OUI_NON = [["", "—"], ["oui", "OUI"], ["non", "NON"]];
  var STATUT = [["", "—"], ["public", "PUBLIC"], ["prive", "PRIVÉ"]];
  var TYPE_ETAB = [["", "—"], ["cem", "CEM"], ["cfa", "CFA"],
                   ["lycee", "LYCÉE"], ["lfa", "LFA"], ["bst", "BST"]];
  var GENRE = [["", "—"], ["m", "M"], ["f", "F"]];
  var SEXE = [["", "—"], ["m", "M"], ["f", "F"]];
  var TELEPHONE = [["", "—"], ["neant", "NÉANT"], ["fixe", "FIXE"],
                   ["mobile", "MOBILE"], ["cdma", "CDMA"]];
  var INTERNET = [["", "—"], ["neant", "NÉANT"], ["wifi", "WIFI"],
                  ["fibre", "FIBRE"], ["flybox", "FLYBOX"]];
  var SUPPORT_NUM = [["", "—"], ["neant", "NÉANT"],
                     ["1a3", "1 À 3 TITRES"], ["4plus", "4+ TITRES"]];
  var TYPE_CLASSE = [["", "—"], ["simple", "SIMPLE"], ["cmg", "CMG"]];

  /* -----------------------------------------------------------------------
     FEUILLE 1 — IDENTIFICATION / EFFECTIFS / GOUVERNANCE
     ----------------------------------------------------------------------- */
  var IDENTIFICATION_CHAMPS = [
    { n: "nom_ecole", l: "Nom de l'établissement", t: "combo", req: true,
      large: true, listeNom: "RR_ECOLES_MOYEN",
      aide: "Liste fermée des CEM, lycées et CFA de l'inspection." },
    { n: "code_admin", l: "Code administratif de l'établissement" },
    { n: "code_chapitre", l: "Code Chapitre" },
    { n: "region_ia", l: "Région / IA", def: "KAOLACK" },
    { n: "departement", l: "Département", def: "NIORO" },
    { n: "adresse", l: "Adresse de l'établissement" },
    { n: "ief", l: "IEF", def: "KEUR MADIABEL" },
    { n: "commune", l: "Commune" },
    { n: "district", l: "District" },
    { n: "ville_village", l: "Ville / village" },
    { n: "telephone_fixe", l: "Téléphone fixe de l'établissement", tel: true },
    { n: "statut", l: "Statut (public - privé)", t: "select", opts: STATUT },
    { n: "email", l: "Email de l'établissement" },
    { n: "type_etab", l: "Type (CEM - CFA - Lycée - LFA - BST)", t: "select",
      opts: TYPE_ETAB },
    { n: "site_web", l: "Site WEB de l'établissement" },
    { n: "bst_polarise", l: "Si le collège est polarisé par un BST, préciser" },
    { n: "geolat", l: "Géoréférencement - latitude" },
    { n: "geolong", l: "Géoréférencement - longitude" },
    { n: "annee_creation", l: "Année de création" },
    { n: "ref_circulaire", l: "N° de référence de la circulaire de création" }
  ];

  var PERSONNEL_LIGNES = [
    { n: "admin", l: "Personnel administratif (Chef d'étab; SG; Surv; Gest.)" },
    { n: "ens_tit", l: "Personnel enseignant titulaire" },
    { n: "ens_vac", l: "Personnel enseignant vacataire ou contractuel" },
    { n: "tech", l: "Personnel technique (technicien informatique, autre)" },
    { n: "service", l: "Personnel de service (ménage, gardien …)" }
  ];

  var ELEVES_LIGNES = [
    { n: "sixieme", l: "6ème" },
    { n: "cinquieme", l: "5ème" },
    { n: "quatrieme", l: "4ème" },
    { n: "troisieme", l: "3ème" },
    { n: "seconde", l: "Seconde" },
    { n: "premiere", l: "Première" },
    { n: "terminale", l: "Terminale" }
  ];

  var CELLULES = [
    ["all", "ALL"], ["ang", "ANG"], ["arabe", "Arabe"], ["efs", "EFS"],
    ["esp", "ESP"], ["fr", "FR"], ["hg", "HG"], ["math", "MATH"],
    ["philo", "Philo"], ["port", "PORT"], ["russ", "RUSS"], ["sp", "SP"],
    ["svt", "SVT"], ["techno", "Techno"]
  ];

  var CLUBS = [
    ["tic", "Club TIC"], ["sciences", "Club sciences"],
    ["autres", "Autres Org/Clubs"], ["ovds", "OVDS"], ["clap", "CLAP"],
    ["evf", "EVF"]
  ];

  /* -----------------------------------------------------------------------
     FEUILLE 2 — INFORMATIONS ELEVES VULNERABLES
     ----------------------------------------------------------------------- */
  var VULNERABLES_INDICATEURS = [
    { n: "vulnerables", l: "Élèves vulnérables" },
    { n: "sans_piece", l: "Nombre d'élèves sans pièce d'état civil" },
    { n: "redoublants_handicapes", l: "Nombre de redoublants handicapés" },
    { n: "moteurs", l: "Nombre handicapés moteurs" },
    { n: "malvoyants", l: "Nombre handicapés malvoyants" },
    { n: "deficients_visuels", l: "Nombre handicapés déficients visuels" },
    { n: "verbo_auditif", l: "Nombre handicapés verbo-auditif (sourd et/ou muet)" },
    { n: "cantine", l: "Nombre bénéficiaires de cantine" },
    { n: "bourses", l: "Nombre bénéficiaires de bourses" },
    { n: "violences_sexuelles", l: "Nombre victimes de violences sexuelles" },
    { n: "autres_violences", l: "Nombre victimes d'autres formes de violences" }
  ];

  /* -----------------------------------------------------------------------
     FEUILLE 3 — STRUCTURES & ÉQUIPEMENTS
     ----------------------------------------------------------------------- */
  var SALLES = [
    { n: "physiques", l: "Salles de classe physiques" },
    { n: "bureaux", l: "Bureaux (salles) administratifs / de secrétariat" },
    { n: "profs", l: "Salles de professeurs" },
    { n: "bibliotheque", l: "Salle bibliothèque" },
    { n: "specialisees", l: "Salles spécialisées" },
    { n: "informatique", l: "Salle informatique ou pouvant en tenir lieu ?" },
    { n: "tables_bancs", l: "Tables - bancs" }
  ];

  var EQUIPEMENTS = [
    { n: "desktop", l: "Ordinateurs de bureau (desk-top)" },
    { n: "portable", l: "Ordinateurs portables" },
    { n: "laser", l: "Imprimante laser" },
    { n: "jet", l: "Imprimante Jet d'encre" },
    { n: "videoprojecteur", l: "Vidéoprojecteur" },
    { n: "photocopieuse", l: "Photocopieuse" },
    { n: "risographe", l: "Risographe" },
    { n: "scanner", l: "Scanner" }
  ];

  var MANUELS_DISCIPLINES = [
    ["francais", "Français"], ["mathematiques", "Mathématiques"],
    ["histoire", "Histoire"], ["geographie", "Géographie"],
    ["svt", "Science Vie et Terre"], ["physique", "Science Physique"],
    ["chimie", "Chimie"], ["anglais", "Anglais"],
    ["philosophie", "Philosophie"],
    ["efs", "Econ. Familiale & Sociale"], ["grec", "Grec"], ["latin", "Latin"],
    ["allemand", "Allemand"], ["arabe", "Arabe"], ["espagnol", "Espagnol"],
    ["italien", "Italien"], ["portugais", "Portuguais"], ["russe", "Russe"]
  ];

  var MANUELS_CLASSES = [
    ["sixieme", "6ème"], ["cinquieme", "5ème"], ["quatrieme", "4ème"],
    ["troisieme", "3ème"], ["seconde", "Seconde"], ["premiere", "Première"],
    ["terminale", "Terminale"]
  ];

  var SUPPORTS_NUM = [
    ["texte", "Text"], ["video", "Vidéo"], ["interactif", "Interactif"]
  ];

  /* -----------------------------------------------------------------------
     FEUILLE 4 — SITUATION DU TICE
     ----------------------------------------------------------------------- */
  var TICE_PERSONNELS = [
    ["enseignant", "Personnel enseignant"],
    ["administratif", "Personnel administratif"]
  ];

  var TICE_COMPETENCES = [
    ["word", "MS Word"], ["excel", "MS Excel"],
    ["powerpoint", "MS Power Point"], ["internet", "Navigation Internet"],
    ["messagerie", "Messagerie"], ["numerique", "Numérique"]
  ];

  var TICE_NIVEAUX = [
    ["aucun", "Aucun"], ["faible", "Faible"],
    ["moyen", "Moyen"], ["avance", "Avancé"]
  ];

  var FINANCEMENTS = [
    ["ministere", "Ministère"],
    ["partenaires_dev", "Partenaires au développement"],
    ["cotisations", "Cotisations élèves"],
    ["prives", "Partenaires privés"]
  ];

  var PARTENAIRES_LIGNES = 5;

  /* -----------------------------------------------------------------------
     FEUILLES 5-6 — EFFECTIFS ÉLÈVES
     ----------------------------------------------------------------------- */
  var EFFECTIFS_MOYEN_NIVEAUX = [
    ["sixieme", "6ème"], ["cinquieme", "5ème"],
    ["quatrieme", "4ème"], ["troisieme", "3ème"]
  ];

  var EFFECTIFS_SECONDAIRE_GROUPES = [
    { cle: "seconde", l: "SECONDE", series: [
      ["l", "L"], ["la", "LA"], ["s", "S"], ["sa", "SA"]
    ] },
    { cle: "premiere", l: "PREMIÈRE", series: [
      ["l1", "L1"], ["la", "LA"], ["l2", "L2"], ["lp", "L'1"],
      ["s1", "S1"], ["s1a", "S1A"], ["s2", "S2"], ["s2a", "S2A"]
    ] },
    { cle: "terminale", l: "TERMINALE", series: [
      ["l1", "L1"], ["la", "LA"], ["l2", "L2"], ["lp", "L'1"],
      ["s1", "S1"], ["s1a", "S1A"], ["s2", "S2"], ["s2a", "S2A"]
    ] }
  ];

  var LV2_LANGUES = [
    ["allemand", "Allemand"], ["arabe", "Arabe"], ["espagnol", "Espagnol"],
    ["italien", "Italien"], ["portugais", "Portuguais"], ["russe", "Russe"]
  ];

  /* -----------------------------------------------------------------------
     FEUILLE 7 — RÉSULTATS EXAMENS (année 2025/2026)
     ----------------------------------------------------------------------- */
  var EXAMENS_GROUPES = [
    { cle: "ins", l: "INSCRITS", cols: 2 },
    { cle: "pres", l: "PRÉSENTS", cols: 2 },
    { cle: "pres_t", l: "", cols: 1 },
    { cle: "adm1", l: "ADMIS 1er groupe", cols: 2 },
    { cle: "adm2", l: "ADMIS 2ème groupe", cols: 2 },
    { cle: "adm_t", l: "TOTAL ADMIS", cols: 3 },
    { cle: "fa", l: "DONT FA", cols: 2 },
    { cle: "pct", l: "ADMIS / PRÉSENTS (%)", cols: 3 }
  ];

  var EXAMENS_COLONNES = [
    { n: "ins_g", l: "Garçons", groupe: "ins" },
    { n: "ins_f", l: "Filles", groupe: "ins" },
    { n: "pres_g", l: "Garçons", groupe: "pres" },
    { n: "pres_f", l: "Filles", groupe: "pres" },
    { n: "pres_t", l: "ETAB", groupe: "pres_t", auto: true },
    { n: "adm1_g", l: "Garçons", groupe: "adm1" },
    { n: "adm1_f", l: "Filles", groupe: "adm1" },
    { n: "adm2_g", l: "Garçons", groupe: "adm2" },
    { n: "adm2_f", l: "Filles", groupe: "adm2" },
    { n: "adm_t_g", l: "Garçons", groupe: "adm_t", auto: true },
    { n: "adm_t_f", l: "Filles", groupe: "adm_t", auto: true },
    { n: "adm_t", l: "ETAB", groupe: "adm_t", auto: true },
    { n: "fa_g", l: "Garçons", groupe: "fa" },
    { n: "fa_f", l: "Filles", groupe: "fa" },
    { n: "pct_g", l: "Garçons", groupe: "pct", auto: true },
    { n: "pct_f", l: "Filles", groupe: "pct", auto: true },
    { n: "pct_etab", l: "% ETAB", groupe: "pct", auto: true }
  ];

  var BFEM_SESSIONS = [
    ["normale", "Normale"], ["remplacement", "Remplacement"]
  ];

  var BAC_SERIES = [
    ["l1", "L1"], ["l2", "L2"], ["lp", "L Prime"],
    ["s1", "S1"], ["s2", "S2"]
  ];

  var BAC_SESSIONS = [
    ["normale", "Normale"], ["remplacement", "Remplacement"],
    ["total", "TOTAL"]
  ];

  var MENTIONS = [
    ["tb", "Très bien"], ["bien", "Bien"], ["ab", "Assez Bien"]
  ];

  var MENTIONS_SERIES = [
    ["l1", "L1"], ["l2", "L2"], ["lp", "L Prime"], ["la", "LA"],
    ["s1", "S1"], ["s1a", "S1A"], ["s2", "S2"], ["s2a", "S2A"]
  ];

  var MENTIONS_GROUPES = [
    { cle: "tb", l: "Très bien" },
    { cle: "bien", l: "Bien" },
    { cle: "ab", l: "Assez Bien" },
    { cle: "total", l: "TOTAL" }
  ];

  /* -----------------------------------------------------------------------
     FEUILLES 8-10 — PERSONNELS NOMINATIFS
     ----------------------------------------------------------------------- */
  var COLONNES_ADMIN = [
    { n: "fonction", l: "FONCTIONS", t: "text", w: "17%" },
    { n: "prenom", l: "PRÉNOM(S)", t: "text", maj: "upper", w: "14%" },
    { n: "nom", l: "NOM", t: "text", maj: "upper", w: "14%" },
    { n: "sexe", l: "Sexe M/F", t: "select", opts: SEXE, w: "6%" },
    { n: "date_naissance", l: "Date Naissance", t: "date", w: "9%" },
    { n: "matricule", l: "Matricule de solde", t: "text", w: "10%" },
    { n: "corps_grade", l: "CORPS / GRADE", t: "text", w: "10%" },
    { n: "date_entree", l: "Date Entrée Établissement", t: "date", w: "10%" },
    { n: "specialite", l: "SPÉCIALITÉ (DISCIPLINE)", t: "text", w: "10%" }
  ];

  var COLONNES_ENSEIGNANT = [
    { n: "discip", l: "DISCIP.", t: "text", w: "6%" },
    { n: "discipline_dominante", l: "DISCIPLINE DOMINANTE ENSEIGNÉE",
      t: "text", w: "13%" },
    { n: "prenom", l: "PRÉNOM(S)", t: "text", maj: "upper", w: "10%" },
    { n: "nom", l: "NOM", t: "text", maj: "upper", w: "10%" },
    { n: "sexe", l: "SEXE M/F", t: "select", opts: SEXE, w: "5%" },
    { n: "date_naissance", l: "Date Naissance", t: "date", w: "8%" },
    { n: "matricule", l: "MATRICULE DE SOLDE", t: "text", w: "9%" },
    { n: "corps_grade", l: "CORPS / GRADE", t: "text", w: "8%" },
    { n: "date_entree", l: "Date Entrée Établissement", t: "date", w: "8%" },
    { n: "diplome_acad", l: "DIPLÔME ACADEMIQUE", t: "text", w: "9%" },
    { n: "discipline_diplome", l: "DISCIPLINE DU DIPLÔME ACADEMIQUE",
      t: "text", w: "9%" },
    { n: "diplome_prof", l: "DIPLÔME PROFESSIONNEL", t: "text", w: "9%" },
    { n: "heures", l: "Nbre d'heures enseignées / semaine", t: "num",
      w: "6%" },
    { n: "decharge", l: "Décharge", t: "text", w: "5%" },
    { n: "classes", l: "Classes Tenues", t: "text", w: "8%" }
  ];

  var COLONNES_SERVICE = [
    { n: "fonction", l: "FONCTIONS", t: "text", w: "18%" },
    { n: "prenom", l: "PRÉNOM(S)", t: "text", maj: "upper", w: "15%" },
    { n: "nom", l: "NOM", t: "text", maj: "upper", w: "15%" },
    { n: "sexe", l: "Sexe M/F", t: "select", opts: SEXE, w: "7%" },
    { n: "date_naissance", l: "Date Naissance", t: "date", w: "11%" },
    { n: "date_prise_service", l: "Date de prise de service", t: "date", w: "13%" },
    { n: "specialite", l: "SPÉCIALITÉ", t: "text", w: "13%" }
  ];

  /* --- Validations minimales --- */
  var OBLIGATOIRES = [
    ["identification.nom_ecole", "le nom de l'établissement"],
    ["chef.chef_prenom_nom", "le prénom et le nom du chef d'établissement"],
    ["chef.chef_telephone", "le téléphone du chef d'établissement"]
  ];

  global.RR_CHAMPS_GENERAL_MOYEN = {
    IDENTIFICATION_CHAMPS: IDENTIFICATION_CHAMPS,
    PERSONNEL_LIGNES: PERSONNEL_LIGNES,
    ELEVES_LIGNES: ELEVES_LIGNES,
    CELLULES: CELLULES,
    CLUBS: CLUBS,
    VULNERABLES_INDICATEURS: VULNERABLES_INDICATEURS,
    SALLES: SALLES,
    EQUIPEMENTS: EQUIPEMENTS,
    MANUELS_DISCIPLINES: MANUELS_DISCIPLINES,
    MANUELS_CLASSES: MANUELS_CLASSES,
    SUPPORTS_NUM: SUPPORTS_NUM,
    TICE_PERSONNELS: TICE_PERSONNELS,
    TICE_COMPETENCES: TICE_COMPETENCES,
    TICE_NIVEAUX: TICE_NIVEAUX,
    FINANCEMENTS: FINANCEMENTS,
    PARTENAIRES_LIGNES: PARTENAIRES_LIGNES,
    EFFECTIFS_MOYEN_NIVEAUX: EFFECTIFS_MOYEN_NIVEAUX,
    EFFECTIFS_SECONDAIRE_GROUPES: EFFECTIFS_SECONDAIRE_GROUPES,
    LV2_LANGUES: LV2_LANGUES,
    EXAMENS_GROUPES: EXAMENS_GROUPES,
    EXAMENS_COLONNES: EXAMENS_COLONNES,
    BFEM_SESSIONS: BFEM_SESSIONS,
    BAC_SERIES: BAC_SERIES,
    BAC_SESSIONS: BAC_SESSIONS,
    MENTIONS: MENTIONS,
    MENTIONS_SERIES: MENTIONS_SERIES,
    MENTIONS_GROUPES: MENTIONS_GROUPES,
    COLONNES_ADMIN: COLONNES_ADMIN,
    COLONNES_ENSEIGNANT: COLONNES_ENSEIGNANT,
    COLONNES_SERVICE: COLONNES_SERVICE,
    OBLIGATOIRES: OBLIGATOIRES,
    OPTIONS: {
      OUI_NON: OUI_NON, STATUT: STATUT, TYPE_ETAB: TYPE_ETAB,
      GENRE: GENRE, SEXE: SEXE, TELEPHONE: TELEPHONE,
      INTERNET: INTERNET, SUPPORT_NUM: SUPPORT_NUM,
      TYPE_CLASSE: TYPE_CLASSE
    }
  };

}(window));
