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
    /* Clé d'unicité du rapport : le NOM de l'école uniquement. Le CODEC
       n'entre jamais en compte — plusieurs écoles partagent le même
       CODEC (c'est leur regroupement) et restent des rapports distincts. */
    var nom = donnees && donnees.identification && donnees.identification.nom_ecole;
    return slug(nom || "ECOLE");
  }

  /* ---------- Envoi d'un élément ----------
     On utilise la fonction SQL SECURITY DEFINER `sauver_rapport` plutôt
     qu'un upsert PostgREST : le rôle anon n'a pas de policy SELECT, ce qui
     bloquait ON CONFLICT (erreur 42501) et les mises à jour (0 ligne).
     La RPC contourne ce limité SANS ouvrir la lecture des données. */
  async function envoyer(el) {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var ligne = {
      ecole_code: el.ecole_code,
      ecole_nom: el.ecole_nom || "",
      annee: el.annee || CFG.ANNEE || "2026/2027",
      donnees: el.donnees,
      maj_le: new Date().toISOString()
    };
    var res = await c.rpc("sauver_rapport", {
      p_ecole_code: ligne.ecole_code,
      p_ecole_nom: ligne.ecole_nom,
      p_annee: ligne.annee,
      p_donnees: ligne.donnees
    });
    if (res.error) { throw new Error(res.error.message); }
    ligne.statut = (res.data === "maj") ? "maj" : "insere";
    return ligne;
  }

  /**
   * Vérifie côté serveur si un rapport existe déjà pour cette école.
   * Renvoie null si Supabase est inactif ou si la vérification échoue
   * (on laisse alors la soumission passer normalement).
   */
  async function existe(decodees) {
    var c = sb();
    if (!c) { return null; }
    var res = await c.rpc("rapport_existe", {
      p_ecole_code: codeEcole(decodees),
      p_annee: CFG.ANNEE || "2026/2027"
    });
    if (res.error) { return null; }
    return !!res.data;
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

  /* Lecture complète (champs + `donnees`) — export XLSX de l'Espace
     Inspection. Une seule requête, contrairement à obtenir() par ligne. */
  async function listerComplets() {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var res = await c.from("rapports")
      .select("*")
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

  /* ---------- Suppression (admin authentifié) ----------
     Le rôle `authenticated` possède la policy DELETE : contrairement à
     l'écriture du directeur (qui passe par la RPC SECURITY DEFINER),
     la suppression peut se faire directement en PostgREST. */
  async function supprimer(code) {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var res = await c.from("rapports").delete().eq("ecole_code", code);
    if (res.error) { throw new Error(res.error.message); }
    return true;
  }

  /* ---------- Listes fermées (écoles / CODEC) ----------
     Table `listes` : le directeur (anon) ne peut que LIRE, seule
     l'Inspection authentifiée peut ajouter ou supprimer. */
  var LS_LISTES = "rr_listes_v1";

  /** Forme normalisée : ni accents, ni casse, ni espaces multiples. */
  function normaliserListe(s) {
    return String(s === null || s === undefined ? "" : s)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
      .toUpperCase();
  }

  function trier(arr) {
    arr.sort(function (a, b) { return a.localeCompare(b, "fr"); });
  }

  /* Les tableaux RR_ECOLES / RR_CODECS / RR_COMMUNES sont référencés par
     champs.js : on les MUTATE en place (length = 0 + push), jamais on ne
     les remplace. */
  function poserTableau(arr, items) {
    if (!arr) { return; }
    arr.length = 0;
    for (var i = 0; i < items.length; i++) { arr.push(items[i]); }
    trier(arr);
  }

  /** Type de liste → tableau global correspondant. */
  function tableauDe(type) {
    if (type === "codec") { return global.RR_CODECS; }
    if (type === "commune") { return global.RR_COMMUNES; }
    return global.RR_ECOLES;
  }

  /** Libellé humain du type (messages d'erreur / de confirmation). */
  function libelleDe(type) {
    if (type === "codec") { return "CODEC"; }
    if (type === "commune") { return "communes"; }
    return "écoles";
  }

  function ecrireCache(donnees) {
    try {
      localStorage.setItem(LS_LISTES, JSON.stringify({
        t: Date.now(), ecoles: donnees.ecoles, codecs: donnees.codecs,
        communes: donnees.communes
      }));
    } catch (e) { /* stockage plein : on ignore */ }
  }

  function lireCache() {
    try {
      var s = localStorage.getItem(LS_LISTES);
      if (!s) { return null; }
      var o = JSON.parse(s);
      return (o && o.ecoles && o.ecoles.length) ? o : null;
    } catch (e) { return null; }
  }

  /** Lecture brute des listes (espace Inspection). */
  async function listerListes() {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var res = await c.from("listes").select("type, valeur");
    if (res.error) { throw new Error(res.error.message); }
    var ecoles = [], codecs = [], communes = [];
    (res.data || []).forEach(function (r) {
      if (r.type === "codec") { codecs.push(r.valeur); }
      else if (r.type === "commune") { communes.push(r.valeur); }
      else { ecoles.push(r.valeur); }
    });
    trier(ecoles); trier(codecs); trier(communes);
    return { ecoles: ecoles, codecs: codecs, communes: communes };
  }

  /**
   * Alimente RR_ECOLES / RR_CODECS / RR_COMMUNES pour le formulaire.
   * Repli : serveur → cache localStorage → ecoles.js (déjà en place).
   * Une liste serveur vide est IGNORÉE : on ne bloque jamais le formulaire
   * à cause d'une table mal amorcée.
   */
  async function chargerListes() {
    if (!actif()) { return { source: "fallback" }; }
    var donnees = null;
    try {
      donnees = await listerListes();
    } catch (e) {
      donnees = null;
    }
    if (donnees && donnees.ecoles.length) {
      poserTableau(global.RR_ECOLES, donnees.ecoles);
      poserTableau(global.RR_CODECS, donnees.codecs);
      /* Une liste de communes vide (base non migrée) ne doit jamais
         vider le repli embarqué de ecoles.js. */
      if (donnees.communes.length) {
        poserTableau(global.RR_COMMUNES, donnees.communes);
      }
      ecrireCache(donnees);
      return { source: "serveur", ecoles: donnees.ecoles.length,
               codecs: donnees.codecs.length,
               communes: (donnees.communes || []).length };
    }
    var cache = lireCache();
    if (cache) {
      poserTableau(global.RR_ECOLES, cache.ecoles);
      poserTableau(global.RR_CODECS, cache.codecs || []);
      if (cache.communes && cache.communes.length) {
        poserTableau(global.RR_COMMUNES, cache.communes);
      }
      return { source: "cache", ecoles: cache.ecoles.length,
               codecs: (cache.codecs || []).length,
               communes: (cache.communes || []).length };
    }
    return { source: "fallback", ecoles: (global.RR_ECOLES || []).length,
             codecs: (global.RR_CODECS || []).length,
             communes: (global.RR_COMMUNES || []).length };
  }

  /** Ajoute une valeur (doublon normalisé refusé côté client ET serveur). */
  async function ajouterListe(type, valeur) {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var v = String(valeur === null || valeur === undefined ? "" : valeur)
      .replace(/\s+/g, " ").trim();
    if (!v) { throw new Error("Merci de saisir une valeur."); }
    if (type !== "ecole" && type !== "codec" && type !== "commune") {
      throw new Error("Type de liste inconnu.");
    }
    var cible = tableauDe(type);
    var doublon = (cible || []).some(function (x) {
      return normaliserListe(x) === normaliserListe(v);
    });
    if (doublon) {
      throw new Error("« " + v + " » figure déjà dans la liste des " +
        libelleDe(type) + ".");
    }
    var res = await c.from("listes")
      .insert({ type: type, valeur: v }).select("type, valeur");
    if (res.error) {
      /* Base non migrée (contrainte sans 'commune') : message lisible. */
      if (/check constraint/i.test(res.error.message)) {
        throw new Error("La base Supabase n'accepte pas encore ce type de " +
          "liste : exécutez `supabase/listes.sql` dans le SQL Editor " +
          "(migration « commune »).");
      }
      throw new Error(res.error.message);
    }
    if (!res.data || !res.data.length) {
      throw new Error("Ajout refusé : droits administrateur requis.");
    }
    cible.push(v);
    trier(cible);
    ecrireCache({ ecoles: global.RR_ECOLES, codecs: global.RR_CODECS,
                  communes: global.RR_COMMUNES });
    return v;
  }

  /** Supprime une valeur de la liste (les rapports déjà soumis sont conservés). */
  async function supprimerListe(type, valeur) {
    var c = sb();
    if (!c) { throw new Error("Supabase non configuré"); }
    var res = await c.from("listes")
      .delete().eq("type", type).eq("valeur", valeur).select("valeur");
    if (res.error) { throw new Error(res.error.message); }
    if (!res.data || !res.data.length) {
      throw new Error("Suppression refusée : droits administrateur requis.");
    }
    var cible = tableauDe(type);
    if (cible) {
      for (var i = cible.length - 1; i >= 0; i--) {
        if (cible[i] === valeur) { cible.splice(i, 1); }
      }
    }
    ecrireCache({ ecoles: global.RR_ECOLES, codecs: global.RR_CODECS,
                  communes: global.RR_COMMUNES });
    return true;
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
    existe: existe,
    viderFile: viderFile,
    lister: lister,
    listerComplets: listerComplets,
    obtenir: obtenir,
    supprimer: supprimer,
    listerListes: listerListes,
    chargerListes: chargerListes,
    ajouterListe: ajouterListe,
    supprimerListe: supprimerListe,
    normaliserListe: normaliserListe,
    connexion: connexion,
    deconnexion: deconnexion,
    utilisateur: utilisateur,
    attente: attente
  };

}(window));
