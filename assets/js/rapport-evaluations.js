/* =========================================================================
   rapport-evaluations.js — Générateur HTML du « RAPPORT DES ÉVALUATIONS »
   (1er / 2e / 3e TRIMESTRE) : EXACTEMENT 2 PAGES A4 PORTRAIT 210 x 297 mm,
   composées à la maille du modèle officiel (baselines, colonnes 120 + 6 x 72,
   couleurs #FBE5D6 / #E2F0D9 / #17365D / #C00000 relevées sur le PDF).
   Se register dans le registre RR_MODELES["evaluations"] : les appelants
   (apercu.html, evaluations.html, admin.html) dispatchent vers ce modèle ;
   rapport.js / lib.js restent intacts (défaut = élémentaire).
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR = global.RR || {};
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;                    /* fourni par rapport.js (chargé avant) */

  var TYPE = "evaluations";
  var TITRES = ["Identification + effectifs + statistiques",
                "Commentaires, problèmes soulevés et solutions"];

  /* --- Classes du modèle (ordre officiel CI → CM2) --- */
  var CLASSES = [
    ["ci", "CI"], ["cp", "CP"], ["ce1", "CE1"],
    ["ce2", "CE2"], ["cm1", "CM1"], ["cm2", "CM2"]
  ];

  /* --- Matières (bandes pêche) + libellés des 3 statistiques ---
      Les libellés sont coupés EXACTEMENT comme dans le modèle (3 lignes). */
  var MATIERES = [
    { cle: "langue", titre: "LANGUE ET COMMUNICATION" },
    { cle: "maths",  titre: "MATHÉMATIQUES" },
    { cle: "ist",    titre: "INITIATION SCIENTIFIQUE ET TECHNOLOGIQUE" }
  ];

  var LIB_STATS = [
    ["NOMBRE", "D\u2019ÉLÈVES AYANT", "COMPOSÉ"],
    ["NOMBRE", "D\u2019ÉLÈVES AYANT", "LA MOYENNE"],
    ["POURCENTAGE DES", "ÉLÈVES AYANT LA", "MOYENNE"]
  ];
  var CLES_STATS = ["compose", "moyenne", "pct"];

  /* -----------------------------------------------------------------------
     AIDE-MÉMOIRE
     ----------------------------------------------------------------------- */
  function champ(d, path) {
    var parts = String(path).split(".");
    var o = d;
    for (var i = 0; i < parts.length; i++) {
      if (o === null || o === undefined) { return ""; }
      o = o[parts[i]];
    }
    return (o === null || o === undefined) ? "" : o;
  }

  /** Nombre → valeur affichée dans le tableau (vide = 0, comme le modèle). */
  function nb(v) {
    if (v === "" || v === null || v === undefined || isNaN(parseFloat(v))) {
      return "0";
    }
    return esc(v);
  }

  /** Libellé du trimestre : 1er / 2e / 3e TRIMESTRE (défaut : 1er). */
  function trimestre(d) {
    var v = String(champ(d, "trimestre.val") || "1");
    if (v === "2") { return "2e TRIMESTRE"; }
    if (v === "3") { return "3e TRIMESTRE"; }
    return "1er TRIMESTRE";
  }

  function numeroTrimestre(d) {
    var v = String(champ(d, "trimestre.val") || "1");
    return (v === "2" || v === "3") ? v : "1";
  }

  /* -----------------------------------------------------------------------
     PAGE 1 — en-tête souligné + logo + titre + tableau officiel
     ----------------------------------------------------------------------- */
  function enteteHTML(d) {
    var lignes = [
      ["ia", "IA:"],
      ["ief", "IEF:"],
      ["district", "DISTRICT:"],
      ["codec", "CODEC:"],
      ["nom_ecole", "ECOLE:"],
      ["annee", "ANNEE SCOLAIRE:"]
    ];
    var html = "";
    lignes.forEach(function (l) {
      var v = champ(d, "identification." + l[0]);
      html += '<div class="ev-el"><b>' + l[1] + '</b>' +
              '<span class="ev-val">' + esc(String(v).trim()) + "</span></div>";
    });
    return html;
  }

  /** Les 12 cellules (6 classes × lettre + chiffre) d'une sous-ligne. */
  function cellules(d, chemin, lettre, cls) {
    var html = "";
    var l = lettre.toLowerCase();
    CLASSES.forEach(function (cl) {
      html += '<td class="ev-lettre ' + cls + '">' + lettre + "</td>" +
              '<td class="' + cls + '">' +
              nb(champ(d, chemin + "." + cl[0] + "." + l)) + "</td>";
    });
    return html;
  }

  /** Bloc « EFFECTIF TOTAL » : 3 sous-lignes G / F / T. */
  function effectifHTML(d) {
    var html = '<tr><td class="ev-lib" rowspan="3">EFFECTIF TOTAL</td>' +
      cellules(d, "effectifs", "G", "ev-g") + "</tr>" +
      "<tr>" + cellules(d, "effectifs", "F", "ev-f") + "</tr>" +
      "<tr>" + cellules(d, "effectifs", "T", "ev-t") + "</tr>";
    return html;
  }

  /** Bloc d'une matière : bande pêche + 3 statistiques × 3 sous-lignes. */
  function matiereHTML(d, mat) {
    var html = '<tr class="ev-bande"><td colspan="13">' +
               esc(mat.titre) + "</td></tr>";
    CLES_STATS.forEach(function (stat, si) {
      var chemin = "evaluations." + mat.cle + "." + stat;
      html += '<tr><td class="ev-lib" rowspan="3">' +
              LIB_STATS[si].join("<br>") + "</td>" +
              cellules(d, chemin, "G", "ev-g") + "</tr>" +
              "<tr>" + cellules(d, chemin, "F", "ev-f") + "</tr>" +
              "<tr>" + cellules(d, chemin, "T", "ev-t") + "</tr>";
    });
    return html;
  }

  function tableauHTML(d) {
    var colgroup = '<colgroup><col style="width:120pt">';
    CLASSES.forEach(function () {
      colgroup += '<col style="width:25pt"><col style="width:47pt">';
    });
    colgroup += "</colgroup>";

    var thead = '<thead><tr><th class="ev-cours">COURS</th>';
    CLASSES.forEach(function (cl) {
      thead += '<th class="ev-cls" rowspan="2" colspan="2">' +
               esc(cl[1]) + "</th>";
    });
    thead += '</tr><tr><th class="ev-stats">STATISTIQUES</th></tr></thead>';

    var tbody = "<tbody>" + effectifHTML(d);
    MATIERES.forEach(function (m) { tbody += matiereHTML(d, m); });
    tbody += "</tbody>";

    return '<table class="ev-table">' + colgroup + thead + tbody + "</table>";
  }

  function page1(ctx) {
    var d = ctx.d || {};
    return '<div class="ev-p1">' +
      '<img class="ev-logo" src="assets/logo_evaluations.jpeg" alt="">' +
      '<div class="ev-entete">' + enteteHTML(d) + "</div>" +
      '<div class="ev-titre">RAPPORT DES ÉVALUATIONS DU ' +
        trimestre(d) + "</div>" +
      tableauHTML(d) +
    "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGE 2 — commentaires (4 lignes pointillées) + problèmes / solutions
     (cases numérotées 1 → 6 en 2 colonnes) + signature
     ----------------------------------------------------------------------- */
  function itemsHTML(valeurs) {
    var html = '<div class="ev-items">';
    for (var i = 0; i < 6; i++) {
      var col = (i % 2 === 0) ? "col-gauche" : "col-droite";
      html += '<div class="ev-item ' + col + '">' +
              '<span class="ev-n">' + (i + 1) + "</span>" +
              '<span class="ev-l">' +
              esc(String(valeurs && valeurs[i] ? valeurs[i] : "")) +
              "</span></div>";
    }
    return html + "</div>";
  }

  function liste(d, cle) {
    var v = champ(d, cle);
    if (Array.isArray(v)) { return v; }
    return [];
  }

  function page2(ctx) {
    var d = ctx.d || {};
    var commentaire = String(champ(d, "commentaires") || "");

    return '<div class="ev-p2">' +
      '<div class="ev-titre2">COMMENTAIRES</div>' +
      '<div class="ev-lignes">' +
        '<div class="ev-lignes-fond">' +
          '<div class="ev-ligne-comm"></div>' +
          '<div class="ev-ligne-comm"></div>' +
          '<div class="ev-ligne-comm"></div>' +
          '<div class="ev-ligne-comm"></div>' +
        "</div>" +
        '<div class="ev-comm-texte">' + esc(commentaire) + "</div>" +
      "</div>" +
      '<div class="ev-apres-lignes">' +
        '<div class="ev-titre2">PROBLEMES SOULEVES</div>' +
        itemsHTML(liste(d, "problemes")) +
      "</div>" +
      '<div class="ev-apres-items">' +
        '<div class="ev-titre2">SOLUTIONS MISES EN ŒUVRE</div>' +
        itemsHTML(liste(d, "solutions")) +
      "</div>" +
      '<div class="ev-sign">LE DIRECTEUR DE L\u2019ÉCOLE</div>' +
    "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGES + APERÇU (wrappers .apercu-slot + .apercu-legende)
     ----------------------------------------------------------------------- */
  function pageContents(ctx) {
    return [page1(ctx), page2(ctx)];
  }

  /** HTML complet : 2 pages A4 PORTRAIT pleines (210 x 297 mm, marge 0)
      → pdf.js dépose l'image à 0/0 : géométrie exacte du modèle. */
  function buildPages(ctx) {
    var contenus = pageContents(ctx);
    var attributs = ' data-page="{n}" data-orientation="portrait"' +
      ' data-mm-largeur="210" data-mm-hauteur="297"' +
      ' data-marge-x="0" data-marge-y="0"';
    return (
      '<div class="apercu-slot">' +
        '<div class="pdf-page a4-plein"' + attributs.replace("{n}", "1") + ">" +
          '<div class="page-inner">' + contenus[0] + "</div>" +
        "</div>" +
        '<div class="apercu-legende"></div>' +
      "</div>" +
      '<div class="apercu-slot">' +
        '<div class="pdf-page a4-plein"' + attributs.replace("{n}", "2") + ">" +
          '<div class="page-inner">' + contenus[1] + "</div>" +
        "</div>" +
        '<div class="apercu-legende"></div>' +
      "</div>"
    );
  }

  /* -----------------------------------------------------------------------
     APERÇU — échelle de la page pleine 210 x 297 mm (aucun auto-ajustement :
     la géométrie du modèle est strictement respectée, la page déborde →
     overflow:hidden la rogne, comme un document imprimé).
     ----------------------------------------------------------------------- */
  function renderPreview(container, ctx) {
    container.innerHTML = buildPages(ctx);
    fitPreview(container);
    return container.querySelectorAll(".pdf-page");
  }

  function fitPreview(container) {
    var pages = container.querySelectorAll(".pdf-page");
    if (!pages.length) { return; }
    var avail = container.clientWidth ||
                (container.parentElement && container.parentElement.clientWidth) || 1040;

    var pagePx = 210 * 96 / 25.4;        /* 793,7 px */
    var hauteurPx = 297 * 96 / 25.4;     /* 1122,5 px */

    Array.prototype.forEach.call(pages, function (pg, i) {
      var scale = Math.min(1, (avail - 4) / pagePx);
      pg.style.transform = "scale(" + scale + ")";
      pg.style.transformOrigin = "top left";

      var slot = pg.parentElement;
      var leg = (slot && slot.classList.contains("apercu-slot"))
        ? slot.querySelector(".apercu-legende") : null;
      if (leg) {
        leg.textContent = "Page " + (i + 1) + " / " + TITRES.length +
                          " — " + TITRES[i];
        leg.style.marginTop = Math.ceil(hauteurPx * (scale - 1)) + "px";
      }
    });
  }

  /* -----------------------------------------------------------------------
     CONTEXTE (brut → rendu)
     ----------------------------------------------------------------------- */
  function buildContext(donnees, opts) {
    opts = opts || {};
    var d = donnees || {};

    var soumission = opts.soumission || d._submission_time || "";
    if (soumission) {
      var parsed = new Date(soumission);
      if (!isNaN(parsed.getTime())) {
        soumission = ("0" + parsed.getDate()).slice(-2) + "/" +
          ("0" + (parsed.getMonth() + 1)).slice(-2) + "/" +
          parsed.getFullYear() + " " +
          ("0" + parsed.getHours()).slice(-2) + ":" +
          ("0" + parsed.getMinutes()).slice(-2);
      }
    } else {
      soumission = "—";
    }

    var num = numeroTrimestre(d);

    return {
      meta: {
        ecole: champ(d, "identification.nom_ecole") || "—",
        annee: opts.annee || CFG.ANNEE || "2026/2027",
        soumission: soumission,
        id: (opts.id !== undefined && opts.id !== null && opts.id !== "")
            ? opts.id : "—",
        /* Préfixe du nom de fichier : Rapport_Evaluations_T<n>_ECOLE_ANNEE.pdf */
        fichier_prefixe: "Rapport_Evaluations_T" + num + "_"
      },
      insp: {
        ministere: CFG.MINISTERE || "",
        inspection: CFG.INSPECTION || "",
        ief: CFG.IEF || ""
      },
      d: d
    };
  }

  /* -----------------------------------------------------------------------
     ENREGISTREMENT DANS LE REGISTRE DES MODÈLES
     ----------------------------------------------------------------------- */
  global.RR_MODELES = global.RR_MODELES || {};
  global.RR_MODELES[TYPE] = {
    buildContext: buildContext,
    buildPages: buildPages,
    pageContents: pageContents,
    renderPreview: renderPreview,
    fitPreview: fitPreview,
    titres: TITRES
  };

  R.evaluations = {
    buildContext: buildContext,
    buildPages: buildPages,
    pageContents: pageContents,
    renderPreview: renderPreview,
    fitPreview: fitPreview,
    titres: TITRES
  };

}(window));
