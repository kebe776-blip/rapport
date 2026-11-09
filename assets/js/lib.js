/* =========================================================================
   lib.js — Portage JavaScript de build_context() (app.py)
   Transforme les données brutes du formulaire (même forme que sample_data.json)
   en contexte prêt à être rendu par rapport.js.
   ========================================================================= */
(function (global) {
  "use strict";

  var CFG = global.RR_CONFIG || {};

  /* -----------------------------------------------------------------------
     LIBELLÉS DES OPTIONS
     ----------------------------------------------------------------------- */
  var LABELS = {
    statut: { public: "PUBLIC", prive: "PRIVÉ", communautaire: "COMMUNAUTAIRE" },
    oui_non: { oui: "OUI", non: "NON" },
    langue: {
      wolof: "WOLOF", pulaar: "PULAAR", serere: "SERÈRE", diola: "DIOLA",
      mandinka: "MANDINKA", soninke: "SONINKÉ", manjak: "MANJAK",
      balant: "BALANT", noon: "NOON", koulack: "KOULACK", autre: "AUTRE"
    },
    type_classe: { simple: "SIMPLE", cmg: "CMG", cdf: "CDF" },
    /* legacy : colonne Type supprimée du rapport */
    statut_directeur: { titulaire: "TITULAIRE", interimaire: "INTÉRIMAIRE" },
    discipline: { francais: "FRANÇAIS", arabe: "ARABE", anglais: "ANGLAIS" },
    provenance: {
      etat: "ÉTAT", cge: "CGE", caritas: "CARITAS",
      plan_international: "PLAN INTERNATIONAL", relit: "RELIT",
      pame: "PAME", onu: "ONU", bailleur: "BAILLEUR", autre: "AUTRE"
    },
    etat: {
      bon: "BON", acceptable: "ACCEPTABLE",
      mauvais: "MAUVAIS", neant: "NÉANT"
    },
    source_electricite: {
      senelec: "SENELEC", solaire: "SOLAIRE",
      groupe_electrogene: "GROUPE ÉLECTROGÈNE", neant: "NÉANT"
    }
  };

  var MOBILIER = [
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
  ];

  var COURS = [
    ["eff_ci", "CI"], ["eff_cp", "CP"], ["eff_ce1", "CE1"],
    ["eff_ce2", "CE2"], ["eff_cm1", "CM1"], ["eff_cm2", "CM2"]
  ];

  /* -----------------------------------------------------------------------
     UTILITAIRES DE LECTURE
     ----------------------------------------------------------------------- */

  /** Aplatit les groupes : {'g': {'q': 1}} -> {'g/q': 1}.
   *  Les listes (repeat groups) sont conservées telles quelles. */
  function flatten(obj, prefix) {
    var out = {};
    prefix = prefix || "";
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
      Object.keys(obj).forEach(function (k) {
        var p = prefix ? prefix + "/" + k : k;
        var sub = flatten(obj[k], p);
        Object.keys(sub).forEach(function (kk) { out[kk] = sub[kk]; });
      });
    } else {
      out[prefix] = obj;
    }
    return out;
  }

  /** Valeur scalaire : name = dernière partie du chemin, within = chemin parent. */
  function val(flat, name, within, dflt) {
    if (dflt === undefined) { dflt = ""; }
    var keys = Object.keys(flat);
    for (var i = 0; i < keys.length; i++) {
      var path = keys[i], v = flat[path];
      if (v !== null && typeof v === "object") { continue; }
      var parts = path.split("/");
      if (parts[parts.length - 1] !== name) { continue; }
      if (within && path.indexOf(within) === -1) { continue; }
      return (v === null || v === undefined) ? dflt : v;
    }
    return dflt;
  }

  /** Lignes d'un repeat group (liste imbriquée OU clés indexées à plat). */
  function rows(flat, name, aliases) {
    var cands = [name].concat(aliases || []);
    var keys = Object.keys(flat);
    var c, i, path, parts;
    for (c = 0; c < cands.length; c++) {
      for (i = 0; i < keys.length; i++) {
        path = keys[i];
        if (path.split("/").pop() === cands[c] && Array.isArray(flat[path])) {
          return flat[path].map(function (item) { return flatten(item); });
        }
      }
    }
    var idx = {};
    var found = false;
    for (i = 0; i < keys.length; i++) {
      path = keys[i];
      parts = path.split("/");
      if (parts.length >= 3 && /^\d+$/.test(parts[parts.length - 2]) &&
          parts[parts.length - 3] === name) {
        var n = parseInt(parts[parts.length - 2], 10);
        if (!idx[n]) { idx[n] = {}; }
        idx[n][parts[parts.length - 1]] = flat[path];
        found = true;
      }
    }
    if (!found) { return []; }
    return Object.keys(idx).map(Number)
      .sort(function (a, b) { return a - b; })
      .map(function (k) { return idx[k]; });
  }

  /** Entier (0 par défaut). */
  function num(v, dflt) {
    if (dflt === undefined) { dflt = 0; }
    if (v === null || v === undefined || v === "") { return dflt; }
    var n = parseFloat(String(v).replace(/\s/g, ""));
    if (isNaN(n)) { return dflt; }
    return n < 0 ? Math.ceil(n) : Math.floor(n);
  }

  /** Convertit la valeur brute en libellé lisible. */
  function lab(kind, value, dflt) {
    if (dflt === undefined) { dflt = ""; }
    if (value === null || value === undefined || value === "") { return dflt; }
    var map = LABELS[kind] || {};
    var k = String(value).trim().toLowerCase();
    return map[k] !== undefined ? map[k] : String(value).toUpperCase();
  }

  /** Miroir du filtre Jinja « %02d ». */
  function pad2(v) {
    var n = parseInt(v, 10);
    if (isNaN(n)) { return String(v === null || v === undefined ? "" : v).trim() || "00"; }
    return (n < 10 ? "0" : "") + n;
  }

  function txt(v, dflt) {
    if (v === null || v === undefined || String(v).trim() === "") {
      return dflt === undefined ? "" : dflt;
    }
    return String(v);
  }

  /* -----------------------------------------------------------------------
     CONSTRUCTION DU CONTEXTE DU RAPPORT
     ----------------------------------------------------------------------- */
  function buildContext(raw, opts) {
    opts = opts || {};
    raw = raw || {};
    var f = flatten(raw);

    /* --- A. Identification --- */
    var a = {
      nom_ecole: txt(val(f, "nom_ecole"), "—").toUpperCase(),
      statut: lab("statut", val(f, "statut"), "—"),
      date_creation: txt(val(f, "date_creation"), "—"),
      commune: txt(val(f, "commune"), "—").toUpperCase(),
      district: txt(val(f, "district"), "—").toUpperCase(),
      codec: txt(val(f, "codec"), "—").toUpperCase(),
      villages_polarises: txt(val(f, "villages_polarises"), "—"),
      langue_nationale: lab("langue", val(f, "langue_nationale"), "—")
    };

    /* --- B. Classes pédagogiques --- */
    var b = {
      nb_cours: num(val(f, "nb_cours")),
      nb_classes_simples: num(val(f, "nb_classes_simples")),
      nb_cmg: num(val(f, "nb_cmg")),
      nb_cdf: num(val(f, "nb_cdf")),
      cours_jumeles: txt(val(f, "cours_jumeles"), "NÉANT").toUpperCase(),
      cours_jumeles_cmg: txt(val(f, "cours_jumeles_cmg"), "NÉANT").toUpperCase(),
      cours_jumeles_cdf: txt(val(f, "cours_jumeles_cdf"), "NÉANT").toUpperCase()
    };

    /* --- C. Classes physiques --- */
    var c = {};
    ["salles_bonnes", "salles_acceptables", "salles_mauvaises",
     "salles_totale", "salles_utilisees", "salles_non_utilisees",
     "abris_provisoires", "a_rehabiliter", "cours_construction"
    ].forEach(function (k) { c[k] = num(val(f, k)); });
    c.programme_construction =
      txt(val(f, "programme_construction"), "NÉANT").toUpperCase();

    /* --- D. Directeur --- */
    var d = {
      prenom_nom: txt(val(f, "prenom_nom", "directeur"), "—").toUpperCase(),
      grade: txt(val(f, "grade", "directeur"), "—"),
      matricule: txt(val(f, "matricule", "directeur"), "—"),
      date_naissance: txt(val(f, "date_naissance"), "—"),
      lieu_naissance: txt(val(f, "lieu_naissance"), "—").toUpperCase(),
      diplome_academique: txt(val(f, "diplome_academique"), "—").toUpperCase(),
      diplome_professionnel: txt(val(f, "diplome_professionnel"), "—").toUpperCase(),
      date_entree_enseignement: txt(val(f, "date_entree_enseignement"), "—"),
      date_affectation: txt(val(f, "date_affectation"), "—"),
      references_affectation: txt(val(f, "references_affectation"), "—"),
      statut_directeur: txt(val(f, "statut_directeur"), "—").toUpperCase(),
      position: lab("oui_non", val(f, "position"), "—"),
      decharge: lab("oui_non", val(f, "decharge"), "—"),
      telephone1: txt(val(f, "telephone1"), "—"),
      telephone2: txt(val(f, "telephone2"), "—"),
      whatsapp: txt(val(f, "whatsapp"), "—")
    };

    /* --- E. Ouvrages annexes --- */
    var e = {
      toilettes: lab("oui_non", val(f, "toilettes"), "—"),
      nb_blocs: num(val(f, "nb_blocs")),
      nb_cabines: num(val(f, "nb_cabines")),
      cabines_fonctionnelles: num(val(f, "cabines_fonctionnelles")),
      cabines_non_fonctionnelles: num(val(f, "cabines_non_fonctionnelles")),
      bailleur_toilettes: txt(val(f, "bailleur_toilettes"), "NÉANT"),
      point_eau: lab("oui_non", val(f, "point_eau"), "—"),
      nb_robinets: num(val(f, "nb_robinets")),
      etat_point_eau: lab("etat", val(f, "etat_point_eau"), "—"),
      bailleur_point_eau: txt(val(f, "bailleur_point_eau"), "NÉANT"),
      puits: lab("oui_non", val(f, "puits"), "—"),
      etat_puits: lab("etat", val(f, "etat_puits"), "—"),
      bailleur_puits: txt(val(f, "bailleur_puits"), "NÉANT"),
      senelec: lab("oui_non", val(f, "senelec"), "—"),
      etat_electricite: lab("etat", val(f, "etat_electricite"), "—"),
      plaques_solaires: lab("oui_non", val(f, "plaques_solaires"), "—"),
      etat_plaques_solaires: lab("etat", val(f, "etat_plaques_solaires"), "—"),
      groupe_electrogene: lab("oui_non", val(f, "groupe_electrogene"), "—"),
      etat_groupe_electrogene: lab("etat", val(f, "etat_groupe_electrogene"), "—"),
      internet: lab("oui_non", val(f, "internet"), "—"),
      modem_wifi_men: lab("oui_non", val(f, "modem_wifi_men"), "—"),
      bureau: lab("oui_non", val(f, "bureau"), "—"),
      bailleur_bureau: txt(val(f, "bailleur_bureau"), "NÉANT"),
      magasin: lab("oui_non", val(f, "magasin"), "—"),
      bailleur_magasin: txt(val(f, "bailleur_magasin"), "NÉANT"),
      cloture: lab("oui_non", val(f, "cloture"), "—"),
      bailleur_cloture: txt(val(f, "bailleur_cloture"), "NÉANT"),
      cuisine: lab("oui_non", val(f, "cuisine"), "—"),
      bailleur_cuisine: txt(val(f, "bailleur_cuisine"), "NÉANT"),
      logement: lab("oui_non", val(f, "logement"), "—"),
      bailleur_logement: txt(val(f, "bailleur_logement"), "NÉANT")
    };

    /* --- F. Activités péri et para scolaires --- */
    var fa = {
      cge: lab("oui_non", val(f, "cge"), "—"),
      cge_date_mise_en_place: txt(val(f, "cge_date_mise_en_place"), "___/___/______"),
      cge_president: txt(val(f, "cge_president"), "—"),
      cge_tel: txt(val(f, "cge_tel"), "—"),
      cge_deux_mandats: lab("oui_non", val(f, "cge_deux_mandats"), "—"),
      programmes_intervenants: lab("oui_non", val(f, "programmes_intervenants"), "—"),
      programmes_intervenants_preciser: txt(val(f, "programmes_intervenants_preciser")),
      cantine: lab("oui_non", val(f, "cantine"), "—"),
      bailleur_cantine: txt(val(f, "bailleur_cantine"), "NÉANT"),
      cooperative: lab("oui_non", val(f, "cooperative"), "—"),
      jardin: lab("oui_non", val(f, "jardin"), "—"),
      bailleur_jardin: txt(val(f, "bailleur_jardin"), "NÉANT"),
      champ_communaute: lab("oui_non", val(f, "champ_communaute"), "—"),
      mallette_pedagogique: lab("oui_non", val(f, "mallette_pedagogique"), "—"),
      nb_mallettes: num(val(f, "nb_mallettes")),
      bibliotheque: lab("oui_non", val(f, "bibliotheque"), "—"),
      terrain_sport: lab("oui_non", val(f, "terrain_sport"), "—"),
      boite_pharmacie: lab("oui_non", val(f, "boite_pharmacie"), "—")
    };

    /* --- G. Observations --- */
    var g = {
      obs_materiel: txt(val(f, "obs_materiel")),
      obs_personnel: txt(val(f, "obs_personnel")),
      obs_pedagogique: txt(val(f, "obs_pedagogique"))
    };

    /* --- H. Personnel --- */
    function pers(item, idx) {
      return {
        num: num(item.num_ligne) || (idx + 1),
        prenom: txt(item.prenom).toUpperCase(),
        nom: txt(item.nom).toUpperCase(),
        grade: txt(item.grade),
        matricule: txt(item.matricule),
        discipline: lab("discipline", item.discipline),
        diplome_acad: txt(item.diplome_acad).toUpperCase(),
        diplome_prof: txt(item.diplome_prof).toUpperCase(),
        date_entree: txt(item.date_entree),
        date_affectation: txt(item.date_affectation),
        cours_tenu: txt(item.cours_tenu).toUpperCase(),
        contact: txt(item.contact)
      };
    }

    /* Lignes entièrement vides écartées (le PDF complète en lignes numérotées) */
    function nonVide(item) {
      return Object.keys(item).some(function (k) {
        var v = item[k];
        if (v === null || v === undefined || v === "") { return false; }
        if (typeof v === "number" && v === 0) { return false; }
        return true;
      });
    }
    var personnel = rows(f, "enseignant").filter(nonVide).map(pers);
    var suppleants = rows(f, "suppleant").filter(nonVide).map(pers);
    var malades = rows(f, "malade").filter(nonVide).map(pers);

    var rfKeys = ["inst_h", "inst_f", "inst_t", "inst_adj_h", "inst_adj_f",
                  "inst_adj_t", "mc_h", "mc_f", "mc_t"];
    var raKeys = ["arabe_inst_h", "arabe_inst_f", "arabe_inst_t",
                  "arabe_inst_adj_h", "arabe_inst_adj_f", "arabe_inst_adj_t",
                  "arabe_mc_h", "arabe_mc_f", "arabe_mc_t"];
    var recap_fr = {}, recap_ar = {};
    rfKeys.forEach(function (k) { recap_fr[k] = num(val(f, k, "recap_francais/")); });
    raKeys.forEach(function (k) { recap_ar[k] = num(val(f, k, "recap_arabe/")); });

    /* --- I. Effectifs --- */
    var totalKeys = ["eff_g", "eff_f", "eff_t", "red_g", "red_f", "red_t",
                     "hand_g", "hand_f", "hand_t",
                     "sans_etat_g", "sans_etat_f", "sans_etat_t"];
    var total = {};
    totalKeys.forEach(function (k) { total[k] = 0; });

    var effectifs = COURS.map(function (pair) {
      var grp = pair[0], label = pair[1];
      var row = { cours: label };
      totalKeys.forEach(function (k) {
        row[k] = num(val(f, k, grp + "/"));
        total[k] += row[k];
      });
      row.nb_classes = num(val(f, "nb_classes", grp + "/"));
      return row;
    });
    var total_row = { cours: "TOTAL" };
    totalKeys.forEach(function (k) { total_row[k] = total[k]; });

    /* --- J. Mobilier --- */
    var mobilier = MOBILIER.map(function (pair) {
      var grp = pair[0], label = pair[1];
      var inside = grp + "/";
      return {
        designation: label,
        bon: num(val(f, "bon", inside)),
        a_reparer: num(val(f, "a_reparer", inside)),
        total: num(val(f, "total", inside)),
        defecat: num(val(f, "defecat", inside))
      };
    });

    /* --- K, L, M, N. Manuels & matériel --- */
    function stuff(item) {
      return {
        titre: txt(item.titre || item.designation),
        quantite: num(item.quantite),
        provenance: lab("provenance", item.provenance, "—"),
        besoins: txt(item.besoins).trim(),
        observations: txt(item.observations)
      };
    }

    var manuels = rows(f, "manuel", "manuels").filter(nonVide).map(stuff);
    var autres_manuels = rows(f, "autre_manuel", "autres_manuels").filter(nonVide).map(stuff);
    var materiel = rows(f, "materiel", "materiel_didactique").filter(nonVide).map(stuff);
    var autres_materiels = rows(f, "autre_materiel", "autres_materiels").filter(nonVide).map(stuff);

    /* --- Méta --- */
    var soumission = opts.soumission || raw._submission_time || "";
    var parsed = new Date(String(soumission).replace("Z", "+00:00"));
    if (soumission && !isNaN(parsed.getTime())) {
      function z(n) { return (n < 10 ? "0" : "") + n; }
      soumission = z(parsed.getDate()) + "/" + z(parsed.getMonth() + 1) +
                   "/" + parsed.getFullYear() + " " + z(parsed.getHours()) +
                   ":" + z(parsed.getMinutes());
    } else {
      soumission = String(soumission || "—");
    }

    return {
      meta: {
        ecole: a.nom_ecole,
        annee: opts.annee || CFG.ANNEE || "2025/2026",
        soumission: soumission,
        id: opts.id !== undefined && opts.id !== null && opts.id !== ""
            ? opts.id : (raw._id || "—")
      },
      insp: {
        ministere: opts.ministere || CFG.MINISTERE || "",
        inspection: opts.inspection || CFG.INSPECTION || "",
        ief: opts.ief || CFG.IEF || ""
      },
      a: a, b: b, c: c, d: d, e: e, f: fa, g: g,
      personnel: personnel,
      suppleants: suppleants,
      malades: malades,
      recap_fr: recap_fr,
      recap_ar: recap_ar,
      effectifs: effectifs,
      effectifs_total: total_row,
      mobilier: mobilier,
      manuels: manuels,
      autres_manuels: autres_manuels,
      materiel: materiel,
      autres_materiels: autres_materiels
    };
  }

  /* -----------------------------------------------------------------------
     EXPORTS
     ----------------------------------------------------------------------- */
  global.RR = global.RR || {};
  global.RR.LABELS = LABELS;
  global.RR.MOBILIER = MOBILIER;
  global.RR.COURS = COURS;
  global.RR.flatten = flatten;
  global.RR.val = val;
  global.RR.rows = rows;
  global.RR.num = num;
  global.RR.lab = lab;
  global.RR.pad2 = pad2;
  global.RR.txt = txt;
  global.RR.buildContext = buildContext;

}(window));
