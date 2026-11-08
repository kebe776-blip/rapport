/* =========================================================================
   CONFIGURATION DE L'APPLICATION
   GitHub Pages + Supabase — Rapport général de rentrée élémentaire
   -------------------------------------------------------------------------
   AVANT MISE EN LIGNE : renseignez SUPABASE_URL et SUPABASE_ANON_KEY
   (Supabase > Project Settings > API). Le reste est déjà paramétré.
   ========================================================================= */
window.RR_CONFIG = {
  /* --- Année scolaire et en-têtes officiels du rapport --- */
  ANNEE: "2025/2026",
  MINISTERE: "MINISTÈRE DE L'ÉDUCATION NATIONALE",
  INSPECTION: "INSPECTION D'ACADÉMIE DE KAOLACK",
  IEF: "INSPECTION DE L'ÉDUCATION ET DE LA FORMATION DE NIORO DU RIP",

  /* --- Supabase (laisser vide pour fonctionner hors-ligne / en démo) --- */
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  /* --- Logo officiel optionnel : "assets/logo.png" ou "" (bloc LOGO MEN) --- */
  LOGO: "",

  /* --- Clés de stockage local (brouillon hors-ligne + file d'attente) --- */
  LS_BROUILLON: "rr_brouillon_v1",
  LS_FILE: "rr_file_attente_v1",
  LS_SOUIS: "rr_soumissions_v1"
};
