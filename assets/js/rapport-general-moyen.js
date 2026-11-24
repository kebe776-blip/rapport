/* =========================================================================
   rapport-general-moyen.js — Gabarit HTML du « RAPPORT GÉNÉRAL DE RENTRÉE
   — ENSEIGNEMENT MOYEN & SECONDAIRE » : EXACTEMENT 11 PAGES.
     • pages 1, 2, 3, 5, 11 : A4 PORTRAIT (210 x 297 mm, marges 0)
     • pages 4, 6, 7, 8, 9, 10 : A4 PAYSAGE (297 x 210 mm, marges 0)
     • feuille 6 (personnel administratif, 52 lignes) : pages 6 et 7
       (26 + 26 lignes, en-tête répété) ;
     • feuille 7 (personnel enseignant, 69 lignes) : pages 8, 9 et 10
       (23 + 23 + 23 lignes, en-tête répété).
   Le module est AUTONOME : il ne dépend ni de champs.js ni de form.js et
   se déclare dans RR_MODELES["general-moyen"] pour l'Espace Inspection,
   apercu.html et le formulaire. rapport.js n'est pas modifié.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR = global.RR || {};
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc || function (s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  var TYPE = "general-moyen";
  var MAX_ADMIN = 52;
  var MAX_ENSEIGNANT = 69;
  var ADMIN_PAR_PAGE = 26;
  var ENS_PAR_PAGE = 23;

  var TITRES = [
    "Page d'entrée — identification, effectifs, CGE, PE et chef d'établissement",
    "Structures & équipements — locaux, matériels, manuels et supports",
    "Situation TICE — compétences, partenaires et financements",
    "Effectifs élèves — classes, effectifs, passants, redoublants et LV2",
    "Résultats examens — BFEM, baccalauréat et mentions",
    "Personnel administratif — lignes 1 à 26",
    "Personnel administratif — lignes 27 à 52",
    "Personnel enseignant — lignes 1 à 23",
    "Personnel enseignant — lignes 24 à 46",
    "Personnel enseignant — lignes 47 à 69",
    "Observations du chef d'établissement"
  ];

  var ORIENTATIONS = [
    "portrait", "portrait", "portrait", "landscape", "portrait",
    "landscape", "landscape", "landscape", "landscape", "landscape",
    "portrait"
  ];

  /* Noms EXACTS des feuilles du classeur officiel, repris au pied de page. */
  var FEUILLES = [
    "1 - PAGE D'ENTRÉE",
    "2 - STRUCTURES & EQUIPEMENTS",
    "3 - SITUATION TICE",
    "4 - EFFECTIFS ELEVES",
    "5 - RÉSULTATS EXAMENS",
    "6 - PERSONNEL ADMINISTRATIF",
    "6 - PERSONNEL ADMINISTRATIF",
    "7 - PERSONNEL ENSEIGNANT",
    "7 - PERSONNEL ENSEIGNANT",
    "7 - PERSONNEL ENSEIGNANT",
    "8 - OBSERVATIONS CHEF D'ETAB"
  ];

  /* -----------------------------------------------------------------------
     LISTES OFFICIELLES (reprises du modèle Excel, sans dépendance)
     ----------------------------------------------------------------------- */
  var PERSONNELS_LABELS = [
    "Personnel administratif (Chef d'étab; SG; Surv; Gest.)",
    "Personnel enseignant titulaire",
    "Personnel enseignant vacataire ou contractuel",
    "Personnel technique (technicien informatique, autre)",
    "Personnel de service (ménage, gardien …)"
  ];

  var ELEVES_LABELS = [
    "6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale"
  ];

  var CELLULES = [
    ["all", "ALL"], ["ang", "ANG"], ["arabe", "Arabe"], ["efs", "EFS"],
    ["esp", "ESP"], ["fr", "FR"], ["hg", "HG"], ["math", "MATH"],
    ["philo", "Philo"], ["port", "PORT"], ["russ", "RUSS"], ["sp", "SP"],
    ["svt", "SVT"], ["techno", "Techno"]
  ];

  var CLUBS = [
    ["tic", "Club TIC"], ["sciences", "Club sciences"],
    ["autres", "Autres Org/Clubs"], ["ovds", "OVDS"], ["clap", "CLAP"]
  ];

  var SALLES_LABELS = [
    "Salles de classe physiques",
    "Bureaux (salles) administratifs / de secrétariat",
    "Salles de professeurs",
    "Salle bibliothèque",
    "Salles spécialisées",
    "Salle informatique ou pouvant en tenir lieu ?",
    "Tables - bancs"
  ];

  var EQUIPEMENTS_LABELS = [
    "Ordinateurs de bureau (desk-top)",
    "Ordinateurs portables",
    "Imprimante laser",
    "Imprimante Jet d'encre",
    "Videoprojecteur",
    "Photocopieuse",
    "Risographe",
    "Scanner",
    "Caméra numérique",
    "Webcam"
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

  var SUPPORTS_LABELS = [
    ["texte", "Text"], ["video", "Vidéo"], ["interactif", "Interactif"]
  ];

  var TICE_GROUPES = [
    ["Personnel enseignant", 0],
    ["Personnel administratif", 1]
  ];

  var TICE_COMPETENCES = [
    "MS Word", "MS Excel", "MS Power Point", "Navigation Internet",
    "Messagerie", "TICE"
  ];

  var TICE_NIVEAUX = ["aucun", "faible", "moyen", "avance"];
  var TICE_NIVEAUX_LABELS = ["Aucun", "Faible", "Moyen", "Avancé"];

  var FINANCEMENTS = [
    ["ministere", "Ministère"],
    ["partenaires_dev", "Partenaires au développement"],
    ["cotisations", "Cotisations élèves"],
    ["prives", "Partenaires privés"]
  ];

  var EFFECTIFS_COLONNES = [
    { n: "sixieme", l: "6ème", g: "moyen" },
    { n: "cinquieme", l: "5ème", g: "moyen" },
    { n: "quatrieme", l: "4ème", g: "moyen" },
    { n: "troisieme", l: "3ème", g: "moyen" },
    { n: "seconde_l", l: "Littéraire", g: "seconde" },
    { n: "seconde_s", l: "Scientif.", g: "seconde" },
    { n: "premiere_l1", l: "L1", g: "premiere" },
    { n: "premiere_l2", l: "L2", g: "premiere" },
    { n: "premiere_lp", l: "L Prime", g: "premiere" },
    { n: "premiere_s1", l: "S1", g: "premiere" },
    { n: "premiere_s2", l: "S2", g: "premiere" },
    { n: "terminale_l1", l: "L1", g: "terminale" },
    { n: "terminale_l2", l: "L2", g: "terminale" },
    { n: "terminale_lp", l: "L Prime", g: "terminale" },
    { n: "terminale_s1", l: "S1", g: "terminale" },
    { n: "terminale_s2", l: "S2", g: "terminale" }
  ];

  var EFFECTIFS_GROUPES = [
    { cle: "moyen", l: "ENSEIGNEMENT MOYEN" },
    { cle: "seconde", l: "SECONDE" },
    { cle: "premiere", l: "PREMIÈRE" },
    { cle: "terminale", l: "TERMINALE" }
  ];

  var LV2_LANGUES = [
    ["allemand", "Allemand"], ["arabe", "Arabe"], ["espagnol", "Espagnol"],
    ["italien", "Italien"], ["portugais", "Portuguais"], ["russe", "Russe"]
  ];

  var BAC_SERIES = [
    ["l1", "L1"], ["l2", "L2"], ["lp", "L Prime"],
    ["s1", "S1"], ["s2", "S2"]
  ];

  var EXAM_COLS = [
    "ins_g", "ins_f", "pres_g", "pres_f", "pres_t",
    "adm1_g", "adm1_f", "adm2_g", "adm2_f",
    "adm_t_g", "adm_t_f", "adm_t", "pct_g", "pct_f", "pct_etab"
  ];

  /* -----------------------------------------------------------------------
     AIDE-MÉMOIRE DE LECTURE / AFFICHAGE
     ----------------------------------------------------------------------- */
  function g(obj, chemin, defaut) {
    var parties = String(chemin || "").split(".");
    var o = obj;
    for (var i = 0; i < parties.length; i++) {
      if (o === null || o === undefined) { return defaut; }
      o = o[parties[i]];
    }
    return (o === undefined || o === null) ? defaut : o;
  }

  function n(v) {
    var x = parseFloat(String(v === null || v === undefined ? "" : v)
      .replace(/\s/g, "").replace(",", "."));
    return isNaN(x) ? 0 : x;
  }

  function entier(v) { return Math.round(n(v)); }

  function txt(v) {
    return String(v === null || v === undefined ? "" : v).replace(/\s+/g, " ").trim();
  }

  function maj(v) { return txt(v).toUpperCase(); }

  function escAff(v) { return esc(txt(v)); }

  function vide(v) {
    var s = txt(v);
    return s === "" ? "&nbsp;" : esc(s);
  }

  function nz(v) {
    var x = entier(v);
    return x ? String(x) : "&nbsp;";
  }

  function zero(v) {
    return entier(v) === 0 ? "" : String(entier(v));
  }

  function oui(v) {
    if (v === true || v === 1) { return "OUI"; }
    var s = txt(v).toLowerCase();
    if (s === "oui" || s === "true" || s === "1") { return "OUI"; }
    if (s === "non" || s === "false" || s === "0") { return "NON"; }
    return "";
  }

  function estOui(v) {
    return oui(v) === "OUI";
  }

  function croix(v) {
    return '<span class="gm-cb' + (estOui(v) ? " on" : "") + '">' +
      (estOui(v) ? "X" : "&nbsp;") + "</span>";
  }

  function sexe(v) {
    var s = txt(v).toLowerCase();
    if (s === "m" || s === "masculin") { return "M"; }
    if (s === "f" || s === "feminin" || s === "féminin") { return "F"; }
    return txt(v).toUpperCase();
  }

  function dateFr(v) {
    var s = txt(v);
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) { return m[3] + "/" + m[2] + "/" + m[1]; }
    return s;
  }

  function pct(num, den) {
    if (!den) { return ""; }
    return String(Math.round(num / den * 1000) / 10).replace(".", ",");
  }

  function dateCGE(c) {
    var jj = txt(c.date_jj), mm = txt(c.date_mm), an = txt(c.date_annee);
    if (!jj && !mm && !an) { return ""; }
    return (jj || "..") + "/" + (mm || "..") + "/" + (an || "....");
  }

  function statutLabel(v) {
    var s = txt(v).toLowerCase();
    if (s === "public") { return "PUBLIC"; }
    if (s === "prive" || s === "privé") { return "PRIVÉ"; }
    return maj(v);
  }

  function typeLabel(v) {
    var s = txt(v).toLowerCase();
    if (s === "cem") { return "CEM"; }
    if (s === "cfa") { return "CFA"; }
    if (s === "lycee" || s === "lycée") { return "LYCÉE"; }
    if (s === "lfa") { return "LFA"; }
    if (s === "bst") { return "BST"; }
    return maj(v);
  }

  function telLabel(v) {
    var s = txt(v).toLowerCase();
    if (s === "neant" || s === "néant") { return "NÉANT"; }
    if (s === "fixe") { return "FIXE"; }
    if (s === "mobile") { return "MOBILE"; }
    if (s === "cdma") { return "CDMA"; }
    return maj(v);
  }

  function netLabel(v) {
    var s = txt(v).toLowerCase();
    if (s === "neant" || s === "néant") { return "NÉANT"; }
    if (s === "wifi") { return "WIFI"; }
    if (s === "adsl") { return "ADSL"; }
    return maj(v);
  }

  function supportLabel(v) {
    var s = txt(v).toLowerCase();
    if (s === "neant" || s === "néant") { return "NÉANT"; }
    if (s === "1a3") { return "1 À 3 TITRES"; }
    if (s === "4plus") { return "4+ TITRES"; }
    return maj(v);
  }

  /* -----------------------------------------------------------------------
     TABLEAUX LIBELLÉ / VALEUR
     ----------------------------------------------------------------------- */
  function kvRows(items) {
    var out = "", i = 0;
    while (i < items.length) {
      var it = items[i];
      if (it.full) {
        out += '<tr><td class="kv-l">' + esc(it.l) + "</td>" +
          '<td class="kv-v" colspan="3">' + (it.v || "&nbsp;") + "</td></tr>";
        i++;
        continue;
      }
      var a = items[i];
      var b = (i + 1 < items.length && !items[i + 1].full) ? items[i + 1] : null;
      out += "<tr><td class=\"kv-l\">" + esc(a.l) + "</td>" +
        '<td class="kv-v">' + (a.v || "&nbsp;") + "</td>";
      if (b) {
        out += '<td class="kv-l">' + esc(b.l) + "</td>" +
          '<td class="kv-v">' + (b.v || "&nbsp;") + "</td>";
        i += 2;
      } else {
        out += '<td class="kv-l">&nbsp;</td><td class="kv-v">&nbsp;</td>';
        i++;
      }
      out += "</tr>";
    }
    return out;
  }

  function kvTable(items, style) {
    return '<table class="gm-kv"' + (style ? ' style="' + style + '"' : "") +
      ">" + kvRows(items) + "</table>";
  }

  /* Table libellé / valeur sur une seule colonne (fiche d'identification). */
  function kv2Table(items) {
    var out = '<table class="gm-kv gm-kv2"><tbody>';
    items.forEach(function (it) {
      out += '<tr><td class="kv-l">' + esc(it.l) + '</td>' +
        '<td class="kv-v">' + (it.v || "&nbsp;") + "</td></tr>";
    });
    return out + "</tbody></table>";
  }

  /* -----------------------------------------------------------------------
     EN-TÊTES ET PIEDS
     ----------------------------------------------------------------------- */
  function enteteOfficiel(ctx) {
    var logo = CFG.LOGO
      ? '<img class="logo-img" src="' + esc(CFG.LOGO) + '" alt="Logo"' +
        ' onerror="window.RRlogoManquant(this)">'
      : '<div class="logo-box">LOGO<br>MEN</div>';
    var drapeau = CFG.DRAPEAU
      ? '<img class="drapeau-img" src="' + esc(CFG.DRAPEAU) + '"' +
        ' alt="Drapeau du Sénégal" onerror="window.RRdrapeauKo(this)">'
      : '<table class="drapeau"><tr>' +
        '<td class="d1"></td><td class="d2">*</td><td class="d3"></td>' +
        "</tr></table>";
    return '<div class="gm-entete-officiel">' + drapeau +
      '<div class="centre">' +
        '<div class="rep">RÉPUBLIQUE DU SÉNÉGAL</div>' +
        '<div class="devise">Un Peuple - Un But - Une Foi</div>' +
        '<div class="niv">' + esc(ctx.insp.ministere) + "</div>" +
        '<div class="niv">' + esc(ctx.insp.inspection) + "</div>" +
        '<div class="niv">' + esc(ctx.insp.ief) + "</div>" +
      "</div>" + logo + "</div>";
  }

  function topline(ctx) {
    return '<div class="gm-topline">' +
      '<span><span class="lab">ÉTABLISSEMENT : </span>' +
        '<span class="etab">' + esc(ctx.meta.ecole || "—") + "</span></span>" +
      '<span class="situation">' + esc(ctx.meta.situation) + "</span>" +
      "</div>";
  }

  function pied(n) {
    return '<div class="gm-pied"><span>Rapport général de rentrée — ' +
      "Enseignement moyen &amp; secondaire — " + esc(CFG.ANNEE || "2026/2027") +
      "</span><span>" + esc(FEUILLES[n - 1] || "") +
      " — Page " + n + " / 11</span></div>";
  }

  function titrePage(texte, petit) {
    return '<div class="gm-titre-page' + (petit ? " petit" : "") + '">' +
      texte + "</div>";
  }

  /* -----------------------------------------------------------------------
     CONTEXTE
     ----------------------------------------------------------------------- */
  function listeRemplie(a) {
    return Array.isArray(a) ? a.filter(function (x) {
      return x && Object.keys(x).some(function (k) {
        var v = x[k];
        return v !== "" && v !== null && v !== undefined && v !== 0;
      });
    }) : [];
  }

  function arrLongueur(a, taille) {
    var out = Array.isArray(a) ? a.slice(0, taille) : [];
    while (out.length < taille) { out.push({}); }
    return out;
  }

  function blocEffectifs(src, prefixe) {
    var b = { g: {}, f: {}, tot: {}, cg: {}, cf: {}, ct: {}, tg: 0, tf: 0, tt: 0 };
    EFFECTIFS_COLONNES.forEach(function (c) {
      b.g[c.n] = entier(g(src, prefixe + ".g." + c.n));
      b.f[c.n] = entier(g(src, prefixe + ".f." + c.n));
      b.tot[c.n] = b.g[c.n] + b.f[c.n];
    });
    EFFECTIFS_GROUPES.forEach(function (gr) {
      var sg = 0, sf = 0;
      EFFECTIFS_COLONNES.filter(function (c) { return c.g === gr.cle; })
        .forEach(function (c) {
          sg += b.g[c.n]; sf += b.f[c.n];
        });
      b.cg[gr.cle] = sg;
      b.cf[gr.cle] = sf;
      b.ct[gr.cle] = sg + sf;
      b.tg += sg; b.tf += sf;
    });
    b.tt = b.tg + b.tf;
    return b;
  }

  function baseExamen(src) {
    return {
      ins_g: entier(g(src, "ins_g")), ins_f: entier(g(src, "ins_f")),
      pres_g: entier(g(src, "pres_g")), pres_f: entier(g(src, "pres_f")),
      adm1_g: entier(g(src, "adm1_g")), adm1_f: entier(g(src, "adm1_f")),
      adm2_g: entier(g(src, "adm2_g")), adm2_f: entier(g(src, "adm2_f"))
    };
  }

  function deriveExamen(b) {
    var o = {
      ins_g: b.ins_g, ins_f: b.ins_f,
      pres_g: b.pres_g, pres_f: b.pres_f,
      pres_t: b.pres_g + b.pres_f,
      adm1_g: b.adm1_g, adm1_f: b.adm1_f,
      adm2_g: b.adm2_g, adm2_f: b.adm2_f
    };
    o.adm_t_g = o.adm1_g + o.adm2_g;
    o.adm_t_f = o.adm1_f + o.adm2_f;
    o.adm_t = o.adm_t_g + o.adm_t_f;
    o.pct_g = pct(o.adm_t_g, o.pres_g);
    o.pct_f = pct(o.adm_t_f, o.pres_f);
    o.pct_etab = pct(o.adm_t, o.pres_t);
    return o;
  }

  function sommeBase(a, b) {
    var o = {};
    Object.keys(a).forEach(function (k) { o[k] = entier(a[k]); });
    Object.keys(b).forEach(function (k) { o[k] = entier(o[k]) + entier(b[k]); });
    return o;
  }

  function mentionBase(src) {
    var o = {};
    ["tb", "bien", "ab"].forEach(function (m) {
      o[m + "_g"] = entier(g(src, m + "_g"));
      o[m + "_f"] = entier(g(src, m + "_f"));
    });
    o.total_g = o.tb_g + o.bien_g + o.ab_g;
    o.total_f = o.tb_f + o.bien_f + o.ab_f;
    o.total_etab = o.total_g + o.total_f;
    return o;
  }

  function sommeMention(a, b) {
    var o = {};
    Object.keys(a).forEach(function (k) { o[k] = entier(a[k]); });
    Object.keys(b).forEach(function (k) { o[k] = entier(o[k]) + entier(b[k]); });
    return o;
  }

  function buildContext(donnees, opts) {
    opts = opts || {};
    var d = donnees || {};
    var id = g(d, "identification", {});
    var nom = maj(g(id, "nom_ecole", "")) || "—";

    var ident = {
      nom_ecole: nom,
      code_sige: vide(g(id, "code_sige")),
      region_ia: vide(g(id, "region_ia")),
      departement: vide(g(id, "departement")),
      adresse: vide(g(id, "adresse")),
      ief: vide(g(id, "ief")),
      commune: vide(g(id, "commune")),
      district: vide(g(id, "district")),
      ville_village: vide(g(id, "ville_village")),
      telephone_fixe: vide(g(id, "telephone_fixe")),
      statut: vide(statutLabel(g(id, "statut"))),
      email: vide(g(id, "email")),
      type_etab: vide(typeLabel(g(id, "type_etab"))),
      site_web: vide(g(id, "site_web")),
      bst_polarise: vide(g(id, "bst_polarise")),
      geolat: vide(g(id, "geolat")),
      geolong: vide(g(id, "geolong")),
      annee_creation: vide(g(id, "annee_creation")),
      ref_circulaire: vide(g(id, "ref_circulaire"))
    };

    var personnels = { les: [], tg: 0, tf: 0, tt: 0 };
    PERSONNELS_LABELS.forEach(function (lbl, i) {
      var cle = ["admin", "ens_tit", "ens_vac", "tech", "service"][i];
      var f = entier(g(d, "personnels." + cle + ".f"));
      var h = entier(g(d, "personnels." + cle + ".h"));
      personnels.les.push({ l: lbl, f: f, h: h, t: f + h });
      personnels.tf += f; personnels.tg += h; personnels.tt += f + h;
    });

    var eleves1 = { les: [], tf: 0, tg: 0, tt: 0 };
    ELEVES_LABELS.forEach(function (lbl, i) {
      var cle = ["sixieme", "cinquieme", "quatrieme", "troisieme",
                 "seconde", "premiere", "terminale"][i];
      var f = entier(g(d, "eleves_page1." + cle + ".filles"));
      var h = entier(g(d, "eleves_page1." + cle + ".garcons"));
      eleves1.les.push({ l: lbl, f: f, g: h, t: f + h });
      eleves1.tf += f; eleves1.tg += h; eleves1.tt += f + h;
    });

    var cge = {
      reglement_interieur: oui(g(d, "cge.reglement_interieur")),
      reglement_adopte: oui(g(d, "cge.reglement_adopte")),
      date: dateCGE(g(d, "cge", {})),
      nb_membres: entier(g(d, "cge.nb_membres")),
      femmes: entier(g(d, "cge.femmes")),
      hommes: entier(g(d, "cge.hommes")),
      reunions_12m: entier(g(d, "cge.reunions_12m")),
      compte_bancaire: oui(g(d, "cge.compte_bancaire"))
    };

    var pe = {
      projet_etab: oui(g(d, "pe.projet_etab")),
      projet_precisions: vide(g(d, "pe.projet_precisions")),
      gouvernement_eleves: oui(g(d, "pe.gouvernement_eleves")),
      gouv_filles: entier(g(d, "pe.gouv_filles")),
      gouv_garcons: entier(g(d, "pe.gouv_garcons")),
      gouv_membres: entier(g(d, "pe.gouv_membres"))
    };

    var cellules = {
      fonctionnelles: oui(g(d, "cellules.cellules_fonctionnelles")),
      les: CELLULES.map(function (c) {
        return { cle: c[0], l: c[1], v: oui(g(d, "cellules.cellules." + c[0])) };
      })
    };

    var clubs = {
      fonctionnels: oui(g(d, "clubs.clubs_fonctionnels")),
      autres_precisions: vide(g(d, "clubs.autres_precisions")),
      les: CLUBS.map(function (c) {
        return { cle: c[0], l: c[1], v: oui(g(d, "clubs." + c[0])) };
      })
    };

    var chef = {
      prenom_nom: vide(g(d, "chef.chef_prenom_nom")),
      telephone: vide(g(d, "chef.chef_telephone")),
      genre: sexe(g(d, "chef.chef_genre")),
      corps_grade: vide(g(d, "chef.chef_corps_grade")),
      email: vide(g(d, "chef.chef_email"))
    };

    var structures = {
      accessible: oui(g(d, "structures.accessible")),
      nature_route: vide(g(d, "structures.nature_route")),
      cloture: oui(g(d, "structures.cloture")),
      type_cloture: vide(g(d, "structures.type_cloture")),
      sanitaires_separes: oui(g(d, "structures.sanitaires_separes")),
      nb_blocs: entier(g(d, "structures.nb_blocs")),
      nb_box_total: entier(g(d, "structures.nb_box_total")),
      nb_box_filles: entier(g(d, "structures.nb_box_filles")),
      nb_box_garcons: entier(g(d, "structures.nb_box_garcons")),
      telephone: vide(telLabel(g(d, "structures.telephone"))),
      internet: vide(netLabel(g(d, "structures.internet"))),
      bloc_admin: oui(g(d, "structures.bloc_admin")),
      salle_info_climatisee: oui(g(d, "structures.salle_info_climatisee")),
      cablage_reseau: oui(g(d, "structures.cablage_reseau")),
      nb_ordi_reseau: entier(g(d, "structures.nb_ordi_reseau")),
      eau_forage: oui(g(d, "structures.eau_forage")),
      eau_puits: oui(g(d, "structures.eau_puits")),
      eau_autre: oui(g(d, "structures.eau_autre")),
      eau_autre_description: vide(g(d, "structures.eau_autre_description")),
      energie_electricite: oui(g(d, "structures.energie_electricite")),
      energie_solaire: oui(g(d, "structures.energie_solaire")),
      energie_eolienne: oui(g(d, "structures.energie_eolienne")),
      energie_groupe: oui(g(d, "structures.energie_groupe"))
    };

    var salles = arrLongueur(g(d, "salles", []), 7).map(function (s, i) {
      return {
        l: SALLES_LABELS[i],
        total: entier(g(s, "total")),
        bon: entier(g(s, "bon")),
        mauvais: entier(g(s, "mauvais")),
        non_utilisees: entier(g(s, "non_utilisees")),
        abris: entier(g(s, "abris"))
      };
    });

    var equipements = arrLongueur(g(d, "equipements", []), 10).map(function (e, i) {
      return {
        l: EQUIPEMENTS_LABELS[i],
        marche: entier(g(e, "marche")),
        panne: entier(g(e, "panne")),
        eleves: entier(g(e, "eleves"))
      };
    });

    var manuels = MANUELS_DISCIPLINES.map(function (disc) {
      return {
        l: disc[1],
        valeurs: MANUELS_CLASSES.map(function (cl) {
          return entier(g(d, "manuels." + disc[0] + "." + cl[0]));
        })
      };
    });

    var supports = SUPPORTS_LABELS.map(function (s) {
      return { l: s[1], v: vide(supportLabel(g(d, "supports." + s[0]))) };
    });

    var ticeCompetences = arrLongueur(g(d, "tice.competences", []), 12).map(function (c) {
      return {
        aucun: entier(g(c, "aucun")),
        faible: entier(g(c, "faible")),
        moyen: entier(g(c, "moyen")),
        avance: entier(g(c, "avance"))
      };
    });

    var partenaires = arrLongueur(g(d, "tice.partenaires", []), 5).map(function (p) {
      return {
        nom: vide(g(p, "nom")),
        technique: oui(g(p, "technique")),
        pedagogique: oui(g(p, "pedagogique")),
        financier: oui(g(p, "financier"))
      };
    });

    var tice = {
      competences: ticeCompetences,
      personnes_ressources: entier(g(d, "tice.personnes_ressources")),
      fonctions: vide(g(d, "tice.fonctions")),
      volet_tic: oui(g(d, "tice.volet_tic")),
      volet_description: vide(g(d, "tice.volet_description")),
      partenaires: partenaires,
      financements: FINANCEMENTS.map(function (f) {
        return { cle: f[0], l: f[1], v: oui(g(d, "tice.financements." + f[0])) };
      }),
      contraintes: vide(g(d, "tice.contraintes")),
      strategies: vide(g(d, "tice.strategies")),
      recommandations: vide(g(d, "tice.recommandations"))
    };

    var effectifs = {
      nb: EFFECTIFS_COLONNES.map(function (c) {
        return entier(g(d, "effectifs.nb_classes." + c.n));
      }),
      effectifs: blocEffectifs(d, "effectifs.effectifs"),
      passants: blocEffectifs(d, "effectifs.passants"),
      redoublants: blocEffectifs(d, "effectifs.redoublants"),
      lv2: {}
    };
    LV2_LANGUES.forEach(function (l) {
      effectifs.lv2[l[0]] = blocEffectifs(d, "lv2." + l[0]);
    });

    var bfem = {
      normale: deriveExamen(baseExamen(g(d, "examens.bfem.normale", {}))),
      remplacement: deriveExamen(baseExamen(g(d, "examens.bfem.remplacement", {})))
    };
    bfem.total = deriveExamen(sommeBase(
      baseExamen(g(d, "examens.bfem.normale", {})),
      baseExamen(g(d, "examens.bfem.remplacement", {}))
    ));

    var bac = {};
    BAC_SERIES.forEach(function (s) {
      var nSrc = g(d, "examens.bac." + s[0] + ".normale", {});
      var rSrc = g(d, "examens.bac." + s[0] + ".remplacement", {});
      var nBase = baseExamen(nSrc);
      var rBase = baseExamen(rSrc);
      bac[s[0]] = {
        normale: deriveExamen(nBase),
        remplacement: deriveExamen(rBase),
        total: deriveExamen(sommeBase(nBase, rBase))
      };
    });

    var mentions = { series: {}, total: null };
    BAC_SERIES.forEach(function (s) {
      mentions.series[s[0]] = mentionBase(
        g(d, "examens.mentions." + s[0], {}));
    });
    var mTotal = mentions.series[BAC_SERIES[0][0]];
    BAC_SERIES.slice(1).forEach(function (s) {
      mTotal = sommeMention(mTotal, mentions.series[s[0]]);
    });
    mentions.total = mTotal;

    var observations = vide(g(d, "observations.texte"));

    return {
      meta: {
        ecole: nom === "—" ? "—" : nom,
        annee: CFG.ANNEE || "2026/2027",
        situation: "SITUATION AU 31 DÉCEMBRE 2026",
        id: opts.id || null,
        fichier_prefixe: "Rapport_Rentree_Moyen_"
      },
      insp: {
        ministere: CFG.MINISTERE || "MINISTÈRE DE L'ÉDUCATION NATIONALE",
        inspection: CFG.INSPECTION || "INSPECTION D'ACADÉMIE DE KAOLACK",
        ief: CFG.IEF || "IEF DE KEUR MADIABEL"
      },
      ident: ident,
      personnels: personnels,
      eleves1: eleves1,
      cge: cge,
      pe: pe,
      cellules: cellules,
      clubs: clubs,
      chef: chef,
      structures: structures,
      salles: salles,
      equipements: equipements,
      manuels: manuels,
      supports: supports,
      tice: tice,
      effectifs: effectifs,
      examens: { bfem: bfem, bac: bac, mentions: mentions },
      admin: listeRemplie(g(d, "admin", [])),
      enseignant: listeRemplie(g(d, "enseignant", [])),
      observations: observations
    };
  }

  /* -----------------------------------------------------------------------
     PAGE 1 — PAGE D'ENTRÉE
     ----------------------------------------------------------------------- */
  function page1(ctx) {
    var c = ctx.ident;
    var identGauche = [
      { l: "Nom de l'établissement", v: c.nom_ecole },
      { l: "Adresse de l'établissement", v: c.adresse },
      { l: "Commune", v: c.commune },
      { l: "Ville / village", v: c.ville_village },
      { l: "Téléphone fixe", v: c.telephone_fixe },
      { l: "Email de l'établissement", v: c.email },
      { l: "Site WEB de l'établissement", v: c.site_web },
      { l: "Géoréférencement - latitude", v: c.geolat },
      { l: "Géoréférencement - longitude", v: c.geolong }
    ];
    var identDroite = [
      { l: "Code SIGE de l'établissement", v: c.code_sige },
      { l: "Région / IA", v: c.region_ia },
      { l: "Département", v: c.departement },
      { l: "IEF", v: c.ief },
      { l: "District", v: c.district },
      { l: "Statut (public - privé)", v: c.statut },
      { l: "Type (CEM - CFA - Lycée - LFA - BST)", v: c.type_etab },
      { l: "Collège polarisé par un BST, préciser", v: c.bst_polarise },
      { l: "Année de création", v: c.annee_creation },
      { l: "N° de réf. de la circulaire de création", v: c.ref_circulaire }
    ];

    var html = '<div class="gm-page gm-p1">' + enteteOfficiel(ctx) +
      titrePage("RAPPORT GÉNÉRAL DE RENTRÉE — Enseignement Moyen &amp; Secondaire") +
      '<div class="gm-topline">' +
        '<span>ANNÉE SCOLAIRE <b>' + esc(ctx.meta.annee) + "</b></span>" +
        '<span class="situation">' + esc(ctx.meta.situation) + "</span>" +
      "</div>" +
      '<div class="gm-cols2 gm-ident">' +
        '<div class="gm-col" style="flex:1.06;">' + kv2Table(identGauche) + "</div>" +
        '<div class="gm-col">' + kv2Table(identDroite) + "</div>" +
      "</div>";

    /* Effectifs personnels / élèves */
    html += '<div class="gm-cols2 gm-marge-haut">' +
      '<div class="gm-col"><div class="gm-h">Effectif personnels</div>' +
        '<table class="gm-t compact"><thead><tr>' +
          '<th style="width:56%;">Catégorie</th><th>F</th><th>H</th><th>T</th>' +
        "</tr></thead><tbody>";
    ctx.personnels.les.forEach(function (p) {
      html += "<tr><td>" + esc(p.l) + '</td><td class="v">' + nz(p.f) +
        '</td><td class="v">' + nz(p.h) + '</td><td class="v">' + nz(p.t) +
        "</td></tr>";
    });
    html += "</tbody></table></div>" +
      '<div class="gm-col"><div class="gm-h">Effectif élèves</div>' +
        '<table class="gm-t compact"><thead><tr>' +
          '<th style="width:34%;">Niveau</th><th>Filles</th><th>Garçons</th>' +
          "<th>Total</th></tr></thead><tbody>";
    ctx.eleves1.les.forEach(function (e) {
      html += "<tr><td>" + esc(e.l) + '</td><td class="v">' + nz(e.f) +
        '</td><td class="v">' + nz(e.g) + '</td><td class="v">' + nz(e.t) +
        "</td></tr>";
    });
    html += '<tr class="tot"><td>TOTAL</td><td class="v">' + nz(ctx.eleves1.tf) +
      '</td><td class="v">' + nz(ctx.eleves1.tg) + '</td><td class="v">' +
      nz(ctx.eleves1.tt) + "</td></tr></tbody></table></div></div>";

    /* CGE */
    html += '<div class="gm-h">Conseil de Gestion de l\'Établissement (CGE)</div>' +
      kvTable([
        { l: "Existe-t-il un Règlement Intérieur ?", v: ctx.cge.reglement_interieur },
        { l: "A-t-il été adopté en Assemblée Générale ?", v: ctx.cge.reglement_adopte },
        { l: "Date du dernier renouvellement du CGE", v: ctx.cge.date },
        { l: "Nombre de membres du CGE", v: nz(ctx.cge.nb_membres) },
        { l: "dont Femmes", v: nz(ctx.cge.femmes) },
        { l: "dont Hommes", v: nz(ctx.cge.hommes) },
        { l: "Réunions CGE tenues (12 derniers mois)", v: nz(ctx.cge.reunions_12m) },
        { l: "Compte bancaire au nom de l'établissement ?", v: ctx.cge.compte_bancaire }
      ]);

    /* PE + gouvernement */
    html += '<div class="gm-h">Projet d\'établissement et gouvernement des élèves</div>' +
      kvTable([
        { l: "L'établissement dispose-t-il d'un Projet d'Établissement (PE) courant ?", v: ctx.pe.projet_etab },
        { l: "Gouvernement d'élèves ?", v: ctx.pe.gouvernement_eleves },
        { l: "Si oui, préciser (PE)", v: ctx.pe.projet_precisions, full: true },
        { l: "Nombre de filles", v: nz(ctx.pe.gouv_filles) },
        { l: "Nombre de garçons", v: nz(ctx.pe.gouv_garcons) },
        { l: "Nombre total de membres", v: nz(ctx.pe.gouv_membres) }
      ]);

    /* Cellules pédagogiques */
    html += '<div class="gm-h">Cellules pédagogiques fonctionnelles ? (Oui - Non)</div>' +
      '<table class="gm-t compact gm-cellules"><thead><tr>' +
        '<th style="width:20%;">Réponse</th>';
    ctx.cellules.les.forEach(function (cc) {
      html += "<th>" + esc(cc.l) + "</th>";
    });
    html += "</tr></thead><tbody><tr>" +
      '<td class="c v">' + (ctx.cellules.fonctionnelles || "&nbsp;") + "</td>";
    ctx.cellules.les.forEach(function (cc) {
      html += '<td class="c">' + (cc.v || "&nbsp;") + "</td>";
    });
    html += "</tr></tbody></table>";

    /* Clubs */
    html += '<div class="gm-h">Organisations / Clubs d\'élèves fonctionnels ? (Oui - Non)</div>' +
      '<div class="gm-checks"><span class="gm-check">' +
        '<span class="gm-cb' + (ctx.clubs.fonctionnels === "OUI" ? " on" : "") + '">' +
        (ctx.clubs.fonctionnels === "OUI" ? "X" : "&nbsp;") +
        "</span>Organisations / clubs fonctionnels</span>";
    ctx.clubs.les.forEach(function (cl) {
      html += '<span class="gm-check"><span class="gm-cb' +
        (cl.v === "OUI" ? " on" : "") + '">' + (cl.v === "OUI" ? "X" : "&nbsp;") +
        "</span>" + esc(cl.l) + "</span>";
    });
    html += "</div>";
    if (ctx.clubs.autres_precisions !== "&nbsp;") {
      html += '<div class="gm-note">Autres organisations / clubs : ' +
        ctx.clubs.autres_precisions + "</div>";
    }

    /* Chef d'établissement */
    html += '<div class="gm-h">Chef d\'établissement</div>' +
      '<div class="gm-cols2">' +
        '<div class="gm-col">' + kvTable([
          { l: "Prénom(s) et Nom du Chef d'Établissement", v: ctx.chef.prenom_nom, full: true },
          { l: "Téléphone du Chef d'établissement", v: ctx.chef.telephone },
          { l: "Genre (M ou F)", v: ctx.chef.genre },
          { l: "Corps & grade du Chef d'Établissement", v: ctx.chef.corps_grade },
          { l: "Email du Chef d'Établissement", v: ctx.chef.email }
        ]) + "</div>" +
        '<div style="width:62mm; flex:none;"><div class="gm-sign" style="margin-top:0;">' +
          '<div class="cadre"><b>Cachet et signature :</b><br><br></div></div></div>' +
      "</div>";

    html += '<div class="gm-note"' +
      ' style="margin-top:1.6mm; text-align:center; font-weight:bold; font-size:6pt;">' +
      "À retourner à l'IEF avant le 15 janvier de l'année scolaire en cours.</div>";

    return html + pied(1) + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGE 2 — STRUCTURES & ÉQUIPEMENTS
     ----------------------------------------------------------------------- */
  function page2(ctx) {
    var s = ctx.structures;
    var html = '<div class="gm-page gm-p2">' + topline(ctx) +
      titrePage("STRUCTURES &amp; ÉQUIPEMENTS", true);

    html += kvTable([
      { l: "Établissement accessible en toute saison ?", v: s.accessible },
      { l: "Nature de la route ?", v: s.nature_route },
      { l: "Établissement clôturé ?", v: s.cloture },
      { l: "Type de clôture", v: s.type_cloture },
      { l: "Blocs sanitaires séparés garçons-filles ?", v: s.sanitaires_separes },
      { l: "Nombre de blocs sanitaires", v: nz(s.nb_blocs) },
      { l: "Nbre de box - Total", v: nz(s.nb_box_total) },
      { l: "dont Filles", v: nz(s.nb_box_filles) },
      { l: "dont Garçons", v: nz(s.nb_box_garcons) },
      { l: "Connection Téléphone", v: s.telephone },
      { l: "Connection Internet", v: s.internet },
      { l: "Bloc administratif ?", v: s.bloc_admin },
      { l: "Salle informatique disponible climatisée ?", v: s.salle_info_climatisee },
      { l: "Câblage réseau ?", v: s.cablage_reseau },
      { l: "Nbre d'ordinateurs connectés au réseau", v: nz(s.nb_ordi_reseau) }
    ]);

    html += '<div class="gm-h">Source(s) d\'eau et d\'énergie</div><div class="gm-checks">' +
      '<span class="gm-check">' + croix(s.eau_forage) + " Forage</span>" +
      '<span class="gm-check">' + croix(s.eau_puits) + " Puits</span>" +
      '<span class="gm-check">' + croix(s.eau_autre) + " Autre source d'eau</span>" +
      '<span class="gm-check">' + croix(s.energie_electricite) + " Électricité</span>" +
      '<span class="gm-check">' + croix(s.energie_solaire) + " Solaire</span>" +
      '<span class="gm-check">' + croix(s.energie_eolienne) + " Éolienne</span>" +
      '<span class="gm-check">' + croix(s.energie_groupe) + " Groupe électrogène</span>" +
      "</div>";
    if (s.eau_autre_description !== "&nbsp;") {
      html += '<div class="gm-note">Autre source d\'eau : ' +
        s.eau_autre_description + "</div>";
    }

    /* Salles */
    html += '<div class="gm-h">Salles et locaux</div>' +
      '<table class="gm-t compact"><thead><tr>' +
        '<th style="width:37%;">Locaux</th><th>Nombre total</th>' +
        '<th>En bon état</th><th>En mauvais état</th><th>Non utilisées</th>' +
        "<th>Abris provisoire utilisé comme salle</th></tr></thead><tbody>";
    ctx.salles.forEach(function (r) {
      html += "<tr><td>" + esc(r.l) + '</td><td class="v">' + nz(r.total) +
        '</td><td class="v">' + nz(r.bon) + '</td><td class="v">' + nz(r.mauvais) +
        '</td><td class="v">' + nz(r.non_utilisees) + '</td><td class="v">' +
        nz(r.abris) + "</td></tr>";
    });
    html += "</tbody></table>";

    /* Équipements */
    html += '<div class="gm-h">Équipements</div>' +
      '<table class="gm-t compact"><thead><tr>' +
        '<th style="width:48%;">Équipement</th><th>En état de MARCHE</th>' +
        "<th>En PANNE</th><th>Destiné à l'usage des élèves</th></tr></thead><tbody>";
    ctx.equipements.forEach(function (r) {
      html += "<tr><td>" + esc(r.l) + '</td><td class="v">' + nz(r.marche) +
        '</td><td class="v">' + nz(r.panne) + '</td><td class="v">' +
        nz(r.eleves) + "</td></tr>";
    });
    html += "</tbody></table>";

    /* Manuels */
    html += '<div class="gm-h">Manuels scolaires — nombre par discipline et par classe pédagogique</div>' +
      '<table class="gm-t tres-compact"><thead><tr><th style="width:27%;">Discipline</th>';
    MANUELS_CLASSES.forEach(function (cl) {
      html += "<th>" + esc(cl[1]) + "</th>";
    });
    html += "</tr></thead><tbody>";
    ctx.manuels.forEach(function (m) {
      html += "<tr><td>" + esc(m.l) + "</td>";
      m.valeurs.forEach(function (v) {
        html += '<td class="c">' + nz(v) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table>";

    /* Supports numériques */
    html += '<div class="gm-h">Supports pédagogiques numériques (néant / 1 à 3 titres / 4+ titres)</div>' +
      '<table class="gm-t compact"><thead><tr>';
    ctx.supports.forEach(function (r) {
      html += "<th>" + esc(r.l) + "</th>";
    });
    html += "</tr></thead><tbody><tr>";
    ctx.supports.forEach(function (r) {
      html += '<td class="c v">' + r.v + "</td>";
    });
    html += "</tr></tbody></table>";

    return html + pied(2) + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGE 3 — SITUATION TICE
     ----------------------------------------------------------------------- */
  function page3(ctx) {
    var t = ctx.tice;
    var html = '<div class="gm-page gm-p3">' + topline(ctx) +
      titrePage("SITUATION TICE", true);

    html += '<div class="gm-h">Personnels de l\'établissement selon leurs compétences TIC</div>' +
      '<table class="gm-t compact"><thead><tr>' +
        '<th rowspan="2" style="width:16%;">TYPE DE PERSONNEL</th>' +
        '<th rowspan="2" style="width:24%;">COMPÉTENCE</th>' +
        '<th colspan="4">Nombre de personnes par niveau de compétence</th>' +
      "</tr><tr>";
    TICE_NIVEAUX_LABELS.forEach(function (x) {
      html += "<th>" + esc(x) + "</th>";
    });
    html += "</tr></thead><tbody>";
    TICE_GROUPES.forEach(function (grp) {
      for (var j = 0; j < 6; j++) {
        var idx = grp[1] * 6 + j;
        var c = t.competences[idx];
        html += "<tr>";
        if (j === 0) {
          html += '<td rowspan="6" class="lbl-cell">' + esc(grp[0]) + "</td>";
        }
        html += "<td>" + esc(TICE_COMPETENCES[j]) + "</td>" +
          '<td class="v">' + nz(c.aucun) + '</td><td class="v">' + nz(c.faible) +
          '</td><td class="v">' + nz(c.moyen) + '</td><td class="v">' +
          nz(c.avance) + "</td></tr>";
      }
    });
    html += "</tbody></table>";

    html += '<table class="gm-kv gm-tice-infos"><tbody>' +
      '<tr><td class="kv-l">Nombre de personnes ressources en TIC dans ' +
        'l\'établissement ?</td><td class="kv-v">' + nz(t.personnes_ressources) +
        '</td><td class="kv-l">Le Projet d\'établissement comprend-il un ' +
        'volet TIC ?</td><td class="kv-v">' + (t.volet_tic || "&nbsp;") +
      "</td></tr>" +
      '<tr><td class="kv-l">Fonction(s) de ces personnes</td>' +
        '<td class="kv-v" colspan="3">' + (t.fonctions || "&nbsp;") + "</td></tr>" +
      '<tr><td class="kv-l">Si oui, décrire le volet TIC</td>' +
        '<td class="kv-v" colspan="3">' + (t.volet_description || "&nbsp;") +
      "</td></tr></tbody></table>";

    html += '<div class="gm-h">Avez-vous des partenaires dans le domaine des TIC ?</div>' +
      '<table class="gm-t compact"><thead><tr>' +
        '<th style="width:44%;">PARTENAIRE</th>' +
        '<th colspan="3">Domaine(s) de partenariat (cochez)</th>' +
      "</tr><tr><th></th><th>Technique</th><th>Pédagogique</th>" +
      "<th>Financier</th></tr></thead><tbody>";
    t.partenaires.forEach(function (p) {
      html += "<tr><td>" + p.nom + '</td><td class="c">' + croix(p.technique) +
        '</td><td class="c">' + croix(p.pedagogique) + '</td><td class="c">' +
        croix(p.financier) + "</td></tr>";
    });
    html += "</tbody></table>";

    html += '<div class="gm-h">Sources de financement de la salle informatique (cochez)</div>' +
      '<div class="gm-checks">';
    t.financements.forEach(function (f) {
      html += '<span class="gm-check">' + croix(f.v) + " " + esc(f.l) + "</span>";
    });
    html += "</div>";

    html += '<div class="gm-h">Préoccupations et suggestions</div>' +
      '<div class="gm-question">Quelles sont les 3 principales contraintes auxquelles vous faites face dans l\'utilisation des TIC dans votre établissement ?</div>' +
      '<div class="gm-rep">' + t.contraintes + "</div>" +
      '<div class="gm-question">Quelles stratégies avez-vous mises en œuvre pour surmonter ces contraintes ?</div>' +
      '<div class="gm-rep">' + t.strategies + "</div>" +
      '<div class="gm-question">Quelles recommandations pouvez-vous formuler pour la pérennisation de l\'usage des TIC dans votre établissement ?</div>' +
      '<div class="gm-rep">' + t.recommandations + "</div>";

    return html + pied(3) + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGE 4 — EFFECTIFS ÉLÈVES (PAYSAGE)
     ----------------------------------------------------------------------- */
  function enteteEffectifs() {
    var html = '<thead><tr>' +
      '<th rowspan="2" colspan="2" style="width:14%;">CLASSES &amp; ÉLÈVES</th>';
    EFFECTIFS_GROUPES.forEach(function (gr) {
      var nb = EFFECTIFS_COLONNES.filter(function (c) { return c.g === gr.cle; }).length + 1;
      html += '<th colspan="' + nb + '" class="grp">' + esc(gr.l) + "</th>";
    });
    html += "</tr><tr>";
    EFFECTIFS_GROUPES.forEach(function (gr) {
      EFFECTIFS_COLONNES.filter(function (c) { return c.g === gr.cle; })
        .forEach(function (c) {
          html += "<th>" + esc(c.l) + "</th>";
        });
      html += '<th class="grp">TOTAL</th>';
    });
    return html + "</tr></thead>";
  }

  function cellulesColonnes(vals, totaux, classe) {
    var html = "";
    EFFECTIFS_GROUPES.forEach(function (gr) {
      EFFECTIFS_COLONNES.filter(function (c) { return c.g === gr.cle; })
        .forEach(function (c) {
          html += '<td class="c">' + nz(vals[c.n]) + "</td>";
        });
      html += '<td class="c tot">' + nz(totaux[gr.cle]) + "</td>";
    });
    return html;
  }

  function page4(ctx) {
    var e = ctx.effectifs;
    var html = '<div class="gm-page gm-paysage gm-p4">' + topline(ctx) +
      titrePage("EFFECTIFS ÉLÈVES", true);

    /* Nombre de classes */
    html += '<table class="gm-t tres-compact"><thead>' + enteteEffectifs() +
      '</thead><tbody><tr><td colspan="2" class="lbl-cell">Nbre classes pédagogiques</td>';
    EFFECTIFS_GROUPES.forEach(function (gr) {
      EFFECTIFS_COLONNES.filter(function (c) { return c.g === gr.cle; })
        .forEach(function (c, i) {
          var idx = EFFECTIFS_COLONNES.indexOf(c);
          html += '<td class="c">' + nz(e.nb[idx]) + "</td>";
        });
      var tot = 0;
      EFFECTIFS_COLONNES.forEach(function (c, i) {
        if (c.g === gr.cle) { tot += e.nb[i]; }
      });
      html += '<td class="c tot">' + nz(tot) + "</td>";
    });
    html += "</tr>";

    function lignes(titre, b) {
      var out = "";
      out += '<tr><td rowspan="3" class="lbl-cell">' + titre +
        '</td><td class="c">Garçons</td>' + cellulesColonnes(b.g, b.ct, "") + "</tr>";
      out += '<tr><td class="c">Filles</td>' + cellulesColonnes(b.f, b.ct, "") + "</tr>";
      out += '<tr class="tot"><td class="c">TOTAL</td>' +
        cellulesColonnes(b.tot, b.ct, "tot") + "</tr>";
      return out;
    }

    html += lignes("EFFECTIFS", e.effectifs);
    html += lignes("PASSANTS", e.passants);
    html += lignes("REDOUBLANTS", e.redoublants);
    html += "</tbody></table>";

    /* LV2 */
    html += '<div class="gm-h">Effectifs élèves par deuxième langue vivante étudiée (LV2)</div>' +
      '<table class="gm-t tres-compact"><thead>' + enteteEffectifs() + "</thead><tbody>";
    LV2_LANGUES.forEach(function (l) {
      var b = e.lv2[l[0]];
      html += '<tr><td rowspan="2" class="lbl-cell">' + esc(l[1]) +
        '</td><td class="c">Garçons</td>' + cellulesColonnes(b.g, b.cg, "") + "</tr>";
      html += '<tr><td class="c">Filles</td>' + cellulesColonnes(b.f, b.cf, "") +
        "</tr>";
    });
    html += "</tbody></table>";

    return html + pied(4) + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGE 5 — RÉSULTATS EXAMENS
     ----------------------------------------------------------------------- */
  function examHeader(first) {
    var html = '<thead><tr>' +
      '<th rowspan="3" style="width:12%;">' + (first || "SESSION") + "</th>" +
      '<th colspan="2">INSCRITS</th><th colspan="3">PRÉSENTS</th>' +
      '<th colspan="7">ADMIS</th><th colspan="3">ADMIS / PRÉSENTS (%)</th>' +
      '</tr><tr><th colspan="2"></th><th colspan="3"></th>' +
      '<th colspan="2">1er groupe</th><th colspan="2">2ème groupe</th>' +
      '<th colspan="3">TOTAL</th><th colspan="3">Admis sur Présents (%)</th>' +
      '</tr><tr>' +
      "<th>Garçons</th><th>Filles</th>" +
      "<th>Garçons</th><th>Filles</th><th>ETAB</th>" +
      "<th>Garçons</th><th>Filles</th>" +
      "<th>Garçons</th><th>Filles</th>" +
      "<th>Garçons</th><th>Filles</th><th>ETAB</th>" +
      "<th>Garçons</th><th>Filles</th><th>% ETAB</th>" +
      "</tr></thead>";
    return html;
  }

  function examCells(d) {
    var out = "";
    ["ins_g", "ins_f", "pres_g", "pres_f", "pres_t",
     "adm1_g", "adm1_f", "adm2_g", "adm2_f",
     "adm_t_g", "adm_t_f", "adm_t"].forEach(function (k) {
      out += '<td class="c">' + nz(d[k]) + "</td>";
    });
    ["pct_g", "pct_f", "pct_etab"].forEach(function (k) {
      out += '<td class="c">' + (d[k] === "" ? "&nbsp;" : esc(d[k])) + "</td>";
    });
    return out;
  }

  function page5(ctx) {
    var ex = ctx.examens;
    var html = '<div class="gm-page gm-p5">' + topline(ctx) +
      titrePage("RÉSULTATS AUX EXAMENS", true);

    /* BFEM */
    html += '<div class="gm-h">BFEM — ' + esc(ctx.meta.annee) + "</div>" +
      '<table class="gm-t serre">' + examHeader("SESSION") + "<tbody>";
    [["Normale", ex.bfem.normale], ["Remplacement", ex.bfem.remplacement],
     ["TOTAL", ex.bfem.total]].forEach(function (r, i) {
      html += '<tr' + (i === 2 ? ' class="tot"' : "") + "><td>" + esc(r[0]) +
        "</td>" + examCells(r[1]) + "</tr>";
    });
    html += "</tbody></table>";

    /* BAC */
    html += '<div class="gm-h">BACCALAURÉAT — ' + esc(ctx.meta.annee) + "</div>" +
      '<table class="gm-t serre">' + examHeader("SÉRIE / SESSION") + "<tbody>";
    BAC_SERIES.forEach(function (s) {
      var b = ex.bac[s[0]];
      ["normale", "remplacement", "total"].forEach(function (k, i) {
        html += "<tr" + (i === 2 ? ' class="tot"' : "") + ">";
        if (i === 0) {
          html += '<td rowspan="3" class="lbl-cell">' + esc(s[1]) + "</td>";
        }
        html += "<td>" + (k === "normale" ? "Normale" :
          k === "remplacement" ? "Remplacement" : "TOTAL") + "</td>" +
          examCells(b[k]) + "</tr>";
      });
    });
    html += "</tbody></table>";

    /* Mentions */
    html += '<div class="gm-h">Mentions au baccalauréat</div>' +
      '<table class="gm-t compact"><thead><tr>' +
      '<th rowspan="2" style="width:14%;">SÉRIE</th>' +
      '<th colspan="2">Très bien</th><th colspan="2">Bien</th>' +
      '<th colspan="2">Assez Bien</th><th colspan="3">TOTAL</th>' +
      '</tr><tr><th>Garçons</th><th>Filles</th><th>Garçons</th><th>Filles</th>' +
      '<th>Garçons</th><th>Filles</th><th>Garçons</th><th>Filles</th><th>ETAB</th>' +
      "</tr></thead><tbody>";
    BAC_SERIES.forEach(function (s) {
      var m = ex.mentions.series[s[0]];
      html += '<tr><td class="lbl-cell">' + esc(s[1]) + "</td>" +
        '<td class="c">' + nz(m.tb_g) + '</td><td class="c">' + nz(m.tb_f) +
        '</td><td class="c">' + nz(m.bien_g) + '</td><td class="c">' + nz(m.bien_f) +
        '</td><td class="c">' + nz(m.ab_g) + '</td><td class="c">' + nz(m.ab_f) +
        '</td><td class="c v">' + nz(m.total_g) + '</td><td class="c v">' +
        nz(m.total_f) + '</td><td class="c v">' + nz(m.total_etab) + "</td></tr>";
    });
    var mt = ex.mentions.total;
    html += '<tr class="tot"><td>TOTAL</td>' +
      '<td class="c">' + nz(mt.tb_g) + '</td><td class="c">' + nz(mt.tb_f) +
      '</td><td class="c">' + nz(mt.bien_g) + '</td><td class="c">' + nz(mt.bien_f) +
      '</td><td class="c">' + nz(mt.ab_g) + '</td><td class="c">' + nz(mt.ab_f) +
      '</td><td class="c">' + nz(mt.total_g) + '</td><td class="c">' +
      nz(mt.total_f) + '</td><td class="c">' + nz(mt.total_etab) +
      "</td></tr></tbody></table>";

    return html + pied(5) + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGES 6-7 — PERSONNEL ADMINISTRATIF (26 + 26)
     ----------------------------------------------------------------------- */
  function adminEntete() {
    return '<thead><tr>' +
      '<th style="width:3.5%;">N°<br>Ord</th>' +
      '<th style="width:14%;">FONCTIONS</th>' +
      '<th style="width:11.5%;">PRÉNOM(S)</th>' +
      '<th style="width:11.5%;">NOM</th>' +
      '<th style="width:4.5%;">Sexe<br>M/F</th>' +
      '<th style="width:8.5%;">Date<br>Naissance</th>' +
      '<th style="width:10%;">Matricule<br>de solde</th>' +
      '<th style="width:9.5%;">CORPS /<br>GRADE</th>' +
      '<th style="width:10.5%;">Date Entrée<br>Établissement</th>' +
      '<th style="width:16.5%;">SPÉCIALITÉ<br>(DISCIPLINE)</th>' +
      "</tr></thead>";
  }

  function adminLigne(row, numero) {
    row = row || {};
    return "<tr><td class=\"c\">" + numero + "</td>" +
      "<td>" + escAff(row.fonction) + "</td>" +
      '<td class="nom">' + escAff(row.prenom) + "</td>" +
      '<td class="nom">' + escAff(row.nom) + "</td>" +
      '<td class="c">' + esc(sexe(row.sexe)) + "</td>" +
      '<td class="c">' + esc(dateFr(row.date_naissance)) + "</td>" +
      '<td class="c">' + escAff(row.matricule) + "</td>" +
      "<td>" + escAff(row.corps_grade) + "</td>" +
      '<td class="c">' + esc(dateFr(row.date_entree)) + "</td>" +
      "<td>" + escAff(row.specialite) + "</td></tr>";
  }

  function pageAdmin(ctx, debut, nb, part) {
    var html = '<div class="gm-page gm-paysage gm-p' + (part === 1 ? 6 : 7) + '">' +
      topline(ctx) +
      titrePage("ÉTAT NOMINATIF DU PERSONNEL ADMINISTRATIF", true) +
      '<div class="gm-topline" style="border:0; margin-bottom:.6mm; font-size:5.8pt;">' +
        "<span>Liste officielle des 52 emplois — lignes " + (debut + 1) + " à " +
        (debut + nb) + "</span><span>Partie " + part + " / 2</span></div>" +
      '<table class="gm-pers admin">' + adminEntete() + "<tbody>";
    for (var i = 0; i < nb; i++) {
      html += adminLigne(ctx.admin[debut + i], debut + i + 1);
    }
    html += "</tbody></table>";
    return html + pied(part === 1 ? 6 : 7) + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGES 8-10 — PERSONNEL ENSEIGNANT (23 + 23 + 23)
     ----------------------------------------------------------------------- */
  function ensEntete() {
    return '<thead><tr>' +
      '<th style="width:2.8%;">N°<br>ord</th>' +
      '<th style="width:4.2%;">DISCIP.</th>' +
      '<th style="width:10.5%;">DISCIPLINE DOMINANTE<br>ENSEIGNÉE</th>' +
      '<th style="width:7.5%;">PRÉNOM(S)</th>' +
      '<th style="width:7.5%;">NOM</th>' +
      '<th style="width:3.3%;">SEXE<br>M / F</th>' +
      '<th style="width:6.5%;">Date<br>Naissance</th>' +
      '<th style="width:7.5%;">MATRICULE<br>DE SOLDE</th>' +
      '<th style="width:7.5%;">CORPS /<br>GRADE</th>' +
      '<th style="width:7%;">Date Entrée<br>Établissement</th>' +
      '<th style="width:7%;">DIPLÔME<br>ACADÉMIQUE</th>' +
      '<th style="width:7.5%;">DISCIPLINE DU<br>DIPLÔME ACAD.</th>' +
      '<th style="width:7%;">DIPLÔME<br>PROFESSIONNEL</th>' +
      '<th style="width:4%;">Nbre h.<br>/ semaine</th>' +
      '<th style="width:3.4%;">Décharge</th>' +
      '<th style="width:8.3%;">Classes<br>Tenues</th>' +
      "</tr></thead>";
  }

  function ensLigne(row, numero) {
    row = row || {};
    return "<tr><td class=\"c\">" + numero + "</td>" +
      '<td class="c">' + escAff(row.discip) + "</td>" +
      "<td>" + escAff(row.discipline_dominante) + "</td>" +
      '<td class="nom">' + escAff(row.prenom) + "</td>" +
      '<td class="nom">' + escAff(row.nom) + "</td>" +
      '<td class="c">' + esc(sexe(row.sexe)) + "</td>" +
      '<td class="c">' + esc(dateFr(row.date_naissance)) + "</td>" +
      '<td class="c">' + escAff(row.matricule) + "</td>" +
      "<td>" + escAff(row.corps_grade) + "</td>" +
      '<td class="c">' + esc(dateFr(row.date_entree)) + "</td>" +
      "<td>" + escAff(row.diplome_acad) + "</td>" +
      "<td>" + escAff(row.discipline_diplome) + "</td>" +
      "<td>" + escAff(row.diplome_prof) + "</td>" +
      '<td class="c">' + nz(row.heures) + "</td>" +
      '<td class="c">' + escAff(row.decharge) + "</td>" +
      "<td>" + escAff(row.classes) + "</td></tr>";
  }

  function pageEns(ctx, debut, nb, part) {
    var html = '<div class="gm-page gm-paysage gm-p' + (part === 1 ? 8 : (part === 2 ? 9 : 10)) + '">' +
      topline(ctx) +
      titrePage("ÉTAT NOMINATIF DU PERSONNEL ENSEIGNANT CRAIE EN MAIN", true) +
      '<div class="gm-topline" style="border:0; margin-bottom:.6mm; font-size:5.8pt;">' +
        "<span>Liste officielle des 69 emplois — lignes " + (debut + 1) + " à " +
        (debut + nb) + "</span><span>Partie " + part + " / 3</span></div>" +
      '<table class="gm-pers ens">' + ensEntete() + "<tbody>";
    for (var i = 0; i < nb; i++) {
      html += ensLigne(ctx.enseignant[debut + i], debut + i + 1);
    }
    html += "</tbody></table>";
    return html + pied(part === 1 ? 8 : (part === 2 ? 9 : 10)) + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGE 11 — OBSERVATIONS
     ----------------------------------------------------------------------- */
  function page11(ctx) {
    return '<div class="gm-page gm-p11">' + topline(ctx) +
      titrePage("OBSERVATIONS DU CHEF D'ÉTABLISSEMENT", true) +
      '<div class="gm-obs-box">' + ctx.observations + "</div>" +
      '<div class="gm-sign"><div class="cadre"><b>Cachet et signature du Chef ' +
      "d'Établissement :</b></div></div>" +
      pied(11) + "</div>";
  }

  /* -----------------------------------------------------------------------
     ASSEMBLAGE
     ----------------------------------------------------------------------- */
  function pageContents(ctx) {
    var contenus = [
      page1(ctx), page2(ctx), page3(ctx), page4(ctx), page5(ctx),
      pageAdmin(ctx, 0, ADMIN_PAR_PAGE, 1),
      pageAdmin(ctx, ADMIN_PAR_PAGE, ADMIN_PAR_PAGE, 2),
      pageEns(ctx, 0, ENS_PAR_PAGE, 1),
      pageEns(ctx, ENS_PAR_PAGE, ENS_PAR_PAGE, 2),
      pageEns(ctx, ENS_PAR_PAGE * 2, ENS_PAR_PAGE, 3),
      page11(ctx)
    ];
    if (contenus.length !== 11 || TITRES.length !== 11 ||
        ORIENTATIONS.length !== 11 || FEUILLES.length !== 11) {
      throw new Error("Le rapport général moyen doit comporter exactement 11 pages.");
    }
    return contenus;
  }

  function buildPages(ctx) {
    return pageContents(ctx).map(function (contenu, i) {
      var portrait = ORIENTATIONS[i] === "portrait";
      var mmL = portrait ? 210 : 297;
      var mmH = portrait ? 297 : 210;
      return '<div class="apercu-slot">' +
        '<div class="pdf-page gm-a4' + (portrait ? " portrait" : " landscape") + '"' +
          ' data-page="' + (i + 1) + '"' +
          ' data-mm-largeur="' + mmL + '"' +
          ' data-mm-hauteur="' + mmH + '"' +
          ' data-marge-x="0" data-marge-y="0"' +
          (portrait ? ' data-orientation="portrait"' : "") + ">" +
          '<div class="page-inner">' + contenu + "</div>" +
        "</div>" +
        '<div class="apercu-legende"></div>' +
      "</div>";
    }).join("\n");
  }

  /* -----------------------------------------------------------------------
     AUTO-AJUSTEMENT : scale de sécurité si une page déborde.
     ----------------------------------------------------------------------- */
  function autoAjuster(pg) {
    var inner = pg.querySelector(".page-inner");
    if (!inner) { return; }
    inner.style.transform = "";
    inner.style.width = "";
    inner.style.transformOrigin = "top left";

    var hauteur = inner.scrollHeight;
    var dispo = pg.clientHeight;
    if (hauteur > dispo + 1) {
      var s = dispo / hauteur;
      inner.style.width = (100 / s) + "%";
      inner.style.transform = "scale(" + s + ")";
      inner.style.transformOrigin = "top left";
    }
  }

  function renderPreview(container, ctx) {
    container.innerHTML = buildPages(ctx);
    var pages = container.querySelectorAll(".pdf-page");
    Array.prototype.forEach.call(pages, autoAjuster);
    fitPreview(container);
    return pages;
  }

  /* -----------------------------------------------------------------------
     FIT APERÇU MIXTE : chaque légende est calée sous SA page.
     ----------------------------------------------------------------------- */
  function fitPreview(container) {
    var pages = container.querySelectorAll(".pdf-page");
    if (!pages.length) { return; }
    var avail = container.clientWidth ||
      (container.parentElement && container.parentElement.clientWidth) || 1040;
    var largeurPx = 297 * 96 / 25.4;
    var scale = Math.min(1, (avail - 4) / largeurPx);

    Array.prototype.forEach.call(pages, function (pg, i) {
      var portrait = pg.getAttribute("data-orientation") === "portrait";
      var hauteurPx = (portrait ? 297 : 210) * 96 / 25.4;
      pg.style.transform = "scale(" + scale + ")";
      pg.style.transformOrigin = "top left";

      var slot = pg.parentElement;
      var leg = (slot && slot.classList.contains("apercu-slot"))
        ? slot.querySelector(".apercu-legende") : null;
      if (leg) {
        leg.textContent = "Page " + (i + 1) + " / 11 — " + TITRES[i];
        leg.style.marginTop = Math.ceil(hauteurPx * (scale - 1)) + "px";
      }
    });
    container.style.setProperty("--apercu-echelle", scale);
  }

  /* -----------------------------------------------------------------------
     REGISTRE
     ----------------------------------------------------------------------- */
  global.RR_MODELES = global.RR_MODELES || {};
  global.RR_MODELES[TYPE] = {
    buildContext: buildContext,
    buildPages: buildPages,
    pageContents: pageContents,
    renderPreview: renderPreview,
    fitPreview: fitPreview,
    autoAjuster: autoAjuster,
    titres: TITRES,
    orientations: ORIENTATIONS
  };

  R.generalMoyen = {
    buildContext: buildContext,
    buildPages: buildPages,
    renderPreview: renderPreview,
    fitPreview: fitPreview,
    titres: TITRES,
    orientations: ORIENTATIONS
  };

}(window));
