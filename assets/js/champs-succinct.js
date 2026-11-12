/* =========================================================================
   champs-succinct.js — Définition déclarative du « RAPPORT DE SUCCINCT DE
   RENTRÉE » PRÉSCOLAIRE (2 pages : page 1 PAYSAGE, page 2 PORTRAIT).
   Sections A → L relevées sur le modèle officiel.
   Les noms de champs (n) correspondent à l'objet brut enregistré dans la
   colonne `donnees`, ce que buildContext() de rapport-succinct.js attend.
   -------------------------------------------------------------------------
   Fichier DÉDIÉ : form.js et champs.js (rapport général élémentaire) ne
   sont pas modifiés ni chargés par succinct-prescolaire.html.
   ========================================================================= */
(function (global) {
  "use strict";

  /* --- Listes déroulantes (valeurs = clés brutes) --- */
  var OUI_NON = [["", "—"], ["oui", "OUI"], ["non", "NON"]];
  var STATUT_DIR = [["", "—"], ["titulaire", "TITULAIRE"],
                    ["interimaire", "INTÉRIMAIRE"]];

  /* -----------------------------------------------------------------------
     SECTIONS A → C, E, G, H, L (champs simples)
     t : text | num | date | select | area | combo
     req : champ obligatoire   max : longueur maximale (zones libres)
     ----------------------------------------------------------------------- */
  var SECTIONS = [
    {
      lettre: "A", groupe: "identification",
      titre: "IDENTIFICATION DE L'ÉCOLE",
      champs: [
        { n: "nom_ecole", l: "Nom de l'école", t: "combo", req: true, maj: "upper",
          liste: global.RR_ECOLES_PRESCOLAIRE,
          aide: "Tapez pour filtrer, puis choisissez dans la liste fermée des " +
                "écoles préscolaires." },
        { n: "commune", l: "Commune", t: "combo", req: true, maj: "upper",
          liste: global.RR_COMMUNES,
          aide: "Tapez pour filtrer, puis choisissez dans la liste." },
        { n: "arrondissement", l: "Arrondissement", t: "text", maj: "upper" }
      ]
    },
    {
      lettre: "B", groupe: "locaux",
      titre: "SECTIONS ET BÂTIMENTS",
      champs: [
        { n: "nb_sections", l: "Nombre de sections", t: "num" },
        { n: "nb_bat_1cl", l: "Bâtiments de 1 cl", t: "num" },
        { n: "nb_bat_2cl", l: "Bâtiments de 2 cl", t: "num" },
        { n: "nb_bat_3cl", l: "Bâtiments de 3 cl", t: "num" },
        { n: "nb_abris", l: "Nombre d'abris provisoires", t: "num" },
        { n: "nb_cmg", l: "Nombre de CMG", t: "num" },
        { n: "cours_jumeles", l: "Cours jumelés", t: "text", large: true, max: 80,
          aide: "Laisser vide = rien sur le PDF." }
      ]
    },
    {
      lettre: "C", groupe: "directeur",
      titre: "RENSEIGNEMENTS SUR LE DIRECTEUR",
      champs: [
        { n: "prenom_nom", l: "Prénoms, Nom, Matricule et Grade du Directeur",
          t: "text", req: true, maj: "upper", large: true, max: 90 },
        { n: "statut", l: "Statut", t: "select", opts: STATUT_DIR,
          aide: "Titulaire ou Intérimaire (une croix sur le PDF)." },
        { n: "diplome_academique", l: "Diplôme académique", t: "text",
          maj: "upper", max: 60 },
        { n: "diplome_professionnel", l: "Diplôme professionnel", t: "text",
          maj: "upper", max: 60 },
        { n: "contact_orange", l: "Contact Orange", t: "text", tel: true, max: 20 },
        { n: "contact_tigo", l: "Contact Tigo", t: "text", tel: true, max: 20 },
        { n: "contact_expresso", l: "Contact Expresso", t: "text", tel: true, max: 20,
          aide: "Au moins un contact est obligatoire." }
      ]
    },
    {
      lettre: "E", groupe: "situation_locaux",
      titre: "1. SITUATION DES LOCAUX",
      champs: [
        { n: "salles_dur", l: "Salles d'activités en dur (nombre)", t: "num" },
        { n: "salles_abris", l: "Salles d'activités en abris provisoires (nombre)",
          t: "num" },
        { n: "a_rehabiliter", l: "Salles de classes à réhabiliter (nombre)",
          t: "num", aide: "Ne pas compter les abris provisoires." },
        { n: "salles_inoccupees", l: "Nombre de salles inoccupées", t: "num" },
        { n: "motif_inoccupees", l: "Motif", t: "text", large: true, max: 120 },
        { n: "obs_etat", l: "Observations sur l'état des locaux", t: "area",
          large: true, max: 250, aide: "Laisser vide = rien sur le PDF." }
      ]
    },
    {
      lettre: "G", groupe: "eau",
      titre: "2. EAU",
      champs: [
        { n: "robinets_nombre", l: "Robinets — Nombre", t: "num" },
        { n: "robinets_etat", l: "Robinets — Etat", t: "text", max: 60 },
        { n: "puits_nombre", l: "Puits — Nombre", t: "num" },
        { n: "puits_etat", l: "Puits — Etat", t: "text", max: 60 }
      ]
    },
    {
      lettre: "H", groupe: "electricite",
      titre: "3. ELECTRICITÉ",
      champs: [
        { n: "reseau", l: "Réseau", t: "select", opts: OUI_NON },
        { n: "reseau_etat", l: "Si OUI — Etat des installations (réseau)",
          t: "text", max: 80 },
        { n: "plaques", l: "Plaques solaires", t: "select", opts: OUI_NON },
        { n: "plaques_etat", l: "Si OUI — Etat des installations (plaques solaires)",
          t: "text", max: 80 }
      ]
    },
    {
      lettre: "L", groupe: "structure",
      titre: "7 & 8. STRUCTURE ET OBSERVATIONS DU DIRECTEUR",
      champs: [
        { n: "cantine", l: "La structure dispose-t-elle de cantine", t: "select",
          opts: OUI_NON },
        { n: "coop_scol", l: "Coop. Scol", t: "select", opts: OUI_NON },
        { n: "jardin_scolaire", l: "Jardin scolaire", t: "select", opts: OUI_NON },
        { n: "projet_ecole", l: "Projet d'école", t: "select", opts: OUI_NON },
        { n: "observations_directeur", l: "8. Observations du directeur", t: "area",
          large: true, max: 500, aide: "Laisser vide = rien sur le PDF." },
        { n: "fait_a", l: "Fait à", t: "text", max: 60, maj: "upper" },
        { n: "fait_le", l: "Le (date)", t: "date" }
      ]
    }
  ];

  /* -----------------------------------------------------------------------
     D — EFFECTIFS (page 1, tableau 1) : PS / MS / GS / TOTAL × G F T
     + colonnes maître (Prénoms, Nom, Matricule et Grade / Diplômes / Date).
     ----------------------------------------------------------------------- */
  var COLONNES_MAITRE = [
    { n: "m_prenoms", l: "Prénoms, Nom, Matricule et Grade du maître",
      t: "text", w: "27%", max: 90 },
    { n: "m_diplome_acad", l: "Diplôme Académique", t: "text", w: "12%", max: 40 },
    { n: "m_diplome_prof", l: "Diplôme Professionnel", t: "text", w: "12%", max: 40 },
    { n: "m_date_arrivee", l: "Date d'arrivée à l'école", t: "date", w: "12%" }
  ];

  var EFFECTIFS = {
    lettre: "D", groupe: "effectifs",
    titre: "4. SITUATION DES EFFECTIFS",
    colonne_titre: "COURS",
    aide: "Total = G + F par ligne, puis somme des sections (calcul automatique).",
    lignes: [
      ["ps", "Petite Section"],
      ["ms", "Moyenne Section"],
      ["gs", "Grande Section"],
      ["total", "TOTAL"]
    ],
    colonnes_maitre: COLONNES_MAITRE
  };

  /* --- Ligne « handicapés physiques » sous le tableau des effectifs --- */
  var HANDICAPES = { n: "handicapes", l: "Donner les noms des handicapés physiques",
                     t: "text", large: true, max: 200 };

  /* -----------------------------------------------------------------------
     D bis — PERSONNEL (page 1, tableau 2) : 4 lignes fixes, mêmes colonnes
     ----------------------------------------------------------------------- */
  var PERSONNEL = {
    lettre: "D", groupe: "personnel",
    titre: "PERSONNEL (SUPPLÉANTS / ARABE / MALADE / SERVICE)",
    aide: "4 lignes fixes du modèle — laisser vide s'il n'y en a pas.",
    lignes: [
      ["suppleant", "Suppléants"],
      ["arabe", "Maître d'arabe"],
      ["malade", "Malade indéfinible"],
      ["service", "Personnel de service"]
    ],
    colonnes_maitre: COLONNES_MAITRE
  };

  /* -----------------------------------------------------------------------
     F — ÉQUIPEMENTS SCOLAIRES (page 2) : Nombre / Bailleur / Boxes / Obs.
     ----------------------------------------------------------------------- */
  var EQUIPEMENTS = {
    lettre: "F", groupe: "equipements",
    titre: "5. EQUIPEMENTS SCOLAIRES",
    lignes: [
      ["vestiaires", "Vestiaires"],
      ["magasins", "Magasins"],
      ["regimes", "Régimes"],
      ["toilettes", "Toilettes"],
      ["cuisines", "Cuisines"],
      ["locaux", "Locaux"],
      ["autres", "Autres"]
    ],
    colonnes: [
      { n: "nombre", l: "Nombre", t: "num", w: "12%" },
      { n: "bailleur", l: "Bailleur", t: "text", w: "22%", max: 60 },
      { n: "boxes", l: "Nbre de boxes", t: "num", w: "13%", seulement: "toilettes" },
      { n: "observations", l: "Observations", t: "text", w: "43%", max: 90 }
    ]
  };

  /* -----------------------------------------------------------------------
     I — ÉQUIPEMENTS INFORMATIQUES ET AUDIO VISUELS (page 2)
     ----------------------------------------------------------------------- */
  var INFORMATIQUE = {
    lettre: "I", groupe: "informatique",
    titre: "4. EQUIPEMENT INFORMATIQUE ET AUDIO VISUEL",
    lignes: [
      ["ordinateur", "Ordinateur"],
      ["imprimante", "Imprimante"],
      ["magneto", "Magnétophone"],
      ["autres", "Autres"]
    ],
    colonnes: [
      { n: "nombre", l: "Nombre", t: "num", w: "20%" },
      { n: "bailleur", l: "Bailleur", t: "text", w: "80%", max: 60 }
    ]
  };

  /* -----------------------------------------------------------------------
     J — MOBILIER SCOLAIRE (page 2) : 7 lignes fixes
     ----------------------------------------------------------------------- */
  var COLONNES_ETAT = [
    { n: "bon", l: "Bon", t: "num", w: "16%" },
    { n: "a_reparer", l: "À réparer", t: "num", w: "18%" },
    { n: "total", l: "Total", t: "num", w: "16%", auto: true },
    { n: "deficit", l: "Déficit", t: "num", w: "16%" }
  ];

  var MOBILIER = {
    lettre: "J", groupe: "mobilier",
    titre: "5. MOBILIER SCOLAIRE",
    aide: "Total = Bon + À réparer (calcul automatique, modifiable).",
    lignes: [
      ["tables_enfants", "Tables enfants"],
      ["chaises_adultes", "Chaises adultes"],
      ["tables_bureaux", "Tables bureaux"],
      ["tables_eleves", "Tables élèves"],
      ["tables_cadres", "Tables cadres"],
      ["tables_directeur", "Tables de directeur"],
      ["armoires", "Armoires"]
    ],
    colonnes: COLONNES_ETAT
  };

  /* -----------------------------------------------------------------------
     K — ÉQUIPEMENTS ET JEUX (page 2) : 4 lignes fixes
     ----------------------------------------------------------------------- */
  var JEUX = {
    lettre: "K", groupe: "jeux",
    titre: "6. EQUIPEMENT (JEUX)",
    aide: "Total = Bon + À réparer (calcul automatique, modifiable).",
    lignes: [
      ["ballon", "Ballon"],
      ["toboggan", "Toboggan"],
      ["trottinette", "Trottinette"],
      ["autres_jouets", "Autres jouets (à préciser)"]
    ],
    colonnes: COLONNES_ETAT
  };

  /* -----------------------------------------------------------------------
     VALIDATION — saisie minimale (plan validé)
     ----------------------------------------------------------------------- */
  var OBLIGATOIRES = [
    ["identification.nom_ecole", "le nom de l'école"],
    ["identification.commune", "la commune"],
    ["directeur.prenom_nom", "le nom du directeur"]
  ];

  /* Au moins UN de ces contacts doit être renseigné. */
  var CONTACTS = ["directeur.contact_orange", "directeur.contact_tigo",
                  "directeur.contact_expresso"];

  /* Au moins UN maître renseigné sur PS / MS / GS. */
  var MAITRES = ["effectifs.ps.m_prenoms", "effectifs.ms.m_prenoms",
                 "effectifs.gs.m_prenoms"];

  global.RR_CHAMPS_SUCCINCT = {
    SECTIONS: SECTIONS,
    EFFECTIFS: EFFECTIFS,
    HANDICAPES: HANDICAPES,
    PERSONNEL: PERSONNEL,
    EQUIPEMENTS: EQUIPEMENTS,
    INFORMATIQUE: INFORMATIQUE,
    MOBILIER: MOBILIER,
    JEUX: JEUX,
    OBLIGATOIRES: OBLIGATOIRES,
    CONTACTS: CONTACTS,
    MAITRES: MAITRES,
    OPTIONS: { OUI_NON: OUI_NON, STATUT_DIR: STATUT_DIR }
  };

}(window));
