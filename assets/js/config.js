/* =========================================================================
   CONFIGURATION DE L'APPLICATION
   GitHub Pages + Supabase — Rapport général de rentrée élémentaire
   -------------------------------------------------------------------------
   AVANT MISE EN LIGNE : renseignez SUPABASE_URL et SUPABASE_ANON_KEY
   (Supabase > Project Settings > API). Le reste est déjà paramétré.
   ========================================================================= */

/* --- ORIGINE UNIQUE ------------------------------------------------------
   La session Supabase est gardée dans localStorage, qui est propre à CHAQUE
   origine : ouvrir le site sur 127.0.0.1 alors qu'on s'est connecté sur
   localhost (ou l'inverse) fait perdre la connexion — la page Analyse
   affiche alors « Accès réservé » et masque toutes les données.
   On redirige donc vers localhost, seule origine de référence. Aucun effet
   sur un domaine public (GitHub Pages) ni sur localhost lui-même. */
if (window.location.hostname === "127.0.0.1") {
  window.location.replace(
    window.location.href.replace("127.0.0.1", "localhost"));
}

window.RR_CONFIG = {
  /* --- Année scolaire et en-têtes officiels du rapport --- */
  ANNEE: "2026/2027",
  MINISTERE: "MINISTÈRE DE L'ÉDUCATION NATIONALE",
  INSPECTION: "INSPECTION D'ACADÉMIE DE KAOLACK",
  IEF: "INSPECTION DE L'ÉDUCATION ET DE LA FORMATION DE KEUR MADIABEL",

  /* --- Types de rapport (Espace Inspection + Analyse par type) ---
     id     : valeur stockée dans la colonne `rapports.type`
     nom    : libellé complet affiché dans les titres
     form   : page du formulaire, "" = formulaire à venir
     pdf    : un gabarit PDF existe pour ce type (Voir / PDF + Modifier)
     xlsx   : l'export XLSX du modèle officiel existe pour ce type
     analyse: la page Analyse sait lire ce type (sinon « en préparation »)
     pages  : nombre de pages du gabarit (libellé du bouton PDF)
     ecoles : tableau des écoles fermées du type (cf. ecoles.js)
     modif  : clé sessionStorage de la reprise « Modifier » (défaut RR_MODIF)
     brouillon : clé localStorage du brouillon de saisie du type
                 (défaut : LS_BROUILLON, la clé élémentaire)
      modele : JS du gabarit DÉDIÉ, chargé à la demande par l'Espace
               Inspection ("" = gabarit de rapport.js, rien à charger)
      analyse_js : JS du module d'analyse DÉDIÉ au type, chargé à la
               demande par analyse.js ("" = moteur élémentaire, inchangé)
      xlsx_js : JS du classeur du modèle officiel du type, chargé à la
               demande par l'Espace Inspection au clic sur « Export
               XLSX » ("" = classeur élémentaire 8 feuilles)
     La page active choisit son type avec ?type=<id> (défaut : le 1er). */
  TYPES: [
    { id: "succinct-prescolaire",  nom: "Rapport succinct de rentrée préscolaire",
      form: "succinct-prescolaire.html", pdf: true, xlsx: true, analyse: true,
      pages: 2, ecoles: "RR_ECOLES_PRESCOLAIRE",
      modif: "RR_MODIF_SUCCINCT",
      brouillon: "rr_brouillon_succinct_prescolaire_v1",
      modele: "assets/js/rapport-succinct.js",
      analyse_js: "assets/js/analyse-succinct.js",
      xlsx_js: "assets/js/xlsx-succinct.js" },
    { id: "succinct-elementaire",  nom: "Rapport succinct de rentrée élémentaire",
      form: "", pdf: false, xlsx: false, analyse: false, pages: 0 },
    { id: "succinct-moyen",        nom: "Rapport succinct de rentrée moyen",
      form: "", pdf: false, xlsx: false, analyse: false, pages: 0 },
    { id: "general-prescolaire",   nom: "Rapport général de rentrée préscolaire",
      form: "general-prescolaire.html", pdf: true, xlsx: false, analyse: false,
      pages: 4, ecoles: "RR_ECOLES_PRESCOLAIRE",
      modif: "RR_MODIF_GENERAL_PRESCOLAIRE",
      brouillon: "rr_brouillon_general_prescolaire_v1",
      modele: "assets/js/rapport-general-prescolaire.js" },
    { id: "general-elementaire",   nom: "Rapport général de rentrée élémentaire",
      form: "general-elementaire.html", pdf: true, xlsx: true, analyse: true,
      pages: 6, ecoles: "RR_ECOLES", modif: "RR_MODIF",
      brouillon: "rr_brouillon_v1" },
    { id: "general-moyen",         nom: "Rapport général de rentrée moyen",
      form: "", pdf: false, xlsx: false, analyse: false, pages: 0 }
  ],
  TYPE_DEFAUT: "general-elementaire",

  /* --- Supabase (laisser vide pour fonctionner hors-ligne sans base) ---
     Projet "Planification" (organisation IEF-Planification)
     Clé anon = publique par design (protégée par les règles RLS) */
  SUPABASE_URL: "https://eiaktsyibkwigmdmfdms.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYWt0c3lpYmt3aWdtZG1mZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNTk1NjksImV4cCI6MjEwOTczNTU2OX0.z9mksIu1ANrXKlkrLsFS0JpLdlaqhgoQhcSW924P1ec",

  /* --- Logo et drapeau de l'en-tête (page 1) --- */
  DRAPEAU: "assets/drapeau.png",      // "" = drapeau dessiné en CSS
  LOGO: "assets/logo_men.png",        // "" = bloc « LOGO MEN »

  /* --- Clés de stockage local (brouillon hors-ligne + file d'attente) ---
     Un brouillon PAR TYPE : la saisie élémentaire et la saisie préscolaire
     ne se marchent jamais dessus. */
  LS_BROUILLON: "rr_brouillon_v1",
  LS_BROUILLON_SUCCINCT_PRESCOLAIRE: "rr_brouillon_succinct_prescolaire_v1",
  LS_BROUILLON_GENERAL_PRESCOLAIRE: "rr_brouillon_general_prescolaire_v1",
  LS_FILE: "rr_file_attente_v1"
};
