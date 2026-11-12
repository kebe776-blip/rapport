/* =========================================================================
   rapport-succinct.js — Générateur HTML du « RAPPORT DE SUCCINCT DE
   RENTRÉE » PRÉSCOLAIRE : EXACTEMENT 2 PAGES
     • page 1 → A4 PAYSAGE  (en-tête, identification, effectifs, personnel)
     • page 2 → A4 PORTRAIT (observations générales sur la situation)
   Se register dans le registre RR_MODELES[type] : les appelants
   (admin.html, succinct-prescolaire.html) dispatchent vers ce modèle,
   rapport.js / lib.js restent intacts (défaut = élémentaire).
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR = global.RR || {};
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;                    /* fourni par rapport.js (chargé avant) */

  var TYPE = "succinct-prescolaire";
  var TITRES = ["Identification + effectifs + personnel",
                "Observations générales sur la situation de l'école"];

  /* -----------------------------------------------------------------------
     AIDE-MEMOIRE
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

  /** Texte → valeur affichée (vide = « — », comme convenu). */
  function u(v) {
    var s = String(v === null || v === undefined ? "" : v).trim();
    return esc(s || "—");
  }

  /** Nombre → valeur affichée (vide = « — »). */
  function nb(v) {
    if (v === "" || v === null || v === undefined) { return "—"; }
    return esc(v);
  }

  /** Croix de validation : [X] ou [ ] (titre du modèle : « mettre une croix »). */
  function croix(b) {
    return '<span class="rs-croix">' + (b ? "[X]" : "[ ]") + "</span>";
  }

  /** OUI / NON avec croix du modèle. */
  function ouiNon(v) {
    return "OUI " + croix(v === "oui") + " &ndash; NON " + croix(v === "non");
  }

  /* -----------------------------------------------------------------------
     EN-TÊTE OFFICIEL (même style que rapport.js : drapeau + logo + CFG)
     ----------------------------------------------------------------------- */
  function drapeauCSS() {
    return '<table class="drapeau"><tr>' +
      '<td class="d1"></td><td class="d2">*</td><td class="d3"></td>' +
      '</tr></table>';
  }

  function entete(ctx) {
    var logo = CFG.LOGO
      ? '<img class="logo-img" src="' + esc(CFG.LOGO) + '" alt="Logo"' +
        ' onerror="window.RRlogoManquant(this)">'
      : '<div class="logo-box">LOGO<br>MEN</div>';
    var drapeau = CFG.DRAPEAU
      ? '<img class="drapeau-img" src="' + esc(CFG.DRAPEAU) + '"' +
        ' alt="Drapeau du Sénégal" onerror="window.RRdrapeauKo(this)">'
      : drapeauCSS();
    return '' +
'<table class="entete"><tr>' +
  '<td style="width:70px;">' + drapeau + '</td>' +
  '<td class="titre-officiel">' +
    '<div class="rep">RÉPUBLIQUE DU SÉNÉGAL</div>' +
    '<div class="devis">Un Peuple - Un But - Une Foi</div>' +
    '<div class="niv">' + esc(ctx.insp.ministere) + '</div>' +
    '<div class="niv">' + esc(ctx.insp.inspection) + '</div>' +
    '<div class="niv">' + esc(ctx.insp.ief) + '</div>' +
  '</td>' +
  '<td style="width:80px; text-align:right;">' + logo + '</td>' +
'</tr></table>' +
'<div class="rs-haut">' +
  '<span class="rs-petite">Petite Enfance</span>' +
  '<span class="rs-annee">ANNÉE SCOLAIRE ' + esc(ctx.meta.annee) + '</span>' +
'</div>' +
'<div class="titre-rapport">RAPPORT DE SUCCINCT DE RENTRÉE</div>';
  }

  /* -----------------------------------------------------------------------
     TABLEAUX PAGE 1 (effectifs + personnel — mêmes colonnes maître)
     ----------------------------------------------------------------------- */
  function tableauMaitre(ctx, def) {
    var d = ctx.d;
    var html =
      '<table class="grid rs-maitre">' +
        "<thead><tr>" +
          '<th rowspan="2" style="width:14%;">' + esc(def.colonne_titre || "&nbsp;") + "</th>" +
          '<th colspan="3" class="cat">EFFECTIFS</th>' +
          '<th rowspan="2" style="width:27%;">Prénoms, Nom, Matricule et Grade du maître</th>' +
          '<th rowspan="2" style="width:13%;">Diplôme<br>Académique</th>' +
          '<th rowspan="2" style="width:13%;">Diplôme<br>Professionnel</th>' +
          '<th rowspan="2" style="width:13%;">Date d\'arrivée<br>à l\'école</th>' +
        "</tr><tr>" +
          '<th>G</th><th>F</th><th>T</th>' +
        "</tr></thead><tbody>";
    def.lignes.forEach(function (l) {
      var o = champ(d, def.groupe + "." + l[0]) || {};
      html += "<tr>" +
        '<td class="c"><b>' + esc(l[1]) + "</b></td>" +
        '<td class="n">' + nb(o.g) + "</td>" +
        '<td class="n">' + nb(o.f) + "</td>" +
        '<td class="n">' + nb(o.t) + "</td>" +
        "<td>" + u(o.m_prenoms) + "</td>" +
        "<td>" + u(o.m_diplome_acad) + "</td>" +
        "<td>" + u(o.m_diplome_prof) + "</td>" +
        "<td>" + u(o.m_date_arrivee) + "</td>" +
      "</tr>";
    });
    return html + "</tbody></table>";
  }

  /* -----------------------------------------------------------------------
     PAGE 1 — PAYSAGE (275 x 194 mm)
     ----------------------------------------------------------------------- */
  function page1(ctx) {
    var d = ctx.d;

    var html = entete(ctx);

    /* --- Identification (ligne du modèle) --- */
    html +=
'<div class="rs-ligne">' +
  '<span class="lbl">EM &ndash; CTP &ndash; CPE &ndash; CPCE :</span> ' +
  '<span class="souligne">' + u(champ(d, "identification.nom_ecole")) + "</span>" +
  ' : <span class="lbl">Commune :</span> ' +
  '<span class="souligne">' + u(champ(d, "identification.commune")) + "</span>" +
  ' : <span class="lbl">Arrondissement :</span> ' +
  '<span class="souligne">' + u(champ(d, "identification.arrondissement")) + "</span>" +
"</div>";

    /* --- Sections et bâtiments --- */
    html +=
'<div class="rs-ligne">' +
  '<span class="lbl">Nbre de sections :</span> ' +
  '<span class="souligne">' + nb(champ(d, "locaux.nb_sections")) + "</span>" +
  ' : <span class="lbl">Nbre de bâtiments de 1 cl :</span> ' +
  '<span class="souligne">' + nb(champ(d, "locaux.nb_bat_1cl")) + "</span>" +
  ' : <span class="lbl">de 2 cl :</span> ' +
  '<span class="souligne">' + nb(champ(d, "locaux.nb_bat_2cl")) + "</span>" +
  ' : <span class="lbl">de 3 cl :</span> ' +
  '<span class="souligne">' + nb(champ(d, "locaux.nb_bat_3cl")) + "</span>" +
  ' : <span class="lbl">Nbre d\'abris provisoires :</span> ' +
  '<span class="souligne">' + nb(champ(d, "locaux.nb_abris")) + "</span>" +
"</div>" +
'<div class="rs-ligne">' +
  '<span class="lbl">Nbre de CMG :</span> ' +
  '<span class="souligne">' + nb(champ(d, "locaux.nb_cmg")) + "</span>" +
  ' : <span class="lbl">Cours jumelés :</span> ' +
  '<span class="souligne">' + u(champ(d, "locaux.cours_jumeles")) + "</span>" +
"</div>";

    /* --- Directeur --- */
    var statut = champ(d, "directeur.statut");
    html +=
'<div class="rs-ligne">' +
  '<span class="lbl">Prénoms, Nom, Matricule et Grade du Directeur :</span> ' +
  '<span class="souligne">' + u(champ(d, "directeur.prenom_nom")) + "</span>" +
  ' : Titulaire ' + croix(statut === "titulaire") +
  ' &nbsp; Intérimaire ' + croix(statut === "interimaire") +
  ' <span class="rs-petit">(mettre une croix devant)</span>' +
"</div>" +
'<div class="rs-ligne">' +
  '<span class="lbl">Diplôme académique :</span> ' +
  '<span class="souligne">' + u(champ(d, "directeur.diplome_academique")) + "</span>" +
  ' : <span class="lbl">Diplôme professionnel :</span> ' +
  '<span class="souligne">' + u(champ(d, "directeur.diplome_professionnel")) + "</span>" +
  ' : <span class="lbl">Contact :</span> Orange ' +
  '<span class="souligne">' + u(champ(d, "directeur.contact_orange")) + "</span>" +
  ' / Tigo <span class="souligne">' + u(champ(d, "directeur.contact_tigo")) + "</span>" +
  ' / Expresso <span class="souligne">' + u(champ(d, "directeur.contact_expresso")) + "</span>" +
"</div>";

    /* --- Effectifs PS / MS / GS / TOTAL --- */
    html += tableauMaitre(ctx, {
      groupe: "effectifs", colonne_titre: "COURS",
      lignes: [["ps", "Petite Section"], ["ms", "Moyenne Section"],
               ["gs", "Grande Section"], ["total", "TOTAL"]]
    });

    /* --- Handicapés physiques --- */
    html +=
'<div class="rs-ligne">' +
  '<span class="lbl">Donner les noms des handicapés physiques :</span> ' +
  '<span class="souligne">' + u(champ(d, "effectifs.handicapes")) + "</span>" +
"</div>";

    /* --- Personnel : 4 lignes fixes --- */
    html += tableauMaitre(ctx, {
      groupe: "personnel", colonne_titre: "",
      lignes: [["suppleant", "Suppléants"], ["arabe", "Maître d\'arabe"],
               ["malade", "Malade indéfinible"], ["service", "Personnel de service"]]
    });

    return html;
  }

  /* -----------------------------------------------------------------------
     TABLEAUX PAGE 2
     ----------------------------------------------------------------------- */
  /* Équipements scolaires : Nombre / Bailleur / Boxes / Observations */
  function tableauEquipements(eq) {
    var lignes = [["vestiaires", "Vestiaires"], ["magasins", "Magasins"],
                  ["regimes", "Régimes"], ["toilettes", "Toilettes"],
                  ["cuisines", "Cuisines"], ["locaux", "Locaux"],
                  ["autres", "Autres"]];
    var html =
      '<table class="grid rs-eq">' +
        '<thead><tr>' +
          '<th style="width:24%;">Equipements scolaires</th>' +
          '<th style="width:13%;">Nombre</th>' +
          '<th style="width:23%;">Bailleur</th>' +
          '<th>Observations</th>' +
        "</tr></thead><tbody>";
    lignes.forEach(function (l) {
      var o = eq[l[0]] || {};
      var obs = String(o.observations || "").trim();
      if (l[0] === "toilettes" &&
          o.boxes !== "" && o.boxes !== null && o.boxes !== undefined) {
        obs = "Nbre de boxes : " + o.boxes + (obs ? " — " + obs : "");
      }
      html += "<tr>" +
        "<td>" + esc(l[1]) + "</td>" +
        '<td class="n">' + nb(o.nombre) + "</td>" +
        "<td>" + u(o.bailleur) + "</td>" +
        "<td>" + (obs ? esc(obs) : "—") + "</td>" +
      "</tr>";
    });
    return html + "</tbody></table>";
  }

  /* Équipement informatique : Nombre / Bailleur */
  function tableauInformatique(inf) {
    var lignes = [["ordinateur", "Ordinateur"], ["imprimante", "Imprimante"],
                  ["magneto", "Magnétophone"], ["autres", "Autres"]];
    var html =
      '<table class="grid rs-eq">' +
        '<thead><tr>' +
          '<th style="width:44%;">Equipement</th>' +
          '<th style="width:18%;">Nombre</th>' +
          '<th>Bailleur</th>' +
        "</tr></thead><tbody>";
    lignes.forEach(function (l) {
      var o = inf[l[0]] || {};
      html += "<tr>" +
        "<td>" + esc(l[1]) + "</td>" +
        '<td class="n">' + nb(o.nombre) + "</td>" +
        "<td>" + u(o.bailleur) + "</td>" +
      "</tr>";
    });
    return html + "</tbody></table>";
  }

  /* Mobilier / jeux : Bon / À réparer / Total / Déficit */
  function tableauEtat(def, data) {
    var html =
      '<table class="grid rs-etat">' +
        '<thead><tr>' +
          '<th style="width:40%;">' + esc(def.colonne) + "</th>" +
          "<th>Bon</th><th>À réparer</th><th>Total</th><th>Déficit</th>" +
        "</tr></thead><tbody>";
    def.lignes.forEach(function (l) {
      var o = data[l[0]] || {};
      html += "<tr>" +
        "<td>" + esc(l[1]) + "</td>" +
        '<td class="n">' + nb(o.bon) + "</td>" +
        '<td class="n">' + nb(o.a_reparer) + "</td>" +
        '<td class="n">' + nb(o.total) + "</td>" +
        '<td class="n">' + nb(o.deficit) + "</td>" +
      "</tr>";
    });
    return html + "</tbody></table>";
  }

  /* -----------------------------------------------------------------------
     PAGE 2 — PORTRAIT (188 x 281 mm) : observations générales
     ----------------------------------------------------------------------- */
  function page2(ctx) {
    var d = ctx.d;
    var sl = champ(d, "situation_locaux") || {};
    var eq = champ(d, "equipements") || {};
    var ea = champ(d, "eau") || {};
    var el = champ(d, "electricite") || {};
    var inf = champ(d, "informatique") || {};
    var st = champ(d, "structure") || {};

    var html = '<div class="rs-p2">';

    html +=
'<h2 class="rs-titre-page">OBSERVATIONS GÉNÉRALES SUR LA SITUATION DE L\'ÉCOLE</h2>';

    /* ---- 1. Situation des locaux ---- */
    html +=
'<h3 class="rs-h3">1. Situation des locaux</h3>' +
'<div class="rs-note">Préciser le nombre de classes (renseigner avec des ' +
  'nombres précis, ne pas mettre de croix)</div>' +
'<table class="grid rs-2col">' +
  '<tr>' +
    '<th style="width:50%;">Salles d\'activités en dur</th>' +
    '<th>Salles d\'activités en abris provisoires</th>' +
  "</tr>" +
  '<tr><td class="n">' + nb(sl.salles_dur) + "</td>" +
      '<td class="n">' + nb(sl.salles_abris) + "</td></tr>" +
"</table>" +
'<div class="rs-h3 rs-mt">Bâtiments en réhabilitation :</div>' +
'<table class="grid rs-box"><tr>' +
  '<td style="width:80%;">Nombre de salles de classes à réhabiliter. ' +
    '(Ne pas mettre les abris provisoires)</td>' +
  '<td class="n">' + nb(sl.a_rehabiliter) + "</td>" +
"</tr></table>" +
'<div class="rs-ligne">' +
  '<span class="lbl">Nbre de salles inoccupées :</span> ' +
  '<span class="souligne">' + nb(sl.salles_inoccupees) + "</span>" +
  ' : <span class="lbl">Motif :</span> ' +
  '<span class="souligne">' + u(sl.motif_inoccupees) + "</span>" +
"</div>" +
'<div class="rs-bloc"><span class="lbl">Observations sur l\'état des ' +
  'locaux :</span> ' + u(sl.obs_etat) + "</div>";

    /* ---- 2. Eau ---- */
    html +=
'<div class="rs-ligne"><b>2. Eau</b> : ' +
  '<span class="lbl">Robinets :</span> <span class="lbl">Nombre</span> ' +
  '<span class="souligne">' + nb(ea.robinets_nombre) + "</span>" +
  ' <span class="lbl">Etat</span> ' +
  '<span class="souligne">' + u(ea.robinets_etat) + "</span>" +
"</div>" +
'<div class="rs-ligne rs-decale">' +
  '<span class="lbl">Puits :</span> <span class="lbl">Nombre</span> ' +
  '<span class="souligne">' + nb(ea.puits_nombre) + "</span>" +
  ' <span class="lbl">Etat</span> ' +
  '<span class="souligne">' + u(ea.puits_etat) + "</span>" +
"</div>";

    /* ---- 3. Electricité ---- */
    html +=
'<div class="rs-ligne"><b>3. Electricité</b> : ' +
  '<span class="lbl">Réseau :</span> ' + ouiNon(el.reseau) +
  ' <span class="lbl">Si OUI Etat des installations</span> ' +
  '<span class="souligne">' + u(el.reseau_etat) + "</span>" +
"</div>" +
'<div class="rs-ligne rs-decale">' +
  '<span class="lbl">Plaques solaires :</span> ' + ouiNon(el.plaques) +
  ' <span class="lbl">Si OUI Etat des installations</span> ' +
  '<span class="souligne">' + u(el.plaques_etat) + "</span>" +
"</div>";

    /* ---- 4. Equipement informatique ---- */
    html += '<h3 class="rs-h3">4. Equipement informatique et audio visuel</h3>' +
            tableauInformatique(inf);

    /* ---- 5. Mobilier scolaire ---- */
    html += '<h3 class="rs-h3">5. Mobilier scolaire</h3>' +
      tableauEtat({ colonne: "Mobilier", lignes: [
        ["tables_enfants", "Tables enfants"],
        ["chaises_adultes", "Chaises adultes"],
        ["tables_bureaux", "Tables bureaux"],
        ["tables_eleves", "Tables élèves"],
        ["tables_cadres", "Tables cadres"],
        ["tables_directeur", "Tables de directeur"],
        ["armoires", "Armoires"]
      ] }, champ(d, "mobilier") || {});

    /* ---- 6. Equipement (jeux) ---- */
    html += '<h3 class="rs-h3">6. Equipement</h3>' +
      tableauEtat({ colonne: "Mobilier", lignes: [
        ["ballon", "Ballon"], ["toboggan", "Toboggan"],
        ["trottinette", "Trottinette"], ["autres_jouets", "Autres jouets (à préciser)"]
      ] }, champ(d, "jeux") || {});

    /* ---- 7. Structure ---- */
    html +=
'<div class="rs-ligne">7. La structure dispose-t-elle de cantine ' +
  '<span class="souligne">' + u(st.cantine) + "</span>" +
  ' Coop. Scol <span class="souligne">' + u(st.coop_scol) + "</span>" +
  ' Jardin scolaire <span class="souligne">' + u(st.jardin_scolaire) + "</span>" +
  ' Projet d\'école <span class="souligne">' + u(st.projet_ecole) + "</span>" +
"</div>";

    /* ---- 8. Observations du directeur ---- */
    html +=
'<div class="rs-ligne"><b>8. Observations du directeur :</b></div>' +
'<div class="rs-bloc rs-bloc-grand">' +
  u(champ(d, "structure.observations_directeur")) + "</div>" +
'<div class="rs-ligne rs-centre">Fait à ' +
  '<span class="souligne">' + u(champ(d, "structure.fait_a")) + "</span>" +
  ' , le <span class="souligne">' + u(champ(d, "structure.fait_le")) + "</span>" +
"</div>" +
'<div class="rs-bas">' +
  '<span class="rs-note">Déposer 1 rapport à l\'IEF au plus tard le ' +
    '15 Novembre 2026</span>' +
  '<span class="rs-signature">Le Directeur</span>' +
"</div>";

    return html + "</div>";
  }

  /* -----------------------------------------------------------------------
     PAGES + APERÇU (wrappers .apercu-slot + .apercu-legende)
     ----------------------------------------------------------------------- */
  function pageContents(ctx) {
    return [page1(ctx), page2(ctx)];
  }

  /** HTML complet : 2 <div class="pdf-page"> (paysage puis portrait). */
  function buildPages(ctx) {
    var contenus = pageContents(ctx);
    return (
      '<div class="apercu-slot">' +
        '<div class="pdf-page" data-page="1">' +
          '<div class="page-inner">' + contenus[0] + "</div>" +
        "</div>" +
        '<div class="apercu-legende"></div>' +
      "</div>" +
      '<div class="apercu-slot">' +
        '<div class="pdf-page portrait" data-page="2" data-orientation="portrait">' +
          '<div class="page-inner">' + contenus[1] + "</div>" +
        "</div>" +
        '<div class="apercu-legende"></div>' +
      "</div>"
    );
  }

  /* -----------------------------------------------------------------------
     AUTO-AJUSTEMENT : garantit « pas de page 3 »
     1) compression de la taille de police par paliers de −0,25 pt
        (3 paliers maximum) ;
     2) dernier rempart : overflow:hidden de la page + transform: scale()
        sur le contenu (avec compensation de largeur).
     ----------------------------------------------------------------------- */
  function autoAjuster(pg) {
    var inner = pg.querySelector(".page-inner");
    if (!inner) { return; }
    inner.style.fontSize = "";
    inner.style.transform = "";
    inner.style.width = "";

    var base = parseFloat(global.getComputedStyle(inner).fontSize) || 12.67;
    var pas = 0.25 * 96 / 72;               /* 0,25 pt en pixels */
    var palier = 0;
    while (inner.scrollHeight > inner.clientHeight + 1 && palier < 3) {
      palier++;
      inner.style.fontSize = (base - palier * pas) + "px";
    }

    if (inner.scrollHeight > inner.clientHeight + 1) {
      /* Dernier rempart : échelle + compensation de largeur (reflow). */
      var s = inner.clientHeight / inner.scrollHeight;
      inner.style.width = (100 / s) + "%";
      s = Math.min(1, inner.clientHeight / inner.scrollHeight);
      if (s < 0.999) {
        inner.style.transform = "scale(" + s + ")";
        inner.style.transformOrigin = "top left";
      } else {
        inner.style.width = "";
      }
    }
  }

  /** Injecte les 2 pages, auto-ajuste puis ajuste l'échelle d'affichage. */
  function renderPreview(container, ctx) {
    container.innerHTML = buildPages(ctx);
    var pages = container.querySelectorAll(".pdf-page");
    Array.prototype.forEach.call(pages, autoAjuster);
    fitPreview(container);
    return pages;
  }

  /* -----------------------------------------------------------------------
     FIT APERÇU — échelle MIXTE (paysage 275 mm / portrait 188 mm).
     La page garde sa hauteur non transformée dans le flux : la légende
     est remontée de H × (échelle − 1), valeur négative.
     ----------------------------------------------------------------------- */
  function fitPreview(container) {
    var pages = container.querySelectorAll(".pdf-page");
    if (!pages.length) { return; }
    var avail = container.clientWidth ||
                (container.parentElement && container.parentElement.clientWidth) || 1040;

    Array.prototype.forEach.call(pages, function (pg, i) {
      var portrait = pg.classList.contains("portrait");
      var mmW = portrait ? 188 : 275;
      var mmH = portrait ? 281 : 194;
      var pagePx = mmW * 96 / 25.4;
      var hauteurPx = mmH * 96 / 25.4;
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
     ENREGISTREMENT DANS LE REGISTRE DES MODÈLES
     ----------------------------------------------------------------------- */
  global.RR_MODELES = global.RR_MODELES || {};
  global.RR_MODELES[TYPE] = {
    buildContext: buildContext,
    buildPages: buildPages,
    pageContents: pageContents,
    renderPreview: renderPreview,
    fitPreview: fitPreview,
    autoAjuster: autoAjuster,
    titres: TITRES
  };

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

    return {
      meta: {
        ecole: champ(d, "identification.nom_ecole") || "—",
        annee: opts.annee || CFG.ANNEE || "2026/2027",
        soumission: soumission,
        id: (opts.id !== undefined && opts.id !== null && opts.id !== "")
            ? opts.id : "—"
      },
      insp: {
        ministere: CFG.MINISTERE || "",
        inspection: CFG.INSPECTION || "",
        ief: CFG.IEF || ""
      },
      d: d
    };
  }

  R.succinct = {
    buildContext: buildContext,
    buildPages: buildPages,
    renderPreview: renderPreview,
    fitPreview: fitPreview,
    titres: TITRES
  };

}(window));
