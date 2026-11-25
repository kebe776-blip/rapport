/* =========================================================================
   form-general-moyen.js — Moteur de saisie DÉDIÉ du « RAPPORT GÉNÉRAL DE
   RENTRÉE — ENSEIGNEMENT MOYEN & SECONDAIRE » (general-moyen.html).
   • Rendu des 11 sections du modèle officiel 2026/2027 (14 pages PDF) :
     page d'entrée, élèves vulnérables, structures, TICE, effectifs moyen,
     effectifs secondaire, examens, personnel administratif, personnel
     enseignant, personnel de service, observations.
   • Tableaux nominatifs dynamiques (52 administratifs / 69 enseignants /
     20 agents de service), calculs automatiques (effectifs, LV2, examens,
     mentions), brouillon hors-ligne dédié et soumission (enregistrement
     typé + PDF 14 pages via RR_MODELES).
   • Copie autonome adaptée de form-general-prescolaire.js : form.js et
     champs.js ne sont ni modifiés ni chargés par cette page.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR;
  var D = global.RR_CHAMPS_GENERAL_MOYEN;
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;

  var LS = CFG.LS_BROUILLON_GENERAL_MOYEN ||
           "rr_brouillon_general_moyen_v1";

  var MAX_ADMIN = 52;
  var MAX_ENSEIGNANT = 69;
  var MAX_SERVICE = 20;
  var INIT_ADMIN = 8;
  var INIT_ENSEIGNANT = 10;
  var INIT_SERVICE = 4;

  var conteneur = null;
  var donnees = {};
  var minuteur = null;

  function modele() {
    var type = global.RR_TYPE || "general-moyen";
    var m = (global.RR_MODELES || {})[type];
    return m || { buildContext: R.buildContext, renderPreview: R.renderPreview,
                  fitPreview: R.fitPreview, titres: R.TITRES_PAGES };
  }

  /* -----------------------------------------------------------------------
     CHEMINS DE DONNÉES
     ----------------------------------------------------------------------- */
  function setPath(obj, path, value) {
    var parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var p = parts[i];
      if (o[p] === null || typeof o[p] !== "object") {
        o[p] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      }
      o = o[p];
    }
    o[parts[parts.length - 1]] = value;
  }

  function getPath(obj, path) {
    var parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    var o = obj;
    for (var i = 0; i < parts.length; i++) {
      if (o === null || o === undefined) { return undefined; }
      o = o[parts[i]];
    }
    return o;
  }

  function idDe(path) {
    return "f_" + path.replace(/[^A-Za-z0-9]+/g, "_");
  }

  function nombre(el) {
    var v = parseFloat(el && el.value);
    return isNaN(v) ? 0 : v;
  }

  function normaliser(s) {
    return String(s === null || s === undefined ? "" : s)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
      .toUpperCase();
  }

  function maxDe(type) {
    if (type === "admin") { return MAX_ADMIN; }
    if (type === "enseignant") { return MAX_ENSEIGNANT; }
    return MAX_SERVICE;
  }

  function initDe(type) {
    if (type === "admin") { return INIT_ADMIN; }
    if (type === "enseignant") { return INIT_ENSEIGNANT; }
    return INIT_SERVICE;
  }

  function colonnesDe(type) {
    if (type === "admin") { return D.COLONNES_ADMIN; }
    if (type === "enseignant") { return D.COLONNES_ENSEIGNANT; }
    return D.COLONNES_SERVICE;
  }

  /* -----------------------------------------------------------------------
     GÉNÉRATION DE CHAMPS
     ----------------------------------------------------------------------- */
  function optionsHTML(opts, valeur) {
    var html = "";
    for (var i = 0; i < opts.length; i++) {
      var v = opts[i][0], l = opts[i][1];
      html += '<option value="' + esc(v) + '"' +
              (String(valeur || "") === String(v) ? " selected" : "") + ">" +
              esc(l) + "</option>";
    }
    return html;
  }

  function inputHTML(path, o) {
    o = o || {};
    var attr = ' id="' + idDe(path) + '" data-path="' + esc(path) + '"';
    if (o.type === "num") {
      attr += ' data-type="num" min="0" inputmode="numeric"';
    } else {
      attr += ' data-type="text"';
    }
    if (o.maj) { attr += ' data-maj="upper"'; }
    if (o.max) { attr += ' maxlength="' + o.max + '"'; }
    if (o.tel) { attr += ' inputmode="tel"'; }
    if (o.placeholder) { attr += ' placeholder="' + esc(o.placeholder) + '"'; }
    if (o.readonly) { attr += " readonly"; }
    if (o.cls) { attr += ' class="' + esc(o.cls) + '"'; }
    if (o.style) { attr += ' style="' + esc(o.style) + '"'; }
    var type = o.type === "num" ? "number" : "text";
    return "<input type=\"" + type + '"' + attr + ">";
  }

  function selectHTML(path, opts, valeur, o) {
    o = o || {};
    var attr = ' id="' + idDe(path) + '" data-path="' + esc(path) +
               '" data-type="text"';
    if (o.cls) { attr += ' class="' + esc(o.cls) + '"'; }
    if (o.style) { attr += ' style="' + esc(o.style) + '"'; }
    return "<select" + attr + ">" + optionsHTML(opts, valeur) + "</select>";
  }

  function areaHTML(path, o) {
    o = o || {};
    var attr = ' id="' + idDe(path) + '" data-path="' + esc(path) +
               '" data-type="text" rows="' + (o.rows || 3) + '"';
    if (o.cls) { attr += ' class="' + esc(o.cls) + '"'; }
    return "<textarea" + attr + "></textarea>";
  }

  function checkboxHTML(path, label, cls) {
    return '<label class="gm-check ' + esc(cls || "") + '">' +
      '<input type="checkbox" data-path="' + esc(path) +
      '" data-type="bool" value="oui"> <span>' + esc(label) + "</span></label>";
  }

  function champHTML(groupe, c) {
    var path = groupe + "." + c.n;
    var cls = "champ" + (c.large ? " large" : "");
    var oblig = c.req ? ' <span class="ob">*</span>' : "";
    var aide = c.aide ? '<span class="aide">' + esc(c.aide) + "</span>" : "";
    var html = '<div class="' + cls + '" data-champ="' + esc(path) + '">' +
      '<label for="' + idDe(path) + '">' + esc(c.l) + oblig + "</label>";

    if (c.t === "select") {
      html += selectHTML(path, c.opts, c.def || "");
    } else if (c.t === "area") {
      html += areaHTML(path, { rows: c.rows || 3 });
    } else if (c.t === "combo") {
      var liste = (c.listeNom && global[c.listeNom]) || c.liste || [];
      var idListe = "liste_" + idDe(path);
      html += '<div class="combo">' +
        '<input type="text"' + ' id="' + idDe(path) + '"' +
          ' data-path="' + esc(path) + '" data-type="text"' +
          ' autocomplete="off" spellcheck="false" role="combobox"' +
          ' aria-expanded="false" aria-autocomplete="list"' +
          ' aria-controls="' + idListe + '"' +
          ' placeholder="Tapez pour filtrer…">' +
        '<ul class="combo-liste" id="' + idListe + '" role="listbox" hidden>' +
          liste.map(function (v) {
            return '<li class="combo-option" role="option" data-val="' +
                   esc(v) + '">' + esc(v) + "</li>";
          }).join("") +
        "</ul></div>";
    } else {
      html += inputHTML(path, {
        type: c.t === "num" ? "num" : "text",
        maj: c.maj, max: c.max, tel: c.tel,
        placeholder: c.t === "date" ? "JJ/MM/AAAA" : c.placeholder
      });
    }
    return html + aide + "</div>";
  }

  function champsHTML(groupe, liste) {
    return '<div class="champs">' + liste.map(function (c) {
      return champHTML(groupe, c);
    }).join("") + "</div>";
  }

  function enteteSection(num, titre, badge) {
    return '<details class="section-form" open data-badge-sec="' + esc(badge) + '">' +
      "<summary>" + esc(num) + ". " + esc(titre) +
      '<span class="badge" data-badge="' + esc(badge) + '">0</span></summary>' +
      '<div class="corps">';
  }

  function finSection() {
    return "</div></details>";
  }

  /* Conseil de défilement : masqué en CSS sur ordinateur, visible au téléphone. */
  function aideDefilement(texte) {
    return '<div class="gm-aide-defilement">↔ ' + esc(texte) + "</div>";
  }

  /* -----------------------------------------------------------------------
     SECTION 1 — PAGE D'ENTRÉE
     ----------------------------------------------------------------------- */
  function section1HTML() {
    var html = enteteSection("1", "PAGE D'ENTRÉE — identification, effectifs et gouvernance", "S1");

    html += '<h3 class="gm-h3">Identification de l\'établissement</h3>' +
      champsHTML("identification", D.IDENTIFICATION_CHAMPS);

    /* Effectifs personnels + effectifs élèves */
    html += '<h3 class="gm-h3">Effectif des personnels et des élèves</h3>' +
      '<div class="gm-deux-colonnes">' +
        '<div class="gm-bloc">' +
          '<div class="gm-bloc-titre">EFFECTIF PERSONNELS</div>' +
          '<div class="table-defilement"><table class="table-saisie gm-table-saisie" data-p1p>' +
            '<thead><tr><th style="width:55%;">Catégorie</th><th>F</th><th>H</th><th>T</th></tr></thead><tbody>';

    D.PERSONNEL_LIGNES.forEach(function (l) {
      html += '<tr><td>' + esc(l.l) + "</td>" +
        '<td><input type="number" min="0" data-type="num" data-p1p="' + l.n +
          '" data-sex="f" data-path="personnels.' + l.n + '.f"></td>' +
        '<td><input type="number" min="0" data-type="num" data-p1p="' + l.n +
          '" data-sex="h" data-path="personnels.' + l.n + '.h"></td>' +
        '<td><input type="text" readonly class="gm-calc" data-p1p-total="' +
          l.n + '"></td></tr>';
    });
    html += "</tbody></table></div></div>" +
        '<div class="gm-bloc">' +
          '<div class="gm-bloc-titre">EFFECTIF ÉLÈVES</div>' +
          '<div class="table-defilement"><table class="table-saisie gm-table-saisie" data-p1e>' +
            '<thead><tr><th style="width:40%;">Niveau</th><th>Filles</th>' +
            '<th>Garçons</th><th>Total</th></tr></thead><tbody>';

    D.ELEVES_LIGNES.forEach(function (l) {
      html += '<tr><td>' + esc(l.l) + "</td>" +
        '<td><input type="number" min="0" data-type="num" data-p1e="' + l.n +
          '" data-sex="filles" data-path="eleves_page1.' + l.n + '.filles"></td>' +
        '<td><input type="number" min="0" data-type="num" data-p1e="' + l.n +
          '" data-sex="garcons" data-path="eleves_page1.' + l.n + '.garcons"></td>' +
        '<td><input type="text" readonly class="gm-calc" data-p1e-total="' +
          l.n + '"></td></tr>';
    });
    html += '<tr class="totale"><td><b>TOTAL</b></td>' +
      '<td><input type="text" readonly class="gm-calc" data-p1e-global="filles"></td>' +
      '<td><input type="text" readonly class="gm-calc" data-p1e-global="garcons"></td>' +
      '<td><input type="text" readonly class="gm-calc" data-p1e-global="total"></td>' +
      "</tr></tbody></table></div></div></div>";

    /* CGE */
    html += '<h3 class="gm-h3">Conseil de Gestion de l\'Établissement (CGE)</h3>' +
      '<div class="champs">' +
        champHTML("cge", { n: "reglement_interieur", l: "Existe-t-il un Règlement Intérieur ?", t: "select", opts: D.OPTIONS.OUI_NON }) +
        champHTML("cge", { n: "reglement_adopte", l: "A-t-il été adopté en Assemblée Générale ?", t: "select", opts: D.OPTIONS.OUI_NON }) +
        champHTML("cge", { n: "nb_membres", l: "Nombre de membres du CGE", t: "num" }) +
        champHTML("cge", { n: "femmes", l: "dont Femmes", t: "num" }) +
        champHTML("cge", { n: "hommes", l: "dont Hommes", t: "num" }) +
        champHTML("cge", { n: "reunions_12m", l: "Réunions CGE tenues (12 derniers mois)", t: "num" }) +
        champHTML("cge", { n: "compte_bancaire", l: "Compte bancaire au nom de l'établissement ?", t: "select", opts: D.OPTIONS.OUI_NON }) +
      "</div>" +
      '<div class="gm-inline"><span class="gm-inline-label">Date du dernier renouvellement du CGE :</span>' +
        inputHTML("cge.date_jj", { placeholder: "jj", style: "width:55px;" }) +
        inputHTML("cge.date_mm", { placeholder: "mm", style: "width:55px;" }) +
        inputHTML("cge.date_annee", { placeholder: "année", style: "width:85px;" }) +
      "</div>";

    /* PE + gouvernement */
    html += '<h3 class="gm-h3">Projet d\'établissement et gouvernement scolaire</h3>' +
      '<div class="champs">' +
        champHTML("pe", { n: "projet_etab", l: "L'établissement dispose-t-il d'un Projet d'Établissement (PE) courant ?", t: "select", opts: D.OPTIONS.OUI_NON }) +
        champHTML("pe", { n: "projet_precisions", l: "Si oui, préciser", t: "area", rows: 2, large: true }) +
        champHTML("pe", { n: "gouvernement_eleves", l: "Existe-t-il un gouvernement scolaire ?", t: "select", opts: D.OPTIONS.OUI_NON }) +
        champHTML("pe", { n: "gouv_filles", l: "Si oui, nombre de filles", t: "num" }) +
        champHTML("pe", { n: "gouv_garcons", l: "Nombre de garçons", t: "num" }) +
        champHTML("pe", { n: "gouv_membres", l: "Nombre total de membres", t: "num" }) +
      "</div>";

    /* Cellules pédagogiques */
    html += '<div class="gm-bloc-titre">Cellules pédagogiques fonctionnelles ? (Oui - Non)</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-cellules">' +
        "<thead><tr><th>Réponse</th>" +
        D.CELLULES.map(function (c) { return "<th>" + esc(c[1]) + "</th>"; }).join("") +
        "</tr></thead><tbody><tr>" +
        '<td>' + selectHTML("cellules.cellules_fonctionnelles", D.OPTIONS.OUI_NON,
                            "", { style: "min-width:80px;" }) + "</td>" +
        D.CELLULES.map(function (c) {
          return "<td>" + selectHTML("cellules.cellules." + c[0],
            D.OPTIONS.OUI_NON, "", { style: "min-width:62px;" }) + "</td>";
        }).join("") +
      "</tr></tbody></table></div>";

    /* Clubs */
    html += '<div class="gm-bloc-titre">Organisations / Clubs d\'élèves fonctionnels ? (Oui - Non)</div>' +
      '<div class="gm-checks">' +
        checkboxHTML("clubs.clubs_fonctionnels", "Organisations / clubs fonctionnels") +
        D.CLUBS.map(function (c) {
          return checkboxHTML("clubs." + c[0], c[1]);
        }).join("") +
      "</div>" +
      '<div class="champs">' +
        champHTML("clubs", { n: "autres_precisions", l: "Autres organisations / clubs (préciser)", t: "text", large: true }) +
      "</div>";

    /* Chef d'établissement */
    html += '<h3 class="gm-h3">Chef d\'établissement</h3>' +
      '<div class="champs">' +
        champHTML("chef", { n: "chef_prenom_nom", l: "Prénom(s) et Nom du Chef d'Établissement", req: true, large: true }) +
        champHTML("chef", { n: "chef_telephone", l: "Téléphone du Chef d'établissement", req: true, tel: true }) +
        champHTML("chef", { n: "chef_genre", l: "Genre (M ou F) du Chef d'Établissement", t: "select", opts: D.OPTIONS.GENRE }) +
        champHTML("chef", { n: "chef_corps_grade", l: "Corps & grade du Chef d'Établissement" }) +
        champHTML("chef", { n: "chef_discipline", l: "Discipline(s) / spécialité(s) du Chef d'Établissement", large: true }) +
        champHTML("chef", { n: "chef_email", l: "Email du Chef d'Établissement" }) +
      "</div>" +
      '<div class="gm-note">Cachet et signature du chef d\'établissement à apposer sur l\'exemplaire papier.</div>';

    return html + finSection();
  }

  /* -----------------------------------------------------------------------
     SECTION 2 — INFORMATIONS ÉLÈVES VULNÉRABLES
     ----------------------------------------------------------------------- */
  function section2HTML() {
    var html = enteteSection("2",
      "INFORMATIONS ÉLÈVES VULNÉRABLES — handicap, état civil et violences", "S2");

    html += '<div class="gm-bloc-titre">Nombre de groupes pédagogiques</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-vuln-groupes" data-vuln-groupes>' +
      '<thead><tr><th style="min-width:190px;">Niveau</th>' +
      D.ELEVES_LIGNES.map(function (l) {
        return "<th>" + esc(l.l) + "</th>";
      }).join("") + "</tr></thead><tbody>" +
      '<tr><td><b>Total</b></td>' +
      D.ELEVES_LIGNES.map(function (l) {
        return '<td><input type="number" min="0" data-type="num" data-path="vulnerables.groupes.' +
          l.n + '.total"></td>';
      }).join("") + "</tr>" +
      '<tr><td><b>Dont Franco-arabe</b></td>' +
      D.ELEVES_LIGNES.map(function (l) {
        return '<td><input type="number" min="0" data-type="num" data-path="vulnerables.groupes.' +
          l.n + '.fa"></td>';
      }).join("") + "</tr>" +
      "</tbody></table></div>";

    html += '<div class="gm-bloc-titre">Effectifs par indicateur (Garçons / Filles)</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-vulnerables" data-vuln-table>' +
      '<thead><tr><th rowspan="2" style="min-width:330px;">Indicateur</th>' +
      D.ELEVES_LIGNES.map(function (l) {
        return '<th colspan="2" class="grp">' + esc(l.l) + "</th>";
      }).join("") + "</tr><tr>" +
      D.ELEVES_LIGNES.map(function () {
        return "<th>G</th><th>F</th>";
      }).join("") + "</tr></thead><tbody>";

    D.VULNERABLES_INDICATEURS.forEach(function (ind) {
      html += "<tr><td>" + esc(ind.l) + "</td>";
      D.ELEVES_LIGNES.forEach(function (l) {
        ["g", "f"].forEach(function (s) {
          html += '<td><input type="number" min="0" data-type="num" data-path="vulnerables.indicateurs.' +
            ind.n + "." + l.n + "." + s + '"></td>';
        });
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    return html + finSection();
  }

  /* -----------------------------------------------------------------------
     SECTION 3 — STRUCTURES & ÉQUIPEMENTS
     ----------------------------------------------------------------------- */
  function section3HTML() {
    var html = enteteSection("3", "STRUCTURES & ÉQUIPEMENTS", "S3");

    var champs = [
      { n: "accessible", l: "Établissement accessible en toute saison à partir de la route principale ?", t: "select", opts: D.OPTIONS.OUI_NON },
      { n: "nature_route", l: "Nature de la route ?" },
      { n: "cloture", l: "Établissement clôturé ?", t: "select", opts: D.OPTIONS.OUI_NON },
      { n: "type_cloture", l: "Type de clôture" },
      { n: "sanitaires_separes", l: "Blocs sanitaires séparés garçons-filles ?", t: "select", opts: D.OPTIONS.OUI_NON },
      { n: "nb_box_total", l: "Nbre de box (total)", t: "num" },
      { n: "nb_box_filles", l: "dont box filles", t: "num" },
      { n: "nb_box_garcons", l: "dont box garçons", t: "num" },
      { n: "labo", l: "Laboratoire ?", t: "select", opts: D.OPTIONS.OUI_NON },
      { n: "nb_labos", l: "Si oui, nombre de laboratoires fonctionnels", t: "num" },
      { n: "telephone", l: "Connection téléphone", t: "select", opts: D.OPTIONS.TELEPHONE },
      { n: "internet", l: "Connection Internet", t: "select", opts: D.OPTIONS.INTERNET },
      { n: "bloc_admin", l: "Bloc administratif ?", t: "select", opts: D.OPTIONS.OUI_NON },
      { n: "salle_info_climatisee", l: "Salle informatique disponible climatisée ?", t: "select", opts: D.OPTIONS.OUI_NON },
      { n: "cablage_reseau", l: "Câblage réseau ?", t: "select", opts: D.OPTIONS.OUI_NON },
      { n: "nb_ordi_reseau", l: "Nombre d'ordinateurs connectés au réseau", t: "num" },
      { n: "camera", l: "Caméra numérique — nombre", t: "num" },
      { n: "webcam", l: "Webcam — nombre", t: "num" }
    ];
    html += champsHTML("structures", champs);

    html += '<div class="gm-bloc-titre">Source(s) d\'eau et d\'énergie</div>' +
      '<div class="gm-checks">' +
        checkboxHTML("structures.eau_forage", "Forage") +
        checkboxHTML("structures.eau_puits", "Puits") +
        checkboxHTML("structures.eau_autre", "Autre source d'eau") +
        checkboxHTML("structures.energie_electricite", "Électricité") +
        checkboxHTML("structures.energie_solaire", "Solaire") +
        checkboxHTML("structures.energie_eolienne", "Éolienne") +
        checkboxHTML("structures.energie_groupe", "Groupe électrogène") +
      "</div>" +
      '<div class="champs">' +
        champHTML("structures", { n: "eau_autre_description", l: "Description de l'autre source d'eau", large: true }) +
      "</div>";

    /* Salles */
    html += '<div class="gm-bloc-titre">Salles et locaux</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie" data-salles>' +
        '<thead><tr><th style="min-width:270px;">Locaux</th><th>Nombre total</th>' +
        '<th>En bon état</th><th>En mauvais état</th><th>Non utilisées</th>' +
        '<th>Abris provisoire utilisé comme salle</th></tr></thead><tbody>';
    D.SALLES.forEach(function (s, i) {
      html += "<tr><td>" + esc(s.l) + "</td>";
      ["total", "bon", "mauvais", "non_utilisees", "abris"].forEach(function (k) {
        html += '<td><input type="number" min="0" data-type="num" data-path="salles[' +
          i + "]." + k + '"></td>';
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    /* Équipements */
    html += '<div class="gm-bloc-titre">Équipements</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie" data-equipements>' +
        '<thead><tr><th style="min-width:270px;">Équipement</th><th>En marche</th>' +
        '<th>En panne</th><th>Destiné à l\'usage des élèves</th></tr></thead><tbody>';
    D.EQUIPEMENTS.forEach(function (e, i) {
      html += '<tr><td>' + esc(e.l) + "</td>";
      ["marche", "panne", "eleves"].forEach(function (k) {
        html += '<td><input type="number" min="0" data-type="num" data-path="equipements[' +
          i + "]." + k + '"></td>';
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    /* Manuels */
    html += '<div class="gm-bloc-titre">Manuels scolaires — nombre par discipline et par classe pédagogique</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-manuels">' +
        '<thead><tr><th style="min-width:190px;">Discipline</th>' +
        D.MANUELS_CLASSES.map(function (c) { return "<th>" + esc(c[1]) + "</th>"; }).join("") +
        "</tr></thead><tbody>";
    D.MANUELS_DISCIPLINES.forEach(function (d) {
      html += "<tr><td>" + esc(d[1]) + "</td>";
      D.MANUELS_CLASSES.forEach(function (c) {
        html += '<td><input type="number" min="0" data-type="num" data-path="manuels.' +
          d[0] + "." + c[0] + '"></td>';
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    /* Supports numériques */
    html += '<div class="gm-bloc-titre">Supports pédagogiques numériques (néant / 1 à 3 titres / 4+ titres)</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie">' +
        "<thead><tr>" + D.SUPPORTS_NUM.map(function (s) {
          return "<th>" + esc(s[1]) + "</th>";
        }).join("") + "</tr></thead><tbody><tr>" +
        D.SUPPORTS_NUM.map(function (s) {
          return "<td>" + selectHTML("supports." + s[0], D.OPTIONS.SUPPORT_NUM,
                                     "", { style: "min-width:150px;" }) + "</td>";
        }).join("") + "</tr></tbody></table></div>";

    return html + finSection();
  }

  /* -----------------------------------------------------------------------
     SECTION 4 — SITUATION DU TICE
     ----------------------------------------------------------------------- */
  function section4HTML() {
    var html = enteteSection("4", "SITUATION DU TICE", "S4");

    html += '<div class="gm-bloc-titre">Personnels de l\'établissement selon leurs compétences en numérique</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie">' +
        '<thead><tr><th colspan="2">Type de personnel / compétence</th>' +
        D.TICE_NIVEAUX.map(function (n) { return "<th>" + esc(n[1]) + "</th>"; }).join("") +
        "</tr></thead><tbody>";
    var index = 0;
    D.TICE_PERSONNELS.forEach(function (p) {
      D.TICE_COMPETENCES.forEach(function (c, j) {
        html += "<tr>" +
          (j === 0 ? '<td rowspan="6" class="gm-rowspan">' + esc(p[1]) + "</td>" : "") +
          "<td>" + esc(c[1]) + "</td>";
        D.TICE_NIVEAUX.forEach(function (n) {
          html += '<td><input type="number" min="0" data-type="num" data-path="tice.competences[' +
            index + "]." + n[0] + '"></td>';
        });
        html += "</tr>";
        index++;
      });
    });
    html += "</tbody></table></div>";

    html += '<div class="champs">' +
      champHTML("tice", { n: "personnes_ressources", l: "Nombre de personnes ressources en numérique", t: "num" }) +
      champHTML("tice", { n: "fonctions", l: "Fonction(s) de ces personnes", t: "area", rows: 2, large: true }) +
      champHTML("tice", { n: "volet_tic", l: "Le Projet d'établissement comprend-il un volet numérique ?", t: "select", opts: D.OPTIONS.OUI_NON }) +
      champHTML("tice", { n: "volet_description", l: "Si oui, décrire", t: "area", rows: 2, large: true }) +
      "</div>";

    /* Partenaires */
    html += '<div class="gm-bloc-titre">Partenaires dans le domaine du numérique</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie">' +
        '<thead><tr><th style="min-width:240px;">Partenaire</th>' +
        '<th>Technique</th><th>Pédagogique</th><th>Financier</th></tr></thead><tbody>';
    for (var i = 0; i < D.PARTENAIRES_LIGNES; i++) {
      html += '<tr><td>' + inputHTML("tice.partenaires[" + i + "].nom",
        { placeholder: "Nom du partenaire" }) + "</td>" +
        "<td>" + checkboxHTML("tice.partenaires[" + i + "].technique", "") + "</td>" +
        "<td>" + checkboxHTML("tice.partenaires[" + i + "].pedagogique", "") + "</td>" +
        "<td>" + checkboxHTML("tice.partenaires[" + i + "].financier", "") + "</td></tr>";
    }
    html += "</tbody></table></div>";

    /* Financements */
    html += '<div class="gm-bloc-titre">Sources de financement de la salle informatique (cocher)</div>' +
      '<div class="gm-checks">' +
      D.FINANCEMENTS.map(function (f) {
        return checkboxHTML("tice.financements." + f[0], f[1]);
      }).join("") + "</div>";

    html += '<div class="champs">' +
      champHTML("tice", { n: "contraintes", l: "3 principales contraintes dans l'utilisation du numérique", t: "area", rows: 3, large: true }) +
      champHTML("tice", { n: "strategies", l: "Stratégies mises en œuvre pour surmonter ces contraintes", t: "area", rows: 3, large: true }) +
      champHTML("tice", { n: "recommandations", l: "Recommandations pour la pérennisation de l'usage du numérique", t: "area", rows: 3, large: true }) +
      "</div>";

    return html + finSection();
  }

  /* -----------------------------------------------------------------------
     SECTION 5 — EFFECTIFS ÉLÈVES : ENSEIGNEMENT MOYEN
     ----------------------------------------------------------------------- */
  function enteteMoyen() {
    var html = '<thead><tr><th rowspan="2" colspan="2" class="gm-eff-label">CLASSES &amp; ÉLÈVES</th>' +
      '<th colspan="8" class="grp">ENSEIGNEMENT MOYEN</th>' +
      '<th colspan="2" class="grp">TOTAL</th></tr><tr>';
    D.EFFECTIFS_MOYEN_NIVEAUX.forEach(function (l) {
      html += '<th colspan="2">' + esc(l[1]) + "</th>";
    });
    html += '<th>Total</th><th>Total FA</th></tr><tr>' +
      '<th colspan="2"></th>';
    D.EFFECTIFS_MOYEN_NIVEAUX.forEach(function () {
      html += "<th>Total</th><th>Dont FA</th>";
    });
    html += "<th></th><th></th></tr></thead>";
    return html;
  }

  function inputsMoyen(block, level, kind) {
    return '<td><input type="number" min="0" data-type="num" data-effm="' +
      block + '" data-level="' + level + '" data-kind="' + kind + '" data-path="' +
      "effectifs_moyen." + block + "." + level + "." + kind + '"></td>';
  }

  function ligneMoyen(block, label, sexe, ligne) {
    var html = "";
    if (sexe === "g") {
      html += '<tr><td rowspan="3" class="gm-eff-bloc">' + esc(label) + "</td>" +
        '<td class="c">Garçons</td>';
    } else if (sexe === "f") {
      html += '<tr><td class="c">Filles</td>';
    } else {
      html += '<tr class="totale"><td class="c">TOTAL</td>';
    }
    D.EFFECTIFS_MOYEN_NIVEAUX.forEach(function (l) {
      if (sexe === "g") {
        html += inputsMoyen(block, l[0], "g") + inputsMoyen(block, l[0], "fa_g");
      } else if (sexe === "f") {
        html += inputsMoyen(block, l[0], "f") + inputsMoyen(block, l[0], "fa_f");
      } else {
        html += '<td><input type="text" readonly class="gm-calc" data-effm-total="' +
          block + '" data-level="' + l[0] + '"></td>' +
          '<td><input type="text" readonly class="gm-calc" data-effm-fatotal="' +
          block + '" data-level="' + l[0] + '"></td>';
      }
    });
    if (sexe === "g") {
      html += '<td><input type="text" readonly class="gm-calc" data-effm-gtotal="g"></td>' +
        '<td><input type="text" readonly class="gm-calc" data-effm-gtotal="fa_g"></td>';
    } else if (sexe === "f") {
      html += '<td><input type="text" readonly class="gm-calc" data-effm-gtotal="f"></td>' +
        '<td><input type="text" readonly class="gm-calc" data-effm-gtotal="fa_f"></td>';
    } else {
      html += '<td><input type="text" readonly class="gm-calc" data-effm-grand="total"></td>' +
        '<td><input type="text" readonly class="gm-calc" data-effm-grand="fa"></td>';
    }
    return html + "</tr>";
  }

  function tableMoyen(block, titre) {
    return '<div class="gm-bloc-titre">' + esc(titre) + "</div>" +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-effm" data-effm-table="' +
      esc(block) + '">' + enteteMoyen() + "<tbody>" +
      ligneMoyen(block, titre, "g") +
      ligneMoyen(block, titre, "f") +
      ligneMoyen(block, titre, "total") +
      "</tbody></table></div>";
  }

  function tableMoyenNb() {
    var html = '<div class="gm-bloc-titre">Nombre de classes pédagogiques</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-effm" data-effm-table="nb">' +
      '<thead><tr><th class="gm-eff-label">Niveau</th>' +
      D.EFFECTIFS_MOYEN_NIVEAUX.map(function (l) {
        return "<th>" + esc(l[1]) + "</th>";
      }).join("") + "<th>Total</th></tr></thead><tbody><tr>" +
      '<td><b>Nbre classes</b></td>';
    D.EFFECTIFS_MOYEN_NIVEAUX.forEach(function (l) {
      html += '<td><input type="number" min="0" data-type="num" data-effm-nb="' +
        l[0] + '" data-path="effectifs_moyen.nb_classes.' + l[0] + '"></td>';
    });
    html += '<td><input type="text" readonly class="gm-calc" data-effm-nbtotal></td>' +
      "</tr></tbody></table></div>";
    return html;
  }

  function tableMoyenLv2() {
    var html = '<div class="gm-bloc-titre">Effectifs élèves par deuxième langue vivante étudiée (LV2)</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-effm" data-effm-table="lv2">' +
      enteteMoyen() + "<tbody>";
    D.LV2_LANGUES.forEach(function (lang) {
      ["g", "f"].forEach(function (sexe, j) {
        html += '<tr data-lv2m-row="' + sexe + '" data-lang="' + lang[0] + '">';
        if (j === 0) {
          html += '<td rowspan="2" class="gm-eff-bloc">' + esc(lang[1]) + "</td>";
        }
        html += '<td class="c">' + (sexe === "g" ? "Garçons" : "Filles") + "</td>";
        D.EFFECTIFS_MOYEN_NIVEAUX.forEach(function (l) {
          html += '<td><input type="number" min="0" data-type="num" data-lv2m="' +
            lang[0] + '" data-level="' + l[0] + '" data-kind="' + sexe + '" data-path="' +
            "effectifs_moyen.lv2." + lang[0] + "." + l[0] + "." + sexe + '"></td>' +
            '<td><input type="number" min="0" data-type="num" data-lv2m="' +
            lang[0] + '" data-level="' + l[0] + '" data-kind="fa_' + sexe + '" data-path="' +
            "effectifs_moyen.lv2." + lang[0] + "." + l[0] + ".fa_" + sexe + '"></td>';
        });
        html += '<td><input type="text" readonly class="gm-calc" data-lv2m-total="' +
          lang[0] + '" data-kind="' + sexe + '"></td>' +
          '<td><input type="text" readonly class="gm-calc" data-lv2m-total="' +
          lang[0] + '" data-kind="fa_' + sexe + '"></td></tr>';
      });
    });
    html += "</tbody></table></div>";
    return html;
  }

  function section5HTML() {
    var html = enteteSection("5", "EFFECTIFS ÉLÈVES — ENSEIGNEMENT MOYEN", "S5");
    html += tableMoyenNb();
    html += '<div class="gm-note">Renseignez les garçons, les filles et la part « Dont Franco-arabe ». Les totaux par niveau et par cycle se calculent automatiquement.</div>';
    html += aideDefilement("Faites glisser chaque tableau horizontalement. Les colonnes Total et Total FA restent visibles à droite.");
    html += tableMoyen("effectifs", "EFFECTIFS");
    html += tableMoyen("passants", "PASSANTS");
    html += tableMoyen("redoublants", "REDOUBLANTS");
    html += tableMoyenLv2();
    return html + finSection();
  }

  /* -----------------------------------------------------------------------
     SECTION 6 — EFFECTIFS ÉLÈVES : SECONDAIRE
     ----------------------------------------------------------------------- */
  function enteteSecondaire() {
    var html = '<thead><tr><th rowspan="2" class="gm-eff-label">CLASSES &amp; ÉLÈVES</th>';
    D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
      html += '<th colspan="' + (gr.series.length + 1) + '" class="grp">' +
        esc(gr.l) + "</th>";
    });
    html += "</tr><tr>";
    D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
      gr.series.forEach(function (s) {
        html += "<th>" + esc(s[1]) + "</th>";
      });
      html += '<th class="grp">TOTAL</th>';
    });
    html += "</tr></thead>";
    return html;
  }

  function inputSecondaire(block, groupe, serie, sexe) {
    return '<td><input type="number" min="0" data-type="num" data-effs="' +
      block + '" data-group="' + groupe + '" data-serie="' + serie +
      '" data-kind="' + sexe + '" data-path="effectifs_secondaire.' + block +
      "." + groupe + "." + serie + "." + sexe + '"></td>';
  }

  function ligneSecondaire(block, label, sexe) {
    var html = "";
    if (sexe === "g") {
      html += '<tr><td rowspan="3" class="gm-eff-bloc">' + esc(label) + "</td>" +
        '<td class="c">Garçons</td>';
    } else if (sexe === "f") {
      html += '<tr><td class="c">Filles</td>';
    } else {
      html += '<tr class="totale"><td class="c">TOTAL</td>';
    }
    D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
      gr.series.forEach(function (s) {
        if (sexe === "g" || sexe === "f") {
          html += inputSecondaire(block, gr.cle, s[0], sexe);
        } else {
          html += '<td><input type="text" readonly class="gm-calc" data-effs-total="' +
            block + '" data-group="' + gr.cle + '" data-serie="' + s[0] + '"></td>';
        }
      });
      if (sexe === "g" || sexe === "f") {
        html += '<td><input type="text" readonly class="gm-calc" data-effs-gtotal="' +
          block + '" data-group="' + gr.cle + '" data-kind="' + sexe + '"></td>';
      } else {
        html += '<td><input type="text" readonly class="gm-calc" data-effs-gtotal="' +
          block + '" data-group="' + gr.cle + '" data-kind="total"></td>';
      }
    });
    return html + "</tr>";
  }

  function tableSecondaire(block, titre) {
    return '<div class="gm-bloc-titre">' + esc(titre) + "</div>" +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-effs" data-effs-table="' +
      esc(block) + '">' + enteteSecondaire() + "<tbody>" +
      ligneSecondaire(block, titre, "g") +
      ligneSecondaire(block, titre, "f") +
      ligneSecondaire(block, titre, "total") +
      "</tbody></table></div>";
  }

  function tableSecondaireNb() {
    var html = '<div class="gm-bloc-titre">Nombre de classes pédagogiques</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-effs" data-effs-table="nb">' +
      '<thead><tr><th class="gm-eff-label">Cycle</th>' +
      D.EFFECTIFS_SECONDAIRE_GROUPES.map(function (gr) {
        return "<th>" + esc(gr.l) + "</th>";
      }).join("") + "<th>Total</th></tr></thead><tbody><tr>" +
      '<td><b>Nbre classes</b></td>';
    D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
      html += '<td><input type="number" min="0" data-type="num" data-effs-nb="' +
        gr.cle + '" data-path="effectifs_secondaire.nb_classes.' + gr.cle + '"></td>';
    });
    html += '<td><input type="text" readonly class="gm-calc" data-effs-nbtotal></td>' +
      "</tr></tbody></table></div>";
    return html;
  }

  function tableSecondaireLv2() {
    var html = '<div class="gm-bloc-titre">Effectifs élèves par deuxième langue vivante étudiée (LV2)</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-effs" data-effs-table="lv2">' +
      enteteSecondaire() + "<tbody>";
    D.LV2_LANGUES.forEach(function (lang) {
      ["g", "f"].forEach(function (sexe, j) {
        html += '<tr data-lv2s-row="' + sexe + '" data-lang="' + lang[0] + '">';
        if (j === 0) {
          html += '<td rowspan="2" class="gm-eff-bloc">' + esc(lang[1]) + "</td>";
        }
        html += '<td class="c">' + (sexe === "g" ? "Garçons" : "Filles") + "</td>";
        D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
          gr.series.forEach(function (s) {
            html += '<td><input type="number" min="0" data-type="num" data-lv2s="' +
              lang[0] + '" data-group="' + gr.cle + '" data-serie="' + s[0] +
              '" data-kind="' + sexe + '" data-path="effectifs_secondaire.lv2.' +
              lang[0] + "." + gr.cle + "." + s[0] + "." + sexe + '"></td>';
          });
          html += '<td><input type="text" readonly class="gm-calc" data-lv2s-total="' +
            lang[0] + '" data-group="' + gr.cle + '" data-kind="' + sexe + '"></td>';
        });
        html += "</tr>";
      });
    });
    html += "</tbody></table></div>";
    return html;
  }

  function section6HTML() {
    var html = enteteSection("6", "EFFECTIFS ÉLÈVES — SECONDAIRE", "S6");
    html += tableSecondaireNb();
    html += '<div class="gm-note">Renseignez les garçons et les filles par série. Les totaux par série et par cycle se calculent automatiquement.</div>';
    html += aideDefilement("Faites glisser chaque tableau horizontalement. Le bloc et le sexe restent visibles à gauche pendant la saisie.");
    html += tableSecondaire("effectifs", "EFFECTIFS");
    html += tableSecondaire("passants", "PASSANTS");
    html += tableSecondaire("redoublants", "REDOUBLANTS");
    html += tableSecondaireLv2();
    return html + finSection();
  }

  /* -----------------------------------------------------------------------
     SECTION 7 — RÉSULTATS EXAMENS (2025/2026)
     ----------------------------------------------------------------------- */
  function examBaseInputs(prefix, rowKey) {
    return D.EXAMENS_COLONNES.map(function (c) {
      if (c.auto) {
        return '<td><input type="text" readonly class="gm-calc" data-derived="' +
          c.n + '"></td>';
      }
      return '<td><input type="number" min="0" data-type="num" data-k="' +
        c.n + '" data-path="' + esc(prefix + "." + c.n) + '"></td>';
    }).join("");
  }

  function examHeaderHTML() {
    var html = "<tr><th rowspan=\"2\">SESSION</th>";
    D.EXAMENS_GROUPES.forEach(function (g) {
      html += '<th colspan="' + g.cols + '"' +
        (g.cle === "pres_t" ? ' class="gm-total-col"' : "") + ">" + esc(g.l) + "</th>";
    });
    html += "</tr><tr>";
    D.EXAMENS_GROUPES.forEach(function (g) {
      if (g.cle === "pres_t") {
        html += '<th class="gm-total-col">ETAB</th>';
        return;
      }
      D.EXAMENS_COLONNES.filter(function (c) { return c.groupe === g.cle; })
        .forEach(function (c) { html += "<th>" + esc(c.l) + "</th>"; });
    });
    return html + "</tr>";
  }

  function examRowHTML(label, prefix, key, opts) {
    opts = opts || {};
    var html = "<tr data-exam-key=\"" + esc(key) + "\"" +
      (opts.total ? ' data-exam-total="' + esc(opts.total) + '"' : "") + ">";
    html += "<td>" + esc(label) + "</td>";
    if (opts.total) {
      html += D.EXAMENS_COLONNES.map(function (c) {
        if (c.auto) {
          return '<td><input type="text" readonly class="gm-calc" data-derived="' +
            c.n + '"></td>';
        }
        return '<td><input type="text" readonly class="gm-calc" data-k="' +
          c.n + '"></td>';
      }).join("");
    } else {
      html += examBaseInputs(prefix, key);
    }
    return html + "</tr>";
  }

  function bfemHTML() {
    var html = '<div class="gm-bloc-titre">BFEM — 2025/2026</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-examens" data-exam-table="bfem">' +
      "<thead>" + examHeaderHTML() + "</thead><tbody>";
    D.BFEM_SESSIONS.forEach(function (s) {
      html += examRowHTML(s[1], "examens.bfem." + s[0], "bfem_" + s[0]);
    });
    html += examRowHTML("TOTAL", "", "bfem_total",
      { total: "bfem_normale bfem_remplacement" });
    html += "</tbody></table></div>";
    return html;
  }

  function bacHTML() {
    var html = '<div class="gm-bloc-titre">BACCALAURÉAT — 2025/2026</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-examens" data-exam-table="bac">' +
      '<thead><tr><th rowspan="2">SÉRIE</th><th rowspan="2">SESSION</th>';
    D.EXAMENS_GROUPES.forEach(function (g) {
      html += '<th colspan="' + g.cols + '"' +
        (g.cle === "pres_t" ? ' class="gm-total-col"' : "") + ">" + esc(g.l) + "</th>";
    });
    html += "</tr><tr>";
    D.EXAMENS_GROUPES.forEach(function (g) {
      if (g.cle === "pres_t") {
        html += '<th class="gm-total-col">ETAB</th>';
        return;
      }
      D.EXAMENS_COLONNES.filter(function (c) { return c.groupe === g.cle; })
        .forEach(function (c) { html += "<th>" + esc(c.l) + "</th>"; });
    });
    html += "</tr></thead><tbody>";
    D.BAC_SERIES.forEach(function (serie) {
      D.BAC_SESSIONS.forEach(function (s, i) {
        var key = "bac_" + serie[0] + "_" + s[0];
        var label = i === 0 ? serie[1] : "";
        var prefix = "examens.bac." + serie[0] + "." + s[0];
        var total = s[0] === "total"
          ? { total: "bac_" + serie[0] + "_normale bac_" + serie[0] + "_remplacement" }
          : {};
        html += "<tr data-exam-key=\"" + esc(key) + "\"" +
          (total.total ? ' data-exam-total="' + esc(total.total) + '"' : "") + ">";
        if (i === 0) {
          html += '<td rowspan="3" class="gm-rowspan"><b>' + esc(serie[1]) + "</b></td>";
        }
        html += "<td>" + esc(s[1]) + "</td>";
        if (s[0] === "total") {
          html += D.EXAMENS_COLONNES.map(function (c) {
            if (c.auto) {
              return '<td><input type="text" readonly class="gm-calc" data-derived="' +
                c.n + '"></td>';
            }
            return '<td><input type="text" readonly class="gm-calc" data-k="' +
              c.n + '"></td>';
          }).join("");
        } else {
          html += examBaseInputs(prefix, key);
        }
        html += "</tr>";
      });
    });
    html += "</tbody></table></div>";
    return html;
  }

  function mentionRowHTML(serieLabel, key, prefix, total) {
    var html = '<tr data-mention-key="' + esc(key) + '"' +
      (total ? ' data-mention-total="' + esc(total) + '"' : "") + ">";
    html += "<td>" + esc(serieLabel) + "</td>";
    D.MENTIONS.forEach(function (m) {
      ["g", "f"].forEach(function (sexe) {
        var k = m[0] + "_" + sexe;
        if (total) {
          html += '<td><input type="text" readonly class="gm-calc" data-mk="' +
            k + '"></td>';
        } else {
          html += '<td><input type="number" min="0" data-type="num" data-mk="' +
            k + '" data-path="' + esc(prefix + "." + k) + '"></td>';
        }
      });
    });
    ["total_g", "total_f", "total_etab"].forEach(function (k) {
      html += '<td><input type="text" readonly class="gm-calc" data-derived="' +
        k + '"></td>';
    });
    return html + "</tr>";
  }

  function mentionsHTML() {
    var html = '<div class="gm-bloc-titre">Mentions au BACCALAURÉAT — 2025/2026</div>' +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-examens" data-mentions-table>' +
      '<thead><tr><th rowspan="2">SÉRIE</th>';
    D.MENTIONS_GROUPES.forEach(function (g) {
      if (g.cle === "total") {
        html += '<th colspan="3" class="gm-total-col">TOTAL</th>';
      } else {
        html += '<th colspan="2">' + esc(g.l) + "</th>";
      }
    });
    html += "</tr><tr>";
    D.MENTIONS_GROUPES.forEach(function (g) {
      if (g.cle === "total") {
        html += "<th>Garçons</th><th>Filles</th><th>ETAB</th>";
      } else {
        html += "<th>Garçons</th><th>Filles</th>";
      }
    });
    html += "</tr></thead><tbody>";
    D.MENTIONS_SERIES.forEach(function (s) {
      html += mentionRowHTML(s[1], "mention_" + s[0],
        "examens.mentions." + s[0], null);
    });
    html += mentionRowHTML("TOTAL", "mention_total", "", "1");
    html += "</tbody></table></div>";
    return html;
  }

  function section7HTML() {
    var html = enteteSection("7", "RÉSULTATS EXAMENS — 2025/2026", "S7");
    html += aideDefilement("Faites glisser chaque tableau horizontalement. Les colonnes de synthèse (ETAB, totaux) restent visibles à droite.");
    html += bfemHTML() + bacHTML() + mentionsHTML();
    return html + finSection();
  }

  /* -----------------------------------------------------------------------
     SECTIONS 8-10 — PERSONNELS NOMINATIFS
     ----------------------------------------------------------------------- */
  function persLigneHTML(type, i) {
    var cols = colonnesDe(type);
    var html = '<tr data-pers-row="' + type + '"><td class="num" data-numero>' +
      (i + 1) + "</td>";
    cols.forEach(function (c) {
      var path = type + "[" + i + "]." + c.n;
      if (c.t === "select") {
        html += "<td>" + selectHTML(path, c.opts, "",
          { style: "min-width:70px;" }) + "</td>";
      } else {
        html += "<td>" + inputHTML(path, {
          type: c.t === "num" ? "num" : "text",
          maj: c.maj,
          placeholder: c.t === "date" ? "JJ/MM/AAAA" : ""
        }) + "</td>";
      }
    });
    html += '<td class="col-actions"><button type="button" class="suppr js-suppr-pers" ' +
      'title="Supprimer cette ligne">🗑</button></td></tr>';
    return html;
  }

  function persTableHTML(type, titre, num, badge, max, init) {
    var cols = colonnesDe(type);
    var html = enteteSection(num, titre, badge) +
      '<div class="gm-table-actions">' +
        '<button type="button" class="btn vert petit js-ajouter-pers" data-pers="' + type + '">' +
          "＋ Ajouter une ligne</button>" +
        '<span class="petit" data-compteur="' + type + '">' + init + " / " + max + " lignes</span>" +
        '<span class="petit gm-note-inline">Les lignes vides sont conservées dans le PDF (numérotation officielle complète).</span>' +
      "</div>" +
      '<div class="table-defilement"><table class="table-saisie gm-table-saisie gm-pers" data-pers-table="' +
      type + '"><thead><tr><th style="width:45px;">N°</th>' +
      cols.map(function (c) {
        return "<th" + (c.w ? ' style="width:' + c.w + '"' : "") + ">" +
          esc(c.l) + "</th>";
      }).join("") +
      '<th style="width:42px;">Action</th></tr></thead><tbody data-pers-body="' + type + '">';
    for (var i = 0; i < init; i++) { html += persLigneHTML(type, i); }
    html += "</tbody></table></div>" + finSection();
    return html;
  }

  function section11HTML() {
    return enteteSection("11", "OBSERVATIONS DU CHEF D'ÉTABLISSEMENT", "S11") +
      '<div class="champs">' +
        champHTML("observations", {
          n: "texte", l: "Observations générales du chef d'établissement",
          t: "area", rows: 12, large: true,
          aide: "Le texte est repris intégralement dans le grand cadre de la page 14 du PDF."
        }) +
      "</div>" + finSection();
  }

  /* -----------------------------------------------------------------------
     CONSTRUCTION GLOBALE
     ----------------------------------------------------------------------- */
  function construire(el) {
    conteneur = el;
    var html = "";

    /* Navigation rapide 1 → 11 */
    html += '<div class="carte"><div class="gm-nav">';
    [["1", "Page d'entrée"], ["2", "Élèves vulnérables"], ["3", "Structures"],
     ["4", "TICE"], ["5", "Effectifs moyen"], ["6", "Effectifs secondaire"],
     ["7", "Examens"], ["8", "Personnel admin."], ["9", "Personnel ens."],
     ["10", "Personnel service"], ["11", "Observations"]].forEach(function (s) {
      html += '<a class="btn gris petit" href="#gm_sec_' + s[0] + '" data-aller="' +
        s[0] + '">' + s[0] + ". " + esc(s[1]) + "</a>";
    });
    html += "</div></div>";

    html += '<div id="gm_sec_1">' + section1HTML() + "</div>";
    html += '<div id="gm_sec_2">' + section2HTML() + "</div>";
    html += '<div id="gm_sec_3">' + section3HTML() + "</div>";
    html += '<div id="gm_sec_4">' + section4HTML() + "</div>";
    html += '<div id="gm_sec_5">' + section5HTML() + "</div>";
    html += '<div id="gm_sec_6">' + section6HTML() + "</div>";
    html += '<div id="gm_sec_7">' + section7HTML() + "</div>";
    html += '<div id="gm_sec_8">' + persTableHTML("admin",
      "PERSONNEL ADMINISTRATIF", "8", "S8", MAX_ADMIN, INIT_ADMIN) + "</div>";
    html += '<div id="gm_sec_9">' + persTableHTML("enseignant",
      "PERSONNEL ENSEIGNANT", "9", "S9", MAX_ENSEIGNANT, INIT_ENSEIGNANT) + "</div>";
    html += '<div id="gm_sec_10">' + persTableHTML("service",
      "PERSONNEL DE SERVICE", "10", "S10", MAX_SERVICE, INIT_SERVICE) + "</div>";
    html += '<div id="gm_sec_11">' + section11HTML() + "</div>";

    conteneur.innerHTML = html;
    poserDefauts();
    attacherEvenements();
    mettreAJourBadges();
  }

  /* Valeurs par défaut des champs simples (région, IEF…) sans écraser un
     brouillon : appliquées une seule fois à la construction. */
  function poserDefauts() {
    D.IDENTIFICATION_CHAMPS.forEach(function (c) {
      if (!c.def) { return; }
      var el = conteneur.querySelector('[data-path="identification.' + c.n + '"]');
      if (el && !el.value) { el.value = c.def; }
    });
  }

  /* -----------------------------------------------------------------------
     ÉVÉNEMENTS
     ----------------------------------------------------------------------- */
  function attacherEvenements() {
    conteneur.addEventListener("input", onInput);
    conteneur.addEventListener("change", onInput);
    conteneur.addEventListener("click", onClick);
    conteneur.addEventListener("focusin", onComboFocusIn);
    conteneur.addEventListener("focusout", onComboFocusOut);
    conteneur.addEventListener("keydown", onComboKeyDown);
    conteneur.addEventListener("mousedown", function (ev) {
      if (ev.target.closest && ev.target.closest(".combo-option")) {
        ev.preventDefault();
      }
    });
  }

  /* -----------------------------------------------------------------------
     COMBO FILTRABLE
     ----------------------------------------------------------------------- */
  function ulDe(input) {
    var wrap = input && input.closest ? input.closest(".combo") : null;
    return wrap ? wrap.querySelector(".combo-liste") : null;
  }

  function listeDeChamp(path) {
    var id = String(path || "").split(".")[0];
    if (id === "identification") { return global.RR_ECOLES_MOYEN || []; }
    return [];
  }

  function afficherCombo(input, tout) {
    var ul = ulDe(input);
    if (!ul) { return; }
    var liste = listeDeChamp(input.getAttribute("data-path"));
    var q = tout ? "" : normaliser(input.value);
    var propositions = [];
    for (var i = 0; i < liste.length; i++) {
      if (!q || normaliser(liste[i]).indexOf(q) !== -1) {
        propositions.push(liste[i]);
      }
    }
    if (!propositions.length) {
      ul.innerHTML = '<li class="combo-vide" role="option" aria-disabled="true">' +
        "Aucune correspondance dans la liste — effacez pour tout voir.</li>";
    } else {
      ul.innerHTML = propositions.map(function (v) {
        var actif = normaliser(v) === q && q !== "";
        return '<li class="combo-option' + (actif ? " actif" : "") +
          '" role="option" aria-selected="' + (actif ? "true" : "false") +
          '" data-val="' + esc(v) + '">' + esc(v) + "</li>";
      }).join("");
    }
    ul.setAttribute("data-i", "-1");
    ul.hidden = false;
    input.setAttribute("aria-expanded", "true");
    var wrap = input.closest(".combo");
    if (wrap) { wrap.classList.add("ouvert"); }
  }

  function fermerCombo(input) {
    var ul = ulDe(input);
    if (ul) { ul.hidden = true; ul.setAttribute("data-i", "-1"); }
    input.setAttribute("aria-expanded", "false");
    var wrap = input.closest(".combo");
    if (wrap) { wrap.classList.remove("ouvert"); }
  }

  function choisirCombo(input, valeur) {
    input.value = valeur;
    fermerCombo(input);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  function onComboFocusIn(ev) {
    var input = ev.target;
    if (input.tagName === "INPUT" && input.closest(".combo")) {
      afficherCombo(input, input.value === "");
    }
  }

  function onComboFocusOut(ev) {
    var input = ev.target;
    if (!input.closest || !input.closest(".combo")) { return; }
    var rel = ev.relatedTarget;
    if (rel && input.closest(".combo").contains(rel)) { return; }
    fermerCombo(input);
  }

  function onComboKeyDown(ev) {
    var input = ev.target;
    if (input.tagName !== "INPUT" || !input.closest(".combo")) { return; }
    var ul = ulDe(input);
    if (!ul || ul.hidden) {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        afficherCombo(input);
      }
      return;
    }
    var opts = ul.querySelectorAll(".combo-option");
    if (!opts.length) {
      if (ev.key === "Escape") { ev.preventDefault(); fermerCombo(input); }
      return;
    }
    var i = parseInt(ul.getAttribute("data-i") || "-1", 10);
    if (ev.key === "ArrowDown") {
      ev.preventDefault(); i = (i + 1) % opts.length;
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault(); i = (i - 1 + opts.length) % opts.length;
    } else if (ev.key === "Enter") {
      if (i >= 0 && opts[i]) {
        ev.preventDefault();
        choisirCombo(input, opts[i].getAttribute("data-val"));
      }
      return;
    } else if (ev.key === "Escape") {
      ev.preventDefault(); fermerCombo(input); return;
    } else {
      return;
    }
    ul.setAttribute("data-i", String(i));
    for (var k = 0; k < opts.length; k++) {
      opts[k].classList.toggle("actif", k === i);
    }
    if (opts[i] && opts[i].scrollIntoView) {
      opts[i].scrollIntoView({ block: "nearest" });
    }
  }

  /* -----------------------------------------------------------------------
     SAISIE
     ----------------------------------------------------------------------- */
  function valeurDeEl(el) {
    if (el.getAttribute("data-type") === "bool") {
      return el.checked ? "oui" : "";
    }
    var v = el.value;
    if (el.getAttribute("data-type") === "num") {
      return v === "" ? 0 : (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
    }
    return v;
  }

  function onInput(ev) {
    var el = ev.target;
    var path = el.getAttribute("data-path");
    if (el.getAttribute("data-maj") === "upper" && el.tagName === "INPUT") {
      var pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      if (pos !== null) { try { el.setSelectionRange(pos, pos); } catch (e) {} }
    }
    if (path) {
      setPath(donnees, path, valeurDeEl(el));
    }
    if (el.closest && el.closest("[data-p1p]")) { recalcPersonnels(); }
    if (el.closest && el.closest("[data-p1e]")) { recalcElevesPage1(); }
    if (el.closest && el.closest('table[data-effm-table]')) { recalcEffectifsMoyen(); }
    if (el.closest && el.closest('table[data-effs-table]')) { recalcEffectifsSecondaire(); }
    if (el.closest && el.closest('[data-exam-table]')) { recalcExamens(); }
    if (el.closest && el.closest('[data-mentions-table]')) { recalcMentions(); }

    if (el.closest && el.closest(".combo")) {
      var ulSaisie = ulDe(el);
      if (ulSaisie && !ulSaisie.hidden) { afficherCombo(el); }
    }
    mettreAJourBadges();
    sauverBrouillon();
  }

  function onClick(ev) {
    var t = ev.target;

    if (t.classList && t.classList.contains("combo-option")) {
      var wrap = t.closest(".combo");
      var champSaisie = wrap && wrap.querySelector("input");
      if (champSaisie) { choisirCombo(champSaisie, t.getAttribute("data-val")); }
      return;
    }

    if (t.classList && t.classList.contains("js-ajouter-pers")) {
      ajouterPers(t.getAttribute("data-pers"));
      return;
    }

    if (t.classList && t.classList.contains("js-suppr-pers")) {
      supprimerPers(t);
      return;
    }

    var lien = t.getAttribute && t.getAttribute("data-aller");
    if (lien) {
      ev.preventDefault();
      var cible = document.getElementById("gm_sec_" + lien);
      if (!cible) { return; }
      var det = cible.querySelector("details");
      if (det) { det.open = true; }
      cible.scrollIntoView({ behavior: "smooth", block: "start" });
      var res = cible.querySelector("summary");
      if (res) {
        res.style.background = "#ffe8a3";
        setTimeout(function () { res.style.background = ""; }, 1200);
      }
    }
  }

  /* -----------------------------------------------------------------------
     CALCULS AUTOMATIQUES
     ----------------------------------------------------------------------- */
  function recalcPersonnels() {
    D.PERSONNEL_LIGNES.forEach(function (l) {
      var f = conteneur.querySelector('[data-p1p="' + l.n + '"][data-sex="f"]');
      var h = conteneur.querySelector('[data-p1p="' + l.n + '"][data-sex="h"]');
      var total = conteneur.querySelector('[data-p1p-total="' + l.n + '"]');
      if (total) { total.value = nombre(f) + nombre(h); }
    });
  }

  function recalcElevesPage1() {
    var totF = 0, totG = 0;
    D.ELEVES_LIGNES.forEach(function (l) {
      var f = conteneur.querySelector('[data-p1e="' + l.n + '"][data-sex="filles"]');
      var g = conteneur.querySelector('[data-p1e="' + l.n + '"][data-sex="garcons"]');
      var total = conteneur.querySelector('[data-p1e-total="' + l.n + '"]');
      var nf = nombre(f), ng = nombre(g);
      if (total) { total.value = nf + ng; }
      totF += nf; totG += ng;
    });
    var sf = conteneur.querySelector('[data-p1e-global="filles"]');
    var sg = conteneur.querySelector('[data-p1e-global="garcons"]');
    var st = conteneur.querySelector('[data-p1e-global="total"]');
    if (sf) { sf.value = totF; }
    if (sg) { sg.value = totG; }
    if (st) { st.value = totF + totG; }
  }

  function sommeInputs(root, selector) {
    var s = 0;
    Array.prototype.forEach.call(root.querySelectorAll(selector), function (el) {
      s += nombre(el);
    });
    return s;
  }

  function recalcEffectifsMoyen() {
    var nb = conteneur.querySelector('[data-effm-table="nb"]');
    if (nb) {
      var total = 0;
      D.EFFECTIFS_MOYEN_NIVEAUX.forEach(function (l) {
        var el = nb.querySelector('[data-effm-nb="' + l[0] + '"]');
        total += nombre(el);
      });
      var t = nb.querySelector("[data-effm-nbtotal]");
      if (t) { t.value = total; }
    }

    conteneur.querySelectorAll("table.gm-effm").forEach(function (table) {
      var block = table.getAttribute("data-effm-table");
      if (!block || block === "nb") { return; }
      var g = table.querySelector('[data-effm="' + block + '"][data-kind="g"]');
      if (!g) { return; }
      D.EFFECTIFS_MOYEN_NIVEAUX.forEach(function (l) {
        var lv = l[0];
        var gv = sommeInputs(table, '[data-effm="' + block + '"][data-level="' + lv + '"][data-kind="g"]');
        var fv = sommeInputs(table, '[data-effm="' + block + '"][data-level="' + lv + '"][data-kind="f"]');
        var fag = sommeInputs(table, '[data-effm="' + block + '"][data-level="' + lv + '"][data-kind="fa_g"]');
        var faf = sommeInputs(table, '[data-effm="' + block + '"][data-level="' + lv + '"][data-kind="fa_f"]');
        var tot = table.querySelector('[data-effm-total="' + block + '"][data-level="' + lv + '"]');
        var fat = table.querySelector('[data-effm-fatotal="' + block + '"][data-level="' + lv + '"]');
        if (tot) { tot.value = gv + fv; }
        if (fat) { fat.value = fag + faf; }
      });
      ["g", "f", "fa_g", "fa_f"].forEach(function (kind) {
        var c = table.querySelector('[data-effm-gtotal="' + kind + '"]');
        if (c) {
          c.value = sommeInputs(table, '[data-effm="' + block + '"][data-kind="' + kind + '"]');
        }
      });
      var grand = table.querySelector('[data-effm-grand="total"]');
      var grandFa = table.querySelector('[data-effm-grand="fa"]');
      if (grand) {
        grand.value = sommeInputs(table, '[data-effm="' + block + '"][data-kind="g"]') +
          sommeInputs(table, '[data-effm="' + block + '"][data-kind="f"]');
      }
      if (grandFa) {
        grandFa.value = sommeInputs(table, '[data-effm="' + block + '"][data-kind="fa_g"]') +
          sommeInputs(table, '[data-effm="' + block + '"][data-kind="fa_f"]');
      }
    });

    var lv2 = conteneur.querySelector('[data-effm-table="lv2"]');
    if (lv2) {
      D.LV2_LANGUES.forEach(function (lang) {
        ["g", "f"].forEach(function (sexe) {
          var tr = lv2.querySelector('tr[data-lv2m-row="' + sexe + '"][data-lang="' + lang[0] + '"]');
          if (!tr) { return; }
          ["g", "f", "fa_g", "fa_f"].forEach(function (kind) {
            var c = tr.querySelector('[data-lv2m-total="' + lang[0] + '"][data-kind="' + kind + '"]');
            if (c) {
              c.value = sommeInputs(tr, '[data-lv2m="' + lang[0] + '"][data-kind="' + kind + '"]');
            }
          });
        });
      });
    }
  }

  function recalcEffectifsSecondaire() {
    var nb = conteneur.querySelector('[data-effs-table="nb"]');
    if (nb) {
      var total = 0;
      D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
        total += nombre(nb.querySelector('[data-effs-nb="' + gr.cle + '"]'));
      });
      var t = nb.querySelector("[data-effs-nbtotal]");
      if (t) { t.value = total; }
    }

    conteneur.querySelectorAll("table.gm-effs").forEach(function (table) {
      var block = table.getAttribute("data-effs-table");
      if (!block || block === "nb") { return; }
      D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
        gr.series.forEach(function (s) {
          var gv = sommeInputs(table, '[data-effs="' + block + '"][data-group="' + gr.cle +
            '"][data-serie="' + s[0] + '"][data-kind="g"]');
          var fv = sommeInputs(table, '[data-effs="' + block + '"][data-group="' + gr.cle +
            '"][data-serie="' + s[0] + '"][data-kind="f"]');
          var tot = table.querySelector('[data-effs-total="' + block + '"][data-group="' +
            gr.cle + '"][data-serie="' + s[0] + '"]');
          if (tot) { tot.value = gv + fv; }
        });
        ["g", "f", "total"].forEach(function (kind) {
          var c = table.querySelector('[data-effs-gtotal="' + block + '"][data-group="' +
            gr.cle + '"][data-kind="' + kind + '"]');
          if (c) {
            var sum = 0;
            gr.series.forEach(function (s) {
              sum += sommeInputs(table, '[data-effs="' + block + '"][data-group="' + gr.cle +
                '"][data-serie="' + s[0] + '"][data-kind="' + (kind === "total" ? "g" : kind) + '"]') +
                (kind === "total" ? sommeInputs(table, '[data-effs="' + block + '"][data-group="' +
                gr.cle + '"][data-serie="' + s[0] + '"][data-kind="f"]') : 0);
            });
            c.value = sum;
          }
        });
      });
    });

    var lv2 = conteneur.querySelector('[data-effs-table="lv2"]');
    if (lv2) {
      D.LV2_LANGUES.forEach(function (lang) {
        ["g", "f"].forEach(function (sexe) {
          var tr = lv2.querySelector('tr[data-lv2s-row="' + sexe + '"][data-lang="' + lang[0] + '"]');
          if (!tr) { return; }
          D.EFFECTIFS_SECONDAIRE_GROUPES.forEach(function (gr) {
            var c = tr.querySelector('[data-lv2s-total="' + lang[0] + '"][data-group="' +
              gr.cle + '"][data-kind="' + sexe + '"]');
            if (c) {
              c.value = sommeInputs(tr, '[data-lv2s="' + lang[0] + '"][data-group="' +
                gr.cle + '"][data-kind="' + sexe + '"]');
            }
          });
        });
      });
    }
  }

  function calcExam(base) {
    var pres_t = base.pres_g + base.pres_f;
    var adm_t_g = base.adm1_g + base.adm2_g;
    var adm_t_f = base.adm1_f + base.adm2_f;
    var adm_t = adm_t_g + adm_t_f;
    function pctv(n, d) {
      return d > 0 ? (Math.round(n / d * 1000) / 10) : "";
    }
    return {
      pres_t: pres_t,
      adm_t_g: adm_t_g, adm_t_f: adm_t_f, adm_t: adm_t,
      pct_g: pctv(adm_t_g, base.pres_g),
      pct_f: pctv(adm_t_f, base.pres_f),
      pct_etab: pctv(adm_t, pres_t)
    };
  }

  function lireBase(tr) {
    var o = {};
    D.EXAMENS_COLONNES.forEach(function (c) {
      if (c.auto) { return; }
      var el = tr.querySelector('[data-k="' + c.n + '"]');
      o[c.n] = nombre(el);
    });
    return o;
  }

  function ecrireBase(tr, base) {
    D.EXAMENS_COLONNES.forEach(function (c) {
      if (c.auto) { return; }
      var el = tr.querySelector('[data-k="' + c.n + '"]');
      if (el) { el.value = base[c.n] || 0; }
    });
  }

  function ecrireDerives(tr, d) {
    Object.keys(d).forEach(function (k) {
      var el = tr.querySelector('[data-derived="' + k + '"]');
      if (el) { el.value = d[k] === "" ? "" : d[k]; }
    });
  }

  function recalcExamens() {
    var tables = conteneur.querySelectorAll('[data-exam-table]');
    Array.prototype.forEach.call(tables, function (table) {
      var lignes = table.querySelectorAll("tr[data-exam-key]");
      var index = {};
      Array.prototype.forEach.call(lignes, function (tr) {
        index[tr.getAttribute("data-exam-key")] = tr;
      });
      Array.prototype.forEach.call(lignes, function (tr) {
        if (tr.hasAttribute("data-exam-total")) { return; }
        var base = lireBase(tr);
        ecrireDerives(tr, calcExam(base));
      });
      Array.prototype.forEach.call(lignes, function (tr) {
        if (!tr.hasAttribute("data-exam-total")) { return; }
        var cles = (tr.getAttribute("data-exam-total") || "").split(/\s+/);
        var somme = {};
        D.EXAMENS_COLONNES.forEach(function (c) { if (!c.auto) { somme[c.n] = 0; } });
        cles.forEach(function (k) {
          var source = index[k];
          if (!source) { return; }
          var base = lireBase(source);
          Object.keys(somme).forEach(function (n) { somme[n] += base[n] || 0; });
        });
        ecrireBase(tr, somme);
        ecrireDerives(tr, calcExam(somme));
      });
    });
  }

  function lireMention(tr) {
    var o = {};
    D.MENTIONS.forEach(function (m) {
      ["g", "f"].forEach(function (sexe) {
        var el = tr.querySelector('[data-mk="' + m[0] + "_" + sexe + '"]');
        o[m[0] + "_" + sexe] = nombre(el);
      });
    });
    return o;
  }

  function calcMention(base) {
    var total_g = 0, total_f = 0;
    D.MENTIONS.forEach(function (m) {
      total_g += base[m[0] + "_g"] || 0;
      total_f += base[m[0] + "_f"] || 0;
    });
    return { total_g: total_g, total_f: total_f, total_etab: total_g + total_f };
  }

  function ecrireMention(tr, base, d) {
    D.MENTIONS.forEach(function (m) {
      ["g", "f"].forEach(function (sexe) {
        var k = m[0] + "_" + sexe;
        var el = tr.querySelector('[data-mk="' + k + '"]');
        if (el && el.readOnly) { el.value = base[k] || 0; }
      });
    });
    Object.keys(d).forEach(function (k) {
      var el = tr.querySelector('[data-derived="' + k + '"]');
      if (el) { el.value = d[k]; }
    });
  }

  function recalcMentions() {
    var table = conteneur.querySelector('[data-mentions-table]');
    if (!table) { return; }
    var lignes = table.querySelectorAll("tr[data-mention-key]");
    var index = {};
    Array.prototype.forEach.call(lignes, function (tr) {
      index[tr.getAttribute("data-mention-key")] = tr;
    });
    Array.prototype.forEach.call(lignes, function (tr) {
      if (tr.hasAttribute("data-mention-total")) { return; }
      var base = lireMention(tr);
      ecrireMention(tr, base, calcMention(base));
    });
    Array.prototype.forEach.call(lignes, function (tr) {
      if (!tr.hasAttribute("data-mention-total")) { return; }
      var somme = {};
      D.MENTIONS.forEach(function (m) {
        somme[m[0] + "_g"] = 0;
        somme[m[0] + "_f"] = 0;
      });
      D.MENTIONS_SERIES.forEach(function (s) {
        var source = index["mention_" + s[0]];
        if (!source) { return; }
        var base = lireMention(source);
        D.MENTIONS.forEach(function (m) {
          somme[m[0] + "_g"] += base[m[0] + "_g"] || 0;
          somme[m[0] + "_f"] += base[m[0] + "_f"] || 0;
        });
      });
      ecrireMention(tr, somme, calcMention(somme));
    });
  }

  function recalculerTout() {
    recalcPersonnels();
    recalcElevesPage1();
    recalcEffectifsMoyen();
    recalcEffectifsSecondaire();
    recalcExamens();
    recalcMentions();
  }

  /* -----------------------------------------------------------------------
     LIGNES DYNAMIQUES (personnel administratif / enseignant / service)
     ----------------------------------------------------------------------- */
  function corpsPers(type) {
    return conteneur.querySelector('tbody[data-pers-body="' + type + '"]');
  }

  function compterPers(type) {
    var tb = corpsPers(type);
    return tb ? tb.querySelectorAll("tr[data-pers-row]").length : 0;
  }

  function majCompteur(type) {
    var max = maxDe(type);
    var el = conteneur.querySelector('[data-compteur="' + type + '"]');
    if (el) { el.textContent = compterPers(type) + " / " + max + " lignes"; }
  }

  function ajouterPers(type, silencieux) {
    var tb = corpsPers(type);
    if (!tb) { return; }
    var max = maxDe(type);
    var n = compterPers(type);
    if (n >= max) {
      if (!silencieux) {
        alert("Le modèle officiel comporte au maximum " + max + " lignes.");
      }
      return;
    }
    tb.insertAdjacentHTML("beforeend", persLigneHTML(type, n));
    majCompteur(type);
    mettreAJourBadges();
  }

  function supprimerPers(btn) {
    var tr = btn.closest("tr");
    var tb = tr && tr.parentElement;
    if (!tr || !tb) { return; }
    var type = tr.getAttribute("data-pers-row");
    tr.remove();
    var rows = tb.querySelectorAll("tr[data-pers-row]");
    Array.prototype.forEach.call(rows, function (row, i) {
      row.querySelector("[data-numero]").textContent = i + 1;
      Array.prototype.forEach.call(row.querySelectorAll("[data-path]"), function (el) {
        var p = el.getAttribute("data-path");
        el.setAttribute("data-path",
          p.replace(new RegExp("^" + type + "\\[\\d+\\]"), type + "[" + i + "]"));
      });
    });
    majCompteur(type);
    mettreAJourBadges();
    sauverBrouillon();
  }

  function assurerLignes(type, n) {
    while (compterPers(type) < n) { ajouterPers(type, true); }
  }

  /* -----------------------------------------------------------------------
     REMPLISSAGE / COLLECTE
     ----------------------------------------------------------------------- */
  function remplir(obj) {
    var m = modele();
    if (m && typeof m.migrerDonnees === "function") {
      obj = m.migrerDonnees(obj || {});
    }
    donnees = obj || {};
    ["admin", "enseignant", "service"].forEach(function (type) {
      var arr = donnees[type];
      if (Array.isArray(arr) && arr.length) { assurerLignes(type, arr.length); }
    });
    Array.prototype.forEach.call(conteneur.querySelectorAll("[data-path]"), function (el) {
      if (el.readOnly) { return; }
      var path = el.getAttribute("data-path");
      var v = getPath(donnees, path);
      if (el.getAttribute("data-type") === "bool") {
        el.checked = !!(v === true || v === "oui" || v === "OUI" || v === 1);
        return;
      }
      if (v === undefined || v === null) { v = ""; }
      el.value = v;
    });
    recalculerTout();
    mettreAJourBadges();
  }

  function collecter() {
    var out = {};
    Array.prototype.forEach.call(conteneur.querySelectorAll("[data-path]"), function (el) {
      setPath(out, el.getAttribute("data-path"), valeurDeEl(el));
    });
    ["admin", "enseignant", "service"].forEach(function (cle) {
      if (!Array.isArray(out[cle])) { return; }
      out[cle] = out[cle].filter(function (row) {
        return row && Object.keys(row).some(function (k) {
          var v = row[k];
          return v !== "" && v !== 0 && v !== null && v !== undefined;
        });
      });
    });
    return out;
  }

  /* -----------------------------------------------------------------------
     BADGES
     ----------------------------------------------------------------------- */
  function mettreAJourBadges() {
    Array.prototype.forEach.call(
      conteneur.querySelectorAll("details.section-form"), function (det) {
        var badge = det.querySelector("[data-badge]");
        if (!badge) { return; }
        var champs = det.querySelectorAll("[data-path]");
        var remplis = 0;
        Array.prototype.forEach.call(champs, function (el) {
          if (el.getAttribute("data-type") === "bool") {
            if (el.checked) { remplis++; }
            return;
          }
          if (el.value !== "" && el.value !== "0" && el.value !== null) { remplis++; }
        });
        badge.textContent = remplis + "/" + champs.length;
        badge.style.background = (remplis >= champs.length && champs.length > 0)
          ? "#1e7a3c" : "#1f4e79";
      });
  }

  /* -----------------------------------------------------------------------
     BROUILLON
     ----------------------------------------------------------------------- */
  function sauverBrouillon() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      try {
        localStorage.setItem(LS, JSON.stringify(donnees));
        var el = document.getElementById("statut-brouillon");
        if (el) {
          var h = new Date();
          el.textContent = "Brouillon enregistré à " +
            (h.getHours() < 10 ? "0" : "") + h.getHours() + ":" +
            (h.getMinutes() < 10 ? "0" : "") + h.getMinutes();
        }
      } catch (e) { /* stockage indisponible */ }
    }, 400);
  }

  function chargerBrouillon() {
    try {
      var s = localStorage.getItem(LS);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  /* -----------------------------------------------------------------------
     VALIDATION
     ----------------------------------------------------------------------- */
  function valeurDe(path) {
    var el = conteneur.querySelector('[data-path="' + path + '"]');
    return el ? String(el.value || "").trim() : "";
  }

  function marquerInvalid(path) {
    var el = conteneur.querySelector('[data-path="' + path + '"]');
    var champ = el && el.closest(".champ");
    if (champ) { champ.classList.add("invalid"); }
  }

  function valider() {
    var erreurs = [];
    Array.prototype.forEach.call(conteneur.querySelectorAll(".champ"), function (c) {
      c.classList.remove("invalid");
    });

    D.OBLIGATOIRES.forEach(function (o) {
      if (!valeurDe(o[0])) {
        erreurs.push("Merci de renseigner " + o[1] + ".");
        marquerInvalid(o[0]);
      }
    });

    var ecole = valeurDe("identification.nom_ecole");
    if (ecole) {
      var liste = global.RR_ECOLES_MOYEN || [];
      var connu = liste.some(function (x) {
        return normaliser(x) === normaliser(ecole);
      });
      if (!connu) {
        erreurs.push("« " + ecole + " » ne figure pas dans la liste des " +
          "établissements moyens : choisissez une valeur dans la liste " +
          "déroulante.");
        marquerInvalid("identification.nom_ecole");
        var el = conteneur.querySelector('[data-path="identification.nom_ecole"]');
        if (el) { afficherCombo(el, true); }
      }
    }

    if (compterPers("admin") > MAX_ADMIN) {
      erreurs.push("Le personnel administratif ne peut pas dépasser " +
        MAX_ADMIN + " lignes.");
    }
    if (compterPers("enseignant") > MAX_ENSEIGNANT) {
      erreurs.push("Le personnel enseignant ne peut pas dépasser " +
        MAX_ENSEIGNANT + " lignes.");
    }
    if (compterPers("service") > MAX_SERVICE) {
      erreurs.push("Le personnel de service ne peut pas dépasser " +
        MAX_SERVICE + " lignes.");
    }
    return erreurs;
  }

  /* -----------------------------------------------------------------------
     SOUMISSION — PDF 14 pages
     ----------------------------------------------------------------------- */
  async function soumettre(page) {
    var erreurs = valider();
    if (erreurs.length) {
      page.erreur(erreurs);
      var premier = conteneur.querySelector(".champ.invalid");
      if (premier) { premier.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return false;
    }

    var donneesSaisies = collecter();
    donneesSaisies._submission_time = new Date().toISOString();
    donnees = donneesSaisies;

    try { localStorage.setItem(LS, JSON.stringify(donneesSaisies)); } catch (e) {}

    if (global.RRdb && global.RRdb.actif()) {
      page.progres("Vérification de l'existence d'un rapport…", 5);
      var deja = null;
      try { deja = await global.RRdb.existe(donneesSaisies); }
      catch (e) { deja = null; }
      if (deja === true) {
        var nomEcole = (donneesSaisies.identification &&
                        donneesSaisies.identification.nom_ecole) ||
                       global.RRdb.codeEcole(donneesSaisies);
        var remplacer = confirm(
          "⚠ RAPPORT DÉJÀ SOUMIS\n\n" +
          "Un rapport général moyen & secondaire a déjà été déposé pour\n" +
          "l'établissement « " + nomEcole + " ».\n\n" +
          "OK     → remplacer le rapport déjà enregistré (mise à jour + PDF)\n" +
          "Annuler → abandonner la soumission (aucun envoi, aucun PDF)"
        );
        if (!remplacer) {
          if (page.annule) {
            page.annule("Soumission annulée : un rapport a déjà été soumis " +
                        "pour cet établissement. Rien n'a été envoyé et aucun " +
                        "PDF n'a été généré.");
          }
          return false;
        }
      }
    }

    page.progres("Enregistrement de la soumission…", 5);
    var res = await global.RRdb.enregistrer(donneesSaisies);

    var M = modele();
    var ctx = M.buildContext(donneesSaisies, { id: res.ref });
    page.apercuVisible();
    M.renderPreview(page.apercu, ctx);

    var pages = page.apercu.querySelectorAll(".pdf-page");
    if (pages.length !== 14) {
      throw new Error("Le rapport doit tenir sur exactement 14 pages (" +
                      pages.length + " détectées).");
    }

    var nom = await global.RR.pdf.download(pages, ctx, function (i, n) {
      page.progres("Génération du PDF officiel — page " + i + " / " + n + "…",
                   10 + Math.round(i / n * 90));
    });

    page.succes(res, nom, ctx);
    return true;
  }

  function rafraichirCombos() {
    var wraps = conteneur.querySelectorAll(".combo");
    for (var i = 0; i < wraps.length; i++) {
      var input = wraps[i].querySelector("input");
      var ul = wraps[i].querySelector(".combo-liste");
      if (input && ul && !ul.hidden) { afficherCombo(input); }
    }
  }

  /* -----------------------------------------------------------------------
     API PUBLIQUE
     ----------------------------------------------------------------------- */
  global.RRformGeneralMoyen = {
    construire: construire,
    rafraichirCombos: rafraichirCombos,
    remplir: remplir,
    collecter: collecter,
    valider: valider,
    soumettre: soumettre,
    chargerBrouillon: chargerBrouillon,
    sauverBrouillon: sauverBrouillon,
    setPath: setPath,
    getPath: getPath
  };

}(window));
