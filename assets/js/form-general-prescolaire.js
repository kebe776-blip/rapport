/* =========================================================================
   form-general-prescolaire.js — Moteur de saisie DÉDIÉ du « RAPPORT
   GÉNÉRAL DE RENTRÉE PRÉSCOLAIRE » (general-prescolaire.html).
   • Rendu des sections A → M, combos filtrables, tableaux officiels
     (personnel 10/2/5, effectifs I et handicapés J à lignes fixes P.S /
      M.S / G.S + TOTAL, mobiliers K 16 lignes, recensements L 10 / M 14
      lignes), validation minimale, brouillon hors-ligne dédié et
     soumission (enregistrement typé + PDF 5 pages via RR_MODELES).
   • Copie autonome adaptée de form.js : form.js et champs.js ne sont ni
     modifiés ni chargés par cette page (zéro risque pour l'élémentaire).
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR;
  var D = global.RR_CHAMPS_GENERAL_PRESCOLAIRE;
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;

  /* Brouillon PROPRE à ce type : jamais de collision avec les autres. */
  var LS = CFG.LS_BROUILLON_GENERAL_PRESCOLAIRE ||
           "rr_brouillon_general_prescolaire_v1";

  var conteneur = null;   /* élément qui reçoit le HTML du formulaire */
  var donnees = {};       /* objet en cours de saisie (sections A → M) */
  var minuteur = null;
  var navFocusCible = null; /* champ ciblé par les flèches (combo : ne pas ouvrir) */

  /* -----------------------------------------------------------------------
     MODÈLE DU RAPPORT (contexte + pages + aperçu) — registre RR_MODELES.
     Défaut : modèle élémentaire de rapport.js.
     ----------------------------------------------------------------------- */
  function modele() {
    var type = global.RR_TYPE || "general-prescolaire";
    var m = (global.RR_MODELES || {})[type];
    return m || { buildContext: R.buildContext, renderPreview: R.renderPreview,
                  fitPreview: R.fitPreview, titres: R.TITRES_PAGES };
  }

  /* -----------------------------------------------------------------------
     CHEMINS DE DONNÉES (a.b / a[0].b)
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

  /* -----------------------------------------------------------------------
     GÉNÉRATION DE HTML
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

  function attrsDe(c, path) {
    var attr = ' id="' + idDe(path) + '" data-path="' + esc(path) + '"';
    if (c.max) { attr += ' maxlength="' + c.max + '"'; }
    if (c.tel) { attr += ' inputmode="tel"'; }
    if (c.maj === "upper") { attr += ' data-maj="upper"'; }
    return attr;
  }

  function champHTML(sec, c) {
    var path = sec.groupe + "." + c.n;
    var cls = "champ" + (c.large ? " large" : "");
    var oblig = c.req ? ' <span class="ob">*</span>' : "";
    var aide = c.aide ? '<span class="aide">' + esc(c.aide) + "</span>" : "";
    var ouverture = '<div class="' + cls + '" data-champ="' + esc(path) + '">' +
                    '<label for="' + idDe(path) + '">' + esc(c.l) + oblig + "</label>";
    var attr = attrsDe(c, path);

    if (c.t === "select") {
      return ouverture +
        '<select' + attr + ' data-type="text">' + optionsHTML(c.opts, "") +
        "</select>" + aide + "</div>";
    }
    if (c.t === "area") {
      return ouverture +
        '<textarea' + attr + ' rows="3"></textarea>' + aide + "</div>";
    }
    if (c.t === "combo") {
      var idListe = "liste_" + idDe(path);
      return ouverture +
        '<div class="combo">' +
          '<input type="text"' + attr + ' data-type="text"' +
            ' autocomplete="off" spellcheck="false" role="combobox"' +
            ' aria-expanded="false" aria-autocomplete="list"' +
            ' aria-controls="' + idListe + '"' +
            ' placeholder="Tapez pour filtrer…">' +
          '<ul class="combo-liste" id="' + idListe + '" role="listbox" hidden></ul>' +
        "</div>" + aide + "</div>";
    }
    attr += ' data-type="' + (c.t === "num" ? "num" : "text") + '"';
    if (c.t === "date") { attr += ' inputmode="numeric" placeholder="JJ/MM/AAAA"'; }
    if (c.t === "num") { attr += ' min="0" inputmode="numeric"'; }
    if (c.somme) { attr += ' data-somme="' + c.somme + '"'; }
    if (c.auto) { attr += ' data-auto="1"'; }
    return ouverture +
      '<input type="' + (c.t === "num" ? "number" : "text") + '"' + attr +
      ' value="">' + aide + "</div>";
  }

  function sectionHTML(sec) {
    var corps = '<div class="champs">';
    for (var i = 0; i < sec.champs.length; i++) {
      corps += champHTML(sec, sec.champs[i]);
    }
    corps += "</div>";
    var note = sec.note
      ? '<div class="petit mb">' + esc(sec.note) + "</div>" : "";
    return '<details class="section-form" data-sec="' + sec.lettre + '" open>' +
             "<summary>" + sec.lettre + ". " + esc(sec.titre) +
             '<span class="badge" data-badge="' + sec.lettre + '">0</span></summary>' +
             '<div class="corps">' + note + corps + "</div></details>";
  }

  /* --- Tableau officiel à lignes fixes (personnel / service / recensements) --- */
  function tableauRepeatHTML(def) {
    var sansNum = !!def.sansNum;   /* L / M : le modèle n'a pas de colonne N° */
    var html =
      '<details class="section-form" open>' +
        "<summary>" + (def.lettre ? def.lettre + ". " : "") + esc(def.titre) +
        '<span class="badge" data-badge="' + esc(def.lettre || def.cle) +
          '">0</span></summary>' +
        '<div class="corps">' +
          '<div class="petit mb">' + esc(def.soustitre || "") + "</div>" +
          '<div class="table-defilement">' +
          '<table class="table-saisie" data-repeat="' + def.cle + '">' +
            "<thead><tr>" +
            (sansNum ? "" : '<th style="width:44px;">N°</th>');
    for (var j = 0; j < def.colonnes.length; j++) {
      html += "<th" + (def.colonnes[j].w ? ' style="width:' + def.colonnes[j].w + '"' : "") +
              ">" + esc(def.colonnes[j].l) + "</th>";
    }
    html += "</tr></thead><tbody>";
    for (var i = 0; i < def.min; i++) {
      html += "<tr>" + (sansNum ? "" : '<td class="num">' + (i + 1) + "</td>");
      for (var k = 0; k < def.colonnes.length; k++) {
        html += celluleRepeat(def.colonnes[k], def.cle, i);
      }
      html += "</tr>";
    }
    html += "</tbody></table></div></div></details>";
    return html;
  }

  function celluleRepeat(c, cle, i) {
    var n = c.n;
    var path = cle + "[" + i + "]." + n;
    var style = c.w ? ' style="width:' + c.w + '"' : "";
    var attrs = ' data-path="' + esc(path) + '" data-n="' + n + '"' +
                ' data-type="' + (c.t === "num" ? "num" : "text") + '"';
    if (c.maj === "upper") { attrs += ' data-maj="upper"'; }
    if (c.tel) { attrs += ' inputmode="tel"'; }
    if (c.t === "date") { attrs += ' placeholder="JJ/MM/AAAA"'; }
    if (c.t === "num") { attrs += ' min="0" inputmode="numeric"'; }
    if (c.t === "select") {
      return "<td" + style + "><select" + attrs + ">" +
             optionsHTML(c.opts, "") + "</select></td>";
    }
    return "<td" + style + "><input type=\"" +
           (c.t === "num" ? "number" : "text") + '"' + attrs + ' value=""></td>';
  }

  /* --- Récapitulation (FRANÇAIS / ARABE), page 3 --- */
  var RECAP_CATS = [
    { cls: "inst", titre: "INSTITUTEURS" },
    { cls: "adj", titre: "INSTITUTEURS ADJOINTS" },
    { cls: "mc", titre: "MAÎTRES CONTRACTUELS" }
  ];

  function recapHTML() {
    var html = '<details class="section-form" open>' +
      '<summary>H. RÉCAPITULATION DU PERSONNEL (FRANÇAIS / ARABE)' +
      '<span class="badge" data-badge="H">0</span></summary><div class="corps">' +
      '<div class="petit mb">Totaux H / F / T — le Total se calcule ' +
      'automatiquement (H + F).</div>';
    D.RECAP.groupes.forEach(function (g) {
      html += "<h3>" + esc(g.titre) + "</h3>" +
        '<div class="table-defilement"><table class="table-saisie">' +
        '<thead><tr>';
      RECAP_CATS.forEach(function (c) {
        html += '<th colspan="3" class="grp ' + c.cls + '">' + c.titre + "</th>";
      });
      html += "</tr><tr>";
      RECAP_CATS.forEach(function (c) {
        html += '<th class="' + c.cls + '">H</th>' +
                '<th class="' + c.cls + '">F</th>' +
                '<th class="' + c.cls + '">T</th>';
      });
      html += "</tr></thead><tbody><tr>";
      g.cles.forEach(function (c) {
        var estTotal = /_t$/.test(c[0]);
        var base = c[0].replace(/_t$/, "");
        html += '<td><input type="number" min="0" data-type="num"' +
          ' data-path="recap_personnel.' + g.cle + "." + c[0] + '"' +
          ' data-n="' + c[0] + '"' +
          (estTotal ? ' data-auto="1" data-totalde="' + base + '"' : "") +
          ' value="0"></td>';
      });
      html += "</tr></tbody></table></div>";
    });
    html += "</div></details>";
    return html;
  }

  /* -----------------------------------------------------------------------
     I / J — TABLEAUX À LIGNES FIXES (P.S / M.S / G.S) : colonnes G / F / T
     par groupe, ligne TOTAL calculée. Utilisé par les effectifs (I) et la
     situation des handicapés (J).
     ----------------------------------------------------------------------- */
  function tableauFixeHTML(def, cleTable) {
    var groupes = def.groupes || def.categories;
    var avecNb = !!def.nb_classes;
    var html = '<details class="section-form" open>' +
      '<summary>' + esc(def.lettre) + '. ' + esc(def.titre) +
      '<span class="badge" data-badge="' + esc(def.lettre) + '">0</span>' +
      '</summary><div class="corps">' +
      '<div class="petit mb">' + esc(def.aide) + "</div>" +
      '<div class="gm-aide-defilement">↔ Faites glisser le tableau ' +
        'horizontalement pour voir toutes les colonnes.</div>' +
      '<div class="table-defilement"><table class="table-saisie" ' +
      'data-table="' + cleTable + '"><thead>' +
      '<tr>' +
        '<th rowspan="2" style="width:10%;">SECTIONS</th>' +
        (avecNb ? '<th rowspan="2" style="width:8%;">Nbr Classe</th>' : "");

    groupes.forEach(function (g) {
      html += '<th colspan="3" class="grp">' + esc(g[1]) + "</th>";
    });
    html += "</tr><tr>";
    groupes.forEach(function () {
      html += "<th>G</th><th>F</th><th>T</th>";
    });
    html += "</tr></thead><tbody>";

    def.lignes_fixes.forEach(function (label, i) {
      html += '<tr data-ligne="' + i + '">' +
        '<td class="libelle-ligne"><b>' + esc(label) + "</b>" +
          '<input type="hidden" data-type="text" data-n="section"' +
          ' data-path="' + cleTable + "[" + i + '].section" value="' +
          esc(label) + '"></td>';
      if (avecNb) {
        html += '<td><input type="number" min="0" data-type="num"' +
          ' data-n="nb_classes" data-path="' + cleTable + "[" + i +
          '].nb_classes" value="0"></td>';
      }
      def.colonnes.forEach(function (c) {
        html += '<td><input type="number" min="0" data-type="num"' +
          ' data-n="' + c.n + '" data-path="' + cleTable + "[" + i + "]." +
          c.n + '"' +
          (c.calc ? ' data-calc="' + c.calc + '"' : "") +
          (c.auto ? ' data-auto="1"' : "") + ' value="0"></td>';
      });
      html += "</tr>";
    });

    /* Ligne TOTAL : calculée (somme des trois sections), non modifiable. */
    html += '<tr data-ligne="total" class="totale">' +
      '<td class="libelle-ligne"><b>TOTAL</b></td>';
    if (avecNb) {
      html += '<td><input type="number" readonly class="fixe" data-type="num"' +
        ' data-n="nb_classes" data-path="' + cleTable +
        '_total.nb_classes" data-auto="1" value="0"></td>';
    }
    def.colonnes.forEach(function (c) {
      html += '<td><input type="number" readonly class="fixe" data-type="num"' +
        ' data-n="' + c.n + '" data-path="' + cleTable + "_total." + c.n +
        '" data-auto="1" value="0"></td>';
    });
    html += "</tr></tbody></table></div></div></details>";
    return html;
  }

  function effectifsHTML() {
    return tableauFixeHTML(D.EFFECTIFS, "effectifs");
  }

  function handicapesHTML() {
    return tableauFixeHTML(D.HANDICAPES, "handicapes");
  }

  /* --- K — Mobiliers (16 lignes fixes) --- */
  function mobilierHTML() {
    var def = D.MOBILIER;
    var html = '<details class="section-form" open>' +
      '<summary>' + esc(def.lettre) + '. ' + esc(def.titre) +
      '<span class="badge" data-badge="' + esc(def.lettre) + '">0</span>' +
      '</summary><div class="corps">' +
      '<div class="petit mb">' + esc(def.aide) + "</div>" +
      '<div class="table-defilement"><table class="table-saisie">' +
      '<thead><tr><th style="width:40%;">Mobilier</th>';
    def.colonnes.forEach(function (c) { html += "<th>" + esc(c.l) + "</th>"; });
    html += '<th style="width:40px;"></th></tr></thead><tbody>';
    def.lignes.forEach(function (l) {
      html += '<tr data-ligne="' + l[0] + '"><td><b>' + esc(l[1]) + "</b></td>";
      def.colonnes.forEach(function (c) {
        var path = "mobilier." + l[0] + "." + c.n;
        html += '<td><input type="number" min="0" data-path="' + path +
                '" data-n="' + c.n + '" data-type="num"' +
                (c.auto ? ' data-auto="1"' : "") + ' value="0"></td>';
      });
      html += '<td class="col-actions"><button type="button" class="suppr js-zero" ' +
              'title="Remettre à zéro">∅</button></td></tr>';
    });
    html += "</tbody></table></div></div></details>";
    return html;
  }

  /* -----------------------------------------------------------------------
     CONSTRUCTION GLOBALE (ordre du modèle : A → M, 5 pages)
     ----------------------------------------------------------------------- */
  function construire(el) {
    conteneur = el;
    var html = "";

    /* Navigation rapide A → M */
    html += '<div class="carte"><div style="display:flex; gap:6px; flex-wrap:wrap;">';
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"].forEach(function (l) {
      html += '<a class="btn gris petit" href="#sec_' + l + '" ' +
              'data-aller="' + l + '">' + l + "</a>";
    });
    html += "</div></div>";

    /* Sections A → G (champs simples) */
    D.SECTIONS.forEach(function (s) {
      html += '<div id="sec_' + s.lettre + '">' + sectionHTML(s) + "</div>";
    });

    /* H — Personnel enseignant (10 lignes) */
    html += '<div id="sec_H">' + tableauRepeatHTML(D.PERSONNEL[0]) + "</div>";
    /* Malades / congé de maternité (2 lignes) */
    html += '<div id="sec_malade">' + tableauRepeatHTML(D.PERSONNEL[1]) + "</div>";
    /* Récapitulation FR / AR */
    html += '<div id="sec_recap">' + recapHTML() + "</div>";
    /* Personnel de service (5 lignes) */
    html += '<div id="sec_service">' + tableauRepeatHTML(D.PERSONNEL[2]) + "</div>";

    /* I — Effectifs, J — Handicapés, K — Mobiliers */
    html += '<div id="sec_I">' + effectifsHTML() + "</div>";
    html += '<div id="sec_J">' + handicapesHTML() + "</div>";
    html += '<div id="sec_K">' + mobilierHTML() + "</div>";

    /* L / M — Recensements (page 5) */
    html += '<div id="sec_L">' + tableauRepeatHTML(D.RECENSEMENTS[0]) + "</div>";
    html += '<div id="sec_M">' + tableauRepeatHTML(D.RECENSEMENTS[1]) + "</div>";

    conteneur.innerHTML = html;
    attacherEvenements();
    mettreAJourBadges();
  }

  /* -----------------------------------------------------------------------
     ÉVÉNEMENTS DÉLÉGUÉS
     ----------------------------------------------------------------------- */
  function attacherEvenements() {
    conteneur.addEventListener("input", onInput);
    conteneur.addEventListener("change", onInput);
    conteneur.addEventListener("click", onClick);
    conteneur.addEventListener("focusin", onComboFocusIn);
    conteneur.addEventListener("focusout", onComboFocusOut);
    conteneur.addEventListener("keydown", onComboKeyDown);
    conteneur.addEventListener("keydown", onArrowNavigation);
    /* Empêche le champ de perdre le focus avant le clic sur une option. */
    conteneur.addEventListener("mousedown", function (ev) {
      if (ev.target.closest && ev.target.closest(".combo-option")) {
        ev.preventDefault();
      }
    });
  }

  /* -----------------------------------------------------------------------
     LISTES DÉROULANTES FILTRABLES (combo)
     ----------------------------------------------------------------------- */
  function normaliser(s) {
    return String(s === null || s === undefined ? "" : s)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
      .toUpperCase();
  }

  function defDeChamp(path) {
    var parties = String(path || "").split(".");
    if (parties.length < 2) { return null; }
    for (var i = 0; i < D.SECTIONS.length; i++) {
      var s = D.SECTIONS[i];
      if (s.groupe !== parties[0]) { continue; }
      for (var j = 0; j < s.champs.length; j++) {
        if (s.champs[j].n === parties[1]) { return s.champs[j]; }
      }
    }
    return null;
  }

  function ulDe(input) {
    var wrap = input && input.closest ? input.closest(".combo") : null;
    return wrap ? wrap.querySelector(".combo-liste") : null;
  }

  function afficherCombo(input, tout) {
    var ul = ulDe(input);
    if (!ul) { return; }
    var def = defDeChamp(input.getAttribute("data-path"));
    var liste = (def && def.liste) || [];
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
      /* Focus atteint par les flèches : on garde la liste fermée pour
         pouvoir continuer à se déplacer ; elle s'ouvrira à la frappe. */
      if (navFocusCible === input) { navFocusCible = null; return; }
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
      /* Liste fermée : ↓/↑ ouvre la liste seulement si le champ est vide.
         Avec une valeur déjà saisie, les flèches servent à changer de champ. */
      if ((ev.key === "ArrowDown" || ev.key === "ArrowUp") &&
          !input.value.trim()) {
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
      ev.preventDefault();
      i = (i + 1) % opts.length;
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      i = (i - 1 + opts.length) % opts.length;
    } else if (ev.key === "Enter") {
      if (i >= 0 && opts[i]) {
        ev.preventDefault();
        choisirCombo(input, opts[i].getAttribute("data-val"));
      }
      return;
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      fermerCombo(input);
      return;
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
     NAVIGATION CLAVIER TYPE EXCEL (flèches)
     ----------------------------------------------------------------------- */
  var NAV_KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1 };

  function estChampSaisie(el) {
    return !!(el && el.tagName &&
      (el.tagName === "INPUT" || el.tagName === "SELECT" ||
       el.tagName === "TEXTAREA"));
  }

  /** Cible possible des flèches : on saute seulement les totaux readonly.
      Les zones de texte restent accessibles, mais gardent ensuite leurs
      flèches natives pour déplacer le curseur. */
  function estCibleNavigation(el) {
    if (!el || !el.tagName || el.disabled) { return false; }
    if (el.tagName === "TEXTAREA") { return !el.readOnly; }
    if (el.tagName === "SELECT") { return true; }
    if (el.tagName !== "INPUT") { return false; }
    if (el.type === "hidden" || el.readOnly) { return false; }
    return ["text", "number", "tel", "date", "search", "email", "url"]
      .indexOf(el.type) !== -1;
  }

  function estVisible(el) {
    if (!(el.offsetWidth || el.offsetHeight ||
          (el.getClientRects && el.getClientRects().length))) {
      return false;
    }
    /* Chrome laisse une géométrie aux champs d'un <details> fermé :
       on vérifie donc explicitement les sections repliées. */
    var node = el;
    while (node && node !== conteneur) {
      if (node.tagName === "DETAILS" && !node.open) { return false; }
      node = node.parentElement;
    }
    return true;
  }

  function centreDe(rect) {
    return { x: (rect.left + rect.right) / 2,
             y: (rect.top + rect.bottom) / 2 };
  }

  /** Champ le plus proche dans la direction demandée, d'abord dans la
      section courante (même ligne pour ←/→, même rangée pour ↑/↓). */
  function champSuivant(el, direction) {
    var source = el.getBoundingClientRect();
    var cs = centreDe(source);
    var vertical = direction === "ArrowUp" || direction === "ArrowDown";
    var section = el.closest ? el.closest("details.section-form") : null;
    var candidats = [];

    Array.prototype.forEach.call(
      conteneur.querySelectorAll("input, select, textarea"), function (cand) {
        if (cand === el || !estCibleNavigation(cand) || !estVisible(cand)) {
          return;
        }
        if (section && cand.closest("details.section-form") !== section) {
          return;
        }
        var r = cand.getBoundingClientRect();
        if (!r.width && !r.height) { return; }
        var cc = centreDe(r);
        var dx = cc.x - cs.x;
        var dy = cc.y - cs.y;
        if (direction === "ArrowLeft" && dx >= -1) { return; }
        if (direction === "ArrowRight" && dx <= 1) { return; }
        if (direction === "ArrowUp" && dy >= -1) { return; }
        if (direction === "ArrowDown" && dy <= 1) { return; }
        candidats.push({ el: cand, r: r, dx: dx, dy: dy });
      });

    if (vertical) {
      var proche = meilleurVertical(candidats, source);
      if (proche) { return proche; }
      /* Dernière rangée de la section : on passe à la section voisine,
         en l'ouvrant si elle est repliée. */
      return champSectionVoisine(section, direction);
    }

    var meilleur = null;
    var meilleurScore = Infinity;
    candidats.forEach(function (c) {
      var recouvre = Math.min(source.bottom, c.r.bottom) -
                     Math.max(source.top, c.r.top);
      if (recouvre <= 0) { return; }
      var score = Math.abs(c.dx) + Math.abs(c.dy) * 2;
      if (score < meilleurScore) {
        meilleurScore = score;
        meilleur = c.el;
      }
    });
    if (meilleur) { return meilleur; }

    /* Fin de ligne : on continue dans l'ordre du DOM, dans la même section
       (une ligne de tableau repart ainsi au début de la ligne suivante). */
    return champDom(el, direction, true);
  }

  /** Parmi les champs de la rangée la plus proche, privilégie celui qui est
      aligné horizontalement avec le champ courant. */
  function meilleurVertical(candidats, source) {
    if (!candidats.length) { return null; }
    var distanceMin = Infinity;
    candidats.forEach(function (c) {
      var d = Math.abs(c.dy);
      if (d < distanceMin) { distanceMin = d; }
    });
    var proches = candidats.filter(function (c) {
      return Math.abs(c.dy) <= distanceMin + 26;
    });
    var meilleur = null;
    var meilleurScore = Infinity;
    proches.forEach(function (c) {
      var recouvre = Math.min(source.right, c.r.right) -
                     Math.max(source.left, c.r.left);
      var score = (recouvre > 0 ? 0 : 1000) + Math.abs(c.dx) +
                  Math.abs(c.dy) * 0.1;
      if (score < meilleurScore) {
        meilleurScore = score;
        meilleur = c.el;
      }
    });
    return meilleur;
  }

  /** Section précédente / suivante : l'ouvre si besoin et renvoie son
      premier (↓) ou dernier (↑) champ navigable. */
  function champSectionVoisine(section, direction) {
    if (!section) { return null; }
    var sections = conteneur.querySelectorAll("details.section-form");
    var i = Array.prototype.indexOf.call(sections, section);
    if (i === -1) { return null; }
    var pas = direction === "ArrowDown" ? 1 : -1;
    var voisine = sections[i + pas];
    if (!voisine) { return null; }
    if (!voisine.open) { voisine.open = true; }
    var champs = [];
    Array.prototype.forEach.call(
      voisine.querySelectorAll("input, select, textarea"), function (cand) {
        if (estCibleNavigation(cand)) { champs.push(cand); }
      });
    if (!champs.length) { return null; }
    return direction === "ArrowDown"
      ? champs[0] : champs[champs.length - 1];
  }

  function champDom(el, direction, memeSection) {
    var tous = [];
    Array.prototype.forEach.call(
      conteneur.querySelectorAll("input, select, textarea"), function (cand) {
        if (cand.type === "hidden" || cand.disabled) { return; }
        tous.push(cand);
      });
    var i = tous.indexOf(el);
    if (i === -1) { return null; }
    var pas = direction === "ArrowRight" ? 1 : -1;
    var section = memeSection && el.closest
      ? el.closest("details.section-form") : null;

    for (var j = i + pas; j >= 0 && j < tous.length; j += pas) {
      var cand = tous[j];
      if (!estCibleNavigation(cand)) { continue; }
      if (memeSection) {
        if (section && cand.closest("details.section-form") !== section) {
          continue;
        }
        if (!estVisible(cand)) { continue; }
      }
      return cand;
    }
    return null;
  }

  /** En texte, ←/→ ne changent de champ qu'au début / à la fin. */
  function bordDuCurseur(el, direction) {
    if (el.tagName !== "INPUT") { return true; }
    if (["text", "search", "tel", "email", "url", "password"]
        .indexOf(el.type) === -1) {
      return true;                  /* nombres : pas de curseur texte utile */
    }
    var debut, fin;
    try { debut = el.selectionStart; fin = el.selectionEnd; }
    catch (e) { return true; }
    if (debut === null || fin === null) { return true; }
    if (debut !== fin) { return false; }   /* sélection : laisser les flèches */
    return direction === "ArrowLeft" ? debut === 0 : debut === el.value.length;
  }

  function ouvrirSections(el) {
    var det = el.closest ? el.closest("details") : null;
    while (det) {
      if (!det.open) { det.open = true; }
      det = det.parentElement ? det.parentElement.closest("details") : null;
    }
  }

  function allerVers(el) {
    if (!el) { return false; }
    ouvrirSections(el);
    navFocusCible = el;
    try { el.focus({ preventScroll: true }); }
    catch (e) { el.focus(); }
    navFocusCible = null;
    if (el.tagName === "INPUT" && el.type === "number") {
      try { el.select(); } catch (e2) {}
    } else if (el.tagName === "INPUT" && el.type !== "date") {
      var fin = el.value.length;
      try { el.setSelectionRange(fin, fin); } catch (e3) {}
    } else if (el.tagName === "TEXTAREA") {
      var finZone = el.value.length;
      try { el.setSelectionRange(finZone, finZone); } catch (e4) {}
    }
    if (el.scrollIntoView) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    return true;
  }

  function onArrowNavigation(ev) {
    if (!NAV_KEYS[ev.key] || ev.defaultPrevented) { return; }
    if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) { return; }

    var el = ev.target;
    if (!estChampSaisie(el)) { return; }

    /* Listes natives, dates et zones de texte : flèches natives. */
    if (el.tagName === "SELECT" || el.tagName === "TEXTAREA") { return; }
    if (el.tagName === "INPUT" && el.type === "date") { return; }

    /* Combo ouvert : les flèches pilotent la liste. */
    if (el.closest && el.closest(".combo")) {
      var ul = ulDe(el);
      if (ul && !ul.hidden) { return; }
    }

    /* ←/→ dans un texte : on laisse d'abord le curseur se déplacer. */
    if ((ev.key === "ArrowLeft" || ev.key === "ArrowRight") &&
        !bordDuCurseur(el, ev.key)) {
      return;
    }

    var cible = champSuivant(el, ev.key);
    if (!cible) { return; }
    ev.preventDefault();
    allerVers(cible);
  }

  /* -----------------------------------------------------------------------
     SAISIE + CALCULS AUTOMATIQUES
     ----------------------------------------------------------------------- */
  function onInput(ev) {
    var el = ev.target;
    var path = el.getAttribute("data-path");
    if (!path) { return; }

    if (el.getAttribute("data-maj") === "upper" && el.tagName === "INPUT") {
      var pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      if (pos !== null) { try { el.setSelectionRange(pos, pos); } catch (e) {} }
    }

    var type = el.getAttribute("data-type");
    var v = el.value;
    if (type === "num") {
      v = v === "" ? 0 : (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
    }
    setPath(donnees, path, v);

    /* --- Calculs automatiques --- */
    var calc = el.getAttribute("data-calc");
    if (calc) { calcTotalLigne(el, calc); }

    var nomChamp = el.getAttribute("data-n");
    if (nomChamp === "bon" || nomChamp === "a_reparer") {
      calcTotalMobilier(el);
    }
    if (nomChamp && /_[hf]$/.test(nomChamp)) {
      calcRecap(el, nomChamp.replace(/_[hf]$/, ""));
    }
    if (el.getAttribute("data-totalde") !== null) {
      /* l'utilisateur a saisi le total lui-même : on ne le recalcule plus */
      el.removeAttribute("data-auto");
    }

    /* Somme de groupe (salles de classe en dur → Total) */
    var sommeDe = el.getAttribute("data-somme");
    if (sommeDe) { recalculerSomme(sommeDe); }

    /* Effectifs / handicapés : T recalculé par data-calc, puis ligne TOTAL */
    var table = el.closest && el.closest("table[data-table]");
    if (table && nomChamp && nomChamp !== "section") {
      var nomTable = table.getAttribute("data-table");
      if (nomTable === "effectifs") { sommerTable("effectifs", D.EFFECTIFS); }
      if (nomTable === "handicapes") { sommerTable("handicapes", D.HANDICAPES); }
    }

    /* Liste déroulante filtrable : on filtre à chaque frappe. Si la liste a
       été fermée (choix ou navigation clavier), une frappe réelle la rouvre ;
       le dispatch programmatique de choisirCombo() ne la rouvre pas. */
    if (el.closest && el.closest(".combo")) {
      var ulSaisie = ulDe(el);
      if (ulSaisie &&
          (!ulSaisie.hidden ||
           (ev.isTrusted && document.activeElement === el))) {
        afficherCombo(el);
      }
    }

    mettreAJourBadges();
    sauverBrouillon();
  }

  /** T = G + F sur la ligne courante (tout groupe de colonnes). */
  function calcTotalLigne(el, pre) {
    var tr = el.closest("tr");
    if (!tr) { return; }
    var g = tr.querySelector('[data-n="' + pre + '_g"]');
    var f = tr.querySelector('[data-n="' + pre + '_f"]');
    var t = tr.querySelector('[data-n="' + pre + '_t"]');
    if (!g || !f || !t) { return; }
    var somme = nombre(g) + nombre(f);
    t.value = somme;
    setPath(donnees, t.getAttribute("data-path"), somme);
  }

  /** Total = Bon + A réparer (mobiliers). */
  function calcTotalMobilier(el) {
    var tr = el.closest("tr");
    if (!tr) { return; }
    var total = tr.querySelector('[data-n="total"]');
    if (!total || !total.hasAttribute("data-auto")) { return; }
    var bon = tr.querySelector('[data-n="bon"]');
    var rep = tr.querySelector('[data-n="a_reparer"]');
    var somme = nombre(bon) + nombre(rep);
    total.value = somme;
    setPath(donnees, total.getAttribute("data-path"), somme);
  }

  /** Récapitulation : Total = H + F. */
  function calcRecap(el, base) {
    var tr = el.closest("tr");
    if (!tr) { return; }
    var h = tr.querySelector('[data-n="' + base + '_h"]');
    var f = tr.querySelector('[data-n="' + base + '_f"]');
    var t = tr.querySelector('[data-n="' + base + '_t"]');
    if (!h || !f || !t) { return; }
    var somme = nombre(h) + nombre(f);
    t.value = somme;
    setPath(donnees, t.getAttribute("data-path"), somme);
  }

  /** Somme de groupe (ex. 6 colonnes de salles → Total des salles). */
  function recalculerSomme(cle) {
    var total = conteneur.querySelector('[data-total-de="' + cle + '"]');
    if (!total) { return; }
    var cible = conteneur.querySelector(
      'input[data-path="' + total.getAttribute("data-path") + '"]');
    if (!cible || !cible.hasAttribute("data-auto")) { return; }
    var somme = 0;
    Array.prototype.forEach.call(
      conteneur.querySelectorAll('[data-somme="' + cle + '"]'),
      function (x) { somme += nombre(x); });
    cible.value = somme;
    setPath(donnees, cible.getAttribute("data-path"), somme);
  }

  /** Ligne TOTAL d'un tableau fixe = somme de ses lignes. */
  function sommerTable(cleTable, def) {
    var table = conteneur.querySelector('table[data-table="' + cleTable + '"]');
    if (!table) { return; }
    var cols = def.colonnes.map(function (c) { return c.n; });
    if (def.nb_classes) { cols = ["nb_classes"].concat(cols); }
    var lignes = [];
    for (var i = 0; i < def.lignes_fixes.length; i++) {
      var tr = table.querySelector('tr[data-ligne="' + i + '"]');
      if (tr) { lignes.push(tr); }
    }
    var total = table.querySelector('tr[data-ligne="total"]');
    if (!total) { return; }
    cols.forEach(function (col) {
      var somme = 0;
      lignes.forEach(function (tr) {
        somme += nombre(tr.querySelector('[data-n="' + col + '"]'));
      });
      var cible = total.querySelector('[data-n="' + col + '"]');
      if (cible) {
        cible.value = somme;
        setPath(donnees, cible.getAttribute("data-path"), somme);
      }
    });
  }

  /** Recalcule tous les dérivés après une reprise (brouillon / modification). */
  function recalculerTout() {
    /* Effectifs (I) et handicapés (J) : T = G + F par ligne, puis TOTAL */
    [["effectifs", D.EFFECTIFS], ["handicapes", D.HANDICAPES]]
      .forEach(function (paire) {
        var table = conteneur.querySelector(
          'table[data-table="' + paire[0] + '"]');
        if (!table) { return; }
        var prefixes = (paire[1].groupes || paire[1].categories)
          .map(function (g) { return g[0]; });
        Array.prototype.forEach.call(
          table.querySelectorAll("tbody tr[data-ligne]"), function (tr) {
            if (tr.getAttribute("data-ligne") === "total") { return; }
            prefixes.forEach(function (pre) {
              var g = tr.querySelector('[data-n="' + pre + '_g"]');
              var f = tr.querySelector('[data-n="' + pre + '_f"]');
              var t = tr.querySelector('[data-n="' + pre + '_t"]');
              if (!g || !f || !t) { return; }
              var somme = nombre(g) + nombre(f);
              t.value = somme;
              setPath(donnees, t.getAttribute("data-path"), somme);
            });
          });
        sommerTable(paire[0], paire[1]);
      });
    /* Mobiliers : Total = Bon + A réparer */
    Array.prototype.forEach.call(
      conteneur.querySelectorAll('table [data-n="total"][data-auto]'),
      function (total) {
        var tr = total.closest("tr");
        if (!tr) { return; }
        var somme = nombre(tr.querySelector('[data-n="bon"]')) +
                    nombre(tr.querySelector('[data-n="a_reparer"]'));
        total.value = somme;
        setPath(donnees, total.getAttribute("data-path"), somme);
      });
    /* Récapitulation : T = H + F */
    Array.prototype.forEach.call(
      conteneur.querySelectorAll('table [data-totalde]'), function (t) {
        var base = t.getAttribute("data-totalde");
        var tr = t.closest("tr");
        if (!tr) { return; }
        var somme = nombre(tr.querySelector('[data-n="' + base + '_h"]')) +
                    nombre(tr.querySelector('[data-n="' + base + '_f"]'));
        t.value = somme;
        setPath(donnees, t.getAttribute("data-path"), somme);
      });
    /* Salles de classe : Total = somme des 6 bailleurs */
    recalculerSomme("salles_total");
  }

  function onClick(ev) {
    var t = ev.target;

    /* Choix d'une valeur dans une liste déroulante filtrable */
    if (t.classList && t.classList.contains("combo-option")) {
      var wrap = t.closest(".combo");
      var champSaisie = wrap && wrap.querySelector("input");
      if (champSaisie) {
        choisirCombo(champSaisie, t.getAttribute("data-val"));
      }
      return;
    }

    if (t.classList && t.classList.contains("js-zero")) {
      var tr = t.closest("tr");
      Array.prototype.forEach.call(tr.querySelectorAll("input"), function (inp) {
        inp.value = 0;
        setPath(donnees, inp.getAttribute("data-path"), 0);
      });
      sauverBrouillon();
      return;
    }

    var lien = t.getAttribute && t.getAttribute("data-aller");
    if (lien) {
      ev.preventDefault();
      var cible = document.getElementById("sec_" + lien);
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
     REMPLISSAGE À PARTIR D'UN OBJET
     ----------------------------------------------------------------------- */
  /** Replace les trois lignes fixes d'un ancien brouillon dans l'ordre
   *  P.S / M.S / G.S : reprise par libellé, sinon par position. */
  function normaliserTableFixe(obj, cle, libelles) {
    if (!obj || !Array.isArray(obj[cle])) { return; }
    var copie = obj[cle].slice();
    function norm(s) {
      return String(s === null || s === undefined ? "" : s)
        .toUpperCase().replace(/[\s.\-]/g, "");
    }
    obj[cle] = libelles.map(function (libelle, index) {
      var cible = norm(libelle);
      var trouve = null;
      copie.forEach(function (row) {
        if (trouve) { return; }
        var s = norm(row && row.section);
        if (!s) { return; }
        if (s === cible ||
            (cible === "PS" && s.indexOf("PETITE") === 0) ||
            (cible === "MS" && s.indexOf("MOYENNE") === 0) ||
            (cible === "GS" && s.indexOf("GRANDE") === 0)) {
          trouve = row;
        }
      });
      var ligne = trouve || copie[index] || {};
      if (typeof ligne !== "object") { ligne = {}; }
      ligne.section = libelle;
      return ligne;
    });
  }

  function remplir(obj) {
    donnees = obj || {};
    /* Le champ CODEC a été retiré du formulaire préscolaire : on ignore
       aussi une éventuelle valeur héritée d'un ancien brouillon. */
    if (donnees.identification &&
        Object.prototype.hasOwnProperty.call(donnees.identification, "codec")) {
      delete donnees.identification.codec;
    }
    normaliserTableFixe(donnees, "effectifs", D.EFFECTIFS.lignes_fixes);
    normaliserTableFixe(donnees, "handicapes", D.HANDICAPES.lignes_fixes);
    Array.prototype.forEach.call(conteneur.querySelectorAll("[data-path]"), function (el) {
      if (el.readOnly || el.type === "hidden") { return; } /* TOTAL + libellés fixes */
      var path = el.getAttribute("data-path");
      var v = getPath(donnees, path);
      if (v === undefined || v === null) { v = el.type === "number" ? 0 : ""; }
      el.value = v;
    });
    recalculerTout();
    mettreAJourBadges();
  }

  /* -----------------------------------------------------------------------
     COLLECTE
     ----------------------------------------------------------------------- */
  function collecter() {
    var out = {};
    Array.prototype.forEach.call(conteneur.querySelectorAll("[data-path]"), function (el) {
      var v = el.value;
      if (el.getAttribute("data-type") === "num") {
        v = v === "" ? 0 : (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
      }
      setPath(out, el.getAttribute("data-path"), v);
    });
    /* Lignes entièrement vides écartées : le PDF renumérote lui-même les
       lignes de saisie restantes (et complète le tableau officiel).
       Les tableaux I et J gardent leurs trois lignes fixes P.S / M.S / G.S. */
    ["enseignant", "malade", "service",
     "manuels", "materiel"].forEach(function (cle) {
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
     BADGES DE PROGRESSION
     ----------------------------------------------------------------------- */
  function mettreAJourBadges() {
    Array.prototype.forEach.call(
      conteneur.querySelectorAll("details.section-form"), function (det) {
        var badge = det.querySelector("[data-badge]");
        if (!badge) { return; }
        var champs = det.querySelectorAll("[data-path]");
        var total = 0;
        var remplis = 0;
        Array.prototype.forEach.call(champs, function (el) {
          if (el.readOnly || el.type === "hidden") { return; }
          total++;
          if (el.value !== "" && el.value !== "0" && el.value !== null) { remplis++; }
        });
        badge.textContent = remplis + "/" + total;
        badge.style.background = (remplis >= total && total > 0)
          ? "#1e7a3c" : "#1f4e79";
      });
  }

  /* -----------------------------------------------------------------------
     BROUILLON HORS-LIGNE (clé dédiée à ce type)
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

    /* 1. Champs obligatoires */
    D.OBLIGATOIRES.forEach(function (o) {
      if (!valeurDe(o[0])) {
        erreurs.push("Merci de renseigner " + o[1] + ".");
        marquerInvalid(o[0]);
      }
    });

    /* 2. Champs à liste fermée (école préscolaire, commune) —
       la valeur saisie doit appartenir à la liste. */
    D.SECTIONS.forEach(function (s) {
      s.champs.forEach(function (c) {
        if (c.t !== "combo" || !c.liste || !c.liste.length) { return; }
        var path = s.groupe + "." + c.n;
        var v = valeurDe(path);
        if (!v) { return; }          /* vide : géré par les obligatoires */
        var connu = c.liste.some(function (x) {
          return normaliser(x) === normaliser(v);
        });
        if (connu) { return; }
        erreurs.push("« " + v + " » ne figure pas dans la liste des " +
          (c.n === "commune" ? "communes" : "écoles préscolaires") +
          " : choisissez une valeur dans la liste déroulante.");
        marquerInvalid(path);
        var el = conteneur.querySelector('[data-path="' + path + '"]');
        if (el) { afficherCombo(el, true); }
      });
    });

    /* 3. Au moins un enseignant nommé (section H) */
    var table = conteneur.querySelector('table[data-repeat="enseignant"]');
    if (table) {
      var vide = !Array.prototype.some.call(
        table.tBodies[0].rows, function (tr) {
          var p = tr.querySelector('[data-n="prenom"]');
          var n = tr.querySelector('[data-n="nom"]');
          return p && n && p.value.trim() && n.value.trim();
        });
      if (vide) {
        erreurs.push("Ajoutez au moins un enseignant (prénom et nom) " +
                     "dans la section H.");
      }
    }
    return erreurs;
  }

  /* -----------------------------------------------------------------------
     SOUMISSION : enregistrement typé + PDF 5 pages
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

    /* 1. Toujours conserver localement (réseau faible) */
    try { localStorage.setItem(LS, JSON.stringify(donneesSaisies)); } catch (e) {}

    /* 1 bis. ANTI-DOUBLON PAR TYPE : une école ne dépose qu'un rapport de
       CE type (clé type + ecole_code + annee côté serveur). */
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
          "Un rapport général a déjà été déposé pour l'école\n" +
          "« " + nomEcole + " ».\n\n" +
          "OK     → remplacer le rapport déjà enregistré (mise à jour + PDF)\n" +
          "Annuler → abandonner la soumission (aucun envoi, aucun PDF)"
        );
        if (!remplacer) {
          if (page.annule) {
            page.annule("Soumission annulée : un rapport a déjà été soumis " +
                        "pour cette école. Rien n'a été envoyé et aucun PDF " +
                        "n'a été généré.");
          }
          return false;
        }
      }
    }

    /* 2. Enregistrement serveur (ou file d'attente hors-ligne) */
    page.progres("Enregistrement de la soumission…", 5);
    var res = await global.RRdb.enregistrer(donneesSaisies);

    /* 3. PDF officiel 5 pages (paysage) dans le navigateur */
    var M = modele();
    var ctx = M.buildContext(donneesSaisies, { id: res.ref });
    page.apercuVisible();
    M.renderPreview(page.apercu, ctx);

    /* Garde-fou : le gabarit doit tenir sur exactement 5 pages. */
    var pages = page.apercu.querySelectorAll(".pdf-page");
    if (pages.length !== 5) {
      throw new Error("Le rapport doit tenir sur exactement 5 pages (" +
                      pages.length + " détectées).");
    }

    var nom = await global.RR.pdf.download(pages, ctx, function (i, n) {
      page.progres("Génération du PDF officiel — page " + i + " / " + n + "…",
                   10 + Math.round(i / n * 90));
    });

    page.succes(res, nom, ctx);
    return true;
  }

  /**
   * Réaffiche les listes déroulantes ouvertes après un changement des
   * listes depuis l'espace Inspection. Les valeurs saisies restent en place.
   */
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
  global.RRformGeneralPrescolaire = {
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
