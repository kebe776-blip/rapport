/* =========================================================================
   champs-evaluations.js — Définitions déclaratives du « RAPPORT DES
   ÉVALUATIONS » (evaluations.html) — reproduit le modèle officiel :
     • page 1 : identification (IA / IEF / DISTRICT / CODEC / ECOLE /
       ANNEE, pré-remplis depuis config.js), EFFECTIF TOTAL par classe
       CI → CM2, puis 3 matières × 3 statistiques × G / F / T ;
     • page 2 : COMMENTAIRES (4 lignes), PROBLÈMES SOULEVRES (1 → 6),
       SOLUTIONS MISES EN ŒUVRE (1 → 6), signature.
   Les pourcentages et les totaux T sont calculés par le moteur
   (form-evaluations.js) ; le PDF est produit par
   rapport-evaluations.js (registre RR_MODELES["evaluations"]).
   ========================================================================= */
(function (global) {
  "use strict";

  /* --- Classes du modèle (ordre officiel CI → CM2) --- */
  var CLASSES = [
    ["ci", "CI"], ["cp", "CP"], ["ce1", "CE1"],
    ["ce2", "CE2"], ["cm1", "CM1"], ["cm2", "CM2"]
  ];

  /* --- Matières du modèle (bandes pêche du tableau) --- */
  var MATIERES = [
    { cle: "langue", titre: "LANGUE ET COMMUNICATION" },
    { cle: "maths",  titre: "MATHÉMATIQUES" },
    { cle: "ist",    titre: "INITIATION SCIENTIFIQUE ET TECHNOLOGIQUE" }
  ];

  /* --- Statistiques (lignes de chaque matière) ---
      pct : calculé automatiquement = moyenne / composé × 100. */
  var STATS = [
    { cle: "compose", auto: false,
      titre: "NOMBRE D'ÉLÈVES AYANT COMPOSÉ" },
    { cle: "moyenne", auto: false,
      titre: "NOMBRE D'ÉLÈVES AYANT LA MOYENNE" },
    { cle: "pct", auto: true,
      titre: "POURCENTAGE DES ÉLÈVES AYANT LA MOYENNE" }
  ];

  var TRIMESTRES = [["", "—"], ["1", "1er TRIMESTRE"],
                    ["2", "2e TRIMESTRE"], ["3", "3e TRIMESTRE"]];

  /* -----------------------------------------------------------------------
     SECTIONS À CHAMPS SIMPLS (A, B) — C → G sont des tableaux / zones
     construits sur mesure par form-evaluations.js.
     ----------------------------------------------------------------------- */
  var SECTIONS = [
    {
      lettre: "A", groupe: "identification",
      titre: "IDENTIFICATION DE L'ÉCOLE",
      note: "IA, IEF et l'année scolaire sont pré-remplis — modifiables " +
            "si besoin.",
      champs: [
        { n: "nom_ecole", l: "Nom de l'école", t: "combo", req: true,
          maj: "upper", liste: global.RR_ECOLES,
          aide: "Tapez pour filtrer, puis choisissez dans la liste." },
        { n: "codec", l: "CODEC", t: "combo", maj: "upper",
          liste: global.RR_CODECS,
          aide: "Facultatif — s'il est saisi, il doit figer dans la liste." },
        { n: "district", l: "District", t: "text", maj: "upper" },
        { n: "ia", l: "IA — Inspection d'Académie", t: "text", large: true },
        { n: "ief", l: "IEF", t: "text", large: true },
        { n: "annee", l: "Année scolaire", t: "text",
          aide: "Format du modèle : 2026 - 2027" }
      ]
    },
    {
      lettre: "B", groupe: "trimestre",
      titre: "TRIMESTRE CONCERNÉ",
      note: "Le titre du PDF s'adapte : 1er / 2e / 3e TRIMESTRE.",
      champs: [
        { n: "val", l: "Trimestre", t: "select", req: true,
          opts: TRIMESTRES }
      ]
    }
  ];

  var OBLIGATOIRES = [
    ["identification.nom_ecole", "le nom de l'école"],
    ["trimestre.val", "le trimestre"]
  ];

  global.RR_CHAMPS_EVALUATIONS = {
    CLASSES: CLASSES,
    MATIERES: MATIERES,
    STATS: STATS,
    SECTIONS: SECTIONS,
    OBLIGATOIRES: OBLIGATOIRES
  };

}(window));
