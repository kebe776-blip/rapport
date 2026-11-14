/* =========================================================================
   champs-general-prescolaire.js — Définition déclarative du « RAPPORT
   GÉNÉRAL DE RENTRÉE PRÉSCOLAIRE » (sections A → L, 5 pages A4 paysage).
   Libellés relevés verbatim sur le .docx officiel 2024/2025 et confrontés
   aux captures du modèle 2026/2027 (RG 1-5 prescolaire.PNG) :
     • sections K et L (manuels / matériel) : page 5 ajoutée sur demande
       (ancien périmètre A → J, 4 pages) ;
     • colonne « N°Maître » de I : absente des captures → non reprise ;
     • ligne « 2 » de F : artefact de liste Word → rendue sans le numéro.
   Les noms de champs (n) correspondent à l'objet brut enregistré dans la
   colonne `donnees`, ce que buildContext() de rapport-general-prescolaire.js
   attend pour produire le PDF.
   -------------------------------------------------------------------------
   Fichier DÉDIÉ : form.js / champs.js / rapport.js (élémentaire) ne sont
   ni modifiés ni chargés par general-prescolaire.html.
   ========================================================================= */
(function (global) {
  "use strict";

  /* --- Listes déroulantes (valeurs = clés brutes) --- */
  var OUI_NON = [["", "—"], ["oui", "OUI"], ["non", "NON"]];
  var STATUT = [["", "—"], ["public", "PUBLIC"], ["prive", "PRIVÉ"]];
  var ETAT = [["", "—"], ["bon", "BON"], ["acceptable", "ACCEPTABLE"],
              ["mauvais", "MAUVAIS"], ["neant", "NÉANT"]];
  var STATUT_DIR = [["", "—"], ["titulaire", "TITULAIRE"],
                    ["interimaire", "INTÉRIMAIRE"]];
  var DISCIPLINE = [["", "—"], ["francais", "FRANÇAIS"], ["arabe", "ARABE"],
                    ["anglais", "ANGLAIS"]];
  /* Colonne « Type » du tableau I : Simple ou CMG (case à cocher modèle). */
  var TYPE_SECTION = [["", "—"], ["simple", "SIMPLE"], ["cmg", "CMG"]];

  /* -----------------------------------------------------------------------
     SECTIONS A → G (champs simples)
     t : text | num | date | select | area | combo
     req : champ obligatoire
     ----------------------------------------------------------------------- */
  var SECTIONS = [
    {
      lettre: "A", groupe: "identification",
      titre: "IDENTIFICATION DE L'ÉCOLE",
      champs: [
        { n: "nom_ecole", l: "Nom de l'établissement", t: "combo", req: true,
          maj: "upper", liste: global.RR_ECOLES_PRESCOLAIRE,
          aide: "Tapez pour filtrer, puis choisissez dans la liste fermée des " +
                "écoles préscolaires." },
        { n: "statut", l: "Statut", t: "select", opts: STATUT },
        { n: "date_creation", l: "Date de création", t: "text", aide: "Ex. 1998" },
        { n: "commune", l: "Commune", t: "combo", maj: "upper",
          liste: global.RR_COMMUNES,
          aide: "Tapez pour filtrer, puis choisissez dans la liste." },
        { n: "district", l: "District", t: "text", maj: "upper" },
        { n: "codec", l: "CODEC", t: "combo", maj: "upper",
          liste: global.RR_CODECS,
          aide: "Facultatif et non imprimé sur le PDF — il sert au " +
                "regroupement dans l'Analyse." }
      ]
    },
    {
      lettre: "B", groupe: "classes_pedagogiques",
      titre: "SITUATION DES CLASSES PÉDAGOGIQUES",
      champs: [
        { n: "nb_sections", l: "Nombre de Sections", t: "num" },
        { n: "nb_classes_simples", l: "Nombre de classes simples", t: "num" },
        { n: "nb_cmg", l: "Nombre de CMG", t: "num" },
        { n: "sections_jumeles", l: "Préciser les sections jumelées", t: "text",
          large: true, aide: "Ex. PS/MS — laisser vide si aucune" }
      ]
    },
    {
      lettre: "C", groupe: "classes_physiques",
      titre: "SITUATION DES CLASSES PHYSIQUE",
      note: "Nombre de salles de classe construites par bailleur : " +
            "(ne pas mettre de croix — préciser le nombre de classes).",
      champs: [
        { n: "salles_etat", l: "Salles en dur — ETAT (État)", t: "num",
          somme: "salles_total" },
        { n: "salles_anctp", l: "Salles en dur — ANCTP", t: "num",
          somme: "salles_total" },
        { n: "salles_com", l: "Salles en dur — COM. (Commune)", t: "num",
          somme: "salles_total" },
        { n: "salles_plan", l: "Salles en dur — PLAN", t: "num",
          somme: "salles_total" },
        { n: "salles_prive", l: "Salles en dur — PRIVE", t: "num",
          somme: "salles_total" },
        { n: "salles_ape", l: "Salles en dur — APE", t: "num",
          somme: "salles_total" },
        { n: "salles_total", l: "Total des salles de classe en dur", t: "num",
          auto: true, aide: "Calculé automatiquement (somme des 6 colonnes)." },
        { n: "abris_provisoires", l: "Abris provisoires", t: "num" },
        { n: "a_rehabiliter", l: "À réhabiliter", t: "num" },
        { n: "classes_construction",
          l: "Nombre de classes en cours de construction ou inachevées",
          t: "num" },
        { n: "programme_construction",
          l: "Programme et année (classes en cours / inachevées)", t: "text",
          large: true, aide: "Laisser vide = rien sur le PDF" }
      ]
    },
    {
      lettre: "D", groupe: "directeur",
      titre: "RENSEIGNEMENTS SUR LE DIRECTEUR",
      champs: [
        { n: "prenom_nom", l: "Prénom et Noms", t: "text", req: true,
          maj: "upper" },
        { n: "grade", l: "Grade", t: "text", aide: "Ex. IP/3" },
        { n: "matricule", l: "Matricule", t: "text" },
        { n: "date_naissance", l: "Date de naissance", t: "date" },
        { n: "lieu_naissance", l: "Lieu de naissance", t: "text", maj: "upper" },
        { n: "diplome_academique", l: "Diplôme académique", t: "text",
          maj: "upper" },
        { n: "diplome_professionnel", l: "Diplôme professionnel", t: "text",
          maj: "upper" },
        { n: "date_entree_enseignement", l: "Date d'entrée dans l'enseignement",
          t: "date" },
        { n: "date_affectation", l: "Date d'affectation à l'école", t: "date" },
        { n: "references_affectation", l: "Références de l'acte d'affectation",
          t: "text", large: true },
        { n: "statut_directeur", l: "Statut (Titulaire ou Intérimaire)",
          t: "select", opts: STATUT_DIR },
        { n: "position", l: "Position — Chargé (Titulaire de classe)",
          t: "select", opts: OUI_NON },
        { n: "decharge", l: "Position — Déchargé", t: "select", opts: OUI_NON },
        { n: "telephone1", l: "Numéro de contact", t: "text", req: true,
          tel: true },
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
        { n: "cabines_non_fonctionnelles", l: "Cabines non fonctionnelles",
          t: "num" },
        { n: "cabines_adaptees", l: "Cabines adaptées", t: "num" },
        { n: "cabines_non_adaptees", l: "Cabines non adaptées", t: "num" },
        { n: "bailleur_toilettes", l: "Bailleur (toilettes)", t: "text" },
        { n: "point_eau", l: "Existence d'un point d'eau", t: "select",
          opts: OUI_NON },
        { n: "robinet", l: "Robinet", t: "select", opts: OUI_NON },
        { n: "etat_robinet", l: "Etat (robinet)", t: "select", opts: ETAT },
        { n: "bailleur_robinet", l: "Bailleur (robinet)", t: "text" },
        { n: "puits", l: "Puits", t: "select", opts: OUI_NON },
        { n: "etat_puits", l: "Etat (puits)", t: "select", opts: ETAT },
        { n: "bailleur_puits", l: "Bailleur (puits)", t: "text" },
        { n: "senelec", l: "Senelec", t: "select", opts: OUI_NON },
        { n: "etat_senelec", l: "Etat des installations (Senelec)", t: "select",
          opts: ETAT },
        { n: "plaques_solaires", l: "Plaques solaires", t: "select",
          opts: OUI_NON },
        { n: "etat_plaques_solaires", l: "Etat des installations (plaques solaires)",
          t: "select", opts: ETAT },
        { n: "bloc_admin", l: "Bloc administratif", t: "select", opts: OUI_NON },
        { n: "bailleur_bloc_admin", l: "Bailleur (bloc administratif)",
          t: "text" },
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
      note: "La structure dispose-t-elle :",
      champs: [
        { n: "cantine", l: "d'une cantine scolaire ?", t: "select",
          opts: OUI_NON },
        { n: "bailleur_cantine", l: "Bailleur (cantine)", t: "text" },
        { n: "cooperative", l: "d'une coopérative scolaire ?", t: "select",
          opts: OUI_NON },
        { n: "mallette_pedagogique", l: "d'une mallette pédagogique ?",
          t: "select", opts: OUI_NON },
        { n: "bibliotheque", l: "d'une bibliothèque ?", t: "select",
          opts: OUI_NON },
        { n: "boite_pharmacie", l: "d'une boite pharmacie ?", t: "select",
          opts: OUI_NON }
      ]
    },
    {
      lettre: "G", groupe: "observations",
      titre: "OBSERVATIONS DU DIRECTEUR",
      champs: [
        { n: "obs_materiel", l: "1 — Sur le plan matériel", t: "area",
          large: true, aide: "Laisser vide = R.A.S" },
        { n: "obs_personnel", l: "2 — Sur le plan du personnel", t: "area",
          large: true, aide: "Laisser vide = R.A.S" },
        { n: "obs_pedagogique", l: "3 — Sur le plan pédagogique", t: "area",
          large: true, aide: "Laisser vide = R.A.S" }
      ]
    }
  ];

  /* -----------------------------------------------------------------------
     H — PERSONNEL (page 3 du modèle)
     Enseignant : 10 lignes (colonne « Section tenue »).
     Malades / congé de maternité : 2 lignes.
     Personnel de service : 5 lignes (Prénoms, Noms, N° CNI, Date
     d'affectation, Employeur).
     ----------------------------------------------------------------------- */
  var COLONNES_PERSONNEL = [
    { n: "prenom", l: "Prénom", t: "text", maj: "upper", w: "10%" },
    { n: "nom", l: "Nom", t: "text", maj: "upper", w: "10%" },
    { n: "grade", l: "Grade", t: "text", w: "7%" },
    { n: "matricule", l: "Matricule", t: "text", w: "9%" },
    { n: "discipline", l: "Discipline", t: "select", opts: DISCIPLINE, w: "9%" },
    { n: "diplome_acad", l: "Dipl. acad.", t: "text", w: "8%" },
    { n: "diplome_prof", l: "Dipl. prof.", t: "text", w: "8%" },
    { n: "date_entree", l: "Date entrée ens.", t: "date", w: "9%" },
    { n: "date_affectation", l: "Date affectation", t: "date", w: "9%" },
    { n: "section_tenu", l: "Section tenue", t: "text", w: "9%" },
    { n: "contact", l: "Contact", t: "text", tel: true, w: "12%" }
  ];

  var COLONNES_SERVICE = [
    { n: "prenoms", l: "Prénoms", t: "text", maj: "upper", w: "24%" },
    { n: "noms", l: "Noms", t: "text", maj: "upper", w: "24%" },
    { n: "cni", l: "N° CNI", t: "text", w: "18%" },
    { n: "date_affectation", l: "Date affectation", t: "date", w: "16%" },
    { n: "employeur", l: "Employeur", t: "text", w: "18%" }
  ];

  var PERSONNEL = [
    { cle: "enseignant", lettre: "H",
      titre: "SITUATION DU PERSONNEL ENSEIGNANT",
      soustitre: "10 lignes — le Directeur fait partie du personnel " +
                 "enseignant (inscrire en première ligne)",
      colonnes: COLONNES_PERSONNEL, min: 10, fixe: true },
    { cle: "malade", lettre: "",
      titre: "MALADES / CONGÉ DE MATERNITÉ",
      soustitre: "2 lignes — laisser vide s'il n'y en a pas",
      colonnes: COLONNES_PERSONNEL, min: 2, fixe: true },
    { cle: "service", lettre: "",
      titre: "PERSONNEL DE SERVICE",
      soustitre: "5 lignes — laisser vide s'il n'y en a pas",
      colonnes: COLONNES_SERVICE, min: 5, fixe: true }
  ];

  /* --- Récapitulation FR / AR (page 3, identique à l'élémentaire) --- */
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
     I — EFFECTIFS (page 4) : 10 lignes de SECTIONS libres (le libellé est
     saisi librement : PS, MS, GS… selon la section), 3 groupes G / F / T,
     colonne « Type : Simple / CMG », puis ligne TOTAL (calculée).
     Pas de colonne « N°Maître » : absente du modèle 2026/2027 (captures).
     ----------------------------------------------------------------------- */
  var EFFECTIFS = {
    lettre: "I", groupe: "effectifs",
    titre: "SITUATION DES EFFECTIFS",
    nb_lignes: 10,
    aide: "Sections libres (PS, MS, GS…) — Total (T) = G + F par ligne, " +
          "la ligne TOTAL additionne les 10 lignes.",
    groupes: [
      ["eff", "EFFECTIF"],
      ["hand", "HANDICAPÉ"],
      ["sec", "Nbre d'élèves qui n'ont pas de pièces d'état civil"]
    ],
    colonnes: [
      { n: "eff_g", l: "G", calc: "eff" },
      { n: "eff_f", l: "F", calc: "eff" },
      { n: "eff_t", l: "T", auto: true },
      { n: "hand_g", l: "G", calc: "hand" },
      { n: "hand_f", l: "F", calc: "hand" },
      { n: "hand_t", l: "T", auto: true },
      { n: "sec_g", l: "G", calc: "sec" },
      { n: "sec_f", l: "F", calc: "sec" },
      { n: "sec_t", l: "T", auto: true }
    ],
    type_colonne: { n: "type", l: "Type : Simple/  /CMG", opts: TYPE_SECTION }
  };

  /* -----------------------------------------------------------------------
     J — MOBLIERS (page 4) : 16 lignes fixes du modèle officiel.
     ----------------------------------------------------------------------- */
  var MOBILIER = {
    lettre: "J", groupe: "mobilier",
    titre: "MOBLIERS",
    aide: "Total = Bon + A réparer (calcul automatique, modifiable).",
    lignes: [
      ["mob_tables_bancs", "Tables bancs"],
      ["mob_tables_bureaux_maitres", "Tables bureaux Maîtres"],
      ["mob_tables_eleves", "Tables élèves"],
      ["mob_chaises_maitres", "Chaises Maîtres"],
      ["mob_chaises_eleves", "Chaises Elèves"],
      ["mob_armoires", "Armoires"],
      ["mob_placards", "Placards"],
      ["mob_tableaux", "Tableaux"],
      ["mob_ordinateurs", "Ordinateurs"],
      ["mob_imprimantes", "Imprimantes"],
      ["mob_televiseur", "Téléviseur"],
      ["mob_video_projecteur", "Vidéo projecteur"],
      ["mob_photocopieuses", "Photocopieuses"],
      ["mob_internet", "Internet"],
      ["mob_balancoire", "Balançoire"],
      ["mob_toboggan", "Toboggan"]
    ],
    colonnes: [
      { n: "bon", l: "Bon", t: "num" },
      { n: "a_reparer", l: "A réparer", t: "num" },
      { n: "total", l: "Total", t: "num", auto: true },
      { n: "deficit", l: "Déficit", t: "num" }
    ]
  };

  /* -----------------------------------------------------------------------
     K / L — RECENSEMENTS (page 5) : tableaux à lignes libres, sans colonne
     N° (absente du modèle). Libellés verbatim du .docx :
       K « RECENSEMENT DES MANUELS »  → Provenances (pluriel)
       L « RECENSEMENT DU MATERIEL »   → Provenance (singulier)
     ----------------------------------------------------------------------- */
  var COLONNES_RECENSEMENT = [
    { n: "designation", l: "Désignation", t: "text", w: "28%" },
    { n: "quantite", l: "Quantité", t: "num", w: "11%" },
    { n: "provenance", l: "Provenance", t: "text", w: "16%" },
    { n: "besoins", l: "Besoins", t: "text", w: "16%" },
    { n: "observations", l: "Observations", t: "text", w: "29%" }
  ];

  /** Colonnes du recensement — libellé de la colonne 3 repris verbatim
   *  du .docx : « Provenances » (K, manuels) / « Provenance » (L, matériel). */
  function colonnesRecensement(libelleProvenance) {
    return COLONNES_RECENSEMENT.map(function (c) {
      if (c.n !== "provenance") { return c; }
      return { n: c.n, l: libelleProvenance, t: c.t, w: c.w };
    });
  }

  var RECENSEMENTS = [
    { cle: "manuels", lettre: "K", sansNum: true,
      titre: "RECENSEMENT DES MANUELS",
      soustitre: "10 lignes — laisser vide s'il n'y en a pas",
      colonnes: colonnesRecensement("Provenances"),
      min: 10, fixe: true },
    { cle: "materiel", lettre: "L", sansNum: true,
      titre: "RECENSEMENT DU MATERIEL",
      soustitre: "14 lignes — laisser vide s'il n'y en a pas",
      colonnes: colonnesRecensement("Provenance"),
      min: 14, fixe: true }
  ];

  /* -----------------------------------------------------------------------
     VALIDATION — saisie minimale
     ----------------------------------------------------------------------- */
  var OBLIGATOIRES = [
    ["identification.nom_ecole", "le nom de l'école"],
    ["directeur.prenom_nom", "le nom du directeur"],
    ["directeur.telephone1", "le numéro de contact du directeur"]
  ];

  global.RR_CHAMPS_GENERAL_PRESCOLAIRE = {
    SECTIONS: SECTIONS,
    PERSONNEL: PERSONNEL,
    COLONNES_SERVICE: COLONNES_SERVICE,
    RECAP: RECAP,
    EFFECTIFS: EFFECTIFS,
    MOBILIER: MOBILIER,
    RECENSEMENTS: RECENSEMENTS,
    OBLIGATOIRES: OBLIGATOIRES,
    OPTIONS: {
      OUI_NON: OUI_NON, STATUT: STATUT, ETAT: ETAT,
      STATUT_DIR: STATUT_DIR, DISCIPLINE: DISCIPLINE,
      TYPE_SECTION: TYPE_SECTION
    }
  };

}(window));
