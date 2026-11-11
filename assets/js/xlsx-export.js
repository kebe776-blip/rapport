/* =========================================================================
   xlsx-export.js — Export XLSX de l'Espace Inspection (SheetJS local)
   -------------------------------------------------------------------------
   Construit un classeur de 8 feuilles à partir des rapports soumis :

     1. Identification              — une ligne par école (section A + D + méta)
     2. Effectifs et cours          — une ligne par école et par niveau (I)
     3. Type de classe              — modèle TYPE DE CLASSE
     4. Personnel enseignant        — modèle PERSONNELS ENSEIGNANT
     5. Liste du personnel          — modèle LISTE PERSONNELS (1 ligne / personne)
     6. Ouvrages annexes            — modèle OUVRAGES ET ACTIVITES ANNEXES
     7. Mobilier et équipements     — modèle MOBILIERS ET EQUIPEMENTS
     8. Manuels et matériel didact. — modèle MANUELS ET MATERIELS DIDACTIQUE

   Les feuilles 3 à 8 reprennent à l'identique les en-têtes, les fusions et
   les largeurs du fichier officiel (voir assets/js/xlsx-modele.js). On ne
   remplit que les colonnes du modèle qui ont un équivalent dans nos
   données : les colonnes non collectées (sexe, surplus/déficit, effectifs
   distinguant classe simple / multigrade…) restent vides, et les données
   sans colonne dans le modèle (Cahier PAAME, RELIT, planche
   d'alphabétisation, mobilier « Autres »…) sont ignorées.

   Les formules du modèle (=F8+G8, =SUM(…)) sont recalculées en JavaScript :
   les valeurs sont écrites comme des nombres, somables dans Excel.

   Pied de tableau des feuilles 3, 4, 6, 7 et 8 : une ligne
   « Total COM. <commune> » après chaque groupe d'écoles d'une même
   commune, puis une ligne « TOTAL GÉNÉRAL ». Aucune ligne ARRDT ni
   DEPARTEMENT.

   Les 8 feuilles sont triées par commune puis par nom d'école afin que la
   ligne N corresponde à la même école partout dans le classeur.

   Les valeurs numériques restent des nombres et les dates sont formatées
   en jj/mm/aaaa. Aucun CDN : SheetJS est vendorisé dans
   assets/vendor/xlsx.full.min.js.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR;
  var CFG = global.RR_CONFIG || {};
  var M = global.RR_MODELE || {};

  /* --------------------------------------------------------------------
     Utilitaires
     -------------------------------------------------------------------- */

  /** ISO (2026-09-14T10:20:00+00:00) → jj/mm/aaaa ; vide → "". */
  function dateFr(v) {
    if (v === null || v === undefined || v === "") { return ""; }
    var s = String(v);
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) { return m[3] + "/" + m[2] + "/" + m[1]; }
    return s;
  }

  /** Comparaison sans accents ni casse (appariement des titres de manuels). */
  function norm(s) {
    var t = (s === null || s === undefined) ? "" : String(s);
    if (t.normalize) { t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    return t.toLowerCase().replace(/\s+/g, " ").trim();
  }

  /** Ligne de n cellules vides. */
  function rangee(n) {
    var a = [];
    for (var i = 0; i < n; i++) { a.push(""); }
    return a;
  }

  /** [r0,c0,r1,c1] → objet de fusion attendu par SheetJS. */
  function versFusions(tab) {
    return (tab || []).map(function (m) {
      return { s: { r: m[0], c: m[1] }, e: { r: m[2], c: m[3] } };
    });
  }

  /** Feuille à partir d'un tableau de tableaux + largeurs + fusions. */
  function feuille(XLSX, aoa, largeurs, merges) {
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    if (largeurs && largeurs.length) {
      ws["!cols"] = largeurs.map(function (w) {
        return { wch: (w === null || w === undefined) ? 8.43 : w };
      });
    }
    if (merges && merges.length) { ws["!merges"] = merges; }
    return ws;
  }

  /* --------------------------------------------------------------------
     Squelette des feuilles reprises du modèle : 3 lignes de titre
     (Académie / IEF / titre de la feuille), lignes éventuellement vides,
     puis les lignes d'en-tête fusionnées du modèle.
     -------------------------------------------------------------------- */
  function squelette(modele) {
    var aoa = [
      [CFG.INSPECTION || "ACADEMIE DE KAOLACK"],
      [CFG.IEF || ""],
      [modele.titre || ""]
    ];
    var i;
    for (i = 0; i < modele.decalage; i++) { aoa.push([]); }
    for (i = 0; i < modele.entetes.length; i++) {
      aoa.push(modele.entetes[i].slice());
    }
    return aoa;
  }

  /** { aoa, largeurs, merges } prêts pour feuille(). */
  function modeleFeuille(modele, aoa) {
    return { aoa: aoa, largeurs: modele.largeurs,
             merges: versFusions(modele.merges) };
  }

  /* --------------------------------------------------------------------
     Regroupement par commune (sous-totaux)
     -------------------------------------------------------------------- */
  function cleCommune(x) {
    var c = (x && x.a && x.a.commune) || "";
    c = String(c).trim().toUpperCase();
    if (!c || c === "—" || c === "-" || c === "0") { return "SANS COMMUNE"; }
    return c;
  }

  /** Écoles triées par commune, puis par nom. */
  function trier(ctxs) {
    return (ctxs || []).slice().sort(function (a, b) {
      var ca = cleCommune(a), cb = cleCommune(b);
      if (ca !== cb) {
        if (ca === "SANS COMMUNE") { return 1; }
        if (cb === "SANS COMMUNE") { return -1; }
        return ca < cb ? -1 : 1;
      }
      var na = String((a.meta && a.meta.ecole) || "");
      var nb = String((b.meta && b.meta.ecole) || "");
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
  }

  /** Découpe en groupes contigus de même commune (ctxs déjà triés). */
  function grouper(ctxs) {
    var out = [], index = {};
    ctxs.forEach(function (x) {
      var c = cleCommune(x);
      if (!index[c]) { index[c] = { commune: c, ecoles: [] }; out.push(index[c]); }
      index[c].ecoles.push(x);
    });
    return out;
  }

  /**
   * Ligne de sous-total : colonne B = libellé, colonnes numériques sommées
   * (une colonne entièrement vide reste vide : on n'invente pas de 0).
   */
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

  /**
   * Corps d'une feuille « une ligne par école » : écoles groupées par
   * commune, ligne « Total COM. x » après chaque groupe, puis
   * « TOTAL GÉNÉRAL ».
   * @param {number} debutSomme — première colonne à sommer (les colonnes
   *   d'identification avant celle-ci restent vides dans les totaux).
   */
  function corpsGroupe(ctxs, debutSomme, nbColonnes, fabrique) {
    var aoa = [], toutes = [], n = 0;
    grouper(trier(ctxs)).forEach(function (g) {
      var lignes = g.ecoles.map(function (x) { n += 1; return fabrique(x, n); });
      toutes = toutes.concat(lignes);
      aoa = aoa.concat(lignes);
      aoa.push(ligneSomme(lignes, debutSomme, nbColonnes,
                          "Total COM. " + g.commune));
    });
    aoa.push(ligneSomme(toutes, debutSomme, nbColonnes, "TOTAL GÉNÉRAL"));
    return aoa;
  }

  /* --------------------------------------------------------------------
     1. Identification (A + D + méta)
     -------------------------------------------------------------------- */
  function feuilleIdentification(ctxs) {
    var tete = [
      "École", "CODEC", "Commune", "District", "Année", "Statut",
      "Langue nationale", "Villages polarisés", "Inspection", "IEF",
      "Directeur", "Grade", "Matricule", "Statut directeur",
      "Téléphone", "WhatsApp", "Soumis le", "Dernière maj."
    ];
    var lignes = ctxs.map(function (x) {
      return [
        x.a.nom_ecole, x.a.codec, x.a.commune, x.a.district,
        x.meta.annee, x.a.statut, x.a.langue_nationale,
        x.a.villages_polarises, x.insp.inspection, x.insp.ief,
        x.d.prenom_nom, x.d.grade, x.d.matricule, x.d.statut_directeur,
        x.d.telephone1, x.d.whatsapp, x.meta.soumission, x.meta.soumission
      ];
    });
    return [tete].concat(lignes);
  }

  /* --------------------------------------------------------------------
     2. Effectifs et cours (I) — modèle officiel :
        N° | Etablissement | par niveau (CI → CM2) : Nombre +
        EFFECTIFS (G/F/T) + REDOUBLANTS (G/F/T) + HANDICAPÉS (G/F/T) +
        SANS ÉTAT CIVIL (G/F/T), puis TOTAL ÉTABLISSEMENT (somme des
        6 niveaux). Une ligne par école, en-têtes fusionnés.
        Retourne { aoa, merges } — les fusions couvrent les 2 lignes
        d'en-tête.
     -------------------------------------------------------------------- */
  var GROUPES_EFF = ["EFFECTIFS", "REDOUBLANTS", "HANDICAPÉS",
                     "SANS ÉTAT CIVIL"];
  var COLS_NIVEAU = 1 + GROUPES_EFF.length * 3;   /* Nombre + 4×3 */

  function feuilleEffectifs(ctxs) {
    var merges = [];
    var aoa = [];

    /* --- Ligne 1 : N° / Etablissement + nom de chaque bloc --- */
    var r0 = ["N°", "Etablissement"];
    var r1 = ["", ""];
    var blocs = [];
    ctxs.forEach(function (x) {          /* niveaux réels du rapport */
      blocs.push(x.effectifs.map(function (r) { return r.cours; }));
    });
    var nomsBlocs = (blocs[0] || ["CI", "CP", "CE1", "CE2", "CM1", "CM2"])
      .concat(["TOTAL ÉTABLISSEMENT"]);

    nomsBlocs.forEach(function (nom) {
      r0.push(nom);
      for (var i = 1; i < COLS_NIVEAU; i++) { r0.push(""); }
      r1.push("Nombre");
      GROUPES_EFF.forEach(function (g) {
        r1.push(g, "", "");
      });
    });
    aoa.push(r0, r1);

    /* --- Fusions --- */
    merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });   /* N° */
    merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });   /* École */
    nomsBlocs.forEach(function (nom, b) {
      var c0 = 2 + b * COLS_NIVEAU;
      merges.push({ s: { r: 0, c: c0 }, e: { r: 0, c: c0 + COLS_NIVEAU - 1 } });
      GROUPES_EFF.forEach(function (g, gi) {
        var gs = c0 + 1 + gi * 3;                            /* Nombre puis groupes */
        merges.push({ s: { r: 1, c: gs }, e: { r: 1, c: gs + 2 } });
      });
    });

    /* --- Données : une ligne par école --- */
    ctxs.forEach(function (x, idx) {
      var ligne = [idx + 1, x.meta.ecole];
      var tot = { nb_classes: 0, eff_g: 0, eff_f: 0, eff_t: 0,
                  red_g: 0, red_f: 0, red_t: 0, hand_g: 0, hand_f: 0,
                  hand_t: 0, sans_etat_g: 0, sans_etat_f: 0,
                  sans_etat_t: 0 };
      var cles = Object.keys(tot);
      var niveaux = x.effectifs.concat([x.effectifs_total]);
      niveaux.forEach(function (r) {
        cles.forEach(function (k) {
          var v = r[k] || 0;
          ligne.push(v);
          if (r.cours !== "TOTAL") { tot[k] += v; }
        });
      });
      aoa.push(ligne);
    });

    /* --- Largeurs : N° + école, puis 7 blocs identiques --- */
    var largeurs = [5, 28];
    for (var b = 0; b < nomsBlocs.length; b++) {
      largeurs.push(8);                                  /* Nombre */
      for (var g = 0; g < GROUPES_EFF.length; g++) {
        largeurs.push(8, 8, 9);                          /* G, F, T */
      }
    }

    return { aoa: aoa, merges: merges, largeurs: largeurs };
  }

  /* --------------------------------------------------------------------
     3. Type de classe — colonnes du modèle (indices 0-based) :
        0 N° | 1 Etablissement | 2 Nombre de classes | 3 CL simples |
        4 CMG | 5 CDF | 6-11 CLASSES SIMPLES par niveau (non collecté) |
        12-26 15 combinaisons MULTIGRADES | 27-32 DOUBLE FLUX par niveau |
        33-167 effectifs par type de classe (non collectés) |
        168-170 TOTAL GENERAL ECOLE (G / F / T)
     -------------------------------------------------------------------- */
  var TC_MULTIGRADE = 12;            /* 12 → 26 : 15 combinaisons */
  var TC_DOUBLEFLUX = 27;            /* 27 → 32 : CI CP CE1 CE2 CM1 CM2 */
  var TC_TOT_G = 168, TC_TOT_F = 169, TC_TOT_T = 170;

  var NIVEAUX = ["CI", "CP", "CE1", "CE2", "CM1", "CM2"];
  var RE_NIVEAU = /\b(CI|CP|CE1|CE2|CM1|CM2)\b/g;

  /** Texte libre « CI/CP et CE1/CE2 » → groupes de niveaux. */
  function groupesNiveaux(texte) {
    if (!texte) { return []; }
    var t = String(texte).toUpperCase().trim();
    if (!t || /^N[ÉE]ANT$/.test(t) || t === "—") { return []; }
    return t.split(/\s*[,;\n\r|]|\s+ET\s+/)
      .map(function (s) { return s.match(RE_NIVEAU) || []; })
      .filter(function (niv) { return niv.length > 0; });
  }

  /** Paires de niveaux d'un groupe : « CI/CP » → ["CI","CP"]. */
  function pairesDuGroupe(niv) {
    var out = [];
    for (var i = 0; i + 1 < niv.length; i++) {
      var a = niv[i], b = niv[i + 1];
      var ia = NIVEAUX.indexOf(a), ib = NIVEAUX.indexOf(b);
      out.push(ia <= ib ? a + "/" + b : b + "/" + a);
    }
    return out;
  }

  function ligneTypeClasse(x, n) {
    var md = M.type_classe;
    var l = rangee(md.nb_colonnes);
    l[0] = n;
    l[1] = x.meta.ecole;
    l[2] = x.b.nb_cours;
    l[3] = x.b.nb_classes_simples;
    l[4] = x.b.nb_cmg;
    l[5] = x.b.nb_cdf;

    /* Cours jumelés CMG → 1 dans la colonne de la combinaison (coche). */
    var combos = md.entetes[1].slice(TC_MULTIGRADE,
                                     TC_MULTIGRADE + 15);
    groupesNiveaux(x.b.cours_jumeles_cmg).forEach(function (niv) {
      pairesDuGroupe(niv).forEach(function (p) {
        var i = combos.indexOf(p);
        if (i >= 0) { l[TC_MULTIGRADE + i] = 1; }
      });
    });

    /* Cours jumelés CDF → 1 dans chaque niveau concerné (coche). */
    groupesNiveaux(x.b.cours_jumeles_cdf).forEach(function (niv) {
      niv.forEach(function (lv) {
        var i = NIVEAUX.indexOf(lv);
        if (i >= 0) { l[TC_DOUBLEFLUX + i] = 1; }
      });
    });

    /* TOTAL GENERAL ECOLE = effectifs de l'école (section I). */
    l[TC_TOT_G] = x.effectifs_total.eff_g;
    l[TC_TOT_F] = x.effectifs_total.eff_f;
    l[TC_TOT_T] = x.effectifs_total.eff_t;
    return l;
  }

  function feuilleTypeClasse(ctxs) {
    var md = M.type_classe;
    var aoa = squelette(md);
    corpsGroupe(ctxs, 2, md.nb_colonnes, ligneTypeClasse)
      .forEach(function (r) { aoa.push(r); });
    return modeleFeuille(md, aoa);
  }

  /* --------------------------------------------------------------------
     4. Personnel enseignant — colonnes du modèle :
        0 N° | 1 Etablissement | 2 Statut | 3 Nbre cours |
        4-9   INSTITUTEURS (FR puis AR : H / F / Total)
        10-15 INSTITUTEURS ADJOINTS
        16-21 MAITRES CONTRACTUELS
        22-27 AUTRES (non collecté)
        28-33 TOTAL PERSONNEL (recalculé comme dans le modèle)
        34-43 DIRECTEURS (Homme, Femme, Chargé, Déchargé, Titulaire,
               Interimaire, Institut., Instit. Adjt, MC, Autre)
        44-46 NON TITULAIRES DE CLASSE (Supléant, Malade, Congé Mat.)
        47-48 SURPLUS (FR / AR) | 49-50 DEFICIT (FR / AR)
     -------------------------------------------------------------------- */
  function drapeau(v) {
    var s = String(v || "").toUpperCase();
    if (s === "OUI") { return 1; }
    if (s === "NON") { return 0; }
    return "";
  }

  function drapeauStatut(v, attendu) {
    var s = norm(v);
    if (!s || s === "—") { return ""; }
    return s === norm(attendu) ? 1 : 0;
  }

  function statutAbbr(v) {
    var s = String(v || "").toUpperCase().trim();
    if (s === "PUBLIC") { return "Pu"; }
    if (s === "PRIVÉ" || s === "PRIVE") { return "Pr"; }
    if (s === "COMMUNAUTAIRE") { return "Com"; }
    return (!s || s === "—") ? "" : v;
  }

  function lignePersonnel(x, n) {
    var md = M.personnel;
    var l = rangee(md.nb_colonnes);
    var rf = x.recap_fr, ra = x.recap_ar;

    l[0] = n;
    l[1] = x.meta.ecole;
    l[2] = statutAbbr(x.a.statut);
    l[3] = x.b.nb_cours;

    /* INSTITUTEURS : Français puis Arabe */
    l[4] = rf.inst_h; l[5] = rf.inst_f; l[6] = l[4] + l[5];
    l[7] = ra.arabe_inst_h; l[8] = ra.arabe_inst_f; l[9] = l[7] + l[8];
    /* INSTITUTEURS ADJOINTS */
    l[10] = rf.inst_adj_h; l[11] = rf.inst_adj_f; l[12] = l[10] + l[11];
    l[13] = ra.arabe_inst_adj_h; l[14] = ra.arabe_inst_adj_f;
    l[15] = l[13] + l[14];
    /* MAITRES CONTRACTUELS */
    l[16] = rf.mc_h; l[17] = rf.mc_f; l[18] = l[16] + l[17];
    l[19] = ra.arabe_mc_h; l[20] = ra.arabe_mc_f; l[21] = l[19] + l[20];
    /* AUTRES (22-27) : non collecté → vide */

    /* TOTAL PERSONNEL : même calcul que les formules du modèle */
    l[28] = l[4] + l[10] + l[16];
    l[29] = l[5] + l[11] + l[17];
    l[30] = l[28] + l[29];
    l[31] = l[7] + l[13] + l[19];
    l[32] = l[8] + l[14] + l[20];
    l[33] = l[31] + l[32];

    /* DIRECTEURS : 1 directeur par école → indicateurs 0 / 1 */
    l[36] = drapeau(x.d.position);            /* Chargé */
    l[37] = drapeau(x.d.decharge);            /* Déchargé */
    l[38] = drapeauStatut(x.d.statut_directeur, "TITULAIRE");
    l[39] = drapeauStatut(x.d.statut_directeur, "INTÉRIMAIRE");
    /* Homme / Femme / fonction du directeur : non collectés → vide */

    /* NON TITULAIRES DE CLASSE */
    l[44] = x.suppleants.length;
    l[45] = x.malades.length;
    /* Congé Maternité : non distingué des malades → vide */
    /* SURPLUS (47-48) et DEFICIT (49-50) : non collectés → vide */
    return l;
  }

  function feuillePersonnel(ctxs) {
    var md = M.personnel;
    var aoa = squelette(md);
    corpsGroupe(ctxs, 3, md.nb_colonnes, lignePersonnel)
      .forEach(function (r) { aoa.push(r); });
    return modeleFeuille(md, aoa);
  }

  /* --------------------------------------------------------------------
     5. Liste du personnel — une ligne par personne, colonnes du modèle
        (SEXE, Colonne1 et Colonne2 ne sont pas collectés → vides).
     -------------------------------------------------------------------- */
  var BLOCS_LISTE = [
    ["ENSEIGNANT", "personnel"],
    ["SUPPLÉANT", "suppleants"],
    ["MALADE / CONGÉ", "malades"]
  ];

  function feuilleListePersonnel(ctxs) {
    var md = M.liste_personnel;
    var aoa = squelette(md);
    var n = 0;
    trier(ctxs).forEach(function (x) {
      BLOCS_LISTE.forEach(function (bloc) {
        (x[bloc[1]] || []).forEach(function (p) {
          n += 1;
          aoa.push([
            n, x.meta.ecole, p.prenom, p.nom, "", p.grade, p.matricule,
            bloc[0], p.discipline, p.diplome_acad, p.diplome_prof,
            dateFr(p.date_entree), dateFr(p.date_affectation),
            p.cours_tenu, p.contact, "", ""
          ]);
        });
      });
    });
    return modeleFeuille(md, aoa);
  }

  /* --------------------------------------------------------------------
     6. Ouvrages annexes — colonnes du modèle (indices 0-based) :
        2 Classes en dur | 3 Utilisées | 4 Non utilisées |
        5 Abris provisoires | 6 A Réhabiliter |
        7-9 BLOCS D'HYGIENE (Nbre cabines / Fonct. / Non fonct.) |
        10-13 POINT D'EAU (Robinet / Puits / Fonct. / Non fonct.) |
        14-15 ELECTRICITE (Réseau / Solaire) |
        16-26 activités para-scolaires (OUI/NON)
     -------------------------------------------------------------------- */
  function ligneOuvrages(x, n) {
    var md = M.ouvrages;
    var l = rangee(md.nb_colonnes);
    var c = x.c, e = x.e, f = x.f;
    l[0] = n;
    l[1] = x.meta.ecole;
    l[2] = c.salles_totale;
    l[3] = c.salles_utilisees;
    l[4] = c.salles_non_utilisees;
    l[5] = c.abris_provisoires;
    l[6] = c.a_rehabiliter;
    l[7] = e.nb_cabines;
    l[8] = e.cabines_fonctionnelles;
    l[9] = e.cabines_non_fonctionnelles;
    l[10] = e.nb_robinets;
    l[11] = e.puits;                     /* OUI / NON (pas un décompte) */
    /* 12-13 Puits fonctionnel / non fonctionnel : non collectés → vide */
    l[14] = e.senelec;
    l[15] = e.plaques_solaires;
    l[16] = e.bureau;
    l[17] = e.magasin;
    l[18] = e.cloture;
    l[19] = e.cuisine;
    l[20] = f.cantine;
    l[21] = f.cooperative;
    l[22] = f.jardin;
    l[23] = f.mallette_pedagogique;
    l[24] = f.bibliotheque;
    l[25] = f.terrain_sport;
    l[26] = f.boite_pharmacie;
    return l;
  }

  function feuilleOuvrages(ctxs) {
    var md = M.ouvrages;
    var aoa = squelette(md);
    corpsGroupe(ctxs, 2, md.nb_colonnes, ligneOuvrages)
      .forEach(function (r) { aoa.push(r); });
    return modeleFeuille(md, aoa);
  }

  /* --------------------------------------------------------------------
     7. Mobilier et équipements — 10 blocs de 4 colonnes
        (Bon / À réparer / Total / Déficit) à partir de la colonne 2.
        « Total » = Bon + À réparer (la formule du modèle, calculée en JS).
        La ligne « Autres » du mobilier n'a pas de colonne : ignorée.
     -------------------------------------------------------------------- */
  var MOB_BLOCS = 10;

  function ligneMobilier(x, n) {
    var md = M.mobilier;
    var l = rangee(md.nb_colonnes);
    l[0] = n;
    l[1] = x.meta.ecole;
    for (var b = 0; b < MOB_BLOCS; b++) {
      var m = x.mobilier[b] || { bon: 0, a_reparer: 0, total: 0, defecat: 0 };
      var base = 2 + b * 4;
      l[base] = m.bon;
      l[base + 1] = m.a_reparer;
      l[base + 2] = (m.total > 0 ? m.total : (m.bon + m.a_reparer));
      l[base + 3] = m.defecat;
    }
    return l;
  }

  function feuilleMobilier(ctxs) {
    var md = M.mobilier;
    var aoa = squelette(md);
    corpsGroupe(ctxs, 2, md.nb_colonnes, ligneMobilier)
      .forEach(function (r) { aoa.push(r); });
    return modeleFeuille(md, aoa);
  }

  /* --------------------------------------------------------------------
     8. Manuels et matériel didactique — 44 colonnes :
        0 N° | 1 Etablissement | 2 Année de création | 3 Statut |
        4-29  26 colonnes de manuels | 30-43 14 désignations de matériel.

        Appariement des titres de notre formulaire (section K) sur les
        colonnes du modèle :
          - « Mathematiques CI » → « Maths CI », « Langue et
            communication CI » → « Français CI », idem CP ;
          - les guides CI et CP sont fusionnés dans la colonne « … CI/CP » ;
          - « Guide Mathematiques CM » → « Guide Maths CM1/CM2 », idem
            pour les guides Langue et Découverte du monde ;
          - un titre couvrant CM1 ET CM2 (Mathematiques CM, Langue et
            communication CM, Decouvertte du monde CM) est partagé en deux
            sur les colonnes CM1 / CM2 (le total reste inchangé) ;
          - « Guide revise 1ere etape » + « 2eme etape » → « Guide révisé » ;
          - les titres hors modèle (Cahier PAAME, RELIT, planche
            d'alphabétisation) sont ignorés, et les colonnes sans équivalent
            (Maths/Français CE1 et CE2, Dictionnaire…) restent vides.
        Les 14 désignations de matériel (AE → AR) correspondent exactement
        à DESIGNATIONS_MATERIEL.
     -------------------------------------------------------------------- */
  var MANUELS_SOMME = {
    "4": ["Mathematiques CI"],
    "5": ["Langue et communication CI"],
    "6": ["Mathematiques CP"],
    "7": ["Langue et communication CP"],
    "8": ["Guide Mathematiques CI", "Guide Mathematiques CP"],
    "9": ["Guide L C CI", "Guide L C CP"],
    "25": ["Guide Mathematiques CM"],
    "26": ["Guide L C CM"],
    "27": ["Guide Decouverte du monde CM"],
    "28": ["Guide revise 1ere etape", "Guide revise 2eme etape"]
  };

  var MANUELS_PARTAGE = [
    { src: "Mathematiques CM", cols: [19, 21] },           /* Maths CM1/CM2 */
    { src: "Langue et communication CM", cols: [20, 22] }, /* Français CM1/CM2 */
    { src: "Decouvertte du monde CM", cols: [23, 24] }     /* Déc. CM1/CM2 */
  ];

  var MAT_DEBUT = 30;   /* première colonne de matériel (Equerre) */

  function annee(v) {
    var s = (v === null || v === undefined) ? "" : String(v).trim();
    if (!s || s === "—" || s === "-") { return ""; }
    var m = s.match(/(\d{4})/);
    return m ? Number(m[1]) : s;
  }

  function ligneManuels(x, n) {
    var md = M.manuels;
    var l = rangee(md.nb_colonnes);
    l[0] = n;
    l[1] = x.meta.ecole;
    l[2] = annee(x.a.date_creation);
    l[3] = statutAbbr(x.a.statut);

    var q = {}, qm = {};
    x.manuels.forEach(function (it) { q[norm(it.titre)] = it.quantite; });
    x.materiel.forEach(function (it) { qm[norm(it.titre)] = it.quantite; });

    Object.keys(MANUELS_SOMME).forEach(function (c) {
      var somme = 0, vu = false;
      MANUELS_SOMME[c].forEach(function (t) {
        var v = q[norm(t)];
        if (v !== undefined) { somme += v; vu = true; }
      });
      if (vu) { l[Number(c)] = somme; }
    });

    MANUELS_PARTAGE.forEach(function (p) {
      var v = q[norm(p.src)];
      if (v === undefined) { return; }
      var premier = Math.ceil(v / 2);
      l[p.cols[0]] = premier;
      l[p.cols[1]] = v - premier;
    });

    for (var c = MAT_DEBUT; c < md.nb_colonnes; c++) {
      var v = qm[norm(md.entetes[0][c])];
      if (v !== undefined) { l[c] = v; }
    }
    return l;
  }

  function feuilleManuels(ctxs) {
    var md = M.manuels;
    var aoa = squelette(md);
    corpsGroupe(ctxs, 4, md.nb_colonnes, ligneManuels)
      .forEach(function (r) { aoa.push(r); });
    return modeleFeuille(md, aoa);
  }

  /* --------------------------------------------------------------------
     Construction du classeur complet
     -------------------------------------------------------------------- */

  /**
   * @param {Array} lignes — lignes complètes de la table `rapports`
   *                         (select("*") : ecole_code, donnees, maj_le…)
   * @returns {string} nom du fichier téléchargé.
   */
  function creer(lignes) {
    var XLSX = global.XLSX;
    if (!XLSX) { throw new Error("Librairie XLSX absente"); }
    if (!M.type_classe) {
      throw new Error("En-têtes du modèle absents (assets/js/xlsx-modele.js)");
    }

    var ctxs = (lignes || []).map(function (l) {
      return R.buildContext(l.donnees, {
        id: l.ecole_code,
        annee: l.annee || CFG.ANNEE,
        soumission: l.maj_le
      });
    });
    if (!ctxs.length) { throw new Error("Aucun rapport à exporter"); }
    ctxs = trier(ctxs);                 /* même ordre dans les 8 feuilles */

    var wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb,
      feuille(XLSX, feuilleIdentification(ctxs),
              [26, 14, 14, 14, 10, 9, 15, 24, 30, 34, 24, 10, 12, 15,
               15, 15, 14, 14]),
      "1. Identification");

    XLSX.utils.book_append_sheet(wb,
      (function () {
        var eff = feuilleEffectifs(ctxs);
        return feuille(XLSX, eff.aoa, eff.largeurs, eff.merges);
      })(),
      "2. Effectifs et cours");

    var neuves = [
      ["3. Type de classe", feuilleTypeClasse],
      ["4. Personnel enseignant", feuillePersonnel],
      ["5. Liste du personnel", feuilleListePersonnel],
      ["6. Ouvrages annexes", feuilleOuvrages],
      ["7. Mobilier et équipements", feuilleMobilier],
      ["8. Manuels et matériel didact.", feuilleManuels]
    ];
    neuves.forEach(function (p) {
      var f = p[1](ctxs);
      XLSX.utils.book_append_sheet(wb,
        feuille(XLSX, f.aoa, f.largeurs, f.merges), p[0]);
    });

    var anneeCfg = String(CFG.ANNEE || "2026/2027").replace("/", "-");
    var nom = "Rapport_Rentree_" + anneeCfg + ".xlsx";
    XLSX.writeFile(wb, nom);
    return nom;
  }

  global.RR = global.RR || {};
  global.RR.xlsx = { creer: creer };

}(window));
