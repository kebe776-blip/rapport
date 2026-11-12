/* =========================================================================
   form-succinct.js — Moteur de saisie DÉDIÉ du « RAPPORT DE SUCCINCT DE
   RENTRÉE » PRÉSCOLAIRE (succinct-prescolaire.html).
   • Rendu, combos filtrables, validation minimale, brouillon hors-ligne et
     soumission (enregistrement typé + PDF 2 pages via RR_MODELES).
   • Copie autonome adaptée de form.js : form.js et champs.js ne sont ni
     modifiés ni chargés par cette page (zéro risque pour l'élémentaire).
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR;
  var D = global.RR_CHAMPS_SUCCINCT;
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;

  /* Brouillon PROPRE à ce type : jamais de collision avec l'élémentaire. */
  var LS = CFG.LS_BROUILLON_SUCCINCT_PRESCOLAIRE ||
           "rr_brouillon_succinct_prescolaire_v1";

  var conteneur = null;   /* élément qui reçoit le HTML du formulaire */
  var donnees = {};       /* objet en cours de saisie (sections A → L) */
  var minuteur = null;

  /* -----------------------------------------------------------------------
     MODÈLE DU RAPPORT (contexte + pages + aperçu) — registre RR_MODELES.
     Défaut : modèle élémentaire de rapport.js.
     ----------------------------------------------------------------------- */
  function modele() {
    var type = global.RR_TYPE || "succinct-prescolaire";
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
    return '<details class="section-form" data-sec="' + sec.lettre + '"' +
             (sec.lettre === "A" ? " open" : "") + ">" +
             "<summary>" + sec.lettre + ". " + esc(sec.titre) +
             '<span class="badge" data-badge="' + sec.lettre + '">0</span></summary>' +
             '<div class="corps">' + corps + "</div></details>";
  }

  /* --- Cellule d'input d'un tableau à lignes fixes (mode objet) --- */
  function inputCellule(c, groupe, ligne) {
    var path = groupe + "." + ligne + "." + c.n;
    /* Colonne réservée à une seule ligne (Nbre de boxes → Toilettes) */
    if (c.seulement && c.seulement !== ligne) { return "<td></td>"; }
    var attrs = ' data-path="' + esc(path) + '" data-col="' + c.n + '"' +
                ' data-type="' + (c.t === "num" ? "num" : "text") + '"';
    if (c.max) { attrs += ' maxlength="' + c.max + '"'; }
    if (c.maj === "upper") { attrs += ' data-maj="upper"'; }
    if (c.tel) { attrs += ' inputmode="tel"'; }
    if (c.t === "date") { attrs += ' placeholder="JJ/MM/AAAA"'; }
    if (c.t === "num") { attrs += ' min="0"'; }
    if (c.auto) { attrs += ' data-auto="1"'; }
    var style = c.w ? ' style="width:' + c.w + '"' : "";
    if (c.t === "select") {
      return "<td" + style + "><select" + attrs + ">" +
             optionsHTML(c.opts, "") + "</select></td>";
    }
    return "<td" + style + "><input type=\"" +
           (c.t === "num" ? "number" : "text") + '"' + attrs + ' value=""></td>';
  }

  /* --- Tableau D (effectifs) / D bis (personnel) : colonnes G F T +
         colonnes maître — en-tête à deux rangées comme sur le modèle. --- */
  function tableauMaitreHTML(def) {
    var html =
      '<details class="section-form" open>' +
        "<summary>" + def.lettre + ". " + esc(def.titre) +
        '<span class="badge" data-badge="' + def.lettre + '">0</span></summary>' +
        '<div class="corps">' +
          '<div class="petit mb">' + esc(def.aide || "") + "</div>" +
          '<div class="table-defilement">' +
          '<table class="table-saisie" data-table="' + def.groupe + '">' +
            "<thead>" +
              "<tr>" +
                '<th rowspan="2" style="width:15%;">' +
                  (def.colonne_titre ? esc(def.colonne_titre) : "&nbsp;") + "</th>" +
                '<th colspan="3" class="grp">EFFECTIFS</th>';
    def.colonnes_maitre.forEach(function (c) {
      html += '<th rowspan="2" style="width:' + c.w + '">' + esc(c.l) + "</th>";
    });
    html += "</tr><tr>" +
                '<th style="width:5%;">G</th>' +
                '<th style="width:5%;">F</th>' +
                '<th style="width:5%;">T</th>' +
              "</tr>" +
            "</thead><tbody>";
    def.lignes.forEach(function (l) {
      html += '<tr data-ligne="' + l[0] + '">' +
              '<td class="libelle-ligne"><b>' + esc(l[1]) + "</b></td>";
      ["g", "f", "t"].forEach(function (col) {
        html += '<td><input type="number" min="0" data-type="num"' +
                ' data-path="' + def.groupe + "." + l[0] + "." + col + '"' +
                ' data-col="' + col + '"' +
                (col === "t" ? ' data-auto="1"' : "") + ' value=""></td>';
      });
      def.colonnes_maitre.forEach(function (c) {
        html += inputCellule(c, def.groupe, l[0]);
      });
      html += "</tr>";
    });
    html += "</tbody></table></div></div></details>";
    return html;
  }

  /* --- Tableaux simples à lignes fixes (F, I, J, K) --- */
  function tableauSimpleHTML(def) {
    var html =
      '<details class="section-form" open>' +
        "<summary>" + def.lettre + ". " + esc(def.titre) +
        '<span class="badge" data-badge="' + def.lettre + '">0</span></summary>' +
        '<div class="corps">' +
          (def.aide ? '<div class="petit mb">' + esc(def.aide) + "</div>" : "") +
          '<div class="table-defilement">' +
          '<table class="table-saisie" data-table="' + def.groupe + '">' +
            '<thead><tr><th style="width:27%;">' +
              esc(def.colonne_titre || "Désignation") + "</th>";
    def.colonnes.forEach(function (c) {
      html += '<th style="width:' + (c.w || "20%") + '">' + esc(c.l) + "</th>";
    });
    html += "</tr></thead><tbody>";
    def.lignes.forEach(function (l) {
      html += '<tr data-ligne="' + l[0] + '">' +
              '<td class="libelle-ligne"><b>' + esc(l[1]) + "</b></td>";
      def.colonnes.forEach(function (c) {
        html += inputCellule(c, def.groupe, l[0]);
      });
      html += "</tr>";
    });
    html += "</tbody></table></div></details>";
    return html;
  }

  /* -----------------------------------------------------------------------
     CONSTRUCTION GLOBALE
     Blocs rendus dans l'ordre A → L (les 12 lettres sont navigables),
     en suivant la numérotation du modèle : page 1 = A, B, C, D ;
     page 2 = E(1) … L(8). Le même ordre est celui du gabarit PDF.
     ----------------------------------------------------------------------- */
  function construire(el) {
    conteneur = el;

    var lettres = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    var sectionDe = {};
    D.SECTIONS.forEach(function (s) { sectionDe[s.lettre] = s; });

    /* D : effectifs + handicapés + personnel (page 1) */
    function blocD() {
      return tableauMaitreHTML(D.EFFECTIFS) +
        '<div class="champs mt"><div class="champ large" data-champ="effectifs.handicapes">' +
        '<label for="' + idDe("effectifs.handicapes") + '">' +
          esc(D.HANDICAPES.l) + '</label>' +
        '<input type="text" id="' + idDe("effectifs.handicapes") + '"' +
          ' data-path="effectifs.handicapes" data-type="text"' +
          (D.HANDICAPES.max ? ' maxlength="' + D.HANDICAPES.max + '"' : "") +
          ' data-maj="upper" value="">' +
        '<span class="aide">Facultatif — laisser vide si aucun.</span>' +
        "</div></div>" +
        tableauMaitreHTML(D.PERSONNEL);
    }

    /* Blocs « tableau » (F, I, J, K) — page 2 du gabarit */
    var TABLEAUX = { F: D.EQUIPEMENTS, I: D.INFORMATIQUE,
                     J: D.MOBILIER, K: D.JEUX };

    function blocDe(lettre) {
      if (lettre === "D") { return blocD(); }
      if (TABLEAUX[lettre]) { return tableauSimpleHTML(TABLEAUX[lettre]); }
      var s = sectionDe[lettre];
      return s ? sectionHTML(s) : "";
    }

    /* Navigation rapide A → L (les 12 blocs) */
    var html = '<div class="carte"><div style="display:flex; gap:6px; flex-wrap:wrap;">';
    lettres.forEach(function (l) {
      html += '<a class="btn gris petit" href="#sec_' + l + '" ' +
              'data-aller="' + l + '">' + l + "</a>";
    });
    html += "</div></div>";

    lettres.forEach(function (l) {
      html += '<div id="sec_' + l + '">' + blocDe(l) + "</div>";
    });

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

    var col = el.getAttribute("data-col");
    var tr = el.closest("tr");
    var table = el.closest("table");
    var groupe = table && table.getAttribute("data-table");

    if (tr && col === "total") {
      /* l'utilisateur a saisi le total lui-même : on ne le recalcule plus */
      el.removeAttribute("data-auto");
    } else if (tr && (col === "g" || col === "f") &&
               (groupe === "effectifs" || groupe === "personnel")) {
      calcTotalLigne(tr);
      if (groupe === "effectifs" && tr.getAttribute("data-ligne") !== "total") {
        sommerEffectifs();
      }
    } else if (tr && (col === "bon" || col === "a_reparer")) {
      calcTotalObjet(tr);
    }

    if (el.closest && el.closest(".combo")) {
      var ulSaisie = ulDe(el);
      if (ulSaisie && !ulSaisie.hidden) { afficherCombo(el); }
    }

    mettreAJourBadges();
    sauverBrouillon();
  }

  /** T = G + F sur la ligne courante (effectifs et personnel). */
  function calcTotalLigne(tr) {
    var g = tr.querySelector('[data-col="g"]');
    var f = tr.querySelector('[data-col="f"]');
    var t = tr.querySelector('[data-col="t"]');
    if (!g || !f || !t) { return; }
    var somme = nombre(g) + nombre(f);
    t.value = somme;
    setPath(donnees, t.getAttribute("data-path"), somme);
  }

  /** TOTAL du tableau des effectifs = somme PS + MS + GS (G, F et T). */
  function sommerEffectifs() {
    var total = conteneur.querySelector(
      'table[data-table="effectifs"] tr[data-ligne="total"]');
    if (!total) { return; }
    ["g", "f", "t"].forEach(function (col) {
      var somme = 0;
      ["ps", "ms", "gs"].forEach(function (ligne) {
        var el = conteneur.querySelector(
          'table[data-table="effectifs"] tr[data-ligne="' + ligne +
          '"] [data-col="' + col + '"]');
        somme += nombre(el);
      });
      var cible = total.querySelector('[data-col="' + col + '"]');
      if (cible) {
        cible.value = somme;
        setPath(donnees, cible.getAttribute("data-path"), somme);
      }
    });
  }

  /** Total = Bon + À réparer (mobilier et jeux). */
  function calcTotalObjet(tr) {
    var total = tr.querySelector('[data-col="total"]');
    if (!total || !total.hasAttribute("data-auto")) { return; }
    var bon = tr.querySelector('[data-col="bon"]');
    var rep = tr.querySelector('[data-col="a_reparer"]');
    var somme = nombre(bon) + nombre(rep);
    total.value = somme;
    setPath(donnees, total.getAttribute("data-path"), somme);
  }

  function onClick(ev) {
    var t = ev.target;

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
      var path = el.getAttribute("data-path");
      var v = getPath(donnees, path);
      if (v === undefined || v === null) { v = el.type === "number" ? 0 : ""; }
      el.value = v;
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
     VALIDATION — saisie minimale (plan validé)
     ----------------------------------------------------------------------- */
  function valeurDe(path) {
    var el = conteneur.querySelector('[data-path="' + path + '"]');
    return el ? String(el.value || "").trim() : "";
  }

  function marquerInvalid(path) {
    var el = conteneur.querySelector('[data-path="' + path + '"]');
    var champ = el && el.closest(".champ");
    if (champ) { champ.classList.add("invalid"); }
    return el;
  }

  function valider() {
    var erreurs = [];
    Array.prototype.forEach.call(conteneur.querySelectorAll(".champ"), function (c) {
      c.classList.remove("invalid");
    });

    /* 1. Champs obligatoires (saisie minimale) */
    D.OBLIGATOIRES.forEach(function (o) {
      if (!valeurDe(o[0])) {
        erreurs.push("Merci de renseigner " + o[1] + ".");
        marquerInvalid(o[0]);
      }
    });

    /* 2. Champs à liste fermée (école préscolaire, commune) */
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

    /* 3. Au moins un contact (Orange / Tigo / Expresso) */
    var contact = D.CONTACTS.some(function (p) { return valeurDe(p); });
    if (!contact) {
      erreurs.push("Renseignez au moins un contact du directeur " +
                   "(Orange, Tigo ou Expresso).");
      D.CONTACTS.forEach(function (p) { marquerInvalid(p); });
    }

    /* 4. Au moins un maître renseigné (PS / MS / GS) */
    var maitre = D.MAITRES.some(function (p) { return valeurDe(p); });
    if (!maitre) {
      erreurs.push("Renseignez au moins un maître sur une section " +
                   "(Petite, Moyenne ou Grande Section).");
      D.MAITRES.forEach(function (p) { marquerInvalid(p); });
    }

    return erreurs;
  }

  /* -----------------------------------------------------------------------
     SOUMISSION : enregistrement typé + PDF 2 pages
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
          "Un rapport succinct a déjà été déposé pour l'école\n" +
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

    /* 3. PDF mixte 2 pages (paysage + portrait) dans le navigateur */
    var M = modele();
    var ctx = M.buildContext(donneesSaisies, { id: res.ref });
    page.apercuVisible();
    M.renderPreview(page.apercu, ctx);

    /* Garde-fou « pas de page 3 » : le gabarit doit tenir sur 2 pages. */
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
   * Rerafraîchit les listes déroulantes ouvertes après un changement des
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
  global.RRformSuccinct = {
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
