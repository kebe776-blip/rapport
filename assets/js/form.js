/* =========================================================================
   form.js — Rendu du formulaire officiel, collecte des données,
   brouillon hors-ligne et soumission (enregistrement + PDF automatique).
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR;
  var D = global.RR_CHAMPS;
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;

  var conteneur = null;   /* élément qui reçoit le HTML du formulaire */
  var donnees = {};       /* objet en cours de saisie (forme sample_data.json) */
  var minuteur = null;

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

  function idDe(path) {
    return "f_" + path.replace(/[^A-Za-z0-9]+/g, "_");
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

  function champHTML(sec, c) {
    var path = sec.groupe + "." + c.n;
    var id = idDe(path);
    var cls = "champ" + (c.large ? " large" : "");
    var oblig = c.req ? ' <span class="ob">*</span>' : "";
    var aide = c.aide ? '<span class="aide">' + esc(c.aide) + "</span>" : "";
    var ouverture = '<div class="' + cls + '" data-champ="' + esc(path) + '">' +
                    '<label for="' + id + '">' + esc(c.l) + oblig + "</label>";
    var valeur = "";
    var attr = ' id="' + id + '" data-path="' + esc(path) + '"';

    if (c.t === "select") {
      return ouverture +
        '<select' + attr + ' data-type="text">' +
          optionsHTML(c.opts, valeur) +
        "</select>" + aide + "</div>";
    }
    if (c.t === "area") {
      return ouverture +
        '<textarea' + attr + ' rows="3"' +
        (c.maj === "upper" ? ' data-maj="upper"' : "") + "></textarea>" +
        aide + "</div>";
    }
    if (c.t === "combo") {
      /* Liste déroulante filtrable : champ de saisie + suggestions.
         La valeur finale doit appartenir à c.liste (voir valider()). */
      var idListe = "liste_" + id;
      return ouverture +
        '<div class="combo">' +
          '<input type="text"' + attr + ' data-type="text"' +
            (c.maj === "upper" ? ' data-maj="upper"' : "") +
            ' autocomplete="off" spellcheck="false" role="combobox"' +
            ' aria-expanded="false" aria-autocomplete="list"' +
            ' aria-controls="' + idListe + '"' +
            ' placeholder="Tapez pour filtrer…">' +
          '<ul class="combo-liste" id="' + idListe + '" role="listbox" hidden></ul>' +
        "</div>" + aide + "</div>";
    }
    var type = c.t === "num" ? "number" : (c.t === "date" ? "text" : "text");
    attr += ' data-type="' + (c.t === "num" ? "num" : "text") + '"';
    if (c.t === "date") { attr += ' inputmode="numeric" placeholder="JJ/MM/AAAA"'; }
    if (c.tel) { attr += ' inputmode="tel"'; }
    if (c.maj === "upper") { attr += ' data-maj="upper"'; }
    if (c.t === "num") { attr += ' min="0"'; }
    return ouverture +
      '<input type="' + type + '"' + attr + ' value="">' + aide + "</div>";
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

  /* --- Tableau répétable (personnel, manuels…) --- */
  function ligneRepeat(cle, colonnes, i, cleTitre, def) {
    def = def || {};
    var valeurFixe = def.valeurs ? def.valeurs[i] : undefined;
    var html = '<tr><td class="num">' + (i + 1) + "</td>";
    for (var j = 0; j < colonnes.length; j++) {
      var c = colonnes[j];
      var n = (cleTitre && c.n === "titre") ? cleTitre : c.n;
      var path = cle + "[" + i + "]." + n;
      var style = c.w ? ' style="width:' + c.w + '"' : "";
      var attrs = ' data-path="' + esc(path) + '" data-n="' + n + '"' +
                  ' data-type="' + (c.t === "num" ? "num" : "text") + '"';
      if (c.maj === "upper") { attrs += ' data-maj="upper"'; }
      if (c.tel) { attrs += ' inputmode="tel"'; }
      if (c.t === "date") { attrs += ' placeholder="JJ/MM/AAAA"'; }
      if (c.t === "num") { attrs += ' min="0"'; }

      /* Titre imprimé par le modèle officiel (K, M) : non modifiable */
      var estValeurFixe = valeurFixe !== undefined && n === (cleTitre || "titre");
      if (estValeurFixe) { attrs += ' readonly class="fixe"'; }

      html += "<td" + style + ">";
      if (c.t === "select") {
        html += "<select" + attrs + ">" + optionsHTML(c.opts, "") + "</select>";
      } else {
        html += "<input" + attrs + ' value="' + esc(estValeurFixe ? valeurFixe : "") + '">';
      }
      html += "</td>";
    }
    if (!def.fixe) {
      html += '<td class="col-actions">' +
              '<button type="button" class="suppr js-suppr" title="Supprimer la ligne">×</button>' +
              "</td>";
    }
    html += "</tr>";
    return html;
  }

  function tableauRepeatHTML(def) {
    var cleTitre = def.cle_titre;
    var nb = def.valeurs ? def.valeurs.length
           : (def.fixe ? (def.min || 1)
                       : Math.max(def.min || 1, (donnees[def.cle] || []).length, 1));
    var aide = def.fixe
      ? "Nombre de lignes fixé selon le modèle officiel."
      : "complétez autant de lignes que nécessaire.";
    var html =
      '<details class="section-form" open>' +
        "<summary>" + def.lettre + ". " + esc(def.titre) +
        '<span class="badge" data-badge="' + esc(def.lettre) + '">0</span></summary>' +
        '<div class="corps">' +
          '<div class="petit mb">' + esc(def.soustitre || "") + " — " + aide + "</div>" +
          '<div class="table-defilement">' +
          '<table class="table-saisie" data-repeat="' + def.cle + '">' +
            "<thead><tr><th style=\"width:44px;\">N°</th>";
    for (var j = 0; j < def.colonnes.length; j++) {
      html += "<th" + (def.colonnes[j].w ? ' style="width:' + def.colonnes[j].w + '"' : "") +
              ">" + esc(def.colonnes[j].l) + "</th>";
    }
    if (!def.fixe) { html += '<th style="width:40px;"></th>'; }
    html += "</tr></thead><tbody>";
    for (var i = 0; i < nb; i++) {
      html += ligneRepeat(def.cle, def.colonnes, i, cleTitre, def);
    }
    html += "</tbody></table></div>";
    if (!def.fixe) {
      html += '<div class="mt"><button type="button" class="btn gris petit js-ajout" ' +
              'data-repeat="' + def.cle + '">＋ Ajouter une ligne</button></div>';
    }
    html += "</div></details>";
    return html;
  }

  /* --- Récapitulation H --- */
  /* --- Récapitulation H (FRANÇAIS / ARABE) --- */
  var RECAP_CATS = [
    { cls: "inst", titre: "INSTITUTEURS" },
    { cls: "adj", titre: "INSTITUTEURS ADJOINTS" },
    { cls: "mc", titre: "MAÎTRES CONTRACTUELS" }
  ];

  function recapHTML() {
    var html = '<details class="section-form" open>' +
      '<summary>H. RÉCAPITULATION DU PERSONNEL (FRANÇAIS / ARABE)' +
      '<span class="badge" data-badge="H">0</span></summary><div class="corps">' +
      '<div class="petit mb">Totaux H / F / T — le Total se calcule automatiquement ' +
      '(H + F).</div>';
    D.RECAP.groupes.forEach(function (g) {
      html += "<h3>" + esc(g.titre) + "</h3>" +
        '<div class="table-defilement"><table class="table-saisie">' +
        '<thead><tr>';
      /* Rangée 1 : catégories (couleur pleine) */
      RECAP_CATS.forEach(function (c) {
        html += '<th colspan="3" class="grp ' + c.cls + '">' + c.titre + "</th>";
      });
      html += "</tr><tr>";
      /* Rangée 2 : H / F / T (teinte claire de la même couleur) */
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

  /* --- Effectifs I --- */
  function effectifsHTML() {
    var cols = D.EFFECTIFS.colonnes;
    var html = '<details class="section-form" open>' +
      '<summary>I. SITUATION DES EFFECTIFS' +
      '<span class="badge" data-badge="I">0</span></summary><div class="corps">' +
      '<div class="petit mb">Les totaux (T) se calculent automatiquement : G + F.</div>' +
      '<div class="table-defilement"><table class="table-saisie">' +
      '<thead>' +
      '<tr>' +
        '<th rowspan="2" style="width:70px;">COURS</th>' +
        '<th rowspan="2">Nbr<br>classe</th>' +
        '<th colspan="3" class="grp eff">EFFECTIF</th>' +
        '<th colspan="3" class="grp red">REDOUBLANTS</th>' +
        '<th colspan="3" class="grp hand">HANDICAPÉS</th>' +
        '<th colspan="3" class="grp etat">Nbre d\'élèves qui n\'ont<br>pas de pièces d\'état civil</th>' +
      '</tr>' +
      '<tr>' +
        '<th class="eff">G</th><th class="eff">F</th><th class="eff">T</th>' +
        '<th class="red">G</th><th class="red">F</th><th class="red">T</th>' +
        '<th class="hand">G</th><th class="hand">F</th><th class="hand">T</th>' +
        '<th class="etat">G</th><th class="etat">F</th><th class="etat">T</th>' +
      '</tr>' +
      '</thead><tbody>';
    D.EFFECTIFS.groupes.forEach(function (g) {
      html += '<tr data-groupe="' + g[0] + '"><td class="num">' + esc(g[1]) + "</td>";
      cols.forEach(function (c) {
        var path = "effectifs." + g[0] + "." + c.n;
        html += "<td>";
        if (c.t === "select") {
          html += '<select data-path="' + path + '" data-n="' + c.n +
                  '" data-type="text">' + optionsHTML(c.opts, "") + "</select>";
        } else {
          html += '<input type="number" min="0" data-path="' + path +
                  '" data-n="' + c.n + '" data-type="num"' +
                  (c.calc ? ' data-calc="' + c.calc + '"' : "") +
                  (c.auto ? ' data-auto="1"' : "") + ' value="0">';
        }
        html += "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table></div></div></details>";
    return html;
  }

  /* --- Mobilier J --- */
  function mobilierHTML() {
    var cols = D.MOBILIER.colonnes;
    var html = '<details class="section-form" open>' +
      '<summary>J. MOBILIER SCOLAIRE' +
      '<span class="badge" data-badge="J">0</span></summary><div class="corps">' +
      '<div class="petit mb">Total = Bon + À réparer (calcul automatique, modifiable).</div>' +
      '<div class="table-defilement"><table class="table-saisie">' +
      '<thead><tr><th style="width:34%;">Désignation</th>';
    cols.forEach(function (c) { html += "<th>" + esc(c.l) + "</th>"; });
    html += '<th style="width:40px;"></th></tr></thead><tbody>';
    D.MOBILIER.lignes.forEach(function (l) {
      html += '<tr data-ligne="' + l[0] + '"><td><b>' + esc(l[1]) + "</b></td>";
      cols.forEach(function (c) {
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
     CONSTRUCTION GLOBALE
     ----------------------------------------------------------------------- */
  function construire(el) {
    conteneur = el;
    var html = "";

    /* Navigation rapide A → N */
    html += '<div class="carte"><div style="display:flex; gap:6px; flex-wrap:wrap;">';
    D.SECTIONS.forEach(function (s) {
      html += '<a class="btn gris petit" href="#sec_' + s.lettre + '" ' +
              'data-aller="' + s.lettre + '">' + s.lettre + "</a>";
    });
    ["H", "I", "J", "K", "L", "M", "N"].forEach(function (l) {
      html += '<a class="btn gris petit" href="#sec_' + l + '" data-aller="' + l + '">' +
              l + "</a>";
    });
    html += "</div></div>";

    D.SECTIONS.forEach(function (s) {
      html += '<div id="sec_' + s.lettre + '">' + sectionHTML(s) + "</div>";
    });

    html += '<div id="sec_H">' + tableauRepeatHTML({
      lettre: "H", cle: "enseignant", titre: "H. SITUATION DU PERSONNEL ENSEIGNANT",
      colonnes: D.PERSONNEL[0].colonnes, min: D.PERSONNEL[0].min, fixe: true,
      soustitre: "20 lignes — inscrire le Directeur en première ligne"
    }) + "</div>";

    D.PERSONNEL.slice(1).forEach(function (p) {
      html += '<div id="sec_' + p.cle + '">' + tableauRepeatHTML({
        lettre: "", cle: p.cle, titre: p.titre, colonnes: p.colonnes,
        min: p.min, fixe: true,
        soustitre: p.min + " lignes — laisser vide s'il n'y en a pas"
      }) + "</div>";
    });

    html += '<div id="sec_recap">' + recapHTML() + "</div>";
    html += '<div id="sec_I">' + effectifsHTML() + "</div>";
    html += '<div id="sec_J">' + mobilierHTML() + "</div>";

    D.LISTES.forEach(function (L) {
      html += '<div id="sec_' + L.lettre + '">' + tableauRepeatHTML({
        lettre: L.lettre, cle: L.cle, titre: L.lettre + ". " + L.titre,
        colonnes: D.COLONNES_LISTE, min: L.min,
        cle_titre: L.cle_titre, soustitre: L.soustitre,
        fixe: !!L.fixe, valeurs: L.valeurs
      }) + "</div>";
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
    /* --- Listes déroulantes filtrables (combo) --- */
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

  /** Forme normalisée pour comparer : ni accents, ni casse, ni doubles espaces. */
  function normaliser(s) {
    return String(s === null || s === undefined ? "" : s)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, " ")
      .trim()
      .toUpperCase();
  }

  /** Définition du champ (champs.js) à partir de son data-path. */
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

  /** Ouvre la liste. `tout` = afficher la liste complète (ignorer le filtre). */
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
    /* On rejoue la logique existante (stockage, badges, brouillon).
       La liste est déjà fermée : onInput ne la rouvre pas. */
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
    if (el.getAttribute("data-n") === "bon" || el.getAttribute("data-n") === "a_reparer") {
      calcTotalMobilier(el);
    }
    var nomChamp = el.getAttribute("data-n");
    if (nomChamp && /_[hf]$/.test(nomChamp)) {
      calcRecap(el, nomChamp.replace(/_[hf]$/, ""));
    }
    var totalde = el.getAttribute("data-totalde");
    if (totalde !== null) {
      /* l'utilisateur a saisi le total lui-même : on ne le recalcule plus */
      el.removeAttribute("data-auto");
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

  function calcTotalLigne(el, pre) {
    var tr = el.closest("tr");
    if (!tr) { return; }
    var g = tr.querySelector('[data-n="' + pre + '_g"]');
    var f = tr.querySelector('[data-n="' + pre + '_f"]');
    var t = tr.querySelector('[data-n="' + pre + '_t"]');
    if (!g || !f || !t) { return; }
    var somme = (parseFloat(g.value) || 0) + (parseFloat(f.value) || 0);
    t.value = somme;
    setPath(donnees, t.getAttribute("data-path"), somme);
  }

  function calcTotalMobilier(el) {
    var tr = el.closest("tr");
    if (!tr) { return; }
    var total = tr.querySelector('[data-n="total"]');
    if (!total || !total.hasAttribute("data-auto")) { return; }
    var bon = tr.querySelector('[data-n="bon"]');
    var rep = tr.querySelector('[data-n="a_reparer"]');
    var somme = (parseFloat(bon && bon.value) || 0) + (parseFloat(rep && rep.value) || 0);
    total.value = somme;
    setPath(donnees, total.getAttribute("data-path"), somme);
  }

  /** Récapitulation H : Total = H + F. */
  function calcRecap(el, base) {
    var tr = el.closest("tr");
    if (!tr) { return; }
    var h = tr.querySelector('[data-n="' + base + '_h"]');
    var f = tr.querySelector('[data-n="' + base + '_f"]');
    var t = tr.querySelector('[data-n="' + base + '_t"]');
    if (!h || !f || !t) { return; }
    var somme = (parseFloat(h.value) || 0) + (parseFloat(f.value) || 0);
    t.value = somme;
    setPath(donnees, t.getAttribute("data-path"), somme);
  }

  function onClick(ev) {
    var t = ev.target;

    /* --- Choix d'une valeur dans une liste déroulante filtrable --- */
    if (t.classList && t.classList.contains("combo-option")) {
      var wrap = t.closest(".combo");
      var champSaisie = wrap && wrap.querySelector("input");
      if (champSaisie) {
        choisirCombo(champSaisie, t.getAttribute("data-val"));
      }
      return;
    }

    if (t.classList.contains("js-ajout")) {
      var cle = t.getAttribute("data-repeat");
      var def = trouverDef(cle);
      var table = conteneur.querySelector('table[data-repeat="' + cle + '"]');
      var i = table.tBodies[0].rows.length;
      table.tBodies[0].insertAdjacentHTML("beforeend",
        ligneRepeat(cle, def.colonnes, i, def.cle_titre, def));
      renumerote(table);
      var dernier = table.tBodies[0].rows[i].querySelector("input, select");
      if (dernier) { dernier.focus(); }
      sauverBrouillon();
      return;
    }

    if (t.classList.contains("js-suppr")) {
      var table2 = t.closest("table");
      var tbody = table2.tBodies[0];
      if (tbody.rows.length <= 1) { return; }
      t.closest("tr").remove();
      renumerote(table2);
      /* purger les données de la ligne supprimée */
      reconstituerDonneesRepeat(table2.getAttribute("data-repeat"));
      sauverBrouillon();
      return;
    }

    if (t.classList.contains("js-zero")) {
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
      if (res) { res.style.background = "#ffe8a3"; setTimeout(function () {
        res.style.background = ""; }, 1200); }
    }
  }

  function trouverDef(cle) {
    var liste = D.PERSONNEL.concat(D.LISTES);
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].cle === cle) {
        if (!liste[i].colonnes) { liste[i].colonnes = D.COLONNES_LISTE; }
        return liste[i];
      }
    }
    return { colonnes: D.COLONNES_LISTE };
  }

  function renumerote(table) {
    var rows = table.tBodies[0].rows;
    var cle = table.getAttribute("data-repeat");
    Array.prototype.forEach.call(rows, function (tr, i) {
      var num = tr.querySelector(".num");
      if (num) { num.textContent = i + 1; }
      Array.prototype.forEach.call(tr.querySelectorAll("[data-n]"), function (el) {
        var n = el.getAttribute("data-n");
        var path = cle + "[" + i + "]." + n;
        el.setAttribute("data-path", path);
        el.id = idDe(path);
      });
      var btn = tr.querySelector(".js-suppr");
      if (btn) { btn.style.visibility = rows.length <= 1 ? "hidden" : "visible"; }
    });
  }

  function reconstituerDonneesRepeat(cle) {
    var table = conteneur.querySelector('table[data-repeat="' + cle + '"]');
    if (!table) { return; }
    var lignes = [];
    Array.prototype.forEach.call(table.tBodies[0].rows, function (tr) {
      var obj = {};
      Array.prototype.forEach.call(tr.querySelectorAll("[data-n]"), function (el) {
        var v = el.value;
        if (el.getAttribute("data-type") === "num") {
          v = v === "" ? 0 : (isNaN(parseFloat(v)) ? 0 : parseFloat(v));
        }
        obj[el.getAttribute("data-n")] = v;
      });
      lignes.push(obj);
    });
    donnees[cle] = lignes;
  }

  /* -----------------------------------------------------------------------
     REMPLISSAGE À PARTIR D'UN OBJET
     ----------------------------------------------------------------------- */
  function remplir(obj) {
    donnees = obj || {};
    /* champs simples */
    Array.prototype.forEach.call(conteneur.querySelectorAll("[data-path]"), function (el) {
      if (el.hasAttribute("data-n")) { return; }   /* géré par les tableaux */
      var path = el.getAttribute("data-path");
      var v = getPath(donnees, path);
      if (v === undefined || v === null) { v = ""; }
      el.value = v;
    });
    /* tableaux répétables */
    ["enseignant", "suppleant", "malade", "manuels", "autre_manuel",
     "materiel", "autre_materiel"].forEach(function (cle) {
      var table = conteneur.querySelector('table[data-repeat="' + cle + '"]');
      if (!table) { return; }
      var def = trouverDef(cle);
      var lignes = donnees[cle];
      var tbody = table.tBodies[0];
      tbody.innerHTML = "";
      var nb = def.valeurs ? def.valeurs.length
             : (def.fixe ? (def.min || 1)
                         : Math.max(lignes && lignes.length ? lignes.length : 0, 1));
      for (var i = 0; i < nb; i++) {
        tbody.insertAdjacentHTML("beforeend",
          ligneRepeat(cle, def.colonnes, i, def.cle_titre, def));
      }
      renumerote(table);
      if (lignes) {
        Array.prototype.forEach.call(tbody.rows, function (tr, i) {
          Array.prototype.forEach.call(tr.querySelectorAll("[data-n]"), function (el) {
            if (el.readOnly) { return; }   /* titre officiel non modifiable */
            var v = lignes[i] && lignes[i][el.getAttribute("data-n")];
            if (v !== undefined && v !== null) { el.value = v; }
          });
        });
      }
    });
    /* effectifs / mobilier / récap */
    Array.prototype.forEach.call(
      conteneur.querySelectorAll('table [data-path][data-n]'), function (el) {
        var v = getPath(donnees, el.getAttribute("data-path"));
        if (v === undefined || v === null) { v = el.type === "number" ? 0 : ""; }
        el.value = v;
      });

    mettreAJourBadges();
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
    /* Les lignes entièrement vides des tableaux fixes sont écartées :
       le PDF renumérote lui-même les lignes de saisie restantes. */
    ["enseignant", "suppleant", "malade", "manuels", "autre_manuel",
     "materiel", "autre_materiel"].forEach(function (cle) {
      if (!Array.isArray(out[cle])) { return; }
      out[cle] = out[cle].filter(function (row) {
        return Object.keys(row).some(function (k) {
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
     BROUILLON HORS-LIGNE
     ----------------------------------------------------------------------- */
  function sauverBrouillon() {
    clearTimeout(minuteur);
    minuteur = setTimeout(function () {
      try {
        localStorage.setItem(CFG.LS_BROUILLON, JSON.stringify(donnees));
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
      var s = localStorage.getItem(CFG.LS_BROUILLON);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  /* -----------------------------------------------------------------------
     VALIDATION
     ----------------------------------------------------------------------- */
  function valider() {
    var erreurs = [];
    Array.prototype.forEach.call(conteneur.querySelectorAll(".champ"), function (c) {
      c.classList.remove("invalid");
    });

    var obligatoires = [
      ["identification.nom_ecole", "le nom de l'école"],
      ["directeur.prenom_nom", "le nom du directeur"],
      ["directeur.telephone1", "le numéro de contact du directeur"]
    ];
    obligatoires.forEach(function (o) {
      var el = conteneur.querySelector('[data-path="' + o[0] + '"]');
      var v = el ? String(el.value || "").trim() : "";
      if (!v) {
        erreurs.push("Merci de renseigner " + o[1] + ".");
        var champ = el && el.closest(".champ");
        if (champ) { champ.classList.add("invalid"); }
      }
    });

    /* --- Champs à liste fermée (école, CODEC) ---
       La valeur saisie doit appartenir à la liste : sinon on bloque la
       soumission (aucun envoi réseau, aucun PDF) et on rouvre la liste
       complète pour guider le choix. Un champ facultatif vide est accepté. */
    D.SECTIONS.forEach(function (s) {
      s.champs.forEach(function (c) {
        if (c.t !== "combo" || !c.liste || !c.liste.length) { return; }
        var el = conteneur.querySelector(
          '[data-path="' + s.groupe + "." + c.n + '"]');
        if (!el) { return; }
        var v = String(el.value || "").trim();
        if (!v) { return; }          /* vide : géré par les obligatoires */
        var connu = c.liste.some(function (x) {
          return normaliser(x) === normaliser(v);
        });
        if (connu) { return; }
        erreurs.push("« " + v + " » ne figure pas dans la liste des " +
          (c.n === "codec" ? "CODEC" : "écoles") +
          " : choisissez une valeur dans la liste déroulante.");
        var champ = el.closest(".champ");
        if (champ) { champ.classList.add("invalid"); }
        afficherCombo(el, true);
      });
    });

    /* au moins un enseignant nommé */
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
     SOUMISSION : enregistrement + PDF automatique
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
    try {
      localStorage.setItem(CFG.LS_BROUILLON, JSON.stringify(donneesSaisies));
    } catch (e) {}

    /* 1 bis. ANTI-DOUBLON : une école ne dépose qu'un seul rapport.
       On interroge le serveur (fonction SQL rapport_existe). Si un rapport
       existe déjà pour ce code école, on demande confirmation :
         • OK      → on remplace le rapport déjà enregistré (mise à jour)
         • Annuler → on abandonne totalement : rien n'est envoyé et
                     aucun PDF n'est généré. Aucun contournement possible.
       Hors-ligne (existe() renvoie null) : on passe directement à l'envoi,
       la file d'attente se synchronisera plus tard. */
    if (global.RRdb && global.RRdb.actif()) {
      page.progres("Vérification de l'existence d'un rapport…", 5);
      var deja = null;
      try {
        deja = await global.RRdb.existe(donneesSaisies);
      } catch (e) {
        deja = null;
      }
      if (deja === true) {
        var codeEcole = global.RRdb.codeEcole(donneesSaisies);
        var remplacer = confirm(
          "⚠ RAPPORT DÉJÀ SOUMIS\n\n" +
          "Un rapport de rentrée a déjà été déposé pour l'école\n" +
          "« " + codeEcole + " ».\n\n" +
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

    /* 3. PDF officiel généré dans le navigateur — toujours, même hors-ligne */
    var ctx = R.buildContext(donneesSaisies, { id: res.ref });
    page.apercuVisible();
    var pages = R.renderPreview(page.apercu, ctx);

    var nom = await R.pdf.download(pages, ctx, function (i, n) {
      page.progres("Génération du PDF officiel — page " + i + " / " + n + "…",
                   10 + Math.round(i / n * 90));
    });

    page.succes(res, nom, ctx);
    return true;
  }

  /* -----------------------------------------------------------------------
     API PUBLIQUE
     ----------------------------------------------------------------------- */
  global.RRform = {
    construire: construire,
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
