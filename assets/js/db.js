/* =========================================================================
   db.js — Accès Supabase depuis le navigateur
   • Envoi des soumissions (insert / upsert) avec repli hors-ligne :
     si le réseau est absent, la soumission part dans une file locale
     et sera envoyée automatiquement à la prochaine visite.
   • Lecture réservée aux comptes administrateurs authentifiés (RLS).
   ========================================================================= */
(function (global) {
  "use strict";

  var CFG = global.RR_CONFIG || {};
  var client = null;

  function actif() {
    return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY &&
              global.supabase && typeof global.supabase.createClient === "function");
  }

  function sb() {
    if (!actif()) { return null; }
    if (!client) {
      client = global.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
    return client;
  }

  /* ---------- File d'attente hors-ligne ---------- */
  function lireFile() {
    try { return JSON.parse(localStorage.getItem(CFG.LS_FILE) || "[]"); }
    catch (e) { return []; }
  }

  function ecrireFile(liste) {
    try { localStorage.setItem(CFG.LS_FILE, JSON.stringify(liste)); }
    catch (e) { /* stockage plein : on ignore */ }
  }

  function mettreEnFile(element) {
    var liste = lireFile();
    /* une seule entrée par école : la dernière soumission gagne */
    liste = liste.filter(function (x) { return x.ecole_code !== element.ecole_code; });
    liste.push(element);
    ecrireFile(liste);
    return liste.length;
  }

  /* ---------- Clé d'identification de l'école ---------- */
  function slug(s) {
    return String(s || "ECOLE")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "").toUpperCase() || "ECOLE";
  }

  function codeEcole(donnees) {
    var codec = donnees && donnees.identification && donnees.identification.codec;
    var nom = donnees && donnees.identification && donnees.identification.nom_ecole;
    return slug(codec || nom || "ECOLE");
  }

  /* ---------- Envoi d'un élément ---------- */
  async function envoyer(el) {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var ligne = {
      ecole_code: el.ecole_code,
      ecole_nom: el.ecole_nom || "",
      annee: el.annee || CFG.ANNEE || "2025/2026",
      donnees: el.donnees,
      maj_le: new Date().toISOString()
    };
    var res = await c.from("rapports").upsert(ligne, { onConflict: "ecole_code,annee" });
    if (res.error) { throw new Error(res.error.message); }
    return ligne;
  }

  /**
   * Enregistre la soumission : Supabase si possible, sinon file locale.
   * @returns {Promise<{envoye:boolean, horsLigne:boolean, ref:string, message:string}>}
   */
  async function enregistrer(donnees) {
    var code = codeEcole(donnees);
    var nom = (donnees.identification && donnees.identification.nom_ecole) || "";
    var el = { ecole_code: code, ecole_nom: nom.toUpperCase(),
               annee: CFG.ANNEE, donnees: donnees,
               horodatage: new Date().toISOString() };

    if (!actif()) {
      mettreEnFile(el);
      return { envoye: false, horsLigne: true, ref: code,
               message: "Supabase non configuré : la saisie est conservée sur " +
                        "cet appareil." };
    }
    try {
      await envoyer(el);
      return { envoye: true, horsLigne: false, ref: code,
               message: "Rapport enregistré sur le serveur." };
    } catch (e) {
      mettreEnFile(el);
      return { envoye: false, horsLigne: true, ref: code,
               message: "Réseau indisponible — saisie mise en file d'attente " +
                        "et envoi automatique au prochain accès réseau. " +
                        "(" + e.message + ")" };
    }
  }

  /** Renvoie en Supabase tout ce qui était en attente. */
  async function viderFile() {
    var liste = lireFile();
    if (!liste.length || !actif()) { return { reste: liste.length, envoyes: 0 }; }
    var reste = [], envoyes = 0;
    for (var i = 0; i < liste.length; i++) {
      try {
        await envoyer(liste[i]);
        envoyes++;
      } catch (e) {
        reste.push(liste[i]);
      }
    }
    ecrireFile(reste);
    return { reste: reste.length, envoyes: envoyes };
  }

  /* ---------- Lecture (admin authentifié) ---------- */
  async function lister() {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var res = await c.from("rapports")
      .select("ecole_code, ecole_nom, annee, maj_le")
      .order("maj_le", { ascending: false });
    if (res.error) { throw new Error(res.error.message); }
    return res.data || [];
  }

  async function obtenir(code) {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var res = await c.from("rapports")
      .select("*").eq("ecole_code", code).limit(1);
    if (res.error) { throw new Error(res.error.message); }
    return (res.data && res.data[0]) || null;
  }

  /* ---------- Authentification administrateur ---------- */
  async function connexion(email, mdp) {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var res = await c.auth.signInWithPassword({ email: email, password: mdp });
    if (res.error) { throw new Error(res.error.message); }
    return res.data.user;
  }

  async function deconnexion() {
    var c = sb();
    if (c) { await c.auth.signOut(); }
  }

  async function utilisateur() {
    var c = sb();
    if (!c) { return null; }
    var res = await c.auth.getSession();
    return (res.data && res.data.session && res.data.session.user) || null;
  }

  function attente() { return lireFile().length; }

  global.RRdb = {
    actif: actif,
    slug: slug,
    codeEcole: codeEcole,
    enregistrer: enregistrer,
    viderFile: viderFile,
    lister: lister,
    obtenir: obtenir,
    connexion: connexion,
    deconnexion: deconnexion,
    utilisateur: utilisateur,
    attente: attente
  };

}(window));
