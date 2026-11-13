/* =========================================================================
   xlsx-succinct.js — Export XLSX du modèle OFFICIEL 3 feuilles (préscolaire)
   -------------------------------------------------------------------------
   Reproduit « STRUCTURES ET EFFECTIFS PRESCOLAIRE … RG.xlsx » :
     1. COURS ET EFFECTIFS           — 78 colonnes (effectifs + personnel)
     2. OUVRAGES ET ACTIVITES ANNEXES — 22 colonnes (salles, eau, élec…)
     3. MOBILIERS ET EQUIPEMENTS     — 66 colonnes (16 rubriques × 4)
   Les en-têtes, les fusions d'en-tête et les titres sont copiés VERBATIM
   du fichier modèle (injectés ci-dessous, aucune librairie externe) ;
   seules les lignes de données sont reconstruites à partir des rapports.
   Sous-totaux « Total COM. x » par commune + TOTAL GÉNÉRAL (même logique
   que l'export élémentaire : corpsGroupe / ligneSomme).
   -------------------------------------------------------------------------
   Chargé à la demande par l'Espace Inspection (config.js : xlsx_js),
   après assets/vendor/xlsx.full.min.js. Renvoie { nom, feuilles: 3 }.
   ========================================================================= */
(function (global) {
  "use strict";

  var CFG = global.RR_CONFIG || {};

  /* En-têtes + fusions du modèle officiel (générés depuis le fichier modèle). */
  var MODELE = {"cours":{"nom":"COURS ET EFFECTIFS","titre":"FEUILLE DE SYNTHESE DES EFFECTIFS DE L'ENSEIGNEMENT PRESCOLAIRE","decalage":1,"entetes":[["N°","Etablissement","Année de création","Statut","PETITE SECTION","","","","","","","MOYENNE SECTION","","","","","","","GRANDE SECTION","","","","","","","TOTAL ETABLISSEMENT","","","","","","","INSTITUTEURS","","","","","","INSTITUTEURS ADJOINTS","","","","","","MAITRES CONTRACTUELS","","","","","","AUTRES","","","","","","TOTAL PERSONNEL","","","","","","PERSONNEL DE SERVICE","","","DIRECTEURS","","","","","","","","","","PERSONNELS NON TITULAIRES DE CLASSE","",""],["","","","","Nombre","EFFECTIFS","","","HANDICAPES","","","Nombre","EFFECTIFS","","","HANDICAPES","","","Nombre","EFFECTIFS","","","HANDICAPES","","","Nombre","EFFECTIFS","","","HANDICAPES","","","Français","","","Arabe","","","Français","","","Arabe","","","Français","","","Arabe","","","Français","","","Arabe","","","Français","","","Arabe","","","","","","","","","","","","","","","","","",""],["","","","","","Garçons","Filles","Total","Garçons","Filles","Total","","Garçons","Filles","Total","Garçons","Filles","Total","","Garçons","Filles","Total","Garçons","Filles","Total","","Garçons","Filles","Total","Garçons","Filles","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Homme","Femme","Chargé","Déchargé","Titulaire","Interimaire","Institut.","Instit. Adjt","MC","Autre","Supléant","Malade","Congé Mat."]],"merges":[[4,62,5,64],[4,75,5,77],[5,32,5,34],[5,35,5,37],[5,38,5,40],[5,41,5,43],[5,44,5,46],[5,47,5,49],[5,56,5,58],[5,59,5,61],[4,32,4,37],[4,38,4,43],[4,44,4,49],[4,56,4,61],[4,65,5,74],[4,50,4,55],[5,50,5,52],[5,53,5,55],[5,22,5,24],[5,18,6,18],[5,11,6,11],[4,11,4,17],[4,18,4,24],[5,25,6,25],[5,19,5,21],[5,12,5,14],[5,15,5,17],[4,25,4,31],[5,26,5,28],[5,29,5,31],[4,3,6,3],[5,5,5,7],[5,8,5,10],[5,4,6,4],[4,4,4,10],[4,0,6,0],[4,2,6,2],[4,1,6,1]],"nb":78},"ouvrages":{"nom":"OUVRAGES ET ACTIVITES ANNEXES","titre":"FEUILLE DE SYNTHESE DES OUVRAGES ANNEXES","decalage":1,"entetes":[["N°","Etablissement","SALLES D'ACTIVITES","","","BLOS D'HYGIENE","","","POINT D'EAU","","","","ELECTRICITE","","Bloc Administ.","Magasin","Clôture","Cuisine","Logement","Cantine","Coopérative scolaire","Boite pharmacie"],["","","En dur","A réhabiliter","Abris provisoire","Nbre Cabines","Fonct.","Non fonct.","Robinet","Puits","Fonct.","Non fonct.","Réseau","Solaire","","","","","","","",""]],"merges":[[4,0,5,0],[4,1,5,1],[4,2,4,4],[4,8,4,11],[4,21,5,21],[4,19,5,19],[4,20,5,20],[4,17,5,17],[4,18,5,18],[4,12,4,13],[4,14,5,14],[4,15,5,15],[4,16,5,16],[4,5,4,7]],"nb":22},"mobiliers":{"nom":"MOBILIERS ET EQUIPEMENTS","titre":"FEUILLE DE SYNTHESE SUR LE MOBILIER ET LES EQUIPEMENTS","decalage":1,"entetes":[["N°","Etablissement","TABLES BANCS","","","","TABLES BUREAUX MAITRE","","","","CHAISES MAITRES","","","","CHAISES EFANTS","","","","TABLES POUR EFANTS","","","","NATTES","","","","ARMOIRES","","","","PLACARDS","","","","TABLEAUX","","","","ORDINATEURS","","","","IMPRIMANTES","","","","Téléviseur","","","","JOUETS POUR ENFANTS","","","","BALANCOIRES","","","","TOBOGANS","","","","TOURNIQUETS","","",""],["","","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit"]],"merges":[[4,0,5,0],[4,1,5,1],[4,2,4,5],[4,6,4,9],[4,50,4,53],[4,10,4,13],[4,26,4,29],[4,30,4,33],[4,14,4,17],[4,34,4,37],[4,38,4,41],[4,42,4,45],[4,18,4,21],[4,62,4,65],[4,22,4,25],[4,58,4,61],[4,54,4,57],[4,46,4,49]],"nb":66}};

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

  /** OUI / NON du formulaire → 1 / 0 (non répondu → ""). */
  function drapeau(v) {
    var s = String(v === null || v === undefined ? "" : v).trim().toLowerCase();
    if (s === "oui") { return 1; }
    if (s === "non") { return 0; }
    return "";
  }

  /** Préfixe de l'école → Statut du modèle : CPCE = COM, CTP / EM = Pu. */
  function statutDe(nom) {
    var n = String(nom || "").trim().toUpperCase();
    if (n.indexOf("CPCE") === 0) { return "COM"; }
    if (n.indexOf("CTP") === 0 || n.indexOf("EM") === 0) { return "Pu"; }
    return "";
  }

  /** 1 si la cellule « Prénoms, Nom, Matricule et Grade » est renseignée. */
  function maitrePresent(o) {
    return String((o && o.m_prenoms) || "").trim() ? 1 : 0;
  }

  /* --- Commune (clé de regroupement, comme l'export élémentaire) --- */
  function cleCommune(v) {
    var c = String(v === null || v === undefined ? "" : v).trim().toUpperCase();
    if (!c || c === "—" || c === "-" || c === "0" || c === "NÉANT") {
      return "SANS COMMUNE";
    }
    return c;
  }

  /** Écoles triées par commune, puis par nom. */
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

  /** Groupes contigus de même commune (xs déjà triés). */
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
     Feuilles : squelette (3 lignes de titre + décalage + en-têtes du
     modèle), fusions d'en-tête et largeurs
     -------------------------------------------------------------------- */
  function squelette(m) {
    var aoa = [
      [CFG.INSPECTION || "ACADEMIE DE KAOLACK"],
      [CFG.IEF || ""],
      [m.titre || ""]
    ];
    var i;
    for (i = 0; i < m.decalage; i++) { aoa.push([]); }
    for (i = 0; i < m.entetes.length; i++) { aoa.push(m.entetes[i].slice()); }
    return aoa;
  }

  function versFusions(tab) {
    return (tab || []).map(function (m) {
      return { s: { r: m[0], c: m[1] }, e: { r: m[2], c: m[3] } };
    });
  }

  /** Largeurs : N° étroit, Etablissement large, le reste en nombres. */
  function largeurs(n, avecAnnee) {
    var a = [5, 34];
    if (avecAnnee) { a.push(12, 8); }        /* Année de création + Statut */
    while (a.length < n) { a.push(8); }
    return a;
  }

  function feuille(XLSX, aoa, larg, merges) {
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = larg.map(function (w) { return { wch: w }; });
    if (merges && merges.length) { ws["!merges"] = merges; }
    return ws;
  }

  /* --------------------------------------------------------------------
     Sous-totaux — même logique que xlsx-export.js :
     « Total COM. x » après chaque commune, puis TOTAL GÉNÉRAL.
     Une colonne entièrement vide reste vide : on n'invente pas de 0.
     -------------------------------------------------------------------- */
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

  /** Corps « une ligne par école » : le N° repart à 1 dans chaque commune. */
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
     1. COURS ET EFFECTIFS (78 colonnes)
        0 N° | 1 Etablissement | 2 Année de création | 3 Statut
        4-10 PS, 11-17 MS, 18-24 GS, 25-31 TOTAL (Nombre + Eff G/F/T +
        Hand G/F/T) | 32-61 personnel FR/Arabe par catégorie |
        62-64 Service H/F/T | 65-74 Directeurs | 75-77 Non titulaires
     -------------------------------------------------------------------- */
  function ligneCours(x, n) {
    var d = x.d, l = rangee(MODELE.cours.nb);
    var loc = objet(d.locaux), eff = objet(d.effectifs), pers = objet(d.personnel);
    var dir = objet(d.directeur);
    var ar = objet(pers.arabe), se = objet(pers.service);
    var tv = objet(eff.total);

    l[0] = n;
    l[1] = x.nom;
    l[2] = "";                             /* Année de création : non collectée */
    l[3] = statutDe(x.nom);                /* Pu / COM selon le préfixe */

    /* PS / MS / GS — Nombre par niveau non collecté (vide) ;
       HANDICAPÉS : noms sur le PDF, pas de décompte → vide. */
    var debuts = { ps: 4, ms: 11, gs: 18 };
    ["ps", "ms", "gs"].forEach(function (k) {
      var o = objet(eff[k]), b = debuts[k];
      l[b] = "";
      l[b + 1] = num(o.g);
      l[b + 2] = num(o.f);
      l[b + 3] = tot(o.g, o.f, o.t);
      l[b + 4] = ""; l[b + 5] = ""; l[b + 6] = "";
    });

    /* TOTAL ETABLISSEMENT — Nombre = nombre de sections (locaux) ;
       effectifs total déclarés, sinon somme des 3 niveaux. */
    var g = 0, f = 0;
    ["ps", "ms", "gs"].forEach(function (k) {
      var o = objet(eff[k]);
      g += num(o.g);
      f += num(o.f);
    });
    if (!g && !f) { g = num(tv.g); f = num(tv.f); }
    l[25] = num(loc.nb_sections);
    l[26] = g;
    l[27] = f;
    l[28] = num(tv.t) || (g + f);
    l[29] = ""; l[30] = ""; l[31] = "";

    /* INSTITUTEURS AR (35-37) + TOTAL PERSONNEL AR (59-61) = Maître d'arabe.
       Les blocs FR (32-34, 38-58) et ADJ/MC/AUTRES : non collectés → vide. */
    l[35] = num(ar.g);
    l[36] = num(ar.f);
    l[37] = tot(ar.g, ar.f, ar.t);
    l[59] = l[35];
    l[60] = l[36];
    l[61] = l[37];

    /* PERSONNEL DE SERVICE (62-64) */
    l[62] = num(se.g);
    l[63] = num(se.f);
    l[64] = tot(se.g, se.f, se.t);

    /* DIRECTEURS — statut seul (H/F/Chargé/grade non collectés → vide) */
    var st = String(dir.statut || "").trim().toLowerCase();
    if (st) {
      l[69] = st === "titulaire" ? 1 : 0;      /* Titulaire */
      l[70] = st === "interimaire" ? 1 : 0;    /* Interimaire */
    }

    /* NON TITULAIRES DE CLASSE (75-77) */
    var sup = objet(pers.suppleant), mal = objet(pers.malade);
    l[75] = num(sup.t) || (maitrePresent(sup) ? 1 : 0);
    l[76] = num(mal.t) || (maitrePresent(mal) ? 1 : 0);
    l[77] = "";                             /* Congé Mat. : non collecté */

    return l;
  }

  /* --------------------------------------------------------------------
     2. OUVRAGES ET ACTIVITES ANNEXES (22 colonnes)
        2-4 Salles (En dur / A réhabiliter / Abris) | 5-7 Hygiène |
        8-11 Eau | 12-13 Électricité | 14-21 activités para-scolaires
     -------------------------------------------------------------------- */
  function ligneOuvrages(x, n) {
    var d = x.d, l = rangee(MODELE.ouvrages.nb);
    var sl = objet(d.situation_locaux), ea = objet(d.eau);
    var el = objet(d.electricite), st = objet(d.structure);
    var eq = objet(d.equipements);

    l[0] = n;
    l[1] = x.nom;
    l[2] = num(sl.salles_dur);
    l[3] = num(sl.a_rehabiliter);
    l[4] = num(sl.salles_abris);
    l[5] = num(objet(eq.toilettes).nombre);   /* Nbre Cabines */
    l[6] = ""; l[7] = "";                    /* Fonct. / Non fonct. : non distingués */
    l[8] = num(ea.robinets_nombre);
    l[9] = num(ea.puits_nombre);
    l[10] = ""; l[11] = "";                  /* Fonct. / Non fonct. : non distingués */
    l[12] = drapeau(el.reseau);              /* Réseau : 1 / 0 */
    l[13] = drapeau(el.plaques);             /* Solaire : 1 / 0 */
    l[14] = 0;                               /* Bloc Administ. : non collecté */
    l[15] = num(objet(eq.magasins).nombre);  /* Magasin */
    l[16] = 0;                               /* Clôture : non collectée */
    l[17] = num(objet(eq.cuisines).nombre);  /* Cuisine */
    l[18] = 0;                               /* Logement : non collecté */
    l[19] = drapeau(st.cantine);             /* Cantine : 1 / 0 */
    l[20] = drapeau(st.coop_scol);           /* Coopérative scolaire : 1 / 0 */
    l[21] = 0;                               /* Boite pharmacie : non collectée */
    return l;
  }

  /* --------------------------------------------------------------------
     3. MOBILIERS ET EQUIPEMENTS (66 colonnes) — 16 rubriques × 4
        (Bon / A réparer / Total / Déficit) à partir de la colonne 2.
        Total = Bon + À réparer quand il n'est pas déclaré (formule du
        modèle) ; rubrique non collectée → 0,0,0,0.
     -------------------------------------------------------------------- */
  function sommeEtat(objs) {
    var s = { bon: 0, a_reparer: 0, total: 0, deficit: 0 };
    objs.forEach(function (o) {
      o = o || {};
      s.bon += num(o.bon);
      s.a_reparer += num(o.a_reparer);
      s.total += num(o.total);
      s.deficit += num(o.deficit);
    });
    if (!s.total) { s.total = s.bon + s.a_reparer; }
    return s;
  }

  /** Ligne « Nombre / Bailleur » (informatique) → état Bon / Total. */
  function etatNombre(o) {
    var n = num((o || {}).nombre);
    return { bon: n, a_reparer: 0, total: n, deficit: 0 };
  }

  /** Sources du formulaire par rubrique du modèle (ordre du modèle). */
  function sourcesDe(d) {
    var mo = objet(d.mobilier), je = objet(d.jeux), inf = objet(d.informatique);
    return [
      [mo.tables_eleves],                    /* TABLES BANCS */
      [mo.tables_bureaux],                   /* TABLES BUREAUX MAITRE */
      [mo.chaises_adultes],                  /* CHAISES MAITRES */
      [],                                    /* CHAISES EFANTS : non collecté */
      [mo.tables_enfants],                   /* TABLES POUR EFANTS */
      [],                                    /* NATTES : non collecté */
      [mo.armoires],                         /* ARMOIRES */
      [],                                    /* PLACARDS : non collecté */
      [],                                    /* TABLEAUX : non collecté */
      [etatNombre(inf.ordinateur)],          /* ORDINATEURS */
      [etatNombre(inf.imprimante)],          /* IMPRIMANTES */
      [],                                    /* Téléviseur : non collecté */
      [je.ballon, je.trottinette, je.autres_jouets],  /* JOUETS POUR ENFANTS */
      [],                                    /* BALANCOIRES : non collecté */
      [je.toboggan],                         /* TOBOGANS */
      []                                     /* TOURNIQUETS : non collecté */
    ];
  }

  function ligneMobilier(x, n) {
    var l = rangee(MODELE.mobiliers.nb);
    l[0] = n;
    l[1] = x.nom;
    sourcesDe(x.d).forEach(function (srcs, i) {
      var s = sommeEtat(srcs), b = 2 + i * 4;
      l[b] = s.bon;
      l[b + 1] = s.a_reparer;
      l[b + 2] = s.total;
      l[b + 3] = s.deficit;
    });
    return l;
  }

  /* --------------------------------------------------------------------
     Construction des 3 feuilles
     -------------------------------------------------------------------- */
  function feuilleDe(XLSX, m, xs, fabrique, debutSomme, avecAnnee) {
    var aoa = squelette(m);
    corpsGroupe(xs, debutSomme, m.nb, fabrique).forEach(function (r) {
      aoa.push(r);
    });
    return feuille(XLSX, aoa, largeurs(m.nb, avecAnnee), versFusions(m.merges));
  }

  /**
   * @param {Array} lignes — lignes complètes de la table `rapports`
   *                         (select("*") : ecole_code, donnees, maj_le…)
   * @returns {{nom: string, feuilles: number}} fichier téléchargé.
   */
  function creer(lignes) {
    var XLSX = global.XLSX;
    if (!XLSX) { throw new Error("Librairie XLSX absente"); }
    if (!MODELE || !MODELE.cours) {
      throw new Error("En-têtes du modèle absents (assets/js/xlsx-succinct.js)");
    }

    var xs = (lignes || []).map(function (r) {
      var d = r.donnees || {};
      var id = d.identification || {};
      return {
        d: d,
        nom: String(id.nom_ecole || r.ecole_nom || "—").trim().toUpperCase(),
        commune: cleCommune(id.commune)
      };
    });
    if (!xs.length) { throw new Error("Aucun rapport à exporter"); }
    xs = trier(xs);

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,
      feuilleDe(XLSX, MODELE.cours, xs, ligneCours, 4, true),
      MODELE.cours.nom);
    XLSX.utils.book_append_sheet(wb,
      feuilleDe(XLSX, MODELE.ouvrages, xs, ligneOuvrages, 2, false),
      MODELE.ouvrages.nom);
    XLSX.utils.book_append_sheet(wb,
      feuilleDe(XLSX, MODELE.mobiliers, xs, ligneMobilier, 2, false),
      MODELE.mobiliers.nom);

    var annee = String(CFG.ANNEE || "2026/2027").replace("/", "-");
    var nom = "Rapport_Succinct_Prescolaire_" + annee + ".xlsx";
    XLSX.writeFile(wb, nom);
    return { nom: nom, feuilles: 3 };
  }

  global.RR = global.RR || {};
  global.RR.xlsxPrescolaire = { creer: creer };

}(window));
