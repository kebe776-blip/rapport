/* =========================================================================
   CONFIGURATION DE L'APPLICATION
   GitHub Pages + Supabase — Rapport général de rentrée élémentaire
   -------------------------------------------------------------------------
   AVANT MISE EN LIGNE : renseignez SUPABASE_URL et SUPABASE_ANON_KEY
   (Supabase > Project Settings > API). Le reste est déjà paramétré.
   ========================================================================= */
window.RR_CONFIG = {
  /* --- Année scolaire et en-têtes officiels du rapport --- */
  ANNEE: "2026/2027",
  MINISTERE: "MINISTÈRE DE L'ÉDUCATION NATIONALE",
  INSPECTION: "INSPECTION D'ACADÉMIE DE KAOLACK",
  IEF: "INSPECTION DE L'ÉDUCATION ET DE LA FORMATION DE KEUR MADIABEL",

  /* --- Supabase (laisser vide pour fonctionner hors-ligne sans base) ---
     Projet "Planification" (organisation IEF-Planification)
     Clé anon = publique par design (protégée par les règles RLS) */
  SUPABASE_URL: "https://eiaktsyibkwigmdmfdms.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYWt0c3lpYmt3aWdtZG1mZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNTk1NjksImV4cCI6MjEwOTczNTU2OX0.z9mksIu1ANrXKlkrLsFS0JpLdlaqhgoQhcSW924P1ec",

  /* --- Logo et drapeau de l'en-tête (page 1) --- */
  DRAPEAU: "assets/drapeau.png",      // "" = drapeau dessiné en CSS
  LOGO: "assets/logo_men.png",        // "" = bloc « LOGO MEN »

  /* --- Clés de stockage local (brouillon hors-ligne + file d'attente) --- */
  LS_BROUILLON: "rr_brouillon_v1",
  LS_FILE: "rr_file_attente_v1"
};
