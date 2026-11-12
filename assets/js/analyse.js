/* =========================================================================
   analyse.js — Exploitation des données (page analyse.html)
   -------------------------------------------------------------------------
   Lecture des rapports (Supabase ou mode démo) → agrégation par école /
   CODEC / commune / sexe → KPI, graphiques SVG faits main (aucun CDN),
   tableau « Taux par école », synthèse groupable et export XLSX.
   ========================================================================= */
(function () {
  "use strict";

  var CFG = window.RR_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var TOUTES = "";

  /* -----------------------------------------------------------------------
     Utilitaires locaux
     RR.esc est défini dans rapport.js (non chargé ici) : on le redéfinit.
     ----------------------------------------------------------------------- */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function num(x) {
    var n = parseFloat(String(x === null || x === undefined ? "" : x).replace(",", "."));
    return isFinite(n) ? n : 0;
  }

  /** Entier séparé par espaces (12 345). */
  function fmt(n) {
    n = Math.round(num(n));
    var s = String(Math.abs(n)), out = "", c = 0;
    for (var i = s.length - 1; i >= 0; i--) {
      out = s[i] + out;
      if (++c % 3 === 0 && i > 0) { out = " " + out; }
    }
    return (n < 0 ? "-" : "") + out;
  }

  /** Décimale à la française (12,4). */
  function fmt1(n) {
    return String(Math.round(num(n) * 10) / 10).replace(".", ",");
  }

  function pct(a, b) { return b > 0 ? Math.round(num(a) / num(b) * 100) : 0; }

  /** Normalisation sans accent ni casse (comparaison des titres de manuels). */
  function norm(s) {
    var t = String(s === null || s === undefined ? "" : s);
    if (t.normalize) { t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    return t.toLowerCase().replace(/\s+/g, " ").trim();
  }

  /** Total = valeur déclarée, sinon G + F (sécurité sur les données). */
  function tot(g, f, t) { return num(t) || (num(g) + num(f)); }

  /* -----------------------------------------------------------------------
     Clés de regroupement : commune / CODEC absents regroupés à part
     ----------------------------------------------------------------------- */
  function cleVide(v, defaut) {
    var t = String(v === null || v === undefined ? "" : v).trim().toUpperCase();
    if (!t || t === "—" || t === "-" || t === "0" || t === "NÉANT") { return defaut; }
    return t;
  }
  function cleCommune(v) { return cleVide(v, "SANS COMMUNE"); }
  function cleCodec(v) { return cleVide(v, "SANS CODEC"); }

  function trier(arr) {
    return arr.slice().sort(function (a, b) {
      return a.commune.localeCompare(b.commune, "fr") ||
             a.nom.localeCompare(b.nom, "fr") ||
             a.code.localeCompare(b.code, "fr");
    });
  }

  function triPourGroupe(grp) {
    return function (a, b) {
      var ka = grp === "commune" ? a.commune : grp === "codec" ? a.codec : a.nom;
      var kb = grp === "commune" ? b.commune : grp === "codec" ? b.codec : b.nom;
      return ka.localeCompare(kb, "fr") ||
             a.nom.localeCompare(b.nom, "fr") ||
             a.code.localeCompare(b.code, "fr");
    };
  }

  /* -----------------------------------------------------------------------
     État
     ----------------------------------------------------------------------- */
  var state = { lignes: [], demo: false, taux: [] };
  var triTaux = { cle: "commune", sens: 1 };

  var TITRES_MAJEURS = [
    "Langue et communication CI", "Mathematiques CI",
    "Langue et communication CP", "Mathematiques CP",
    "Langue et communication CM", "Mathematiques CM",
    "Guide Mathematiques CM", "Guide revise 1ere etape"
  ];

  var C = {
    garcons: "#2f6fd0", filles: "#d94f8a",
    simples: "#3b7dd8", cmg: "#f0a500", cdf: "#1e7a3c",
    bon: "#1e7a3c", reparer: "#f0a500", deficit: "#c62828",
    frH: "#1f4e79", frF: "#7fb3e0", arH: "#1e7a3c", arF: "#8ecda6",
    barre: "#1f4e79", piste: "#e6eaf0"
  };

  /* =======================================================================
     MESSAGES / PROGRESSION
     ======================================================================= */
  function msg(classe, html) {
    var m = $("msg");
    m.className = "bandeau " + classe;
    m.innerHTML = html;
    m.style.display = "block";
  }

  function msgAnalyse(classe, html) {
    var m = $("msg-analyse");
    if (!html) { m.style.display = "none"; return; }
    m.className = "bandeau " + classe + " mt";
    m.innerHTML = html;
    m.style.display = "block";
  }

  function progres(texte, p) {
    var el = $("progression");
    el.classList.add("visible");
    $("prog-texte").textContent = texte;
    $("prog-barre").style.width = (p || 0) + "%";
  }
  function finProgres() { $("progression").classList.remove("visible"); }

  /* =======================================================================
     GRAPHIQUES SVG (aucune bibliothèque externe)
     ======================================================================= */

  /** Arrondi « joli » supérieur : 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 × 10^n */
  function joliMax(v) {
    if (!(v > 0)) { return 10; }
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
    var f = v / p;
    var pal = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < pal.length; i++) {
      if (f <= pal[i] + 1e-9) { return pal[i] * p; }
    }
    return 10 * p;
  }

  function fmtAxis(v) {
    return v >= 10 ? fmt(v) : String(Math.round(v * 10) / 10).replace(".", ",");
  }

  function vide(texte) {
    return '<div class="graphique"><div class="vide">' +
      esc(texte || "Aucune donnée à afficher.") + "</div></div>";
  }

  function legende(items) {
    return '<div class="legende">' + items.map(function (i) {
      return '<span class="leg"><i style="background:' + i.couleur + '"></i>' +
             esc(i.nom) + "</span>";
    }).join("") + "</div>";
  }

  /** Barres verticales groupées. opts : {categories, series:[{nom,couleur,valeurs}]} */
  function svgVerticaux(opts) {
    var cats = opts.categories || [];
    var series = opts.series || [];
    var W = 640, H = 258, mG = 46, mD = 12, mH = 20, mB = 30;
    var iw = W - mG - mD, ih = H - mH - mB;
    var max = 0;
    series.forEach(function (s) {
      (s.valeurs || []).forEach(function (v) { if (v > max) { max = v; } });
    });
    if (!cats.length || !series.length || max <= 0) {
      return vide("Aucune donnée à afficher.");
    }
    var top = joliMax(max);
    var s = [];
    var labMax = 1;

    [0, 0.5, 1].forEach(function (t) {
      var y = mH + ih - ih * t;
      s.push('<line x1="' + mG + '" y1="' + y + '" x2="' + (W - mD) +
             '" y2="' + y + '" stroke="' + (t === 0 ? "#c9d2dc" : C.piste) + '"/>');
      s.push('<text class="ax" x="' + (mG - 6) + '" y="' + (y + 4) +
             '" text-anchor="end">' + fmtAxis(top * t) + "</text>");
      if (String(fmtAxis(top * t)).length > labMax) {
        labMax = String(fmtAxis(top * t)).length;
      }
    });

    var groupW = iw / cats.length;
    var sW = Math.min(34, (groupW * 0.74) / series.length);
    var etiquettes = series.length <= 2 && cats.length <= 7;

    cats.forEach(function (cat, i) {
      var gx = mG + groupW * i + groupW / 2;
      var totalW = sW * series.length + (series.length - 1) * 3;
      var x0 = gx - totalW / 2;
      series.forEach(function (ser, j) {
        var v = num((ser.valeurs || [])[i]);
        var h = ih * (v / top);
        var x = x0 + j * (sW + 3);
        var y = mH + ih - h;
        s.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
               '" width="' + sW.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) +
               '" rx="2" fill="' + ser.couleur + '"><title>' + esc(ser.nom) + " — " +
               esc(cat) + " : " + fmt(v) + "</title></rect>");
        if (etiquettes && v > 0) {
          s.push('<text class="val" x="' + (x + sW / 2).toFixed(1) + '" y="' +
                 (y - 4).toFixed(1) + '" text-anchor="middle">' + fmt(v) + "</text>");
        }
      });
      s.push('<text class="ax" x="' + gx.toFixed(1) + '" y="' + (mH + ih + 17) +
             '" text-anchor="middle">' + esc(cat) + "</text>");
    });

    return '<div class="graphique"><svg viewBox="0 0 ' + W + " " + H +
           '" role="img">' + s.join("") + "</svg></div>" + legende(series);
  }

  /**
   * Barres horizontales empilées.
   * rows : [{label, segments:[{nom, val, couleur}]}]
   * opts : {largeurLabel, montrerPct}
   */
  function svgEmpile(rows, opts) {
    opts = opts || {};
    var mL = opts.largeurLabel || 170;
    var W = 640, mD = 62, rh = 24, gap = 9, top = 8;
    var iw = W - mL - mD;
    var H = top + rows.length * (rh + gap) + 4;
    var max = 0;
    rows.forEach(function (r) {
      var t = 0;
      r.segments.forEach(function (g) { t += Math.max(0, num(g.val)); });
      if (t > max) { max = t; }
    });
    if (!rows.length || max <= 0) { return vide("Aucune donnée à afficher."); }

    var s = [];
    rows.forEach(function (r, i) {
      var y = top + i * (rh + gap);
      var x = mL;
      var somme = 0;
      r.segments.forEach(function (g) { somme += Math.max(0, num(g.val)); });
      s.push('<text class="lbl" x="' + (mL - 8) + '" y="' + (y + rh / 2 + 4) +
             '" text-anchor="end">' + esc(r.label) + "</text>");
      if (somme <= 0) {
        s.push('<rect x="' + mL + '" y="' + y + '" width="' + iw + '" height="' + rh +
               '" rx="3" fill="' + C.piste + '"/>');
        s.push('<text class="val" x="' + (mL + 8) + '" y="' + (y + rh / 2 + 4) +
               '">0</text>');
        return;
      }
      r.segments.forEach(function (g) {
        var v = Math.max(0, num(g.val));
        if (v <= 0) { return; }
        var w = iw * (v / max);
        s.push('<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + Math.max(1, w).toFixed(1) +
               '" height="' + rh + '" fill="' + g.couleur + '"><title>' + esc(g.nom) +
               " : " + fmt(v) + "</title></rect>");
        if (w >= 46) {
          s.push('<text class="val-inv" x="' + (x + w / 2).toFixed(1) + '" y="' +
                 (y + rh / 2 + 4) + '" text-anchor="middle">' + fmt(v) + "</text>");
        }
        x += w;
      });
      s.push('<text class="lbl-fin" x="' + (W - mD + 8) + '" y="' + (y + rh / 2 + 4) +
             '">' + fmt(somme) + "</text>");
    });

    return '<div class="graphique"><svg viewBox="0 0 ' + W + " " + H +
           '" role="img">' + s.join("") + "</svg></div>" +
      (opts.legende ? legende(opts.legende) : "");
  }

  /** Barres horizontales de pourcentage. rows : [{label, pct, note}] */
  function svgPourcent(rows, opts) {
    opts = opts || {};
    var mL = opts.largeurLabel || 160;
    var W = 640, mD = 74, rh = 18, gap = 9, top = 6;
    var iw = W - mL - mD;
    var H = top + rows.length * (rh + gap) + 4;
    if (!rows.length) { return vide("Aucune donnée à afficher."); }

    var s = [];
    s.push('<rect x="' + mL + '" y="' + (top - 3) + '" width="' + iw + '" height="' +
           (rows.length * (rh + gap)) + '" rx="4" fill="#f7f9fc"/>');
    rows.forEach(function (r, i) {
      var y = top + i * (rh + gap);
      var p = Math.max(0, Math.min(100, num(r.p)));
      s.push('<text class="lbl" x="' + (mL - 8) + '" y="' + (y + rh - 4) +
             '" text-anchor="end">' + esc(r.label) + "</text>");
      s.push('<rect x="' + mL + '" y="' + y + '" width="' + iw + '" height="' + rh +
             '" rx="3" fill="' + C.piste + '"/>');
      if (p > 0) {
        s.push('<rect x="' + mL + '" y="' + y + '" width="' + (iw * p / 100).toFixed(1) +
               '" height="' + rh + '" rx="3" fill="' + (r.couleur || C.barre) +
               '"><title>' + esc(r.label) + " : " + p + " %</title></rect>");
      }
      s.push('<text class="pct" x="' + (W - mD + 8) + '" y="' + (y + rh - 4) + '">' +
             p + " %</text>");
    });
    return '<div class="graphique"><svg viewBox="0 0 ' + W + " " + H +
           '" role="img">' + s.join("") + "</svg></div>";
  }

  /** Mini-barre de pourcentage pour les cellules de tableau. */
  function miniBar(p, couleur) {
    var w = 62, h = 8;
    var v = Math.max(0, Math.min(100, num(p)));
    return '<span class="taux-cell"><span class="pct">' + v + ' %</span>' +
      '<svg width="' + w + '" height="' + h + '" aria-hidden="true">' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="4" fill="' + C.piste + '"/>' +
      '<rect x="0" y="0" width="' + (w * v / 100).toFixed(1) + '" height="' + h +
      '" rx="4" fill="' + couleur + '"/></svg></span>';
  }

  /* =======================================================================
     AGRÉGATION
     ======================================================================= */
  var CLES_PERS = [
    "inst_h", "inst_f", "inst_t",
    "inst_adj_h", "inst_adj_f", "inst_adj_t",
    "mc_h", "mc_f", "mc_t",
    "arabe_inst_h", "arabe_inst_f", "arabe_inst_t",
    "arabe_inst_adj_h", "arabe_inst_adj_f", "arabe_inst_adj_t",
    "arabe_mc_h", "arabe_mc_f", "arabe_mc_t"
  ];

  function agreger(sel) {
    var A = {
      n: sel.length,
      eff: { g: 0, f: 0, t: 0, red: 0, hand: 0, sec: 0 },
      niveaux: window.RR.COURS.map(function (p) {
        return { cours: p[1], g: 0, f: 0, t: 0, classes: 0 };
      }),
      classes: { simples: 0, cmg: 0, cdf: 0, total: 0 },
      pers: {},
      mobilier: window.RR.MOBILIER.map(function (p) {
        return { designation: p[1], bon: 0, a_reparer: 0, total: 0, defecat: 0 };
      }),
      infra: { toilettes: 0, point_eau: 0, electricite: 0, cloture: 0,
               internet: 0, magasin: 0, salles: 0 },
      titres: {}
    };
    CLES_PERS.forEach(function (k) { A.pers[k] = 0; });
    TITRES_MAJEURS.forEach(function (t) { A.titres[norm(t)] = 0; });

    sel.forEach(function (l) {
      var c = l.ctx;
      var et = c.effectifs_total;

      A.eff.g += num(et.eff_g);
      A.eff.f += num(et.eff_f);
      A.eff.t += tot(et.eff_g, et.eff_f, et.eff_t);
      A.eff.red += tot(et.red_g, et.red_f, et.red_t);
      A.eff.hand += tot(et.hand_g, et.hand_f, et.hand_t);
      A.eff.sec += tot(et.sans_etat_g, et.sans_etat_f, et.sans_etat_t);

      c.effectifs.forEach(function (row, i) {
        var n = A.niveaux[i];
        if (!n) { return; }
        n.g += num(row.eff_g);
        n.f += num(row.eff_f);
        n.t += tot(row.eff_g, row.eff_f, row.eff_t);
        n.classes += num(row.nb_classes);
      });

      A.classes.simples += num(c.b.nb_classes_simples);
      A.classes.cmg += num(c.b.nb_cmg);
      A.classes.cdf += num(c.b.nb_cdf);
      A.classes.total += num(c.b.nb_cours);

      CLES_PERS.forEach(function (k) {
        A.pers[k] += num(k.indexOf("arabe_") === 0 ? c.recap_ar[k] : c.recap_fr[k]);
      });

      c.mobilier.forEach(function (m, i) {
        var slot = A.mobilier[i];
        if (!slot) { return; }
        slot.bon += num(m.bon);
        slot.a_reparer += num(m.a_reparer);
        slot.total += num(m.total);
        slot.defecat += num(m.defecat);
      });

      var e = c.e;
      if (e.toilettes === "OUI") { A.infra.toilettes++; }
      if (e.point_eau === "OUI") { A.infra.point_eau++; }
      if (e.senelec === "OUI") { A.infra.electricite++; }
      if (e.cloture === "OUI") { A.infra.cloture++; }
      if (e.internet === "OUI") { A.infra.internet++; }
      if (e.magasin === "OUI") { A.infra.magasin++; }
      if (num(c.c.salles_utilisees) > 0) { A.infra.salles++; }

      var vus = {};
      (c.manuels || []).concat(c.autres_manuels || []).forEach(function (m) {
        if (num(m.quantite) <= 0) { return; }
        var k = norm(m.titre);
        if (A.titres[k] !== undefined && !vus[k]) { A.titres[k]++; vus[k] = 1; }
      });
    });

    return A;
  }

  /* =======================================================================
     FILTRES EN CASCADE
     ======================================================================= */
  function distinct(arr, cle) {
    var vus = {}, out = [];
    arr.forEach(function (l) {
      var v = l[cle];
      if (!vus[v]) { vus[v] = 1; out.push(v); }
    });
    return out.sort(function (a, b) { return a.localeCompare(b, "fr"); });
  }

  function peupler(select, items, toutLibelle, conserve) {
    select.innerHTML = '<option value="">' + esc(toutLibelle) + "</option>" +
      items.map(function (i) {
        return '<option value="' + esc(i.v) + '">' + esc(i.t) + "</option>";
      }).join("");
    if (conserve && items.some(function (i) { return i.v === conserve; })) {
      select.value = conserve;
    }
  }

  function reconstruireFiltres() {
    var commune = $("f-commune").value;
    var codec = $("f-codec").value;
    var ecole = $("f-ecole").value;

    var parCommune = state.lignes.filter(function (l) {
      return !commune || l.commune === commune;
    });
    var parCodec = parCommune.filter(function (l) {
      return !codec || l.codec === codec;
    });

    peupler($("f-commune"),
      distinct(state.lignes, "commune").map(function (v) { return { v: v, t: v }; }),
      "Toutes les communes", commune);

    peupler($("f-codec"),
      distinct(parCommune, "codec").map(function (v) { return { v: v, t: v }; }),
      "Tous les CODEC", codec);

    peupler($("f-ecole"),
      trier(parCodec).map(function (l) { return { v: l.code, t: l.nom }; }),
      "Toutes les écoles", ecole);
  }

  function selection() {
    var commune = $("f-commune").value;
    var codec = $("f-codec").value;
    var ecole = $("f-ecole").value;
    return state.lignes.filter(function (l) {
      return (!commune || l.commune === commune) &&
             (!codec || l.codec === codec) &&
             (!ecole || l.code === ecole);
    });
  }

  var LIB_SEXE = { tous: "Garçons et Filles", g: "Garçons", f: "Filles" };

  function etatFiltres(sel) {
    var p = [sel.length + " école" + (sel.length > 1 ? "s" : "") + " retenue" +
             (sel.length > 1 ? "s" : "") + " sur " + state.lignes.length];
    var commune = $("f-commune").value;
    var codec = $("f-codec").value;
    var ecole = $("f-ecole").value;
    p.push(commune ? "Commune : " + commune : "Toutes communes");
    if (codec) { p.push("CODEC : " + codec); }
    if (ecole) {
      var opt = $("f-ecole").options[$("f-ecole").selectedIndex];
      p.push("École : " + (opt ? opt.textContent : ecole));
    }
    p.push("Sexe : " + LIB_SEXE[$("f-sexe").value]);
    return p.join("  ·  ");
  }

  /* =======================================================================
     RENDU — KPI
     ======================================================================= */
  function carte(valeur, libelle, sous) {
    return '<div class="stat"><div class="valeur">' + valeur + "</div>" +
      '<div class="libelle">' + esc(libelle) + "</div>" +
      '<div class="sous">' + sous + "</div></div>";
  }

  function rendreKpi(A) {
    var s = $("f-sexe").value;
    var effBase = s === "g" ? A.eff.g : s === "f" ? A.eff.f : A.eff.t;
    var inscrits = A.eff.g + A.eff.f;
    var persH = A.pers.inst_h + A.pers.inst_adj_h + A.pers.mc_h +
                A.pers.arabe_inst_h + A.pers.arabe_inst_adj_h + A.pers.arabe_mc_h;
    var persF = A.pers.inst_f + A.pers.inst_adj_f + A.pers.mc_f +
                A.pers.arabe_inst_f + A.pers.arabe_inst_adj_f + A.pers.arabe_mc_f;
    var persT = (s === "g" ? persH : s === "f" ? persF : persH + persF);
    var sousEff;
    if (s === "tous") {
      sousEff = "<b>" + fmt(A.eff.g) + "</b> garçons · <b>" + fmt(A.eff.f) +
                "</b> filles · <b>" + pct(A.eff.f, inscrits) + " %</b> de filles";
    } else {
      sousEff = "<b>" + pct(effBase, inscrits) + " %</b> des " + fmt(inscrits) +
                " élèves inscrits";
    }

    $("stats").innerHTML =
      carte(fmt(A.n), "Écoles analysées",
            state.demo ? "données de démonstration" : "rapports en base") +
      carte(fmt(effBase), s === "tous" ? "Élèves" :
            (s === "g" ? "Élèves garçons" : "Élèves filles"), sousEff) +
      carte(fmt(A.classes.total), "Cours / classes",
            "simples <b>" + fmt(A.classes.simples) + "</b> · CMG <b>" +
            fmt(A.classes.cmg) + "</b> · CDF <b>" + fmt(A.classes.cdf) + "</b>") +
      carte(pct(A.eff.red, A.eff.t) + " %", "Redoublants",
            "<b>" + fmt(A.eff.red) + "</b> élèves sur " + fmt(A.eff.t)) +
      carte(fmt(A.eff.hand), "Handicapés",
            "<b>" + pct(A.eff.hand, A.eff.t) + " %</b> des élèves · sans état civil <b>" +
            fmt(A.eff.sec) + "</b>") +
      carte(fmt(persT), "Personnel",
            "H <b>" + fmt(persH) + "</b> · F <b>" + fmt(persF) + "</b>" +
            (s !== "tous" ? " (filtre sexe)" : ""));
  }

  /* =======================================================================
     RENDU — GRAPHIQUES
     ======================================================================= */
  function rendreChartEffectifs(A) {
    var s = $("f-sexe").value;
    var cats = A.niveaux.map(function (n) { return n.cours; });
    var series;
    if (s === "g") {
      series = [{ nom: "Garçons", couleur: C.garcons,
                  valeurs: A.niveaux.map(function (n) { return n.g; }) }];
    } else if (s === "f") {
      series = [{ nom: "Filles", couleur: C.filles,
                  valeurs: A.niveaux.map(function (n) { return n.f; }) }];
    } else {
      series = [
        { nom: "Garçons", couleur: C.garcons,
          valeurs: A.niveaux.map(function (n) { return n.g; }) },
        { nom: "Filles", couleur: C.filles,
          valeurs: A.niveaux.map(function (n) { return n.f; }) }
      ];
    }
    $("chart-effectifs").innerHTML = svgVerticaux({ categories: cats, series: series });
  }

  function rendreChartClasses(A) {
    var t = A.classes.simples + A.classes.cmg + A.classes.cdf;
    var rows = [{
      label: "Classes",
      segments: [
        { nom: "Simples", val: A.classes.simples, couleur: C.simples },
        { nom: "CMG (multigrades)", val: A.classes.cmg, couleur: C.cmg },
        { nom: "CDF (double flux)", val: A.classes.cdf, couleur: C.cdf }
      ]
    }];
    var leg = [
      { nom: "Simples : " + fmt(A.classes.simples) + " (" + pct(A.classes.simples, t) + " %)", couleur: C.simples },
      { nom: "CMG : " + fmt(A.classes.cmg) + " (" + pct(A.classes.cmg, t) + " %)", couleur: C.cmg },
      { nom: "CDF : " + fmt(A.classes.cdf) + " (" + pct(A.classes.cdf, t) + " %)", couleur: C.cdf }
    ];
    $("chart-classes").innerHTML = svgEmpile(rows, { largeurLabel: 90, legende: leg }) +
      '<div class="petit mt">Total déclaré : <b>' + fmt(A.classes.total) +
      "</b> cours · élèves par cours : <b>" +
      (A.classes.total > 0 ? fmt1(A.eff.t / A.classes.total) : "—") + "</b></div>";
  }

  function rendreChartPersonnel(A) {
    var s = $("f-sexe").value;
    var cats = ["Instituteurs", "Adjoints", "Maîtres contr."];
    var tous = [
      { nom: "Français H", couleur: C.frH,
        valeurs: [A.pers.inst_h, A.pers.inst_adj_h, A.pers.mc_h] },
      { nom: "Français F", couleur: C.frF,
        valeurs: [A.pers.inst_f, A.pers.inst_adj_f, A.pers.mc_f] },
      { nom: "Arabe H", couleur: C.arH,
        valeurs: [A.pers.arabe_inst_h, A.pers.arabe_inst_adj_h, A.pers.arabe_mc_h] },
      { nom: "Arabe F", couleur: C.arF,
        valeurs: [A.pers.arabe_inst_f, A.pers.arabe_inst_adj_f, A.pers.arabe_mc_f] }
    ];
    var series = s === "g" ? tous.filter(function (x) { return / H$/.test(x.nom); })
                : s === "f" ? tous.filter(function (x) { return / F$/.test(x.nom); })
                : tous;
    $("chart-personnel").innerHTML = svgVerticaux({ categories: cats, series: series });
  }

  function rendreChartMobilier(A) {
    var rows = A.mobilier.map(function (m) {
      var def = Math.max(num(m.defecat), num(m.total) - num(m.bon) - num(m.a_reparer));
      return {
        label: m.designation,
        segments: [
          { nom: "Bon", val: m.bon, couleur: C.bon },
          { nom: "À réparer", val: m.a_reparer, couleur: C.reparer },
          { nom: "Déficit", val: Math.max(0, def), couleur: C.deficit }
        ]
      };
    });
    var leg = [
      { nom: "Bon état", couleur: C.bon },
      { nom: "À réparer", couleur: C.reparer },
      { nom: "Déficit", couleur: C.deficit }
    ];
    $("chart-mobilier").innerHTML = svgEmpile(rows, { largeurLabel: 165, legende: leg });
  }

  function rendreChartInfra(A) {
    var n = A.n;
    var rows = [
      { label: "Toilettes", p: pct(A.infra.toilettes, n) },
      { label: "Point d'eau", p: pct(A.infra.point_eau, n) },
      { label: "Électricité", p: pct(A.infra.electricite, n) },
      { label: "Clôture", p: pct(A.infra.cloture, n) },
      { label: "Internet", p: pct(A.infra.internet, n) },
      { label: "Magasin", p: pct(A.infra.magasin, n) },
      { label: "Salles utilisées", p: pct(A.infra.salles, n) }
    ];
    $("chart-infra").innerHTML = svgPourcent(rows, { largeurLabel: 150 }) +
      '<div class="petit mt">Part des écoles déclarant « OUI » (ou ≥ 1 salle utilisée), ' +
      "sur " + fmt(n) + " école(s) analysée(s).</div>";
  }

  function rendreChartManuels(A) {
    var n = A.n;
    var rows = TITRES_MAJEURS.map(function (t) {
      return { label: t, p: pct(A.titres[norm(t)], n) };
    });
    $("chart-manuels").innerHTML = svgPourcent(rows, { largeurLabel: 215 }) +
      '<div class="petit mt">Part des écoles déclarant <b>au moins 1 exemplaire</b> ' +
      "de chaque titre majeur.</div>";
  }

  /* =======================================================================
     RENDU — TAUX PAR ÉCOLE
     ======================================================================= */
  function tauxDe(l) {
    var c = l.ctx;
    var et = c.effectifs_total;
    var g = num(et.eff_g), f = num(et.eff_f);
    var t = tot(g, f, et.eff_t);
    var classes = num(c.b.nb_cours);
    return {
      ligne: l, nom: l.nom, commune: l.commune, codec: l.codec,
      eleves: t, classes: classes,
      pfilles: pct(f, g + f),
      pred: pct(tot(et.red_g, et.red_f, et.red_t), t),
      phand: pct(tot(et.hand_g, et.hand_f, et.hand_t), t),
      psec: pct(tot(et.sans_etat_g, et.sans_etat_f, et.sans_etat_t), t),
      parClasse: classes > 0 ? Math.round(t / classes * 10) / 10 : 0
    };
  }

  var COLS_TAUX = [
    { cle: "nom", titre: "École", type: "txt" },
    { cle: "commune", titre: "Commune", type: "txt" },
    { cle: "codec", titre: "CODEC", type: "txt" },
    { cle: "eleves", titre: "Élèves", type: "num" },
    { cle: "pfilles", titre: "% filles", type: "pct", couleur: C.garcons },
    { cle: "pred", titre: "% redoublants", type: "pct", couleur: "#e07b00" },
    { cle: "phand", titre: "% handicapés", type: "pct", couleur: "#6b7280" },
    { cle: "psec", titre: "% sans état civil", type: "pct", couleur: "#6b7280" },
    { cle: "classes", titre: "Classes", type: "num" },
    { cle: "parClasse", titre: "Élèves/classe", type: "dec" }
  ];

  function rendreTaux(sel) {
    state.taux = trier(sel).map(tauxDe);
    rendreTauxEntete();
    rendreTauxCorps();
  }

  function rendreTauxEntete() {
    $("taux-entete").innerHTML = COLS_TAUX.map(function (col) {
      var actif = triTaux.cle === col.cle;
      var fleche = actif ? (triTaux.sens === 1 ? " ▲" : " ▼") : " ▲";
      return '<th class="tri' + (actif ? " actif" : "") + '" data-cle="' + col.cle +
        '" title="Trier par ' + esc(col.titre) + '">' + esc(col.titre) +
        '<span class="fleche">' + fleche + "</span></th>";
    }).join("");
  }

  function rendreTauxCorps() {
    var lignes = state.taux.slice().sort(function (a, b) {
      var col = null;
      for (var i = 0; i < COLS_TAUX.length; i++) {
        if (COLS_TAUX[i].cle === triTaux.cle) { col = COLS_TAUX[i]; break; }
      }
      if (!col) { col = COLS_TAUX[0]; }
      var va = a[col.cle], vb = b[col.cle];
      var r;
      if (col.type === "txt") { r = String(va).localeCompare(String(vb), "fr"); }
      else { r = num(va) - num(vb); }
      if (r === 0) { r = a.nom.localeCompare(b.nom, "fr"); }
      return r * triTaux.sens;
    });

    var corps = $("table-taux").querySelector("tbody");
    if (!lignes.length) {
      corps.innerHTML = '<tr><td colspan="' + COLS_TAUX.length +
        '" style="text-align:center;color:#777;">Aucune école pour ces filtres.</td></tr>';
      return;
    }
    corps.innerHTML = lignes.map(function (t) {
      return "<tr>" +
        "<td><b>" + esc(t.nom) + "</b></td>" +
        "<td>" + esc(t.commune) + "</td>" +
        "<td>" + esc(t.codec) + "</td>" +
        '<td class="num">' + fmt(t.eleves) + "</td>" +
        '<td class="num">' + miniBar(t.pfilles, C.garcons) + "</td>" +
        '<td class="num">' + miniBar(t.pred, "#e07b00") + "</td>" +
        '<td class="num">' + miniBar(t.phand, "#6b7280") + "</td>" +
        '<td class="num">' + miniBar(t.psec, "#6b7280") + "</td>" +
        '<td class="num">' + fmt(t.classes) + "</td>" +
        '<td class="num">' + (t.parClasse > 0 ? fmt1(t.parClasse) : "—") + "</td>" +
        "</tr>";
    }).join("");
  }

  /* =======================================================================
     RENDU — SYNTHÈSE (tableau + export XLSX)
     ======================================================================= */
  var COLS_SYN = [
    { titre: "École", cle: "ecole" },
    { titre: "Commune", cle: "commune" },
    { titre: "CODEC", cle: "codec" },
    { titre: "Élèves G", cle: "g", num: true },
    { titre: "Élèves F", cle: "f", num: true },
    { titre: "Élèves T", cle: "t", num: true },
    { titre: "Classes", cle: "classes", num: true },
    { titre: "Pers. H", cle: "ph", num: true },
    { titre: "Pers. F", cle: "pf", num: true },
    { titre: "Redoubl.", cle: "red", num: true },
    { titre: "Handicap.", cle: "hand", num: true }
  ];

  function chiffres(l) {
    var c = l.ctx;
    var et = c.effectifs_total;
    var g = num(et.eff_g), f = num(et.eff_f);
    var ph = 0, pf = 0;
    ["inst_h", "inst_adj_h", "mc_h"].forEach(function (k) { ph += num(c.recap_fr[k]); });
    ["inst_f", "inst_adj_f", "mc_f"].forEach(function (k) { pf += num(c.recap_fr[k]); });
    ["arabe_inst_h", "arabe_inst_adj_h", "arabe_mc_h"].forEach(function (k) { ph += num(c.recap_ar[k]); });
    ["arabe_inst_f", "arabe_inst_adj_f", "arabe_mc_f"].forEach(function (k) { pf += num(c.recap_ar[k]); });
    return {
      ecole: l.nom, commune: l.commune, codec: l.codec,
      g: g, f: f, t: tot(g, f, et.eff_t),
      classes: num(c.b.nb_cours), ph: ph, pf: pf,
      red: tot(et.red_g, et.red_f, et.red_t),
      hand: tot(et.hand_g, et.hand_f, et.hand_t)
    };
  }

  function somme(lignes, cle) {
    var s = 0;
    lignes.forEach(function (l) { s += num(chiffres(l)[cle]); });
    return s;
  }

  /** Groupes = {cle, titre, lignes[], total{}} — source unique du tableau et du XLSX. */
  function construireSynthese() {
    var grp = $("groupement").value;
    var sel = selection().slice().sort(triPourGroupe(grp));
    var groupes = [], courant = null;
    sel.forEach(function (l) {
      var cle = grp === "commune" ? l.commune : grp === "codec" ? l.codec : l.code;
      if (!courant || courant.cle !== cle) {
        courant = { cle: cle, lignes: [], total: null };
        groupes.push(courant);
      }
      courant.lignes.push(l);
    });

    var totaux = {};
    COLS_SYN.forEach(function (col) {
      if (col.num) { totaux[col.cle] = 0; }
    });

    groupes.forEach(function (g) {
      var t = {};
      COLS_SYN.forEach(function (col) {
        if (col.num) { t[col.cle] = somme(g.lignes, col.cle); }
      });
      g.total = t;
      Object.keys(t).forEach(function (k) { totaux[k] += t[k]; });
    });

    return { grp: grp, groupes: groupes, total: totaux, n: sel.length };
  }

  function libelleTotal(grp, cle) {
    if (grp === "commune") { return "Total COM. " + cle; }
    if (grp === "codec") { return "Total CODEC " + cle; }
    return "";
  }

  function rendreSynthese() {
    var syn = construireSynthese();
    var thead = $("table-synthese").querySelector("thead");
    var tbody = $("table-synthese").querySelector("tbody");

    thead.innerHTML = "<tr>" + COLS_SYN.map(function (c) {
      return '<th' + (c.num ? ' style="text-align:right;"' : "") + ">" + esc(c.titre) + "</th>";
    }).join("") + "</tr>";

    if (!syn.groupes.length) {
      tbody.innerHTML = '<tr><td colspan="' + COLS_SYN.length +
        '" style="text-align:center;color:#777;">Aucune école pour ces filtres.</td></tr>';
      return;
    }

    var html = [];
    syn.groupes.forEach(function (g) {
      g.lignes.forEach(function (l) {
        var c = chiffres(l);
        html.push("<tr>" + COLS_SYN.map(function (col) {
          var v = c[col.cle];
          if (col.num) { return '<td class="num">' + fmt(v) + "</td>"; }
          return "<td" + (col.cle === "ecole" ? "><b>" + esc(v) + "</b>" : ">" + esc(v)) + "</td>";
        }).join("") + "</tr>");
      });
      if (syn.grp !== "ecole") {
        html.push('<tr class="total-groupe"><td>' + esc(libelleTotal(syn.grp, g.cle)) +
          '</td><td colspan="2"></td>' + COLS_SYN.slice(3).map(function (col) {
            return '<td class="num">' + fmt(g.total[col.cle]) + "</td>";
          }).join("") + "</tr>");
      }
    });

    html.push('<tr class="total-general"><td>TOTAL GÉNÉRAL</td><td colspan="2"></td>' +
      COLS_SYN.slice(3).map(function (col) {
        return '<td class="num">' + fmt(syn.total[col.cle]) + "</td>";
      }).join("") + "</tr>");

    tbody.innerHTML = html.join("");
  }

  /* =======================================================================
     EXPORT XLSX (SheetJS chargé à la demande)
     ======================================================================= */
  function descriptionFiltres() {
    var p = [];
    var commune = $("f-commune").value;
    var codec = $("f-codec").value;
    var ecole = $("f-ecole").value;
    p.push(commune ? "Commune : " + commune : "Toutes communes");
    p.push(codec ? "CODEC : " + codec : "Tous les CODEC");
    if (ecole) {
      var opt = $("f-ecole").options[$("f-ecole").selectedIndex];
      p.push("École : " + (opt ? opt.textContent : ecole));
    }
    return p.join("  ·  ");
  }

  async function exporterXlsx() {
    var btn = $("btn-xlsx");
    btn.disabled = true;
    try {
      var syn = construireSynthese();
      if (!syn.n) { throw new Error("Aucune école à exporter (filtres trop restrictifs)."); }

      progres("Chargement du module XLSX…", 10);
      await window.RR.chargerScripts(["assets/vendor/xlsx.full.min.js"]);
      progres("Construction du classeur…", 55);

      var aoa = [];
      aoa.push(["ANALYSE DES DONNÉES — RAPPORT DE RENTRÉE ÉLÉMENTAIRE"]);
      aoa.push([CFG.INSPECTION || "", CFG.IEF || ""]);
      aoa.push(["Année scolaire " + (CFG.ANNEE || "") + " — " + syn.n + " école(s) — " +
                descriptionFiltres()]);
      aoa.push([]);
      aoa.push(COLS_SYN.map(function (c) { return c.titre; }));

      syn.groupes.forEach(function (g) {
        g.lignes.forEach(function (l) {
          var c = chiffres(l);
          aoa.push(COLS_SYN.map(function (col) { return c[col.cle]; }));
        });
        if (syn.grp !== "ecole") {
          var ligne = ["", "", ""];
          COLS_SYN.forEach(function (col, i) {
            if (i < 3) { return; }
            ligne[i] = g.total[col.cle];
          });
          ligne[0] = libelleTotal(syn.grp, g.cle);
          aoa.push(ligne);
        }
      });

      var ligneTot = ["TOTAL GÉNÉRAL", "", ""];
      COLS_SYN.forEach(function (col, i) {
        if (i < 3) { return; }
        ligneTot[i] = syn.total[col.cle];
      });
      aoa.push(ligneTot);

      var ws = window.XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [
        { wch: 42 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 9 }, { wch: 9 }, { wch: 9 }, { wch: 11 }, { wch: 11 }
      ];
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: COLS_SYN.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: COLS_SYN.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: COLS_SYN.length - 1 } }
      ];

      var wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Synthèse");
      var nom = "Analyse_Rentree_" + String(CFG.ANNEE || "").replace("/", "-") + ".xlsx";
      window.XLSX.writeFile(wb, nom);

      finProgres();
      msgAnalyse("ok", "<b>Fichier exporté : " + esc(nom) + "</b> — feuille « Synthèse », " +
        syn.n + " école(s), " + (syn.groupes.length) + " groupe(s), nombres somables.");
    } catch (e) {
      finProgres();
      msgAnalyse("erreur", "<b>Export impossible.</b> " + esc(e.message));
    } finally {
      btn.disabled = false;
    }
  }

  /* =======================================================================
     RENDU GLOBAL
     ======================================================================= */
  function rendre() {
    var sel = selection();
    $("filtre-etat").textContent = etatFiltres(sel);

    if (!sel.length) {
      $("stats").innerHTML = "";
      ["chart-effectifs", "chart-classes", "chart-personnel", "chart-mobilier",
       "chart-infra", "chart-manuels"].forEach(function (id) {
        $(id).innerHTML = "";
      });
      rendreTaux([]);
      rendreSynthese();
      msgAnalyse("warn", "<b>Aucune école ne correspond à ces filtres.</b> " +
        "Élargissez la sélection ou réinitialisez.");
      return;
    }

    msgAnalyse(null);
    var A = agreger(sel);
    rendreKpi(A);
    rendreChartEffectifs(A);
    rendreChartClasses(A);
    rendreChartPersonnel(A);
    rendreChartMobilier(A);
    rendreChartInfra(A);
    rendreChartManuels(A);
    rendreTaux(sel);
    rendreSynthese();
  }

  /* =======================================================================
     DONNÉES
     ======================================================================= */
  function construireLignes(bruts) {
    return bruts.map(function (r) {
      var donnees = r.donnees || {};
      var ctx = window.RR.buildContext(donnees, { id: r.ecole_code });
      var nom = ctx.a.nom_ecole;
      if (!nom || nom === "—") { nom = String(r.ecole_nom || "—").toUpperCase(); }
      return {
        code: String(r.ecole_code || "—"),
        nom: nom,
        commune: cleCommune(ctx.a.commune),
        codec: cleCodec(ctx.a.codec),
        ctx: ctx
      };
    });
  }

  /** 4 rapports fictifs pour développer / démontrer (base réelle vide). */
  async function chargerDemo() {
    var res = await fetch("assets/demo.json", { cache: "no-store" });
    if (!res.ok) { throw new Error("assets/demo.json introuvable."); }
    var brut = await res.json();
    var defs = [
      { nom: "ECOLE PRIMAIRE PUBLIC DE WACK NGOUNA", commune: "WACK NGOUNA", codec: "WACK NGOUNA", k: 1 },
      { nom: "ECOLE PRIMAIRE PRIVEE KEUR MABA DIAKHOU", commune: "KEUR MABA DIAKHOU", codec: "KEUR MABA DIAKHOU", k: 0.74 },
      { nom: "ECOLE PRIMAIRE DE SAMB WOLOF", commune: "SAMB WOLOF", codec: "MADIANA", k: 1.31 },
      { nom: "ECOLE COMMUNAUTAIRE DE DIAGANE", commune: "", codec: "", k: 0.52 }
    ];
    return defs.map(function (d, i) {
      var c = JSON.parse(JSON.stringify(brut));
      c.identification.nom_ecole = d.nom;
      c.identification.commune = d.commune;
      c.identification.codec = d.codec;

      Object.keys(c.effectifs).forEach(function (k) {
        var r = c.effectifs[k];
        r.eff_g = Math.round(num(r.eff_g) * d.k);
        r.eff_f = Math.round(num(r.eff_f) * d.k * (0.92 + 0.05 * i));
        r.eff_t = r.eff_g + r.eff_f;
        r.red_g = Math.round(num(r.red_g) * d.k);
        r.red_f = Math.round(num(r.red_f) * d.k);
        r.red_t = r.red_g + r.red_f;
        r.hand_g = Math.round(num(r.hand_g) * d.k);
        r.hand_f = Math.round(num(r.hand_f) * d.k);
        r.hand_t = r.hand_g + r.hand_f;
        r.sans_etat_g = Math.round(num(r.sans_etat_g) * d.k);
        r.sans_etat_f = Math.round(num(r.sans_etat_f) * d.k);
        r.sans_etat_t = r.sans_etat_g + r.sans_etat_f;
      });

      var cp = c.classes_pedagogiques || {};
      var s = Math.max(1, Math.round(num(cp.nb_classes_simples) * d.k));
      var mg = Math.round(num(cp.nb_cmg) * d.k);
      var df = Math.round(num(cp.nb_cdf) * d.k);
      if (s + mg + df > 0) {
        cp.nb_classes_simples = s;
        cp.nb_cmg = mg;
        cp.nb_cdf = df;
        cp.nb_cours = s + mg + df;
      }

      var oa = c.ouvrages_annexes || {};
      if (i >= 2) { oa.internet = "non"; }
      if (i === 3) { oa.toilettes = "non"; oa.senelec = "non"; oa.magasin = "non"; }

      if (i === 3) {
        (c.manuels || []).forEach(function (m) {
          if (/Mathematiques CM|Guide revise/i.test(String(m.titre || ""))) {
            m.quantite = 0;
          }
        });
      }

      return {
        ecole_code: "DEMO-" + (i + 1),
        ecole_nom: d.nom,
        annee: CFG.ANNEE || "2026/2027",
        maj_le: "2026-11-11 10:00:00+00:00",
        donnees: c
      };
    });
  }

  /* =======================================================================
     DÉMARRAGE + GARDE-FOU (aucun formulaire de connexion sur la page)
     ======================================================================= */
  async function demarrer() {
    var params = new URLSearchParams(location.search);
    state.demo = params.get("demo") === "1";

    try {
      if (!state.demo) {
        if (!window.RRdb.actif()) {
          msg("warn", "<b>Supabase non configuré.</b> Ouvrez cette page depuis " +
            "l'<a href=\"admin.html\">Espace Inspection</a> après avoir renseigné " +
            "<span class='mono'>assets/js/config.js</span>.");
          return;
        }
        var user = await window.RRdb.utilisateur();
        if (!user) {
          msg("warn", "<b>Accès réservé.</b> Ouvrez cette page depuis l'" +
            "<a href=\"admin.html\">Espace Inspection</a> : connectez-vous puis " +
            "cliquez sur le bouton « 📊 Analyse ». " +
            "(Aucune donnée n'est lue sans session.)");
          return;
        }
      }

      progres(state.demo ? "Chargement des données de démonstration…"
                         : "Lecture des rapports…", 25);
      var bruts = state.demo ? await chargerDemo() : await window.RRdb.listerComplets();
      finProgres();

      if (!bruts.length) {
        msg("info", "<b>Aucun rapport à analyser.</b> Déposez d'abord des rapports " +
          "depuis l'<a href=\"admin.html\">Espace Inspection</a> — ou ouvrez " +
          "<a href=\"analyse.html?demo=1\">analyse.html?demo=1</a> pour un " +
          "exemple avec des données fictives.");
        return;
      }

      state.lignes = construireLignes(bruts);
      $("zone").style.display = "block";
      if (state.demo) {
        msgAnalyse("info", "<b>Mode démonstration</b> — " + state.lignes.length +
          " rapports fictifs construits à partir de <span class='mono'>assets/demo.json</span>.");
      }

      reconstruireFiltres();
      rendre();
    } catch (e) {
      finProgres();
      msg("erreur", "<b>Impossible de charger les données.</b> " + esc(e.message));
    }
  }

  /* =======================================================================
     ÉVÈNEMENTS
     ======================================================================= */
  function init() {
    $("f-commune").addEventListener("change", function () {
      $("f-codec").value = "";
      $("f-ecole").value = "";
      reconstruireFiltres();
      rendre();
    });
    $("f-codec").addEventListener("change", function () {
      $("f-ecole").value = "";
      reconstruireFiltres();
      rendre();
    });
    $("f-ecole").addEventListener("change", rendre);
    $("f-sexe").addEventListener("change", rendre);
    $("groupement").addEventListener("change", rendreSynthese);

    $("btn-reset").addEventListener("click", function () {
      $("f-commune").value = "";
      $("f-codec").value = "";
      $("f-ecole").value = "";
      $("f-sexe").value = "tous";
      reconstruireFiltres();
      rendre();
    });

    $("btn-xlsx").addEventListener("click", exporterXlsx);

    $("taux-entete").addEventListener("click", function (ev) {
      var th = ev.target.closest ? ev.target.closest("th[data-cle]") : null;
      if (!th) { return; }
      var cle = th.getAttribute("data-cle");
      if (triTaux.cle === cle) {
        triTaux.sens = -triTaux.sens;
      } else {
        var col = null;
        for (var i = 0; i < COLS_TAUX.length; i++) {
          if (COLS_TAUX[i].cle === cle) { col = COLS_TAUX[i]; break; }
        }
        triTaux.cle = cle;
        triTaux.sens = col && col.type !== "txt" ? -1 : 1;
      }
      rendreTauxEntete();
      rendreTauxCorps();
    });

    demarrer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
