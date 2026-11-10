/* =========================================================================
   xlsx-export.js — Export XLSX de l'Espace Inspection (SheetJS local)
   -------------------------------------------------------------------------
   Construit un classeur de 5 feuilles à partir des rapports soumis :

     1. Identification      — une ligne par école (section A + D + méta)
     2. Effectifs           — une ligne par école et par niveau (section I)
     3. Personnel           — enseignants / suppléants / malades + récap FR/AR
     4. Infrastructures & Mobilier — sections C, E puis J
     5. Matériels didactiques — sections K, L, M, N

   Les valeurs numériques restent des nombres (somables dans Excel) et
   les dates sont formatées en jj/mm/aaaa. Aucun CDN : la librairie est
   vendorisée dans assets/vendor/xlsx.full.min.js.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR;
  var CFG = global.RR_CONFIG || {};

  /* Libellés du récapitulatif (sections H FR / AR) — même ordre que
     les clés lues par buildContext() dans lib.js. */
  var RECAP_FR = [
    ["inst_h", "Instituteurs H"], ["inst_f", "Instituteurs F"],
    ["inst_t", "Instituteurs Total"],
    ["inst_adj_h", "Inst. adjoints H"], ["inst_adj_f", "Inst. adjoints F"],
    ["inst_adj_t", "Inst. adjoints Total"],
    ["mc_h", "Maîtres contr. H"], ["mc_f", "Maîtres contr. F"],
    ["mc_t", "Maîtres contr. Total"]
  ];
  var RECAP_AR = [
    ["arabe_inst_h", "Instituteurs H"], ["arabe_inst_f", "Instituteurs F"],
    ["arabe_inst_t", "Instituteurs Total"],
    ["arabe_inst_adj_h", "Inst. adjoints H"],
    ["arabe_inst_adj_f", "Inst. adjoints F"],
    ["arabe_inst_adj_t", "Inst. adjoints Total"],
    ["arabe_mc_h", "Maîtres contr. H"], ["arabe_mc_f", "Maîtres contr. F"],
    ["arabe_mc_t", "Maîtres contr. Total"]
  ];

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

  /** Arrondi à `d` décimales (retour numérique). */
  function rnd(n, d) {
    var p = Math.pow(10, d === undefined ? 1 : d);
    return Math.round(n * p) / p;
  }

  /** Feuille à partir d'un tableau de tableaux + largeurs de colonnes. */
  function feuille(XLSX, aoa, largeurs) {
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    if (largeurs && largeurs.length) {
      ws["!cols"] = largeurs.map(function (w) { return { wch: w }; });
    }
    return ws;
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
     2. Effectifs (I) — une ligne par niveau + TOTAL, par école
     -------------------------------------------------------------------- */
  function feuilleEffectifs(ctxs) {
    var tete = [
      "École", "Niveau", "Nbr classe",
      "Eff. G", "Eff. F", "Eff. T",
      "Redoublants G", "Redoublants F", "Redoublants T",
      "Handicapés G", "Handicapés F", "Handicapés T",
      "Sans état civil G", "Sans état civil F", "Sans état civil T",
      "Élèves / classe", "% filles", "% redoublants"
    ];
    var lignes = [];
    ctxs.forEach(function (x) {
      var tout = x.effectifs.concat([x.effectifs_total]);
      tout.forEach(function (r) {
        var classes = r.nb_classes || 0;
        var tg = r.eff_t || 0;
        lignes.push([
          x.meta.ecole, r.cours, classes,
          r.eff_g || 0, r.eff_f || 0, tg,
          r.red_g || 0, r.red_f || 0, r.red_t || 0,
          r.hand_g || 0, r.hand_f || 0, r.hand_t || 0,
          r.sans_etat_g || 0, r.sans_etat_f || 0, r.sans_etat_t || 0,
          classes > 0 ? rnd(tg / classes) : "",
          tg > 0 ? rnd((r.eff_f || 0) * 100 / tg) : "",
          tg > 0 ? rnd((r.red_t || 0) * 100 / tg) : ""
        ]);
      });
    });
    return [tete].concat(lignes);
  }

  /* --------------------------------------------------------------------
     3. Personnel (H) — 3 blocs par école + récapitulatif FR / AR
     -------------------------------------------------------------------- */
  function feuillePersonnel(ctxs) {
    var tete = [
      "École", "Bloc", "Prénom", "Nom", "Grade", "Matricule", "Discipline",
      "Dipl. acad.", "Dipl. prof.", "Date entrée ens.", "Date affectation",
      "Cours tenu", "Contact", "Valeur (récap)"
    ];
    var lignes = [];
    ctxs.forEach(function (x) {
      [["Enseignant", x.personnel], ["Suppléant", x.suppleants],
       ["Malade / Congé", x.malades]].forEach(function (bloc) {
        bloc[1].forEach(function (p) {
          lignes.push([
            x.meta.ecole, bloc[0], p.prenom, p.nom, p.grade, p.matricule,
            p.discipline, p.diplome_acad, p.diplome_prof, p.date_entree,
            p.date_affectation, p.cours_tenu, p.contact, ""
          ]);
        });
      });
      RECAP_FR.forEach(function (pair) {
        lignes.push([x.meta.ecole, "Récap FR", "", pair[1], "", "", "", "",
                     "", "", "", "", "", x.recap_fr[pair[0]] || 0]);
      });
      RECAP_AR.forEach(function (pair) {
        lignes.push([x.meta.ecole, "Récap AR", "", pair[1], "", "", "", "",
                     "", "", "", "", "", x.recap_ar[pair[0]] || 0]);
      });
    });
    return [tete].concat(lignes);
  }

  /* --------------------------------------------------------------------
     4. Infrastructures (C + E) et Mobilier (J)
        Trois blocs séparés par une ligne-titre.
     -------------------------------------------------------------------- */
  function feuilleInfraMobilier(ctxs) {
    var aoa = [];

    /* --- Bloc 1 : classes physiques (C) --- */
    aoa.push(["SITUATION DES CLASSES PHYSIQUES (C)"]);
    aoa.push([
      "École", "Salles bonnes", "Salles acceptables", "Salles mauvaises",
      "Salles totale", "Salles utilisées", "Salles non utilisées",
      "Abris provisoires", "À réhabiliter", "En construction",
      "Programme / année"
    ]);
    ctxs.forEach(function (x) {
      aoa.push([
        x.meta.ecole, x.c.salles_bonnes, x.c.salles_acceptables,
        x.c.salles_mauvaises, x.c.salles_totale, x.c.salles_utilisees,
        x.c.salles_non_utilisees, x.c.abris_provisoires,
        x.c.a_rehabiliter, x.c.cours_construction, x.c.programme_construction
      ]);
    });

    /* --- Bloc 2 : ouvrages annexes (E) --- */
    aoa.push([]);
    aoa.push(["SITUATION DES OUVRAGES ANNEXES (E)"]);
    aoa.push([
      "École", "Toilettes", "Nb blocs", "Nb cabines",
      "Cabines fonctionnelles", "Cabines non fonctionnelles",
      "Bailleur toilettes", "Point d'eau", "Nb robinets",
      "État point d'eau", "Bailleur point d'eau", "Puits", "État puits",
      "Bailleur puits", "Senelec", "État électricité",
      "Plaques solaires", "État solaire", "Groupe électrogène",
      "État groupe", "Internet", "Modem wifi MEN", "Bureau",
      "Bailleur bureau", "Magasin", "Bailleur magasin", "Clôture",
      "Bailleur clôture", "Cuisine", "Bailleur cuisine", "Logement",
      "Bailleur logement"
    ]);
    ctxs.forEach(function (x) {
      aoa.push([
        x.meta.ecole, x.e.toilettes, x.e.nb_blocs, x.e.nb_cabines,
        x.e.cabines_fonctionnelles, x.e.cabines_non_fonctionnelles,
        x.e.bailleur_toilettes, x.e.point_eau, x.e.nb_robinets,
        x.e.etat_point_eau, x.e.bailleur_point_eau, x.e.puits,
        x.e.etat_puits, x.e.bailleur_puits, x.e.senelec,
        x.e.etat_electricite, x.e.plaques_solaires,
        x.e.etat_plaques_solaires, x.e.groupe_electrogene,
        x.e.etat_groupe_electrogene, x.e.internet,
        x.e.modem_wifi_men, x.e.bureau, x.e.bailleur_bureau,
        x.e.magasin, x.e.bailleur_magasin, x.e.cloture,
        x.e.bailleur_cloture, x.e.cuisine, x.e.bailleur_cuisine,
        x.e.logement, x.e.bailleur_logement
      ]);
    });

    /* --- Bloc 3 : mobilier (J) --- */
    aoa.push([]);
    aoa.push(["MOBILIER SCOLAIRE (J)"]);
    aoa.push(["École", "Désignation", "Bon", "À réparer", "Total",
              "Déficit"]);
    ctxs.forEach(function (x) {
      var tot = { bon: 0, a_reparer: 0, total: 0, defecat: 0 };
      x.mobilier.forEach(function (m) {
        aoa.push([x.meta.ecole, m.designation, m.bon, m.a_reparer,
                  m.total, m.defecat]);
        tot.bon += m.bon; tot.a_reparer += m.a_reparer;
        tot.total += m.total; tot.defecat += m.defecat;
      });
      aoa.push([x.meta.ecole, "TOTAL GÉNÉRAL", tot.bon, tot.a_reparer,
                tot.total, tot.defecat]);
    });

    return aoa;
  }

  /* --------------------------------------------------------------------
     5. Matériels didactiques (K, L, M, N)
     -------------------------------------------------------------------- */
  function feuilleMateriaux(ctxs) {
    var tete = ["École", "Section", "Titre / Désignation", "Quantité",
                "Provenance", "Besoins", "Observations"];
    var sections = [
      ["K — Manuels (officiels)", "manuels"],
      ["L — Autres manuels", "autres_manuels"],
      ["M — Matériel didactique", "materiel"],
      ["N — Autres matériel", "autres_materiels"]
    ];
    var lignes = [];
    ctxs.forEach(function (x) {
      sections.forEach(function (s) {
        (x[s[1]] || []).forEach(function (it) {
          lignes.push([x.meta.ecole, s[0], it.titre, it.quantite,
                       it.provenance, it.besoins, it.observations]);
        });
      });
    });
    return [tete].concat(lignes);
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

    var ctxs = (lignes || []).map(function (l) {
      return R.buildContext(l.donnees, {
        id: l.ecole_code,
        annee: l.annee || CFG.ANNEE,
        soumission: l.maj_le
      });
    });
    if (!ctxs.length) { throw new Error("Aucun rapport à exporter"); }

    var wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb,
      feuille(XLSX, feuilleIdentification(ctxs),
              [26, 14, 14, 14, 10, 9, 15, 24, 30, 34, 24, 10, 12, 15,
               15, 15, 14, 14]),
      "1. Identification");

    XLSX.utils.book_append_sheet(wb,
      feuille(XLSX, feuilleEffectifs(ctxs),
              [26, 10, 10, 9, 9, 9, 12, 12, 12, 11, 11, 11, 13, 13, 13,
               12, 9, 14]),
      "2. Effectifs");

    XLSX.utils.book_append_sheet(wb,
      feuille(XLSX, feuillePersonnel(ctxs),
              [26, 15, 12, 16, 9, 12, 14, 12, 12, 15, 15, 14, 15, 15]),
      "3. Personnel");

    XLSX.utils.book_append_sheet(wb,
      feuille(XLSX, feuilleInfraMobilier(ctxs),
              [26, 18, 18, 18, 14, 16, 18, 14, 14, 16, 26]),
      "4. Infra-Mobilier");

    XLSX.utils.book_append_sheet(wb,
      feuille(XLSX, feuilleMateriaux(ctxs),
              [26, 24, 44, 10, 14, 16, 30]),
      "5. Matériels didactiques");

    var annee = String(CFG.ANNEE || "2026/2027").replace("/", "-");
    var nom = "Rapport_Rentree_" + annee + ".xlsx";
    XLSX.writeFile(wb, nom);
    return nom;
  }

  global.RR = global.RR || {};
  global.RR.xlsx = { creer: creer };

}(window));
