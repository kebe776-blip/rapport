/* =========================================================================
   form-general-prescolaire.js — Moteur de saisie DÉDIÉ du « RAPPORT
   GÉNÉRAL DE RENTRÉE PRÉSCOLAIRE » (general-prescolaire.html).
   • Rendu des sections A → J, combos filtrables, tableaux officiels
     (personnel 10/2/5, effectifs à sections libres + TOTAL, mobiliers
     16 lignes), validation minimale, brouillon hors-ligne dédié et
     soumission (enregistrement typé + PDF 4 pages via RR_MODELES).
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
  var donnees = {};       /* objet en cours de saisie (sections A → J) */
  var minuteur = null;

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
    if (c.t === "num") { attr += ' min="0"'; }
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
    return '<details class="section-form" data-sec="' + sec.lettre + '"' +
             (sec.lettre === "A" ? " open" : "") + ">" +
             "<summary>" + sec.lettre + ". " + esc(sec.titre) +
             '<span class="badge" data-badge="' + sec.lettre + '">0</span></summary>' +
             '<div class="corps">' + note + corps + "</div></details>";
  }

  /* --- Tableau officiel à lignes fixes (personnel / service) --- */
  function tableauRepeatHTML(def) {
    var html =
      '<details class="section-form" open>' +
        "<summary>" + (def.lettre ? def.lettre + ". " : "") + esc(def.titre) +
        '<span class="badge" data-badge="' + esc(def.lettre || def.cle) +
          '">0</span></summary>' +
        '<div class="corps">' +
          '<div class="petit mb">' + esc(def.soustitre || "") + "</div>" +
          '<div class="table-defilement">' +
          '<table class="table-saisie" data-repeat="' + def.cle + '">' +
            '<thead><tr><th style="width:44px;">N°</th>';
    for (var j = 0; j < def.colonnes.length; j++) {
      html += "<th" + (def.colonnes[j].w ? ' style="width:' + def.colonnes[j].w + '"' : "") +
              ">" + esc(def.colonnes[j].l) + "</th>";
    }
    html += "</tr></thead><tbody>";
    for (var i = 0; i < def.min; i++) {
      html += '<tr><td class="num">' + (i + 1) + "</td>";
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
    if (c.t === "num") { attrs += ' min="0"'; }
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
     I — EFFECTIFS : 10 sections libres + colonnes G / F / T (3 groupes)
     + colonne Type + ligne TOTAL calculée.
     ----------------------------------------------------------------------- */
  function effectifsHTML() {
    var def = D.EFFECTIFS;
    var html = '<details class="section-form" open>' +
      '<summary>I. ' + esc(def.titre) +
      '<span class="badge" data-badge="I">0</span></summary><div class="corps">' +
      '<div class="petit mb">' + esc(def.aide) + "</div>" +
      '<div class="table-defilement"><table class="table-saisie" ' +
      'data-table="effectifs"><thead>' +
      '<tr>' +
        '<th rowspan="2" style="width:16%;">SECTIONS</th>' +
        '<th colspan="3" class="grp eff">EFFECTIF</th>' +
        '<th colspan="3" class="grp hand">HANDICAPÉ</th>' +
        '<th colspan="3" class="grp etat">Nbre d\'élèves qui n\'ont<br>' +
          'pas de pièces d\'état civil</th>' +
        '<th rowspan="2" style="width:11%;">' +
          esc(def.type_colonne.l) + '</th>' +
      '</tr><tr>';
    ["eff", "hand", "sec"].forEach(function () {});
    def.colonnes.forEach(function (c) {
      var cls = c.n.indexOf("eff") === 0 ? "eff"
              : c.n.indexOf("hand") === 0 ? "hand" : "etat";
      html += '<th class="' + cls + '">' + esc(c.l) + "</th>";
    });
    html += '</tr></thead><tbody>';
    for (var i = 0; i < def.nb_lignes; i++) {
      html += '<tr data-ligne="' + i + '">' +
        '<td><input type="text" data-type="text" data-n="section"' +
          ' data-path="effectifs[' + i + '].section" value=""></td>';
      def.colonnes.forEach(function (c) {
        html += '<td><input type="number" min="0" data-type="num"' +
          ' data-n="' + c.n + '" data-path="effectifs[' + i + '].' + c.n + '"' +
          (c.calc ? ' data-calc="' + c.calc + '"' : "") +
          (c.auto ? ' data-auto="1"' : "") + ' value="0"></td>';
      });
      html += '<td><select data-type="text" data-n="type"' +
        ' data-path="effectifs[' + i + '].type">' +
        optionsHTML(def.type_colonne.opts, "") + "</select></td></tr>";
    }
    /* Ligne TOTAL : calculée (somme des 10 lignes), non modifiable. */
    html += '<tr data-ligne="total" class="totale">' +
      '<td class="libelle-ligne"><b>TOTAL</b></td>';
    def.colonnes.forEach(function (c) {
      html += '<td><input type="number" readonly class="fixe" data-type="num"' +
        ' data-n="' + c.n + '" data-path="effectifs_total.' + c.n +
        '" data-auto="1" value="0"></td>';
    });
    html += '<td></td></tr>';
    html += "</tbody></table></div></div></details>";
    return html;
  }

  /* --- J — Mobiliers (16 lignes fixes) --- */
  function mobilierHTML() {
    var def = D.MOBILIER;
    var html = '<details class="section-form" open>' +
      '<summary>J. ' + esc(def.titre) +
      '<span class="badge" data-badge="J">0</span></summary><div class="corps">' +
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
     CONSTRUCTION GLOBALE (ordre du modèle : A → J, 4 pages)
     ----------------------------------------------------------------------- */
  function construire(el) {
    conteneur = el;
    var html = "";

    /* Navigation rapide A → J */
    html += '<div class="carte"><div style="display:flex; gap:6px; flex-wrap:wrap;">';
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].forEach(function (l) {
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

    /* I — Effectifs, J — Mobiliers */
    html += '<div id="sec_I">' + effectifsHTML() + "</div>";
    html += '<div id="sec_J">' + mobilierHTML() + "</div>";

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

    /* Effectifs : T recalculé par data-calc, puis ligne TOTAL */
    var table = el.closest && el.closest('table[data-table="effectifs"]');
    if (table && nomChamp && nomChamp !== "section" && nomChamp !== "type") {
      sommerEffectifs();
    }

    /* Liste déroulante filtrable : on filtre à chaque frappe, mais seulement
       si la liste est déjà ouverte (après un choix, elle reste fermée). */
    if (el.closest && el.closest(".combo")) {
      var ulSaisie = ulDe(el);
      if (ulSaisie && !ulSaisie.hidden) { afficherCombo(el); }
    }

    mettreAJourBadges();
    sauverBrouillon();
  }

  /** T = G + F sur la ligne courante (groupes eff / hand / sec). */
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

  /** Ligne TOTAL des effectifs = somme des 10 lignes (9 colonnes). */
  function sommerEffectifs() {
    var table = conteneur.querySelector('table[data-table="effectifs"]');
    if (!table) { return; }
    var cols = D.EFFECTIFS.colonnes.map(function (c) { return c.n; });
    var lignes = [];
    for (var i = 0; i < D.EFFECTIFS.nb_lignes; i++) {
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
    /* Effectifs : T = G + F par ligne, puis TOTAL */
    var table = conteneur.querySelector('table[data-table="effectifs"]');
    if (table) {
      Array.prototype.forEach.call(
        table.querySelectorAll("tbody tr[data-ligne]"), function (tr) {
          if (tr.getAttribute("data-ligne") === "total") { return; }
          ["eff", "hand", "sec"].forEach(function (pre) {
            var g = tr.querySelector('[data-n="' + pre + '_g"]');
            var f = tr.querySelector('[data-n="' + pre + '_f"]');
            var t = tr.querySelector('[data-n="' + pre + '_t"]');
            if (!g || !f || !t) { return; }
            var somme = nombre(g) + nombre(f);
            t.value = somme;
            setPath(donnees, t.getAttribute("data-path"), somme);
          });
        });
      sommerEffectifs();
    }
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
  function remplir(obj) {
    donnees = obj || {};
    Array.prototype.forEach.call(conteneur.querySelectorAll("[data-path]"), function (el) {
      if (el.readOnly) { return; }        /* lignes TOTAL : recalculées */
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
       lignes de saisie restantes (et complète le tableau officiel). */
    ["enseignant", "malade", "service", "effectifs"].forEach(function (cle) {
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

    /* 2. Champs à liste fermée (école préscolaire, commune, CODEC) —
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
          (c.n === "codec" ? "CODEC" :
           c.n === "commune" ? "communes" : "écoles préscolaires") +
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
     SOUMISSION : enregistrement typé + PDF 4 pages
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

    /* 3. PDF officiel 4 pages (paysage) dans le navigateur */
    var M = modele();
    var ctx = M.buildContext(donneesSaisies, { id: res.ref });
    page.apercuVisible();
    M.renderPreview(page.apercu, ctx);

    /* Garde-fou : le gabarit doit tenir sur exactement 4 pages. */
    var pages = page.apercu.querySelectorAll(".pdf-page");
    if (pages.length !== 4) {
      throw new Error("Le rapport doit tenir sur exactement 4 pages (" +
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
