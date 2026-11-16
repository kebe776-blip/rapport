/* =========================================================================
   form-evaluations.js — Moteur de saisie DÉDIÉ du « RAPPORT DES
   ÉVALUATIONS » (evaluations.html) : reproduit le modèle officiel
   (T1 / T2 / T3), 2 pages A4 portrait.
     • A IDENTIFICATION (pré-rempli IA / IEF / année depuis config.js)
     • B TRIMESTRE (le titre du PDF s'adapte)
     • C EFFECTIF TOTAL (CI → CM2, G / F / T auto)
     • D / E / F 3 matières × 3 statistiques × G / F / T
       (T = G + F ; POURCENTAGE calculé automatiquement)
     • G COMMENTAIRES / PROBLÈMES SOULEVÉS / SOLUTIONS (page 2)
   Copie autonome adaptée de form-general-prescolaire.js : form.js et
   champs.js ne sont ni modifiés ni chargés par cette page (zéro risque
   pour les types existants).
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR;
  var D = global.RR_CHAMPS_EVALUATIONS;
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;

  /* Brouillon PROPRE à ce type : jamais de collision avec les autres. */
  var LS = CFG.LS_BROUILLON_EVALUATIONS || "rr_brouillon_evaluations_v1";

  var conteneur = null;   /* élément qui reçoit le HTML du formulaire */
  var donnees = {};       /* objet en cours de saisie */
  var minuteur = null;

  /* -----------------------------------------------------------------------
     MODÈLE DU RAPPORT (contexte + pages + aperçu) — registre RR_MODELES.
     ----------------------------------------------------------------------- */
  function modele() {
    var type = global.RR_TYPE || "evaluations";
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
    if (c.t === "num") { attr += ' min="0" inputmode="numeric"'; }
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
    return '<details class="section-form" data-sec="' + sec.lettre + '"' +
             (sec.lettre === "A" ? " open" : "") + ">" +
             "<summary>" + sec.lettre + ". " + esc(sec.titre) +
             '<span class="badge" data-badge="' + sec.lettre + '">0</span></summary>' +
             '<div class="corps">' + note + corps + "</div></details>";
  }

  /** Enveloppe <details> d'une section sur mesure (C → G). */
  function sectionCustomHTML(lettre, titre, note, corps, open) {
    return '<details class="section-form" data-sec="' + lettre + '"' +
           (open ? " open" : "") + ">" +
           "<summary>" + lettre + ". " + esc(titre) +
           '<span class="badge" data-badge="' + lettre + '">0</span></summary>' +
           '<div class="corps">' +
           (note ? '<div class="petit mb">' + esc(note) + "</div>" : "") +
           corps + "</div></details>";
  }

  /* --- C — EFFECTIF TOTAL : 6 classes × G / F / T (T auto) --- */
  function effectifsHTML() {
    var html = '<div class="table-defilement"><table class="table-saisie" ' +
      'data-table="effectifs"><thead><tr>' +
      '<th style="width:34%;">CLASSES</th><th>G</th><th>F</th><th>T</th>' +
      '</tr></thead><tbody>';
    D.CLASSES.forEach(function (cl) {
      html += '<tr data-cl="' + cl[0] + '"><td><b>' + esc(cl[1]) + "</b></td>";
      ["g", "f"].forEach(function (l) {
        html += '<td><input type="number" min="0" data-type="num"' +
          ' data-path="effectifs.' + cl[0] + "." + l + '" data-n="' + l +
          '" value="0"></td>';
      });
      html += '<td><input type="number" readonly class="fixe" data-type="num"' +
        ' data-path="effectifs.' + cl[0] + '.t" data-n="t" data-auto="1"' +
        ' value="0"></td></tr>';
    });
    html += "</tbody></table></div>";
    return sectionCustomHTML(
      "C", "EFFECTIF TOTAL",
      "Total (T) = G + F, calculé automatiquement pour chaque classe.",
      html, true);
  }

  /* --- D / E / F — une matière : 3 statistiques × 6 classes × G / F / T --- */
  function matiereHTML(mat, lettre, ouvrir) {
    var html = '<div class="table-defilement"><table class="table-saisie" ' +
      'data-table="evaluations" data-mat="' + esc(mat.cle) + '"><thead><tr>' +
      '<th rowspan="2" style="width:12%;">CLASSES</th>' +
      '<th colspan="3" class="grp">NOMBRE D\'ÉLÈVES AYANT COMPOSÉ</th>' +
      '<th colspan="3" class="grp">NOMBRE D\'ÉLÈVES AYANT LA MOYENNE</th>' +
      '<th colspan="3" class="grp">POURCENTAGE DES ÉLÈVES AYANT LA MOYENNE</th>' +
      '</tr><tr>';
    for (var s = 0; s < 3; s++) {
      html += '<th>G</th><th>F</th><th>T</th>';
    }
    html += "</tr></thead><tbody>";
    D.CLASSES.forEach(function (cl) {
      html += '<tr data-cl="' + cl[0] + '"><td><b>' + esc(cl[1]) + "</b></td>";
      ["compose", "moyenne", "pct"].forEach(function (stat) {
        ["g", "f"].forEach(function (l) {
          var auto = stat === "pct";
          html += '<td><input type="number" min="0" data-type="num"' +
            (auto ? ' readonly class="fixe" data-auto="1"' : "") +
            ' data-path="evaluations.' + mat.cle + "." + stat + "." +
            cl[0] + "." + l + '" data-n="' + stat + "_" + l +
            '" value="0"></td>';
        });
        html += '<td><input type="number" readonly class="fixe" data-type="num"' +
          ' data-auto="1" data-path="evaluations.' + mat.cle + "." + stat +
          "." + cl[0] + '.t" data-n="' + stat + '_t" value="0"></td>';
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    return sectionCustomHTML(
      lettre, mat.titre,
      "T = G + F et le pourcentage = MOYENNE ÷ COMPOSÉ × 100, " +
      "calculés automatiquement.",
      html, !!ouvrir);
  }

  /* --- G — Page 2 : commentaires, problèmes, solutions --- */
  function page2HTML() {
    var html = '<div class="champ large">' +
      '<label for="f_commentaires">COMMENTAIRES</label>' +
      '<textarea id="f_commentaires" data-path="commentaires"' +
      ' rows="4" placeholder="Observations générales…"></textarea>' +
      '<span class="aide">4 lignes dans le PDF officiel (page 2).</span></div>';

    [["problemes", "PROBLÈMES SOULEVÉS",
      "Les 6 cases numérotées du modèle (page 2)."],
     ["solutions", "SOLUTIONS MISES EN ŒUVRE",
      "Les 6 cases numérotées du modèle (page 2)."]].forEach(function (bloc) {
      html += '<h3>' + esc(bloc[1]) + "</h3>" +
        '<div class="petit mb">' + esc(bloc[2]) + "</div>" +
        '<div class="table-defilement"><table class="table-saisie">' +
        '<thead><tr><th style="width:44px;">N°</th><th>' + esc(bloc[1]) +
        "</th></tr></thead><tbody>";
      for (var i = 0; i < 6; i++) {
        html += '<tr><td class="num">' + (i + 1) + "</td>" +
          '<td><input type="text" data-type="text" data-n="' + bloc[0] +
          '" data-path="' + bloc[0] + "." + i + '" value=""></td></tr>';
      }
      html += "</tbody></table></div>";
    });
    return sectionCustomHTML("G", "COMMENTAIRES, PROBLÈMES ET SOLUTIONS",
      "Page 2 du modèle officiel.", html, false);
  }

  /* -----------------------------------------------------------------------
     CONSTRUCTION GLOBALE (ordre du modèle : A → G, 2 pages)
     ----------------------------------------------------------------------- */
  function construire(el) {
    conteneur = el;
    var html = "";

    /* Navigation rapide A → G */
    html += '<div class="carte"><div style="display:flex; gap:6px; flex-wrap:wrap;">';
    ["A", "B", "C", "D", "E", "F", "G"].forEach(function (l) {
      html += '<a class="btn gris petit" href="#sec_' + l + '" ' +
              'data-aller="' + l + '">' + l + "</a>";
    });
    html += "</div></div>";

    /* A / B — champs simples */
    D.SECTIONS.forEach(function (s) {
      html += '<div id="sec_' + s.lettre + '">' + sectionHTML(s) + "</div>";
    });

    /* C — effectifs */
    html += '<div id="sec_C">' + effectifsHTML() + "</div>";

    /* D / E / F — matières */
    D.MATIERES.forEach(function (m, i) {
      var lettre = ["D", "E", "F"][i];
      html += '<div id="sec_' + lettre + '">' +
              matiereHTML(m, lettre, i === 0) + "</div>";
    });

    /* G — page 2 */
    html += '<div id="sec_G">' + page2HTML() + "</div>";

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
    var trEffectifs = el.closest && el.closest('table[data-table="effectifs"]');
    if (trEffectifs) {
      recalculerEffectifs(el.closest("tr"));
    }
    var tableMat = el.closest && el.closest('table[data-table="evaluations"]');
    if (tableMat) { recalculerMatiere(tableMat); }

    /* Liste déroulante filtrable : on filtre à chaque frappe, mais seulement
       si la liste est déjà ouverte (après un choix, elle reste fermée). */
    if (el.closest && el.closest(".combo")) {
      var ulSaisie = ulDe(el);
      if (ulSaisie && !ulSaisie.hidden) { afficherCombo(el); }
    }

    mettreAJourBadges();
    sauverBrouillon();
  }

  /** C — T = G + F sur la ligne de la classe. */
  function recalculerEffectifs(tr) {
    if (!tr) { return; }
    var g = tr.querySelector('[data-n="g"]');
    var f = tr.querySelector('[data-n="f"]');
    var t = tr.querySelector('[data-n="t"]');
    if (!g || !f || !t) { return; }
    var somme = nombre(g) + nombre(f);
    t.value = somme;
    setPath(donnees, t.getAttribute("data-path"), somme);
  }

  /** D → F — T = G + F (composé / moyenne) puis POURCENTAGE
      = MOYENNE ÷ COMPOSÉ × 100 (borné 0 → 100). */
  function recalculerMatiere(table) {
    if (!table) { return; }
    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (tr) {
      ["compose", "moyenne"].forEach(function (stat) {
        var g = tr.querySelector('[data-n="' + stat + '_g"]');
        var f = tr.querySelector('[data-n="' + stat + '_f"]');
        var t = tr.querySelector('[data-n="' + stat + '_t"]');
        if (!g || !f || !t) { return; }
        var somme = nombre(g) + nombre(f);
        t.value = somme;
        setPath(donnees, t.getAttribute("data-path"), somme);
      });
      ["g", "f", "t"].forEach(function (l) {
        var comp = tr.querySelector('[data-n="compose_' + l + '"]');
        var moy = tr.querySelector('[data-n="moyenne_' + l + '"]');
        var pct = tr.querySelector('[data-n="pct_' + l + '"]');
        if (!comp || !moy || !pct) { return; }
        var c = nombre(comp), m = nombre(moy);
        var p = c > 0 ? Math.round(m / c * 100) : 0;
        if (p < 0) { p = 0; }
        if (p > 100) { p = 100; }
        pct.value = p;
        setPath(donnees, pct.getAttribute("data-path"), p);
      });
    });
  }

  /** Recalcule tous les dérivés après une reprise (brouillon / modifier). */
  function recalculerTout() {
    Array.prototype.forEach.call(
      conteneur.querySelectorAll('table[data-table="effectifs"] tbody tr'),
      function (tr) { recalculerEffectifs(tr); });
    Array.prototype.forEach.call(
      conteneur.querySelectorAll('table[data-table="evaluations"]'),
      function (table) { recalculerMatiere(table); });
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
  function remplir(obj) {
    donnees = obj || {};
    Array.prototype.forEach.call(conteneur.querySelectorAll("[data-path]"), function (el) {
      if (el.readOnly) { return; }        /* T / pourcentages : recalculés */
      var path = el.getAttribute("data-path");
      var v = getPath(donnees, path);
      if (v === undefined || v === null) { v = el.type === "number" ? 0 : ""; }
      el.value = v;
    });
    recalculerTout();
    mettreAJourBadges();
  }

  /* -----------------------------------------------------------------------
     PRÉ-REMPLISSAGE DEPUIS LA CONFIG (IA / IEF / année) — ne touche qu'aux
     champs encore vides : un brouillon ou une reprise prime.
     ----------------------------------------------------------------------- */
  function prefiller() {
    if (!conteneur) { return; }
    var anneeCfg = String(CFG.ANNEE || "2026/2027").replace("/", " - ");
    [["identification.ia", CFG.INSPECTION],
     ["identification.ief", CFG.IEF],
     ["identification.annee", anneeCfg]].forEach(function (d) {
      var el = conteneur.querySelector('[data-path="' + d[0] + '"]');
      if (el && !String(el.value || "").trim() && d[1]) {
        el.value = d[1];
        setPath(donnees, d[0], d[1]);
      }
    });
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
        var remplis = 0;
        Array.prototype.forEach.call(champs, function (el) {
          if (el.value !== "" && el.value !== "0" && el.value !== null) { remplis++; }
        });
        badge.textContent = remplis + "/" + champs.length;
        badge.style.background = (remplis >= champs.length && champs.length > 0)
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

    /* 2. Champs à liste fermée (école, CODEC) — la valeur saisie doit
        appartenir à la liste. */
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
          (c.n === "codec" ? "CODEC" : "écoles") +
          " : choisissez une valeur dans la liste déroulante.");
        marquerInvalid(path);
        var el = conteneur.querySelector('[data-path="' + path + '"]');
        if (el) { afficherCombo(el, true); }
      });
    });

    return erreurs;
  }

  /* -----------------------------------------------------------------------
     SOUMISSION : enregistrement typé + PDF 2 pages (portrait)
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
          "Un rapport des évaluations a déjà été déposé pour l'école\n" +
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

    /* 3. PDF officiel 2 pages (A4 portrait) dans le navigateur */
    var M = modele();
    var ctx = M.buildContext(donneesSaisies, { id: res.ref });
    page.apercuVisible();
    M.renderPreview(page.apercu, ctx);

    /* Garde-fou : le gabarit doit tenir sur exactement 2 pages. */
    var pages = page.apercu.querySelectorAll(".pdf-page");
    if (pages.length !== 2) {
      throw new Error("Le rapport doit tenir sur exactement 2 pages (" +
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
  global.RRformEvaluations = {
    construire: construire,
    rafraichirCombos: rafraichirCombos,
    remplir: remplir,
    collecter: collecter,
    valider: valider,
    soumettre: soumettre,
    prefiller: prefiller,
    chargerBrouillon: chargerBrouillon,
    sauverBrouillon: sauverBrouillon,
    setPath: setPath,
    getPath: getPath
  };

}(window));
