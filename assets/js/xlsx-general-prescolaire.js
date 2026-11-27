/* =========================================================================
   xlsx-general-prescolaire.js — Export XLSX du RAPPORT GÉNÉRAL PRÉSCOLAIRE
   -------------------------------------------------------------------------
   Reproduit le modèle officiel 9 feuilles « PRESCOLAIRE RG » :
     1. COURS ET EFFECTIFS
     2. SITUATION HANDICAPE
     3. SITUATION ELEVE SANS ETAT CIVIL
     4. LISTE DES PERSONNELS ENSEIGNANT
     5. LISTE DES PERSONNELS MALADES
     6. LISTE DES PERSONNELS SUPPLEANTS
     7. LISTE DES PERSONNELS SERVICE
     8. OUVRAGES ET ACTIVITES ANNEXES
     9. MOBILIERS ET EQUIPEMENTS
   Les en-têtes, fusions et largeurs viennent de
   assets/js/xlsx-modele-general-prescolaire.js (généré depuis le classeur
   officiel). Aucune feuille de titre n'est ajoutée : les en-têtes sont en
   haut, comme dans le modèle.

   Données : uniquement les rapports soumis, triés par commune puis école.
   Les sous-totaux « Total COM. … » et TOTAL GÉNÉRAL sont ajoutés sur les
   feuilles de synthèse. La feuille SUPPLEANTS reste vide (pas de tableau
   suppléants dans le formulaire).

   Chargé par l'Espace Inspection après :
     - assets/vendor/xlsx.full.min.js ;
     - assets/js/xlsx-modele-general-prescolaire.js ;
     - assets/js/rapport-general-prescolaire.js (contexte du rapport).
   Renvoie { nom, feuilles: 9 }.
   ========================================================================= */
(function (global) {
  "use strict";

  var CFG = global.RR_CONFIG || {};
  var MODELE = global.RR_MODELE_GENERAL_PRESCOLAIRE;

  /* --------------------------------------------------------------------
     Utilitaires
     -------------------------------------------------------------------- */
  function rangee(n) {
    var a = [];
    for (var i = 0; i < n; i++) { a.push(""); }
    return a;
  }

  function num(x) {
    var n = parseFloat(String(x === null || x === undefined ? "" : x).replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  /** Total = valeur déclarée, sinon G + F. */
  function tot(g, f, t) { return num(t) || (num(g) + num(f)); }

  function objet(o) { return o || {}; }

  function normaliser(s) {
    var t = String(s === null || s === undefined ? "" : s);
    if (t.normalize) { t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    return t.trim().toUpperCase();
  }

  function drapeau(v) {
    var s = normaliser(v);
    if (s === "OUI") { return 1; }
    if (s === "NON") { return 0; }
    return "";
  }

  function etatSain(v) {
    var s = normaliser(v);
    return s === "BON" || s === "ACCEPTABLE";
  }

  function etatMauvais(v) { return normaliser(v) === "MAUVAIS"; }

  function anneeDe(v) {
    var s = String(v === null || v === undefined ? "" : v);
    var m = s.match(/(\d{4})/);
    return m ? Number(m[1]) : "";
  }

  function statutEcole(v, nom) {
    var s = normaliser(v);
    if (s.indexOf("PUBLIC") === 0) { return "Pu"; }
    if (s.indexOf("PRIV") === 0) { return "Pr"; }
    if (s.indexOf("COMMUNAUT") === 0) { return "COM"; }
    var n = normaliser(nom);
    if (n.indexOf("CPCE") === 0) { return "COM"; }
    if (n.indexOf("CTP") === 0 || n.indexOf("EM") === 0) { return "Pu"; }
    return "";
  }

  function statutFlag(v, attendu) {
    var s = normaliser(v);
    if (!s || s === "—" || s === "NÉANT") { return ""; }
    return s === normaliser(attendu) ? 1 : 0;
  }

  function cleCommune(v) {
    var c = normaliser(v);
    if (!c || c === "—" || c === "-" || c === "0" || c === "NÉANT") {
      return "SANS COMMUNE";
    }
    return c;
  }

  function trier(xs) {
    return (xs || []).slice().sort(function (a, b) {
      if (a.commune !== b.commune) {
        if (a.commune === "SANS COMMUNE") { return 1; }
        if (b.commune === "SANS COMMUNE") { return -1; }
        return a.commune < b.commune ? -1 : 1;
      }
      return a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0;
    });
  }

  function grouper(xs) {
    var out = [], index = {};
    xs.forEach(function (x) {
      if (!index[x.commune]) {
        index[x.commune] = { commune: x.commune, ecoles: [] };
        out.push(index[x.commune]);
      }
      index[x.commune].ecoles.push(x);
    });
    return out;
  }

  /* --------------------------------------------------------------------
     Feuille : en-têtes du modèle + lignes + fusions + largeurs
     -------------------------------------------------------------------- */
  function entetes(m) {
    return (m.entetes || []).map(function (r) { return r.slice(); });
  }

  function versFusions(tab) {
    return (tab || []).map(function (m) {
      return { s: { r: m[0], c: m[1] }, e: { r: m[2], c: m[3] } };
    });
  }

  function feuilleModele(XLSX, m, lignes) {
    var aoa = entetes(m).concat(lignes || []);
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = (m.largeurs || []).map(function (w) {
      return { wch: (w === null || w === undefined) ? 8.43 : w };
    });
    if (m.merges && m.merges.length) {
      ws["!merges"] = versFusions(m.merges);
    }
    return ws;
  }

  function ligneSomme(lignes, debutSomme, nbColonnes, libelle) {
    var out = rangee(nbColonnes);
    out[1] = libelle;
    for (var c = debutSomme; c < nbColonnes; c++) {
      var somme = 0, vu = false;
      for (var i = 0; i < lignes.length; i++) {
        var v = lignes[i][c];
        if (typeof v === "number" && !isNaN(v)) { somme += v; vu = true; }
      }
      if (vu) { out[c] = somme; }
    }
    return out;
  }

  function corpsGroupe(xs, debutSomme, nbColonnes, fabrique) {
    var aoa = [], toutes = [];
    grouper(xs).forEach(function (g) {
      var lignes = g.ecoles.map(function (x, i) { return fabrique(x, i + 1); });
      toutes = toutes.concat(lignes);
      aoa = aoa.concat(lignes);
      aoa.push(ligneSomme(lignes, debutSomme, nbColonnes,
                          "Total COM. " + g.commune));
    });
    aoa.push(ligneSomme(toutes, debutSomme, nbColonnes, "TOTAL GÉNÉRAL"));
    return aoa;
  }

  /* --------------------------------------------------------------------
     Contexte du rapport général préscolaire
     -------------------------------------------------------------------- */
  function modeleRapport() {
    var M = (global.RR_MODELES || {})["general-prescolaire"] ||
            (global.RR || {}).generalPrescolaire;
    if (!M || !M.buildContext) {
      throw new Error("Modèle du rapport général préscolaire indisponible.");
    }
    return M;
  }

  function contexte(ligne) {
    return modeleRapport().buildContext(ligne.donnees || {}, {
      id: ligne.ecole_code,
      annee: ligne.annee || CFG.ANNEE,
      soumission: ligne.maj_le
    });
  }

  /* --------------------------------------------------------------------
     Données d'identification communes
     -------------------------------------------------------------------- */
  function identite(x, n, l) {
    l[0] = n;
    l[1] = x.nom;
    l[2] = anneeDe(x.ctx.a.date_creation);
    l[3] = statutEcole(x.ctx.a.statut, x.nom);
    return l;
  }

  /* --------------------------------------------------------------------
     1. COURS ET EFFECTIFS (111 colonnes)
     PS 4-19 | MS 20-35 | GS 36-51 | TOTAL 52-64 |
     personnel 65-110 (personnel, service, directeurs, non titulaires)
     -------------------------------------------------------------------- */
  var GROUPES_EFF = [
    ["eff_g", 1], ["eff_f", 2], ["eff_t", 3],
    ["pass_g", 4], ["pass_f", 5], ["pass_t", 6],
    ["red_g", 7], ["red_f", 8], ["red_t", 9],
    ["te_g", 10], ["te_f", 11], ["te_t", 12],
    ["ts_g", 13], ["ts_f", 14], ["ts_t", 15]
  ];

  function trio(l, pos, h, f, t) {
    l[pos] = num(h);
    l[pos + 1] = num(f);
    l[pos + 2] = tot(h, f, t);
  }

  function ligneCours(x, n) {
    var c = x.ctx, a = c.a, d = c.d;
    var rf = c.recap_fr || {}, ra = c.recap_ar || {};
    var l = rangee(MODELE.cours.nb);
    identite(x, n, l);

    /* PS / MS / GS. */
    var bases = [4, 20, 36];
    for (var i = 0; i < 3; i++) {
      var r = (c.effectifs || [])[i] || {};
      var base = bases[i];
      l[base] = num(r.nb_classes);
      GROUPES_EFF.forEach(function (g) {
        l[base + g[1]] = num(r[g[0]]);
      });
    }

    /* TOTAL ETABLISSEMENT : Nombre + effectifs + redoublants + transferts. */
    var t = c.effectifs_total || {};
    l[52] = num(t.nb_classes);
    l[53] = num(t.eff_g); l[54] = num(t.eff_f); l[55] = tot(t.eff_g, t.eff_f, t.eff_t);
    l[56] = num(t.red_g); l[57] = num(t.red_f); l[58] = tot(t.red_g, t.red_f, t.red_t);
    l[59] = num(t.te_g); l[60] = num(t.te_f); l[61] = tot(t.te_g, t.te_f, t.te_t);
    l[62] = num(t.ts_g); l[63] = num(t.ts_f); l[64] = tot(t.ts_g, t.ts_f, t.ts_t);

    /* Personnel FR / AR : instituteurs, adjoints, maîtres contractuels. */
    trio(l, 65, rf.inst_h, rf.inst_f, rf.inst_t);
    trio(l, 68, ra.arabe_inst_h, ra.arabe_inst_f, ra.arabe_inst_t);
    trio(l, 71, rf.inst_adj_h, rf.inst_adj_f, rf.inst_adj_t);
    trio(l, 74, ra.arabe_inst_adj_h, ra.arabe_inst_adj_f, ra.arabe_inst_adj_t);
    trio(l, 77, rf.mc_h, rf.mc_f, rf.mc_t);
    trio(l, 80, ra.arabe_mc_h, ra.arabe_mc_f, ra.arabe_mc_t);
    /* AUTRES : non collecté (83-88) → vide. */

    var frH = num(rf.inst_h) + num(rf.inst_adj_h) + num(rf.mc_h);
    var frF = num(rf.inst_f) + num(rf.inst_adj_f) + num(rf.mc_f);
    var arH = num(ra.arabe_inst_h) + num(ra.arabe_inst_adj_h) + num(ra.arabe_mc_h);
    var arF = num(ra.arabe_inst_f) + num(ra.arabe_inst_adj_f) + num(ra.arabe_mc_f);
    trio(l, 89, frH, frF);
    trio(l, 92, arH, arF);

    /* Personnel de service : H/F selon Sexe, T = nombre de lignes. */
    var svcH = 0, svcF = 0;
    (c.service || []).forEach(function (s) {
      var sexe = normaliser(s.sexe);
      if (sexe === "M") { svcH += 1; }
      else if (sexe === "F") { svcF += 1; }
    });
    l[95] = svcH;
    l[96] = svcF;
    l[97] = (c.service || []).length;

    /* Directeurs : sexe déduit du premier enseignant directeur/directrice. */
    var dir = (c.personnel || []).filter(function (p) {
      var f = normaliser(p.fonction);
      return f === "DIRECTEUR" || f === "DIRECTRICE";
    })[0];
    l[98] = (dir && normaliser(dir.sexe) === "M") ? 1 : "";
    l[99] = (dir && normaliser(dir.sexe) === "F") ? 1 : "";
    l[100] = drapeau(d.position);
    l[101] = drapeau(d.decharge);
    l[102] = statutFlag(d.statut_directeur, "TITULAIRE");
    l[103] = statutFlag(d.statut_directeur, "INTÉRIMAIRE");
    l[104] = "";
    l[105] = "";
    l[106] = "";
    l[107] = "";

    /* Non titulaires : suppléants non collectés, malades oui. */
    l[108] = "";
    l[109] = (c.malades || []).length;
    l[110] = "";

    /* `a` est conservé pour la lisibilité de l'identité. */
    void a;
    return l;
  }

  /* --------------------------------------------------------------------
     2. SITUATION HANDICAPE (100 colonnes)
     PS 4-27 | MS 28-51 | GS 52-75 | TOTAL 76-99
     -------------------------------------------------------------------- */
  var CATS_HAND = ["mot", "nv", "mv", "sd", "me", "di", "aut", "poly"];

  function ligneHandicape(x, n) {
    var l = rangee(MODELE.handicape.nb);
    identite(x, n, l);

    var bases = [4, 28, 52];
    for (var i = 0; i < 3; i++) {
      var r = (x.ctx.handicapes || [])[i] || {};
      CATS_HAND.forEach(function (c, j) {
        var base = bases[i] + j * 3;
        l[base] = num(r[c + "_g"]);
        l[base + 1] = num(r[c + "_f"]);
        l[base + 2] = num(r[c + "_t"]);
      });
    }

    var t = x.ctx.handicapes_total || {};
    CATS_HAND.forEach(function (c, j) {
      var base = 76 + j * 3;
      l[base] = num(t[c + "_g"]);
      l[base + 1] = num(t[c + "_f"]);
      l[base + 2] = num(t[c + "_t"]);
    });
    return l;
  }

  /* --------------------------------------------------------------------
     3. SITUATION ELEVE SANS ETAT CIVIL (22 colonnes)
     PS 4-6 | MS 7-9 | GS 10-12 | TOTAUX 13-21
     -------------------------------------------------------------------- */
  function ligneSansEtat(x, n) {
    var l = rangee(MODELE.sans_etat.nb);
    identite(x, n, l);
    var bases = [4, 7, 10];
    for (var i = 0; i < 3; i++) {
      var r = (x.ctx.effectifs || [])[i] || {};
      var base = bases[i];
      l[base] = num(r.sec_g);
      l[base + 1] = num(r.sec_f);
      l[base + 2] = num(r.sec_t);
      /* Bloc TOTAL ETABLISSEMENT : mêmes valeurs par section. */
      var tb = 13 + i * 3;
      l[tb] = l[base];
      l[tb + 1] = l[base + 1];
      l[tb + 2] = l[base + 2];
    }
    return l;
  }

  /* --------------------------------------------------------------------
     4 à 7. LISTES NOMINATIVES
     -------------------------------------------------------------------- */
  function lignesEnseignants(xs) {
    var aoa = [];
    xs.forEach(function (x) {
      (x.ctx.personnel || []).forEach(function (p, i) {
        aoa.push([
          i + 1, x.nom, p.prenom, p.nom, p.sexe, p.grade, p.matricule,
          p.fonction, p.discipline, p.diplome_acad, p.diplome_prof,
          p.date_entree, p.date_affectation, p.section_tenu, p.contact
        ]);
      });
    });
    return aoa;
  }

  function lignesMalades(xs) {
    var aoa = [];
    xs.forEach(function (x) {
      (x.ctx.malades || []).forEach(function (p, i) {
        aoa.push([
          i + 1, x.nom, p.prenom, p.nom, p.sexe, p.grade, p.matricule,
          p.fonction, p.discipline, p.diplome_acad, p.diplome_prof,
          p.date_entree, p.date_affectation, p.section_tenu, p.contact
        ]);
      });
    });
    return aoa;
  }

  function lignesService(xs) {
    var aoa = [];
    xs.forEach(function (x) {
      (x.ctx.service || []).forEach(function (s, i) {
        aoa.push([
          i + 1, x.nom, s.prenoms, s.noms, s.sexe, s.cni,
          s.date_affectation, s.employeur
        ]);
      });
    });
    return aoa;
  }

  /* --------------------------------------------------------------------
     8. OUVRAGES ET ACTIVITES ANNEXES (22 colonnes)
     -------------------------------------------------------------------- */
  function ligneOuvrages(x, n) {
    var c = x.ctx, cl = c.c || {}, e = c.e || {}, fa = c.fa || {};
    var l = rangee(MODELE.ouvrages.nb);
    l[0] = n;
    l[1] = x.nom;
    l[2] = num(cl.salles_total);
    l[3] = num(cl.a_rehabiliter);
    l[4] = num(cl.abris_provisoires);
    l[5] = num(e.nb_cabines);
    l[6] = num(e.cabines_fonctionnelles);
    l[7] = num(e.cabines_non_fonctionnelles);

    l[8] = num(e.robinet);
    l[9] = drapeau(e.puits);
    var fonct = 0, nonFonct = 0;
    if (normaliser(e.point_eau) === "OUI") {
      if (etatSain(e.etat_robinet)) { fonct += 1; }
      else if (etatMauvais(e.etat_robinet)) { nonFonct += 1; }
    }
    if (normaliser(e.puits) === "OUI") {
      if (etatSain(e.etat_puits)) { fonct += 1; }
      else if (etatMauvais(e.etat_puits)) { nonFonct += 1; }
    }
    l[10] = fonct;
    l[11] = nonFonct;

    l[12] = drapeau(e.senelec);
    l[13] = drapeau(e.plaques_solaires);
    l[14] = drapeau(e.bloc_admin);
    l[15] = drapeau(e.magasin);
    l[16] = drapeau(e.cloture);
    l[17] = drapeau(e.cuisine);
    l[18] = drapeau(e.logement);
    l[19] = drapeau(fa.cantine);
    l[20] = drapeau(fa.cooperative);
    l[21] = drapeau(fa.boite_pharmacie);
    return l;
  }

  /* --------------------------------------------------------------------
     9. MOBILIERS ET EQUIPEMENTS (66 colonnes)
     -------------------------------------------------------------------- */
  var MOB_MAP = [0, 1, 3, 4, 2, -1, 5, 6, 7, 8, 9, 10, -1, 14, 15, -1];

  function ligneMobilier(x, n) {
    var l = rangee(MODELE.mobiliers.nb);
    l[0] = n;
    l[1] = x.nom;
    MOB_MAP.forEach(function (idx, b) {
      var item = idx >= 0 ? (x.ctx.mobilier || [])[idx] : null;
      var base = 2 + b * 4;
      if (item) {
        l[base] = num(item.bon);
        l[base + 1] = num(item.a_reparer);
        l[base + 2] = num(item.total) || (num(item.bon) + num(item.a_reparer));
        l[base + 3] = num(item.deficit);
      } else {
        l[base] = 0;
        l[base + 1] = 0;
        l[base + 2] = 0;
        l[base + 3] = 0;
      }
    });
    return l;
  }

  /* --------------------------------------------------------------------
     Construction du classeur
     -------------------------------------------------------------------- */
  function creer(lignes) {
    var XLSX = global.XLSX;
    if (!XLSX) { throw new Error("Librairie XLSX absente"); }
    if (!MODELE || !MODELE.cours || !MODELE.handicape ||
        !MODELE.sans_etat || !MODELE.personnel_enseignant ||
        !MODELE.personnel_malades || !MODELE.personnel_suppleants ||
        !MODELE.personnel_service || !MODELE.ouvrages || !MODELE.mobiliers) {
      throw new Error("Modèle général préscolaire absent " +
                      "(assets/js/xlsx-modele-general-prescolaire.js).");
    }

    var xs = (lignes || []).map(function (r) {
      var ctx = contexte(r);
      return {
        ctx: ctx,
        brut: r.donnees || {},
        nom: String((ctx.meta && ctx.meta.ecole) || r.ecole_nom || "—")
          .trim().toUpperCase(),
        commune: cleCommune((ctx.a || {}).commune)
      };
    });
    if (!xs.length) { throw new Error("Aucun rapport à exporter"); }
    xs = trier(xs);

    var wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.cours,
        corpsGroupe(xs, 4, MODELE.cours.nb, ligneCours)),
      MODELE.cours.nom);

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.handicape,
        corpsGroupe(xs, 4, MODELE.handicape.nb, ligneHandicape)),
      MODELE.handicape.nom);

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.sans_etat,
        corpsGroupe(xs, 4, MODELE.sans_etat.nb, ligneSansEtat)),
      MODELE.sans_etat.nom);

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.personnel_enseignant,
        lignesEnseignants(xs)),
      MODELE.personnel_enseignant.nom);

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.personnel_malades,
        lignesMalades(xs)),
      MODELE.personnel_malades.nom);

    /* Pas de tableau suppléants dans le formulaire : feuille vide. */
    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.personnel_suppleants, []),
      MODELE.personnel_suppleants.nom);

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.personnel_service,
        lignesService(xs)),
      MODELE.personnel_service.nom);

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.ouvrages,
        corpsGroupe(xs, 2, MODELE.ouvrages.nb, ligneOuvrages)),
      MODELE.ouvrages.nom);

    XLSX.utils.book_append_sheet(wb,
      feuilleModele(XLSX, MODELE.mobiliers,
        corpsGroupe(xs, 2, MODELE.mobiliers.nb, ligneMobilier)),
      MODELE.mobiliers.nom);

    var annee = String(CFG.ANNEE || "2026/2027").replace("/", "-");
    var nom = "Rapport_General_Prescolaire_" + annee + ".xlsx";
    XLSX.writeFile(wb, nom);
    return { nom: nom, feuilles: 9 };
  }

  global.RR = global.RR || {};
  global.RR.xlsxGeneralPrescolaire = { creer: creer };

}(window));
