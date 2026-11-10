/* =========================================================================
   champs.js — Définition déclarative du formulaire officiel
   Sections A → N du « RAPPORT GÉNÉRAL DE RENTRÉE ÉLÉMENTAIRE ».
   Les noms de champs (n) correspondent exactement à sample_data.json,
   ce que buildContext() attend pour produire le PDF.
   ========================================================================= */
(function (global) {
  "use strict";

  var L = global.RR.LABELS;

  /* --- Listes déroulantes réutilisables (valeurs = clés brutes) --- */
  var OUI_NON = [["", "—"], ["oui", "OUI"], ["non", "NON"]];
  var STATUT = [["", "—"], ["public", "PUBLIC"], ["prive", "PRIVÉ"],
                ["communautaire", "COMMUNAUTAIRE"]];
  var LANGUE = [["", "—"], ["wolof", "WOLOF"], ["pulaar", "PULAAR"],
                ["serere", "SERÈRE"], ["diola", "DIOLA"], ["mandinka", "MANDINKA"],
                ["soninke", "SONINKÉ"], ["manjak", "MANJAK"], ["balant", "BALANT"],
                ["noon", "NOON"], ["koulack", "KOULACK"], ["autre", "AUTRE"]];
  var ETAT = [["", "—"], ["bon", "BON"], ["acceptable", "ACCEPTABLE"],
              ["mauvais", "MAUVAIS"], ["neant", "NÉANT"]];
  var ELECTRICITE = [["", "—"], ["senelec", "SENELEC"], ["solaire", "SOLAIRE"],
                     ["groupe_electrogene", "GROUPE ÉLECTROGÈNE"],
                     ["neant", "NÉANT"]];
  var STATUT_DIR = [["", "—"], ["titulaire", "TITULAIRE"],
                    ["interimaire", "INTÉRIMAIRE"]];
  var DISCIPLINE = [["", "—"], ["francais", "FRANÇAIS"], ["arabe", "ARABE"],
                    ["anglais", "ANGLAIS"]];
  var PROVENANCE = [["", "—"], ["etat", "ÉTAT"], ["cge", "CGE"],
                    ["caritas", "CARITAS"], ["plan_international", "PLAN INTERNATIONAL"],
                    ["relit", "RELIT"], ["pame", "PAME"], ["onu", "ONU"],
                    ["bailleur", "BAILLEUR"], ["autre", "AUTRE"]];
  var TYPE_CLASSE = [["", "—"], ["simple", "SIMPLE"], ["cmg", "CMG"],
                     ["cdf", "CDF"]];

  /* -----------------------------------------------------------------------
     SECTIONS A → G (champs simples)
     t : text | num | date | select | area
     req : champ obligatoire
     ----------------------------------------------------------------------- */
  var SECTIONS = [
    {
      lettre: "A", groupe: "identification",
      titre: "IDENTIFICATION DE L'ÉCOLE",
      champs: [
        { n: "nom_ecole", l: "Nom de l'école", t: "text", req: true, maj: "upper" },
        { n: "statut", l: "Statut", t: "select", opts: STATUT },
        { n: "date_creation", l: "Date de création", t: "text", aide: "Ex. 1962" },
        { n: "commune", l: "Commune", t: "text", maj: "upper" },
        { n: "district", l: "District", t: "text", maj: "upper" },
        { n: "codec", l: "CODEC", t: "text", maj: "upper" },
        { n: "villages_polarises", l: "Villages polarisés", t: "text", large: true,
          aide: "Séparés par une virgule" },
        { n: "langue_nationale", l: "Langue nationale", t: "select", opts: LANGUE }
      ]
    },
    {
      lettre: "B", groupe: "classes_pedagogiques",
      titre: "SITUATION DES CLASSES PÉDAGOGIQUES",
      champs: [
        { n: "nb_cours", l: "Nombre de cours", t: "num" },
        { n: "nb_classes_simples", l: "Nombre de classes simples", t: "num" },
        { n: "nb_cmg", l: "Nombre de CMG", t: "num" },
        { n: "nb_cdf", l: "Nombre de CDF", t: "num" },
        { n: "cours_jumeles_cmg", l: "Cours jumelés — CMG (multi-grades)", t: "text",
          large: true, aide: "Ex. CI/CP en CMG — laisser vide = NÉANT" },
        { n: "cours_jumeles_cdf", l: "Cours jumelés — CDF (double flux)", t: "text",
          large: true, aide: "Ex. CE1/CE2 en CDF — laisser vide = NÉANT" }
      ]
    },
    {
      lettre: "C", groupe: "classes_physiques",
      titre: "SITUATION DES CLASSES PHYSIQUES",
      champs: [
        { n: "salles_bonnes", l: "Salles en dur — bonnes", t: "num" },
        { n: "salles_acceptables", l: "Salles en dur — acceptables", t: "num" },
        { n: "salles_mauvaises", l: "Salles en dur — mauvaises", t: "num" },
        { n: "salles_totale", l: "Salles en dur — totale", t: "num" },
        { n: "salles_utilisees", l: "Salles utilisées", t: "num" },
        { n: "salles_non_utilisees", l: "Salles non utilisées", t: "num" },
        { n: "abris_provisoires", l: "Abris provisoires", t: "num" },
        { n: "a_rehabiliter", l: "À réhabiliter", t: "num" },
        { n: "cours_construction", l: "Classes en cours de construction", t: "num" },
        { n: "programme_construction", l: "Programme et année (construction)", t: "text",
          large: true, aide: "Laisser vide = NÉANT" }
      ]
    },
    {
      lettre: "D", groupe: "directeur",
      titre: "RENSEIGNEMENTS SUR LE DIRECTEUR",
      champs: [
        { n: "prenom_nom", l: "Prénom et Nom", t: "text", req: true, maj: "upper" },
        { n: "grade", l: "Grade", t: "text", aide: "Ex. IP/3" },
        { n: "matricule", l: "Matricule", t: "text" },
        { n: "date_naissance", l: "Date de naissance", t: "date" },
        { n: "lieu_naissance", l: "Lieu de naissance", t: "text", maj: "upper" },
        { n: "diplome_academique", l: "Diplôme académique", t: "text", maj: "upper" },
        { n: "diplome_professionnel", l: "Diplôme professionnel", t: "text", maj: "upper" },
        { n: "date_entree_enseignement", l: "Date d'entrée dans l'enseignement", t: "date" },
        { n: "date_affectation", l: "Date d'affectation à l'école", t: "date" },
        { n: "references_affectation", l: "Références de l'acte d'affectation", t: "text",
          large: true },
        { n: "statut_directeur", l: "Statut", t: "select", opts: STATUT_DIR },
        { n: "position", l: "Titulaire de classe (Chargé)", t: "select", opts: OUI_NON },
        { n: "decharge", l: "Déchargé", t: "select", opts: OUI_NON },
        { n: "telephone1", l: "Numéro de contact", t: "text", req: true, tel: true },
        { n: "telephone2", l: "Numéro (2ème possible)", t: "text", tel: true },
        { n: "whatsapp", l: "Numéro WhatsApp", t: "text", tel: true }
      ]
    },
    {
      lettre: "E", groupe: "ouvrages_annexes",
      titre: "SITUATION DES OUVRAGES ANNEXES",
      champs: [
        { n: "toilettes", l: "Existence de toilettes", t: "select", opts: OUI_NON },
        { n: "nb_blocs", l: "Nombre de blocs", t: "num" },
        { n: "nb_cabines", l: "Nombre de cabines", t: "num" },
        { n: "cabines_fonctionnelles", l: "Cabines fonctionnelles", t: "num" },
        { n: "cabines_non_fonctionnelles", l: "Cabines non fonctionnelles", t: "num" },
        { n: "bailleur_toilettes", l: "Bailleur (toilettes)", t: "text" },
        { n: "point_eau", l: "Existence d'un point d'eau", t: "select", opts: OUI_NON },
        { n: "nb_robinets", l: "Nombre de robinets", t: "num" },
        { n: "etat_point_eau", l: "État du point d'eau", t: "select", opts: ETAT },
        { n: "bailleur_point_eau", l: "Bailleur (point d'eau)", t: "text" },
        { n: "puits", l: "Puits", t: "select", opts: OUI_NON },
        { n: "etat_puits", l: "État du puits", t: "select", opts: ETAT },
        { n: "bailleur_puits", l: "Bailleur (puits)", t: "text" },
        { n: "senelec", l: "Senelec", t: "select", opts: OUI_NON },
        { n: "etat_electricite", l: "État des installations (Senelec)", t: "select",
          opts: ETAT },
        { n: "plaques_solaires", l: "Plaques solaires", t: "select", opts: OUI_NON },
        { n: "etat_plaques_solaires", l: "État des installations (plaques solaires)",
          t: "select", opts: ETAT },
        { n: "groupe_electrogene", l: "Groupe électrogène", t: "select", opts: OUI_NON },
        { n: "etat_groupe_electrogene", l: "État des installations (groupe électrogène)",
          t: "select", opts: ETAT },
        { n: "internet", l: "Connexion internet", t: "select", opts: OUI_NON },
        { n: "modem_wifi_men", l: "Modem wifi du MEN", t: "select", opts: OUI_NON },
        { n: "bureau", l: "Bureau", t: "select", opts: OUI_NON },
        { n: "bailleur_bureau", l: "Bailleur (bureau)", t: "text" },
        { n: "magasin", l: "Magasin", t: "select", opts: OUI_NON },
        { n: "bailleur_magasin", l: "Bailleur (magasin)", t: "text" },
        { n: "cloture", l: "Clôture", t: "select", opts: OUI_NON },
        { n: "bailleur_cloture", l: "Bailleur (clôture)", t: "text" },
        { n: "cuisine", l: "Cuisine", t: "select", opts: OUI_NON },
        { n: "bailleur_cuisine", l: "Bailleur (cuisine)", t: "text" },
        { n: "logement", l: "Logement", t: "select", opts: OUI_NON },
        { n: "bailleur_logement", l: "Bailleur (logement)", t: "text" }
      ]
    },
    {
      lettre: "F", groupe: "activites",
      titre: "ACTIVITÉS PÉRI ET PARA SCOLAIRES",
      champs: [
        { n: "cge", l: "CGE fonctionnel", t: "select", opts: OUI_NON },
        { n: "cge_date_mise_en_place", l: "Date de mise en place du bureau", t: "date" },
        { n: "cge_president", l: "Président du CGE", t: "text", maj: "upper" },
        { n: "cge_tel", l: "Tél. président", t: "text", tel: true },
        { n: "cge_deux_mandats", l: "Deux mandats consécutifs ?", t: "select", opts: OUI_NON },
        { n: "programmes_intervenants",
          l: "L'école est-elle concernée par un autre programme intervenant dans le secteur éducatif ? (PASED, RELIT, PAIRE L'ÉCOLE, PAAME)",
          t: "select", opts: OUI_NON },
        { n: "programmes_intervenants_preciser",
          l: "Si OUI, préciser le programme", t: "text",
          aide: "Apparaîtra sur la ligne suivante du PDF — laisser vide = rien" },
        { n: "cantine", l: "Cantine scolaire", t: "select", opts: OUI_NON },
        { n: "bailleur_cantine", l: "Bailleur (cantine)", t: "text" },
        { n: "cooperative", l: "Coopérative scolaire", t: "select", opts: OUI_NON },
        { n: "jardin", l: "Jardin scolaire", t: "select", opts: OUI_NON },
        { n: "bailleur_jardin", l: "Bailleur (jardin)", t: "text" },
        { n: "champ_communaute", l: "Champ communautaire", t: "select", opts: OUI_NON },
        { n: "mallette_pedagogique", l: "Mallette pédagogique", t: "select", opts: OUI_NON },
        { n: "nb_mallettes", l: "Nombre de mallettes", t: "num" },
        { n: "bibliotheque", l: "Bibliothèque", t: "select", opts: OUI_NON },
        { n: "terrain_sport", l: "Terrain de sport", t: "select", opts: OUI_NON },
        { n: "boite_pharmacie", l: "Boîte pharmacie", t: "select", opts: OUI_NON }
      ]
    },
    {
      lettre: "G", groupe: "observations",
      titre: "OBSERVATIONS DU DIRECTEUR",
      champs: [
        { n: "obs_materiel", l: "1 — Sur le plan matériel", t: "area", large: true,
          aide: "Laisser vide = R.A.S" },
        { n: "obs_personnel", l: "2 — Sur le plan du personnel", t: "area", large: true,
          aide: "Laisser vide = R.A.S" },
        { n: "obs_pedagogique", l: "3 — Sur le plan pédagogique", t: "area", large: true,
          aide: "Laisser vide = R.A.S" }
      ]
    }
  ];

  /* -----------------------------------------------------------------------
     H — PERSONNEL ENSEIGNANT (3 tableaux répétables)
     ----------------------------------------------------------------------- */
  var COLONNES_PERSONNEL = [
    { n: "prenom", l: "Prénom", t: "text", maj: "upper", w: "11%" },
    { n: "nom", l: "Nom", t: "text", maj: "upper", w: "11%" },
    { n: "grade", l: "Grade", t: "text", w: "7%" },
    { n: "matricule", l: "Matricule", t: "text", w: "10%" },
    { n: "discipline", l: "Discipline", t: "select", opts: DISCIPLINE, w: "9%" },
    { n: "diplome_acad", l: "Dipl. acad.", t: "text", w: "8%" },
    { n: "diplome_prof", l: "Dipl. prof.", t: "text", w: "8%" },
    { n: "date_entree", l: "Date entrée ens.", t: "date", w: "10%" },
    { n: "date_affectation", l: "Date affectation", t: "date", w: "10%" },
    { n: "cours_tenu", l: "Cours tenu", t: "text", w: "9%" },
    { n: "contact", l: "Contact", t: "text", tel: true, w: "10%" }
  ];

  var PERSONNEL = [
    { cle: "enseignant", titre: "ENSEIGNANTS", colonnes: COLONNES_PERSONNEL,
      min: 20, fixe: true },
    { cle: "suppleant", titre: "SUPPLÉANTS", colonnes: COLONNES_PERSONNEL,
      min: 3, fixe: true },
    { cle: "malade", titre: "MALADES / CONGÉS DE MATERNITÉ", colonnes: COLONNES_PERSONNEL,
      min: 3, fixe: true }
  ];

  /* --- Récapitulation FR / AR (section H) --- */
  var RECAP = {
    groupes: [
      { cle: "recap_francais", titre: "FRANÇAIS", cles: [
        ["inst_h", "Instituteurs H"], ["inst_f", "Instituteurs F"], ["inst_t", "Total"],
        ["inst_adj_h", "Inst. adjoints H"], ["inst_adj_f", "Inst. adjoints F"],
        ["inst_adj_t", "Total"], ["mc_h", "Maîtres contr. H"],
        ["mc_f", "Maîtres contr. F"], ["mc_t", "Total"]
      ]},
      { cle: "recap_arabe", titre: "ARABE", cles: [
        ["arabe_inst_h", "Instituteurs H"], ["arabe_inst_f", "Instituteurs F"],
        ["arabe_inst_t", "Total"], ["arabe_inst_adj_h", "Inst. adjoints H"],
        ["arabe_inst_adj_f", "Inst. adjoints F"], ["arabe_inst_adj_t", "Total"],
        ["arabe_mc_h", "Maîtres contr. H"], ["arabe_mc_f", "Maîtres contr. F"],
        ["arabe_mc_t", "Total"]
      ]}
    ]
  };

  /* -----------------------------------------------------------------------
     I — EFFECTIFS (6 lignes fixes : CI → CM2)
     ----------------------------------------------------------------------- */
  var EFFECTIFS = {
    groupes: [
      ["eff_ci", "CI"], ["eff_cp", "CP"], ["eff_ce1", "CE1"],
      ["eff_ce2", "CE2"], ["eff_cm1", "CM1"], ["eff_cm2", "CM2"]
    ],
    colonnes: [
      { n: "nb_classes", l: "Nbr classe", t: "num" },
      { n: "eff_g", l: "Effectif G", t: "num", calc: "eff" },
      { n: "eff_f", l: "Effectif F", t: "num", calc: "eff" },
      { n: "eff_t", l: "Effectif T", t: "num", auto: true },
      { n: "red_g", l: "Redoublants G", t: "num", calc: "red" },
      { n: "red_f", l: "Redoublants F", t: "num", calc: "red" },
      { n: "red_t", l: "Redoublants T", t: "num", auto: true },
      { n: "hand_g", l: "Handicapés G", t: "num", calc: "hand" },
      { n: "hand_f", l: "Handicapés F", t: "num", calc: "hand" },
      { n: "hand_t", l: "Handicapés T", t: "num", auto: true },
      { n: "sans_etat_g", l: "Sans état civil G", t: "num", calc: "etat" },
      { n: "sans_etat_f", l: "Sans état civil F", t: "num", calc: "etat" },
      { n: "sans_etat_t", l: "Sans état civil T", t: "num", auto: true }
    ]
  };

  /* -----------------------------------------------------------------------
     J — MOBILIER SCOLAIRE (11 lignes fixes)
     ----------------------------------------------------------------------- */
  var MOBILIER_FORM = {
    lignes: [
      ["mob_tables_bancs", "Tables bancs"],
      ["mob_tables_bureaux", "Tables bureaux Maîtres"],
      ["mob_chaises", "Chaises"],
      ["mob_armoires", "Armoires"],
      ["mob_placards", "Placards"],
      ["mob_tableaux", "Tableaux"],
      ["mob_ordinateurs", "Ordinateurs"],
      ["mob_imprimantes", "Imprimantes"],
      ["mob_video_projecteur", "Vidéo projecteur"],
      ["mob_photocopieuses", "Photocopieuses"],
      ["mob_autres_mobilier", "Autres"]
    ],
    colonnes: [
      { n: "bon", l: "Bon", t: "num" },
      { n: "a_reparer", l: "À réparer", t: "num" },
      { n: "total", l: "Total", t: "num", auto: true },
      { n: "defecat", l: "Défécit", t: "num" }
    ]
  };

  /* -----------------------------------------------------------------------
     K, L, M, N — LISTES DE MANUELS / MATÉRIEL
     K et M : titres fixes du modèle officiel (pas de bouton d'ajout).
     L : 7 lignes libres — N : 4 lignes libres.
     ----------------------------------------------------------------------- */
  var TITRES_MANUELS = [
    "Langue et communication CI", "Guide L C CI", "Mathematiques CI",
    "Guide Mathematiques CI", "Cahier d'exercices mathematiques (PAAME) CI",
    "Manuel de lecture RELIT CI Tome 1", "Manuel de lecture RELIT CI Tome 2",
    "Planche d'alphabetisation",
    "Langue et communication CP", "Guide L C CP", "Mathematiques CP",
    "Guide Mathematiques CP", "Cahier d'exercices mathematiques (PAAME) CP",
    "Cahier d'exercices mathematiques (PAAME) CE1",
    "Cahier d'exercices mathematiques (PAAME) CE2",
    "Langue et communication CM", "Guide L C CM", "Mathematiques CM",
    "Guide Mathematiques CM",
    "Cahier d'exercices mathematiques (PAAME) CM1",
    "Cahier d'exercices mathematiques (PAAME) CM2",
    "Decouvertte du monde CM", "Guide Decouverte du monde CM",
    "Guide revise 1ere etape", "Guide revise 2eme etape"
  ];

  var DESIGNATIONS_MATERIEL = [
    "Equerre", "Rapporteur", "Compas", "Regle plate", "Decametre",
    "Metre pliant", "Balance", "Poids", "Globe Terrestre", "Carte murale",
    "Chaine d'arpenteur", "Cachet", "Encreur", "Seau"
  ];

  var LISTES = [
    { lettre: "K", cle: "manuels", titre: "RECENSESEMENT DES MANUELS",
      colonne_titre: "Titre", min: TITRES_MANUELS.length, fixe: true,
      valeurs: TITRES_MANUELS, soustitre: "Titres officiels du modèle" },
    { lettre: "L", cle: "autre_manuel", titre: "AUTRES MANUELS DISPONIBLES A L'ÉCOLE",
      colonne_titre: "Titre", min: 7, fixe: true,
      soustitre: "7 lignes — titre libre (donnés, prêtés…)" },
    { lettre: "M", cle: "materiel", titre: "RECENSESEMENT DU MATÉRIEL DIDACTIQUE",
      colonne_titre: "Désignation", min: DESIGNATIONS_MATERIEL.length,
      cle_titre: "designation", fixe: true, valeurs: DESIGNATIONS_MATERIEL,
      soustitre: "Désignations officielles du modèle" },
    { lettre: "N", cle: "autre_materiel", titre: "AUTRES MATÉRIEL DISPONIBLE A L'ÉCOLE",
      colonne_titre: "Désignation", min: 4, cle_titre: "designation", fixe: true,
      soustitre: "4 lignes — désignation libre" }
  ];

  var COLONNES_LISTE = [
    { n: "titre", l: "Titre", t: "text", w: "38%" },
    { n: "quantite", l: "Quantité", t: "num", w: "11%" },
    { n: "provenance", l: "Provenance", t: "select", opts: PROVENANCE, w: "15%" },
    { n: "besoins", l: "Besoins", t: "text", w: "11%" },
    { n: "observations", l: "Observations", t: "text", w: "25%" }
  ];

  global.RR_CHAMPS = {
    SECTIONS: SECTIONS,
    PERSONNEL: PERSONNEL,
    RECAP: RECAP,
    EFFECTIFS: EFFECTIFS,
    MOBILIER: MOBILIER_FORM,
    LISTES: LISTES,
    COLONNES_LISTE: COLONNES_LISTE,
    TITRES_MANUELS: TITRES_MANUELS,
    DESIGNATIONS_MATERIEL: DESIGNATIONS_MATERIEL,
    OPTIONS: {
      OUI_NON: OUI_NON, STATUT: STATUT, LANGUE: LANGUE, ETAT: ETAT,
      ELECTRICITE: ELECTRICITE, STATUT_DIR: STATUT_DIR,
      DISCIPLINE: DISCIPLINE, PROVENANCE: PROVENANCE, TYPE_CLASSE: TYPE_CLASSE
    }
  };

}(window));
