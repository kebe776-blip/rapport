/* =========================================================================
   analyse-succinct.js — Module d'ANALYSE du type « succinct-prescolaire »
   -------------------------------------------------------------------------
   Registre RR_ANALYSE[type] : analyse.js (page analyse.html) le charge à la
   demande APRÈS la session et dispatche vers lui (KPI, graphiques, taux,
   synthèse, export XLSX « Synthèse »). Le moteur élémentaire reste strictement
   inchangé (mod = null pour les autres types).
   Aucun CDN : graphiques SVG faits main fournis par l'API du moteur.
   Données lues dans l'objet brut `donnees` (champs-succinct.js) :
     identification, locaux, directeur, effectifs{ps,ms,gs,total,handicapes},
     personnel{suppleant,arabe,malade,service}, situation_locaux, eau,
     electricite, equipements, informatique, mobilier, jeux, structure
   ========================================================================= */
(function (global) {
  "use strict";

  var TYPE = "succinct-prescolaire";

  /* --- Listes de rubriques (libellés affichés) --- */
  var RUB_MOB = [
    ["tables_enfants", "Tables enfants"],
    ["chaises_adultes", "Chaises adultes"],
    ["tables_bureaux", "Tables bureaux"],
    ["tables_eleves", "Tables élèves"],
    ["tables_cadres", "Tables cadres"],
    ["tables_directeur", "Tables directeur"],
    ["armoires", "Armoires"]
  ];
  var RUB_JEU = [
    ["ballon", "Ballon"],
    ["toboggan", "Toboggan"],
    ["trottinette", "Trottinette"],
    ["autres_jouets", "Autres jouets"]
  ];
  var RUB_EQUIP = [
    ["vestiaires", "Vestiaires"], ["magasins", "Magasins"],
    ["regimes", "Régimes"], ["toilettes", "Toilettes"],
    ["cuisines", "Cuisines"], ["locaux", "Locaux"], ["autres", "Autres"]
  ];
  var NIVEAUX = ["ps", "ms", "gs"];
  var LIGNES_PERS = ["suppleant", "arabe", "malade", "service"];

  /* -----------------------------------------------------------------------
     Aides
     ----------------------------------------------------------------------- */
  function objet(o) { return o || {}; }

  /** 1 si la cellule « Prénoms, Nom… » du tableau maître est renseignée. */
  function maitrePresent(o) {
    return String(objet(o).m_prenoms || "").trim() ? 1 : 0;
  }

  /** Maîtres renseignés : effectifs (PS/MS/GS) + les 4 lignes de personnel. */
  function maitresDe(d) {
    var eff = objet(d.effectifs), pers = objet(d.personnel), n = 0;
    NIVEAUX.forEach(function (k) { n += maitrePresent(eff[k]); });
    LIGNES_PERS.forEach(function (k) { n += maitrePresent(pers[k]); });
    return n;
  }

  /** Effectifs d'une école : G / F / T (total déclaré, sinon somme des niveaux). */
  function effectifsDe(d, api) {
    var num = api.num, tot = api.tot;
    var eff = objet(d.effectifs);
    var ps = objet(eff.ps), ms = objet(eff.ms), gs = objet(eff.gs), tv = objet(eff.total);
    var psv = tot(ps.g, ps.f, ps.t), msv = tot(ms.g, ms.f, ms.t), gsv = tot(gs.g, gs.f, gs.t);
    var g = num(ps.g) + num(ms.g) + num(gs.g);
    var f = num(ps.f) + num(ms.f) + num(gs.f);
    if (!g && !f) { g = num(tv.g); f = num(tv.f); }   /* total seul saisi */
    var t = num(tv.t) || (psv + msv + gsv);
    return { g: g, f: f, t: t, ps: psv, ms: msv, gs: gsv };
  }

  /** Salles d'activités : en dur + à réhabiliter + abris. */
  function sallesDe(d) {
    var sl = objet(d.situation_locaux);
    return {
      dur: api0(sl.salles_dur), rehab: api0(sl.a_rehabiliter),
      abris: api0(sl.salles_abris)
    };
  }
  /* api0 évite une dépendance : valeur numérique, vide = 0 (module autonome) */
  function api0(v) {
    var n = parseFloat(String(v === null || v === undefined ? "" : v).replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  /* =======================================================================
     HOOKS DU MOTEUR (analyse.js)
     ======================================================================= */

  function init(api) {
    /* Couleur du mini-barre « % filles » (palette du moteur) */
    COLS_TAUX[3].couleur = api.C.filles;
  }

  /** Lignes d'analyse : une par rapport, à partir de l'objet brut `donnees`. */
  function construireLignes(bruts, api) {
    return bruts.map(function (r) {
      var d = r.donnees || {};
      var id = objet(d.identification);
      var nom = String(id.nom_ecole || r.ecole_nom || "—").trim().toUpperCase();
      return {
        code: String(r.ecole_code || "—"),
        nom: nom,
        commune: api.cleCommune(id.commune),
        codec: api.cleCodec(id.codec),   /* pas de CODEC sur ce formulaire */
        ctx: { d: d }
      };
    });
  }

  /* -----------------------------------------------------------------------
     AGRÉGATION (KPI + graphiques)
     ----------------------------------------------------------------------- */
  function agreger(sel, api) {
    var num = api.num, tot = api.tot;
    var A = {
      n: sel.length,
      eff: { g: 0, f: 0, t: 0 },
      niv: { ps: { g: 0, f: 0, t: 0 }, ms: { g: 0, f: 0, t: 0 }, gs: { g: 0, f: 0, t: 0 } },
      bat: { c1: 0, c2: 0, c3: 0, abris: 0, sections: 0, cmg: 0 },
      salles: { dur: 0, rehab: 0, abris: 0 },
      eau: { robinets: 0, puits: 0 },
      elec: { reseau: 0, plaques: 0 },
      maitres: 0, maitresEff: 0, maitresPers: 0,
      handicapes: 0,
      equip: {},
      structure: { cantine: 0, coop: 0, jardin: 0, projet: 0 },
      mob: RUB_MOB.map(function (r) {
        return { label: r[1], bon: 0, a_reparer: 0, deficit: 0 };
      }),
      jeu: RUB_JEU.map(function (r) {
        return { label: r[1], bon: 0, a_reparer: 0, deficit: 0 };
      })
    };
    RUB_EQUIP.forEach(function (r) { A.equip[r[0]] = 0; });

    sel.forEach(function (l) {
      var d = l.ctx.d;
      var loc = objet(d.locaux), eff = objet(d.effectifs), pers = objet(d.personnel);
      var ea = objet(d.eau), el = objet(d.electricite), st = objet(d.structure);

      /* --- Effectifs (le filtre Sexe ne s'applique qu'ici / aux graphiques) --- */
      var E = effectifsDe(d, api);
      A.eff.g += E.g; A.eff.f += E.f; A.eff.t += E.t;
      NIVEAUX.forEach(function (k) {
        var o = objet(eff[k]);
        A.niv[k].g += num(o.g);
        A.niv[k].f += num(o.f);
        A.niv[k].t += tot(o.g, o.f, o.t);
      });

      /* --- Sections et bâtiments --- */
      A.bat.sections += num(loc.nb_sections);
      A.bat.c1 += num(loc.nb_bat_1cl);
      A.bat.c2 += num(loc.nb_bat_2cl);
      A.bat.c3 += num(loc.nb_bat_3cl);
      A.bat.abris += num(loc.nb_abris);
      A.bat.cmg += num(loc.nb_cmg);

      /* --- Salles d'activités --- */
      var sal = sallesDe(d);
      A.salles.dur += sal.dur; A.salles.rehab += sal.rehab; A.salles.abris += sal.abris;

      /* --- Eau / électricité (écoles concernées) --- */
      if (api0(ea.robinets_nombre) > 0) { A.eau.robinets++; }
      if (api0(ea.puits_nombre) > 0) { A.eau.puits++; }
      if (el.reseau === "oui") { A.elec.reseau++; }
      if (el.plaques === "oui") { A.elec.plaques++; }

      /* --- Maîtres renseignés + handicapés déclarés --- */
      var mEff = 0;
      NIVEAUX.forEach(function (k) { mEff += maitrePresent(eff[k]); });
      var mPers = 0;
      LIGNES_PERS.forEach(function (k) { mPers += maitrePresent(pers[k]); });
      A.maitresEff += mEff; A.maitresPers += mPers;
      A.maitres += mEff + mPers;
      if (String(eff.handicapes || "").trim()) { A.handicapes++; }

      /* --- Équipements scolaires (au moins 1) --- */
      var eq = objet(d.equipements);
      RUB_EQUIP.forEach(function (r) {
        if (api0(objet(eq[r[0]]).nombre) > 0) { A.equip[r[0]]++; }
      });

      /* --- Structure --- */
      if (st.cantine === "oui") { A.structure.cantine++; }
      if (st.coop_scol === "oui") { A.structure.coop++; }
      if (st.jardin_scolaire === "oui") { A.structure.jardin++; }
      if (st.projet_ecole === "oui") { A.structure.projet++; }

      /* --- Mobilier / jeux (bon / à réparer / déficit) --- */
      var mo = objet(d.mobilier);
      A.mob.forEach(function (slot, i) {
        var o = objet(mo[RUB_MOB[i][0]]);
        slot.bon += api0(o.bon);
        slot.a_reparer += api0(o.a_reparer);
        slot.deficit += api0(o.deficit);
      });
      var je = objet(d.jeux);
      A.jeu.forEach(function (slot, i) {
        var o = objet(je[RUB_JEU[i][0]]);
        slot.bon += api0(o.bon);
        slot.a_reparer += api0(o.a_reparer);
        slot.deficit += api0(o.deficit);
      });
    });

    return A;
  }

  /* -----------------------------------------------------------------------
     KPI (6 cartes)
     ----------------------------------------------------------------------- */
  function rendreKpi(A, api) {
    var $ = api.$, fmt = api.fmt, pct = api.pct, carte = api.carte;
    var s = $("f-sexe").value;
    var effBase = s === "g" ? A.eff.g : s === "f" ? A.eff.f : A.eff.t;
    var inscrits = A.eff.g + A.eff.f;
    var sousEff;
    if (s === "tous") {
      sousEff = "<b>" + fmt(A.eff.g) + "</b> garçons · <b>" + fmt(A.eff.f) +
                "</b> filles · <b>" + pct(A.eff.f, inscrits) + " %</b> de filles";
    } else {
      sousEff = "<b>" + pct(effBase, inscrits) + " %</b> des " + fmt(inscrits) +
                " enfants inscrits";
    }
    var salles = A.salles.dur + A.salles.rehab + A.salles.abris;

    $("stats").innerHTML =
      carte(fmt(A.n), "Écoles analysées", "rapports en base") +
      carte(fmt(effBase), s === "tous" ? "Enfants" :
            (s === "g" ? "Enfants garçons" : "Enfants filles"), sousEff) +
      carte(fmt(A.bat.sections), "Sections",
            "bât. 1 cl <b>" + fmt(A.bat.c1) + "</b> · 2 cl <b>" + fmt(A.bat.c2) +
            "</b> · 3 cl <b>" + fmt(A.bat.c3) + "</b> · abris <b>" +
            fmt(A.bat.abris) + "</b>") +
      carte(fmt(salles), "Salles d'activités",
            "en dur <b>" + fmt(A.salles.dur) + "</b> · à réhabiliter <b>" +
            fmt(A.salles.rehab) + "</b> · abris <b>" + fmt(A.salles.abris) + "</b>") +
      carte(fmt(A.maitres), "Maîtres renseignés",
            "effectifs <b>" + fmt(A.maitresEff) + "</b> · personnel <b>" +
            fmt(A.maitresPers) + "</b>") +
      carte(fmt(A.handicapes), "Handicapés déclarés",
            "<b>" + pct(A.handicapes, A.n) + " %</b> des écoles avec noms");
  }

  /* -----------------------------------------------------------------------
     GRAPHIQUES (6 divs existantes — titres pilotés par MOD.titres)
     ----------------------------------------------------------------------- */
  function rendreCharts(A, sexe, api) {
    var $ = api.$, fmt = api.fmt, pct = api.pct, C = api.C;
    var svgVerticaux = api.svgVerticaux, svgEmpile = api.svgEmpile;
    var svgPourcent = api.svgPourcent;

    /* 1 — Effectifs PS / MS / GS (G / F), filtre Sexe actif */
    var cats = ["PS", "MS", "GS"];
    var series;
    if (sexe === "g") {
      series = [{ nom: "Garçons", couleur: C.garcons,
                  valeurs: cats.map(function (_, i) {
                    var k = ["ps", "ms", "gs"][i];
                    return A.niv[k].g;
                  }) }];
    } else if (sexe === "f") {
      series = [{ nom: "Filles", couleur: C.filles,
                  valeurs: cats.map(function (_, i) {
                    var k = ["ps", "ms", "gs"][i];
                    return A.niv[k].f;
                  }) }];
    } else {
      series = [
        { nom: "Garçons", couleur: C.garcons,
          valeurs: ["ps", "ms", "gs"].map(function (k) { return A.niv[k].g; }) },
        { nom: "Filles", couleur: C.filles,
          valeurs: ["ps", "ms", "gs"].map(function (k) { return A.niv[k].f; }) }
      ];
    }
    $("chart-effectifs").innerHTML = svgVerticaux({ categories: cats, series: series });

    /* 2 — Salles d'activités (en dur / à réhabiliter / abris) */
    var salT = A.salles.dur + A.salles.rehab + A.salles.abris;
    $("chart-classes").innerHTML = svgVerticaux({
      categories: ["En dur", "À réhabiliter", "Abris"],
      series: [{ nom: "Salles", couleur: C.barre,
                 valeurs: [A.salles.dur, A.salles.rehab, A.salles.abris] }]
    }) + '<div class="petit mt">Total : <b>' + fmt(salT) + "</b> salles sur <b>" +
      fmt(A.n) + "</b> école(s).</div>";

    /* 3 — Eau & électricité (% d'écoles) */
    $("chart-personnel").innerHTML = svgPourcent([
      { label: "Robinets (≥ 1)", p: pct(A.eau.robinets, A.n) },
      { label: "Puits (≥ 1)", p: pct(A.eau.puits, A.n) },
      { label: "Réseau électrique", p: pct(A.elec.reseau, A.n) },
      { label: "Plaques solaires", p: pct(A.elec.plaques, A.n) }
    ], { largeurLabel: 165 }) +
      '<div class="petit mt">Part des écoles concernées, sur ' + fmt(A.n) +
      " école(s) analysée(s).</div>";

    /* 4 — Mobilier & jeux (bon / à réparer / déficit) */
    var leg = [
      { nom: "Bon état", couleur: C.bon },
      { nom: "À réparer", couleur: C.reparer },
      { nom: "Déficit", couleur: C.deficit }
    ];
    var rowsMob = A.mob.concat(A.jeu).map(function (m) {
      return {
        label: m.label,
        segments: [
          { nom: "Bon", val: m.bon, couleur: C.bon },
          { nom: "À réparer", val: m.a_reparer, couleur: C.reparer },
          { nom: "Déficit", val: m.deficit, couleur: C.deficit }
        ]
      };
    });
    $("chart-mobilier").innerHTML = svgEmpile(rowsMob,
      { largeurLabel: 165, legende: leg });

    /* 5 — Équipements scolaires (% d'écoles avec au moins 1) */
    $("chart-infra").innerHTML = svgPourcent(RUB_EQUIP.map(function (r) {
      return { label: r[1], p: pct(A.equip[r[0]], A.n) };
    }), { largeurLabel: 150 }) +
      '<div class="petit mt">Part des écoles déclarant <b>au moins 1</b> exemplaire, ' +
      "sur " + fmt(A.n) + " école(s).</div>";

    /* 6 — Structure de l'école (% d'écoles) */
    $("chart-manuels").innerHTML = svgPourcent([
      { label: "Cantine", p: pct(A.structure.cantine, A.n) },
      { label: "Coop. scolaire", p: pct(A.structure.coop, A.n) },
      { label: "Jardin scolaire", p: pct(A.structure.jardin, A.n) },
      { label: "Projet d'école", p: pct(A.structure.projet, A.n) }
    ], { largeurLabel: 165 }) +
      '<div class="petit mt">Part des écoles déclarant « OUI », sur ' +
      fmt(A.n) + " école(s).</div>";
  }

  /* -----------------------------------------------------------------------
     TAUX PAR ÉCOLE
     ----------------------------------------------------------------------- */
  var COLS_TAUX = [
    { cle: "nom", titre: "École", type: "txt" },
    { cle: "commune", titre: "Commune", type: "txt" },
    { cle: "eleves", titre: "Enfants", type: "num" },
    { cle: "pfilles", titre: "% filles", type: "pct", couleur: "#d94f8a" },
    { cle: "sections", titre: "Sections", type: "num" },
    { cle: "salles", titre: "Salles", type: "num" },
    { cle: "maitres", titre: "Maîtres", type: "num" },
    { cle: "parSection", titre: "Enfants/section", type: "dec" }
  ];

  function tauxDe(l, api) {
    var num = api.num, pct = api.pct;
    var d = l.ctx.d;
    var E = effectifsDe(d, api);
    var loc = objet(d.locaux);
    var sections = num(loc.nb_sections);
    var sal = sallesDe(d);
    var salles = sal.dur + sal.rehab + sal.abris;
    return {
      ligne: l, nom: l.nom, commune: l.commune,
      eleves: E.t,
      pfilles: pct(E.f, E.g + E.f),
      sections: sections,
      salles: salles,
      maitres: maitresDe(d),
      parSection: sections > 0 ? Math.round(E.t / sections * 10) / 10 : 0
    };
  }

  /* -----------------------------------------------------------------------
     SYNTHÈSE (tableau + export XLSX « Synthèse »)
     ----------------------------------------------------------------------- */
  var COLS_SYN = [
    { titre: "École", cle: "ecole", w: 42 },
    { titre: "Commune", cle: "commune", w: 20 },
    { titre: "PS", cle: "ps", num: true, w: 8 },
    { titre: "MS", cle: "ms", num: true, w: 8 },
    { titre: "GS", cle: "gs", num: true, w: 8 },
    { titre: "Total", cle: "t", num: true, w: 10 },
    { titre: "Maîtres", cle: "maitres", num: true, w: 10 },
    { titre: "Sections", cle: "sections", num: true, w: 10 },
    { titre: "Handicap. (écoles)", cle: "hand", num: true, w: 17 }
  ];

  function chiffres(l, api) {
    var d = l.ctx.d;
    var E = effectifsDe(d, api);
    var loc = objet(d.locaux);
    return {
      ecole: l.nom, commune: l.commune,
      ps: E.ps, ms: E.ms, gs: E.gs, t: E.t,
      maitres: maitresDe(d),
      sections: api.num(loc.nb_sections),
      hand: String(objet(d.effectifs).handicapes || "").trim() ? 1 : 0
    };
  }

  /* =======================================================================
     REGISTRE — analyse.js dispatche vers cet objet
     ======================================================================= */
  global.RR_ANALYSE = global.RR_ANALYSE || {};
  global.RR_ANALYSE[TYPE] = {
    init: init,
    filtres: { codec: false },          /* pas de CODEC sur ce formulaire */
    titres: {
      "chart-effectifs": "Effectifs PS / MS / GS (G / F)",
      "chart-classes": "Salles d'activités (en dur / à réhabiliter / abris)",
      "chart-personnel": "Eau & électricité — % d'écoles",
      "chart-mobilier": "Mobilier & jeux — bon / à réparer (déficit)",
      "chart-infra": "Équipements scolaires — % d'écoles",
      "chart-manuels": "Structure de l'école — % d'écoles"
    },
    sousTitre: "Rapport succinct de rentrée préscolaire — exploitation par " +
      "école et commune — 2026/2027",
    noteSexe: "Le filtre <b>Sexe</b> s'applique aux KPI et aux graphiques " +
      "(les tableaux restent complets).",
    xlsxTitre: "ANALYSE DES DONNÉES — RAPPORT SUCCINCT DE RENTRÉE PRÉSCOLAIRE",
    construireLignes: construireLignes,
    agreger: agreger,
    rendreKpi: rendreKpi,
    rendreCharts: rendreCharts,
    colsTaux: COLS_TAUX,
    tauxDe: tauxDe,
    colsSyn: COLS_SYN,
    chiffres: chiffres
  };

}(window));
