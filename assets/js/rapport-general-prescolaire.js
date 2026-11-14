/* =========================================================================
   rapport-general-prescolaire.js — Générateur HTML du « RAPPORT GÉNÉRAL
   DE RENTRÉE PRÉSCOLAIRE » : EXACTEMENT 4 PAGES A4 PAYSAGE
     • page 1 → en-tête + A identification + B classes + C physique + D directeur
     • page 2 → E ouvrages annexes + F activités + G observations + signature
     • page 3 → H personnel (enseignants + malades) + récapitulation + service
     • page 4 → I effectifs + J mobiliers
   Se register dans le registre RR_MODELES[type] : les appelants
   (admin.html, general-prescolaire.html, apercu.html) dispatchent vers ce
   modèle ; rapport.js / lib.js restent intacts (défaut = élémentaire).
   Libellés relevés verbatim sur le .docx officiel 2024/2025 (sections A → J
   uniquement : K et L absentes du modèle 2026/2027) ; « N°Maître » de I non
   reprise (absente des captures) ; ligne « 2 » de F rendue sans le numéro.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR = global.RR || {};
  var CFG = global.RR_CONFIG || {};
  var esc = R.esc;                    /* fourni par rapport.js (chargé avant) */
  var flatten = R.flatten, val = R.val, rows = R.rows;
  var num = R.num, lab = R.lab, txt = R.txt, pad2 = R.pad2;

  var TYPE = "general-prescolaire";
  var TITRES = [
    "En-tête + A identification + B classes pédagogiques + C classes physiques + D directeur",
    "E ouvrages annexes + F activités péri et para scolaires + G observations + signature",
    "H personnel enseignant + malades + récapitulation + personnel de service",
    "I situation des effectifs + J mobiliers"
  ];

  /* -----------------------------------------------------------------------
     AIDE-MEMOIRE
     ----------------------------------------------------------------------- */
  /** Texte → valeur affichée (vide = chaîne vide : cellule blanche). */
  function u(s) {
    return esc(String(s === null || s === undefined ? "" : s));
  }

  /** Texte obligatoire → « — » si vide. */
  function ud(s) {
    var v = String(s === null || s === undefined ? "" : s).trim();
    return esc(v || "—");
  }

  /** Nombre → format 2 chiffres (« 05 »), style modèle papier. */
  function p2(n) { return esc(pad2(n)); }

  /** Réponse d'observation : texte saisi ou « R.A.S ». */
  function obs(v) {
    var s = String(v === null || v === undefined ? "" : v).trim();
    return esc(s || "R.A.S");
  }

  /** Croix de validation : [X] ou [ ]. */
  function croix(b) {
    return '<span class="rs-croix">' + (b ? "[X]" : "[ ]") + "</span>";
  }

  /** Paire libellé/valeur soulignée sur une ligne du modèle. */
  function paire(lbl, valHtml, span) {
    return '<td class="paire"' + (span > 1 ? ' colspan="' + span + '"' : "") +
      '><span class="lbl">' + u(lbl) + "</span> " +
      '<span class="val">' + valHtml + "</span></td>";
  }

  /** Ligne « libellé : valeur_soulignée » (séparateur « : » du modèle). */
  function ligne(paires) {
    return '<div class="ligne">' + paires.join(" : ") + "</div>";
  }

  function L(lbl, valeur) {
    return '<span class="lbl">' + u(lbl) + "</span> " +
      '<span class="souligne">' + valeur + "</span>";
  }

  /** Lignes vides numérotées (colonnes = nombre total de colonnes). */
  function blankRows(count, min, cols) {
    var out = "";
    for (var i = count; i < min; i++) {
      out += '<tr><td class="c">' + (i + 1) + "</td>" +
             '<td colspan="' + (cols - 1) + '">&nbsp;</td></tr>';
    }
    return out;
  }

  /** Lignes entièrement vides écartées (le PDF complète en lignes numérotées). */
  function nonVide(item) {
    return Object.keys(item).some(function (k) {
      var v = item[k];
      if (v === null || v === undefined || v === "") { return false; }
      if (typeof v === "number" && v === 0) { return false; }
      return true;
    });
  }

  /* -----------------------------------------------------------------------
     EN-TÊTE OFFICIEL (réutilise les replis CSS de rapport.js)
     ----------------------------------------------------------------------- */
  function entete(ctx) {
    var logo = CFG.LOGO
      ? '<img class="logo-img" src="' + esc(CFG.LOGO) + '" alt="Logo"' +
        ' onerror="window.RRlogoManquant(this)">'
      : '<div class="logo-box">LOGO<br>MEN</div>';
    var drapeau = CFG.DRAPEAU
      ? '<img class="drapeau-img" src="' + esc(CFG.DRAPEAU) + '"' +
        ' alt="Drapeau du Sénégal" onerror="window.RRdrapeauKo(this)">'
      : '<table class="drapeau"><tr>' +
        '<td class="d1"></td><td class="d2">*</td><td class="d3"></td>' +
        "</tr></table>";
    return "" +
'<table class="entete"><tr>' +
  '<td style="width:70px;">' + drapeau + "</td>" +
  '<td class="titre-officiel">' +
    '<div class="rep">RÉPUBLIQUE DU SÉNÉGAL</div>' +
    '<div class="devis">Un Peuple - Un But - Une Foi</div>' +
    '<div class="niv">' + u(ctx.insp.ministere) + "</div>" +
    '<div class="niv">' + u(ctx.insp.inspection) + "</div>" +
    '<div class="niv">' + u(ctx.insp.ief) + "</div>" +
  "</td>" +
  '<td style="width:80px; text-align:right;">' + logo + "</td>" +
"</tr></table>" +
'<div class="titre-rapport">RAPPORT GÉNÉRAL DE RENTRÉE PRÉSCOLAIRE ' +
  u(ctx.meta.annee) + "</div>";
  }

  /* -----------------------------------------------------------------------
     CONTEXTE (brut → rendu) — champs de champs-general-prescolaire.js
     ----------------------------------------------------------------------- */
  function buildContext(donnees, opts) {
    opts = opts || {};
    var raw = donnees || {};
    var f = flatten(raw);

    function v(name, within) { return val(f, name, within); }

    /* --- A. Identification (CODEC facultatif NON imprimé sur le PDF) --- */
    var a = {
      nom_ecole: txt(v("nom_ecole", "identification"), "—").toUpperCase(),
      statut: lab("statut", v("statut", "identification"), "—"),
      date_creation: txt(v("date_creation", "identification"), "—"),
      commune: txt(v("commune", "identification"), "—").toUpperCase(),
      district: txt(v("district", "identification"), "—").toUpperCase()
    };

    /* --- B. Classes pédagogiques --- */
    var b = {
      nb_sections: num(v("nb_sections", "classes_pedagogiques")),
      nb_classes_simples: num(v("nb_classes_simples", "classes_pedagogiques")),
      nb_cmg: num(v("nb_cmg", "classes_pedagogiques")),
      sections_jumeles:
        txt(v("sections_jumeles", "classes_pedagogiques"), "NÉANT").toUpperCase()
    };

    /* --- C. Classes physiques --- */
    var c = {};
    ["salles_etat", "salles_anctp", "salles_com", "salles_plan",
     "salles_prive", "salles_ape", "abris_provisoires", "a_rehabiliter",
     "classes_construction"
    ].forEach(function (k) { c[k] = num(v(k, "classes_physiques")); });
    /* Total auto (somme des 6 bailleurs) : retombee sur le calcul si absent. */
    var sommeSalles = c.salles_etat + c.salles_anctp + c.salles_com +
                      c.salles_plan + c.salles_prive + c.salles_ape;
    c.salles_total = num(v("salles_total", "classes_physiques")) || sommeSalles;
    c.programme_construction =
      txt(v("programme_construction", "classes_physiques"), "NÉANT").toUpperCase();

    /* --- D. Directeur (identique élémentaire + WhatsApp) --- */
    var d = {
      prenom_nom: txt(v("prenom_nom", "directeur"), "—").toUpperCase(),
      grade: txt(v("grade", "directeur"), "—"),
      matricule: txt(v("matricule", "directeur"), "—"),
      date_naissance: txt(v("date_naissance", "directeur")),
      lieu_naissance: txt(v("lieu_naissance", "directeur")).toUpperCase(),
      diplome_academique: txt(v("diplome_academique", "directeur"), "—").toUpperCase(),
      diplome_professionnel:
        txt(v("diplome_professionnel", "directeur"), "—").toUpperCase(),
      date_entree_enseignement: txt(v("date_entree_enseignement", "directeur"), "—"),
      date_affectation: txt(v("date_affectation", "directeur"), "—"),
      references_affectation: txt(v("references_affectation", "directeur"), "—"),
      statut_directeur: txt(v("statut_directeur", "directeur"), "—").toUpperCase(),
      position: lab("oui_non", v("position", "directeur"), "—"),
      decharge: lab("oui_non", v("decharge", "directeur"), "—"),
      telephone1: txt(v("telephone1", "directeur"), "—"),
      telephone2: txt(v("telephone2", "directeur"), "—"),
      whatsapp: txt(v("whatsapp", "directeur"), "—")
    };
    /* « Date et lieu de naissance » : on joint ce qui existe. */
    d.naissance = [d.date_naissance, d.lieu_naissance]
      .filter(function (x) { return x && x !== "—"; })
      .join(" à ") || "—";

    /* --- E. Ouvrages annexes (Senelec + plaques solaires seuls ;
          robinet/puits Oui-Non + Etat + Bailleur ; « Bloc administratif ») --- */
    function on(k) { return lab("oui_non", v(k, "ouvrages_annexes"), "—"); }
    function et(k) { return lab("etat", v(k, "ouvrages_annexes"), "—"); }
    function ba(k) { return txt(v(k, "ouvrages_annexes"), "NÉANT"); }
    function nn(k) { return num(v(k, "ouvrages_annexes")); }

    var e = {
      toilettes: on("toilettes"),
      nb_blocs: nn("nb_blocs"),
      nb_cabines: nn("nb_cabines"),
      cabines_fonctionnelles: nn("cabines_fonctionnelles"),
      cabines_non_fonctionnelles: nn("cabines_non_fonctionnelles"),
      cabines_adaptees: nn("cabines_adaptees"),
      cabines_non_adaptees: nn("cabines_non_adaptees"),
      bailleur_toilettes: ba("bailleur_toilettes"),
      point_eau: on("point_eau"),
      robinet: on("robinet"),
      etat_robinet: et("etat_robinet"),
      bailleur_robinet: ba("bailleur_robinet"),
      puits: on("puits"),
      etat_puits: et("etat_puits"),
      bailleur_puits: ba("bailleur_puits"),
      senelec: on("senelec"),
      etat_senelec: et("etat_senelec"),
      plaques_solaires: on("plaques_solaires"),
      etat_plaques_solaires: et("etat_plaques_solaires"),
      bloc_admin: on("bloc_admin"),
      bailleur_bloc_admin: ba("bailleur_bloc_admin"),
      magasin: on("magasin"),
      bailleur_magasin: ba("bailleur_magasin"),
      cloture: on("cloture"),
      bailleur_cloture: ba("bailleur_cloture"),
      cuisine: on("cuisine"),
      bailleur_cuisine: ba("bailleur_cuisine"),
      logement: on("logement"),
      bailleur_logement: ba("bailleur_logement")
    };

    /* --- F. Activités (sans le numéro « 2 » du modèle Word) --- */
    function act(k) { return lab("oui_non", v(k, "activites"), "—"); }
    var fa = {
      cantine: act("cantine"),
      bailleur_cantine: txt(v("bailleur_cantine", "activites"), "NÉANT"),
      cooperative: act("cooperative"),
      mallette_pedagogique: act("mallette_pedagogique"),
      bibliotheque: act("bibliotheque"),
      boite_pharmacie: act("boite_pharmacie")
    };

    /* --- G. Observations --- */
    var g = {
      obs_materiel: txt(v("obs_materiel", "observations")),
      obs_personnel: txt(v("obs_personnel", "observations")),
      obs_pedagogique: txt(v("obs_pedagogique", "observations"))
    };

    /* --- H. Personnel : enseignants (10) / malades (2) / service (5) --- */
    function pers(item, idx) {
      return {
        num: idx + 1,
        prenom: txt(item.prenom).toUpperCase(),
        nom: txt(item.nom).toUpperCase(),
        grade: txt(item.grade),
        matricule: txt(item.matricule),
        discipline: lab("discipline", item.discipline, "—"),
        diplome_acad: txt(item.diplome_acad).toUpperCase(),
        diplome_prof: txt(item.diplome_prof).toUpperCase(),
        date_entree: txt(item.date_entree),
        date_affectation: txt(item.date_affectation),
        section_tenu: txt(item.section_tenu).toUpperCase(),
        contact: txt(item.contact)
      };
    }

    function serv(item, idx) {
      return {
        num: idx + 1,
        prenoms: txt(item.prenoms).toUpperCase(),
        noms: txt(item.noms).toUpperCase(),
        cni: txt(item.cni),
        date_affectation: txt(item.date_affectation),
        employeur: txt(item.employeur)
      };
    }

    var personnel = rows(f, "enseignant").filter(nonVide).map(pers);
    var malades = rows(f, "malade").filter(nonVide).map(pers);
    var service = rows(f, "service").filter(nonVide).map(serv);

    /* --- Récapitulation FR / AR --- */
    var rfKeys = ["inst_h", "inst_f", "inst_t", "inst_adj_h", "inst_adj_f",
                  "inst_adj_t", "mc_h", "mc_f", "mc_t"];
    var raKeys = ["arabe_inst_h", "arabe_inst_f", "arabe_inst_t",
                  "arabe_inst_adj_h", "arabe_inst_adj_f", "arabe_inst_adj_t",
                  "arabe_mc_h", "arabe_mc_f", "arabe_mc_t"];
    var recap_fr = {}, recap_ar = {};
    rfKeys.forEach(function (k) {
      recap_fr[k] = num(val(f, k, "recap_personnel/recap_francais/"));
    });
    raKeys.forEach(function (k) {
      recap_ar[k] = num(val(f, k, "recap_personnel/recap_arabe/"));
    });

    /* --- I. Effectifs : 10 sections libres + ligne TOTAL calculée --- */
    var effCols = ["eff_g", "eff_f", "eff_t",
                   "hand_g", "hand_f", "hand_t",
                   "sec_g", "sec_f", "sec_t"];
    var totaux = {};
    effCols.forEach(function (k) { totaux[k] = 0; });

    var effectifs = rows(f, "effectifs").filter(nonVide).map(function (item) {
      var r = { section: txt(item.section) };
      effCols.forEach(function (k) {
        r[k] = num(item[k]);
        totaux[k] += r[k];
      });
      r.type = txt(item.type);
      return r;
    });

    var effectifs_total = { section: "TOTAL" };
    effCols.forEach(function (k) { effectifs_total[k] = totaux[k]; });

    /* --- J. Mobiliers : 16 lignes fixes du modèle --- */
    var MOB_LIGNES = [
      ["mob_tables_bancs", "Tables bancs"],
      ["mob_tables_bureaux_maitres", "Tables bureaux Maîtres"],
      ["mob_tables_eleves", "Tables élèves"],
      ["mob_chaises_maitres", "Chaises Maîtres"],
      ["mob_chaises_eleves", "Chaises Elèves"],
      ["mob_armoires", "Armoires"],
      ["mob_placards", "Placards"],
      ["mob_tableaux", "Tableaux"],
      ["mob_ordinateurs", "Ordinateurs"],
      ["mob_imprimantes", "Imprimantes"],
      ["mob_televiseur", "Téléviseur"],
      ["mob_video_projecteur", "Vidéo projecteur"],
      ["mob_photocopieuses", "Photocopieuses"],
      ["mob_internet", "Internet"],
      ["mob_balancoire", "Balançoire"],
      ["mob_toboggan", "Toboggan"]
    ];

    var mobilier = MOB_LIGNES.map(function (p) {
      var inside = "mobilier/" + p[0] + "/";
      var bon = num(val(f, "bon", inside));
      var rep = num(val(f, "a_reparer", inside));
      var tot = num(val(f, "total", inside));
      return {
        designation: p[1],
        bon: bon,
        a_reparer: rep,
        total: tot || (bon + rep),     /* Total = Bon + A réparer (auto) */
        deficit: num(val(f, "deficit", inside))
      };
    });

    /* --- Méta --- */
    var soumission = opts.soumission || raw._submission_time || "";
    var parsed = new Date(String(soumission).replace("Z", "+00:00"));
    if (soumission && !isNaN(parsed.getTime())) {
      function z(n) { return (n < 10 ? "0" : "") + n; }
      soumission = z(parsed.getDate()) + "/" + z(parsed.getMonth() + 1) +
                   "/" + parsed.getFullYear() + " " + z(parsed.getHours()) +
                   ":" + z(parsed.getMinutes());
    } else {
      soumission = String(soumission || "—");
    }

    return {
      meta: {
        ecole: a.nom_ecole,
        annee: opts.annee || CFG.ANNEE || "2026/2027",
        soumission: soumission,
        id: opts.id !== undefined && opts.id !== null && opts.id !== ""
            ? opts.id : "—"
      },
      insp: {
        ministere: opts.ministere || CFG.MINISTERE || "",
        inspection: opts.inspection || CFG.INSPECTION || "",
        ief: opts.ief || CFG.IEF || ""
      },
      a: a, b: b, c: c, d: d, e: e, fa: fa, g: g,
      personnel: personnel,
      malades: malades,
      service: service,
      recap_fr: recap_fr,
      recap_ar: recap_ar,
      effectifs: effectifs,
      effectifs_total: effectifs_total,
      mobilier: mobilier
    };
  }

  /* -----------------------------------------------------------------------
     PAGE 1 : EN-TÊTE + A + B + C + D
     ----------------------------------------------------------------------- */
  function page1(ctx) {
    var a = ctx.a, b = ctx.b, c = ctx.c, d = ctx.d;

    var html = entete(ctx);

    /* ---- A. Identification ---- */
    html +=
'<h2 class="section">A. &nbsp; IDENTIFICATION DE L\'ÉCOLE</h2>' +
'<table class="kv">' +
  "<tr>" +
    paire("Nom de l'établissement :", u(a.nom_ecole)) +
    paire("Statut :", u(a.statut)) +
    paire("Date de création :", u(a.date_creation)) +
  "</tr>" +
  "<tr>" +
    paire("Commune de :", u(a.commune)) +
    paire("District de :", u(a.district)) +
  "</tr>" +
"</table>";

    /* ---- B. Classes pédagogiques ---- */
    html +=
'<h2 class="section">B. &nbsp; SITUATION DES CLASSES PÉDAGOGIQUES</h2>' +
'<table class="grid">' +
  "<tr>" +
    '<th style="width:33.33%;">Nombre de Sections</th>' +
    '<th style="width:33.33%;">Nombre de classes simples</th>' +
    '<th style="width:33.34%;">Nombre de CMG</th>' +
  "</tr>" +
  "<tr>" +
    '<td class="n">' + p2(b.nb_sections) + "</td>" +
    '<td class="n">' + p2(b.nb_classes_simples) + "</td>" +
    '<td class="n">' + p2(b.nb_cmg) + "</td>" +
  "</tr>" +
  "<tr>" +
    '<td colspan="3"><span class="lbl">Préciser les sections jumelées :</span> ' +
    '<span class="souligne">' + u(b.sections_jumeles) + "</span></td>" +
  "</tr>" +
"</table>";

    /* ---- C. Classes physiques ---- */
    html +=
'<h2 class="section">C. &nbsp; SITUATION DES CLASSES PHYSIQUE</h2>' +
'<div class="ligne" style="font-size:8pt; font-style:italic;">' +
  'Nombre de salles de classe construites par bailleur : ' +
  '(Ne mettez pas de croix préciser le nombre de classes)</div>' +
'<table class="grid">' +
  "<tr>" +
    '<th colspan="6" style="border-bottom:0.7pt solid #000;">' +
      'SALLES DE CLASSE EN DUR</th>' +
    '<th rowspan="2">ABRIS<br>PROVISOIRES</th>' +
    '<th rowspan="2">A réhabiliter</th>' +
  "</tr>" +
  "<tr>" +
    "<th>ETAT</th><th>ANCTP</th><th>COM.</th>" +
    "<th>PLAN</th><th>PRIVE</th><th>APE</th>" +
  "</tr>" +
  "<tr>" +
    '<td class="n">' + p2(c.salles_etat) + "</td>" +
    '<td class="n">' + p2(c.salles_anctp) + "</td>" +
    '<td class="n">' + p2(c.salles_com) + "</td>" +
    '<td class="n">' + p2(c.salles_plan) + "</td>" +
    '<td class="n">' + p2(c.salles_prive) + "</td>" +
    '<td class="n">' + p2(c.salles_ape) + "</td>" +
    '<td class="n">' + p2(c.abris_provisoires) + "</td>" +
    '<td class="n">' + p2(c.a_rehabiliter) + "</td>" +
  "</tr>" +
"</table>" +
ligne([
  L("Total des salles de classe en dur :", p2(c.salles_total)),
  L("Nombre de classes en cours de construction ou inachevées :",
    p2(c.classes_construction))
]) +
ligne([
  L("Pour les classes en cours de construction ou inachevées, " +
    "préciser le programme et l'année :", u(c.programme_construction))
]);

    /* ---- D. Directeur ---- */
    html +=
'<h2 class="section">D. &nbsp; RENSEIGNEMENTS SUR LE DIRECTEUR</h2>' +
'<table class="kv">' +
  "<tr>" +
    paire("Prénom et Noms :", u(d.prenom_nom)) +
    paire("Grade :", u(d.grade)) +
    paire("Matricule :", u(d.matricule)) +
  "</tr>" +
  "<tr>" +
    paire("Date et lieu de naissance :", u(d.naissance)) +
    paire("Dipl. Acad. :", u(d.diplome_academique)) +
    paire("Dipl. Prof. :", u(d.diplome_professionnel)) +
  "</tr>" +
  "<tr>" +
    paire("Date d'entrée dans l'enseignement :", u(d.date_entree_enseignement)) +
    paire("Date d'affectation à l'école :", u(d.date_affectation)) +
    paire("Statut :", u(d.statut_directeur)) +
  "</tr>" +
  "<tr>" +
    paire("Références de l'acte d'affectation :", u(d.references_affectation)) +
    paire("Position : Chargé (Titulaire de classe) :", u(d.position)) +
    paire("Déchargé :", u(d.decharge)) +
  "</tr>" +
  "<tr>" +
    paire("Numéros de contact (Plusieurs Numéros si possible) :", u(d.telephone1)) +
    paire("Numéro (2ème possible) :", u(d.telephone2)) +
    paire("Numéro WhatsApp :", u(d.whatsapp)) +
  "</tr>" +
"</table>";

    return html;
  }

  /* -----------------------------------------------------------------------
     PAGE 2 : E + F + G + SIGNATURE
     ----------------------------------------------------------------------- */
  function page2(ctx) {
    var e = ctx.e, fa = ctx.fa, g = ctx.g;

    var html = "";

    /* ---- E. Ouvrages annexes ---- */
    html +=
'<h2 class="section">E. &nbsp; SITUATION DES OUVRAGES ANNEXES</h2>' +
ligne([
  L("Existence de toilettes :", u(e.toilettes)),
  L("Nombre de blocs :", p2(e.nb_blocs)),
  L("Nombre de cabines :", p2(e.nb_cabines)),
  L("Fonctionnelles :", p2(e.cabines_fonctionnelles)),
  L("Non fonctionnelles :", p2(e.cabines_non_fonctionnelles)),
  L("Adaptées :", p2(e.cabines_adaptees)),
  L("Non adaptées :", p2(e.cabines_non_adaptees)),
  L("Bailleur :", u(e.bailleur_toilettes))
]) +
ligne([
  L("Existence d'un point d'eau :", u(e.point_eau)),
  L("Robinet :", u(e.robinet)),
  L("Etat :", u(e.etat_robinet)),
  L("Bailleur :", u(e.bailleur_robinet)),
  L("Puits :", u(e.puits)),
  L("Etat :", u(e.etat_puits)),
  L("Bailleur :", u(e.bailleur_puits))
]) +
ligne([
  L("Alimentation en électricité — Senelec :", u(e.senelec)),
  L("Etat des installations :", u(e.etat_senelec)),
  L("Plaques solaires :", u(e.plaques_solaires)),
  L("Etat des installations :", u(e.etat_plaques_solaires))
]) +
ligne([
  L("Bloc administratif :", u(e.bloc_admin)),
  L("Bailleur :", u(e.bailleur_bloc_admin)),
  L("Magasin :", u(e.magasin)),
  L("Bailleur :", u(e.bailleur_magasin))
]) +
ligne([
  L("Clôture :", u(e.cloture)),
  L("Bailleur :", u(e.bailleur_cloture)),
  L("Cuisine :", u(e.cuisine)),
  L("Bailleur :", u(e.bailleur_cuisine))
]) +
ligne([
  L("Logement :", u(e.logement)),
  L("Bailleur :", u(e.bailleur_logement))
]);

    /* ---- F. Activités péri et para scolaires (sans numéro « 2 ») ---- */
    html +=
'<h2 class="section">F. &nbsp; ACTIVITÉS PÉRI ET PARA SCOLAIRES</h2>' +
'<div class="ligne"><span class="lbl">La structure dispose-t-elle :</span></div>' +
'<div class="ligne">&nbsp;&nbsp;&nbsp;&nbsp;- d\'une cantine scolaire ? ' +
  '<span class="souligne">' + u(fa.cantine) + "</span>" +
  '&nbsp;&nbsp;<span class="lbl">Bailleur :</span> ' +
  '<span class="souligne">' + u(fa.bailleur_cantine) + "</span></div>" +
'<div class="ligne">&nbsp;&nbsp;&nbsp;&nbsp;- d\'une coopérative scolaire ? ' +
  '<span class="souligne">' + u(fa.cooperative) + "</span></div>" +
'<div class="ligne">&nbsp;&nbsp;&nbsp;&nbsp;- d\'une mallette pédagogique ? ' +
  '<span class="souligne">' + u(fa.mallette_pedagogique) + "</span></div>" +
'<div class="ligne">&nbsp;&nbsp;&nbsp;&nbsp;- d\'une bibliothèque ? ' +
  '<span class="souligne">' + u(fa.bibliotheque) + "</span></div>" +
'<div class="ligne">&nbsp;&nbsp;&nbsp;&nbsp;- d\'une boite pharmacie ? ' +
  '<span class="souligne">' + u(fa.boite_pharmacie) + "</span></div>";

    /* ---- G. Observations ---- */
    html +=
'<h2 class="section">G. &nbsp; OBSERVATIONS DU DIRECTEUR</h2>' +
'<div class="obs"><span class="num">1 &nbsp; Sur le plan matériel :</span> ' +
  '<span class="reponse">' + obs(g.obs_materiel) + "</span></div>" +
'<div class="obs"><span class="num">2 &nbsp; Sur le plan du personnel :</span> ' +
  '<span class="reponse">' + obs(g.obs_personnel) + "</span></div>" +
'<div class="obs"><span class="num">3 &nbsp; Sur le plan pédagogique :</span> ' +
  '<span class="reponse">' + obs(g.obs_pedagogique) + "</span></div>";

    /* ---- Signature verbatim du modèle ---- */
    html += '<div class="signature">LE DIRECTEUR (signature et cachet)</div>';

    return html;
  }

  /* -----------------------------------------------------------------------
     PAGE 3 : H (enseignants 10 + malades 2) + RÉCAPITULATION + SERVICE 5
     ----------------------------------------------------------------------- */
  var PERS_HEAD =
"<tr>" +
  '<th style="width:3%;">N°</th>' +
  '<th style="width:11%;">PRÉNOM</th>' +
  '<th style="width:11%;">NOM</th>' +
  '<th style="width:6%;">GRADE</th>' +
  '<th style="width:10%;">Matricule</th>' +
  '<th style="width:9%;">Discipline</th>' +
  '<th style="width:7%;">DIPL.<br>ACAD</th>' +
  '<th style="width:7%;">DIPL.<br>PROF</th>' +
  '<th style="width:11%;">Date d\'entrée<br>enseignement</th>' +
  '<th style="width:11%;">Date affectation<br>école</th>' +
  '<th style="width:6%;">Section tenue</th>' +
  '<th style="width:8%;">Contact</th>' +
"</tr>";

  function persRow(p) {
    return "<tr>" +
      '<td class="c">' + p.num + "</td>" +
      "<td>" + u(p.prenom) + "</td>" +
      "<td>" + u(p.nom) + "</td>" +
      '<td class="c">' + u(p.grade) + "</td>" +
      '<td class="c">' + u(p.matricule) + "</td>" +
      '<td class="c">' + u(p.discipline) + "</td>" +
      '<td class="c">' + u(p.diplome_acad) + "</td>" +
      '<td class="c">' + u(p.diplome_prof) + "</td>" +
      '<td class="c">' + u(p.date_entree) + "</td>" +
      '<td class="c">' + u(p.date_affectation) + "</td>" +
      '<td class="c">' + u(p.section_tenu) + "</td>" +
      '<td class="c">' + u(p.contact) + "</td>" +
    "</tr>";
  }

  function persTable(list, min) {
    var html = '<table class="grid ultracompact">' + PERS_HEAD;
    list.forEach(function (p) { html += persRow(p); });
    html += blankRows(list.length, min, 12);
    html += "</table>";
    return html;
  }

  function page3(ctx) {
    var rf = ctx.recap_fr, ra = ctx.recap_ar;

    var html =
'<h2 class="section">H. &nbsp; SITUATION DU PERSONNEL ENSEIGNANT ' +
  '<span style="font-size:7.5pt; font-style:italic; text-decoration:none;">' +
  '(Le Directeur fait partie du personnel enseignant)</span></h2>' +
persTable(ctx.personnel, 10) +
'<h2 class="section plain tight">MALADES / CONGÉ DE MATERNITÉ</h2>' +
persTable(ctx.malades, 2) +
'<h2 class="section plain tight">RÉCAPITULATION ' +
  '<span style="font-size:7.5pt; font-style:italic;">' +
  '(Prendre en compte le Directeur)</span></h2>' +
'<table class="grid ultracompact">' +
  "<tr>" +
    '<th colspan="9" class="cat" style="border-right:1.2pt solid #000;">' +
      'FRANÇAIS</th>' +
    '<th colspan="9" class="cat">ARABE</th>' +
  "</tr>" +
  "<tr>" +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">' +
      'INSTITUTEURS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">' +
      'INSTITUTEURS ADJOINTS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:1.2pt solid #000;">' +
      'MAÎTRES CONTRACTUELS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">' +
      'INSTITUTEURS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">' +
      'INSTITUTEURS ADJOINTS</th>' +
    '<th colspan="3" class="cat plain">MAÎTRES CONTRACTUELS</th>' +
  "</tr>" +
  "<tr>" +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:1.2pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th>T</th>' +
  "</tr>" +
  "<tr>" +
    '<td class="n">' + p2(rf.inst_h) + "</td>" +
    '<td class="n">' + p2(rf.inst_f) + "</td>" +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(rf.inst_t) + "</td>" +
    '<td class="n">' + p2(rf.inst_adj_h) + "</td>" +
    '<td class="n">' + p2(rf.inst_adj_f) + "</td>" +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(rf.inst_adj_t) + "</td>" +
    '<td class="n">' + p2(rf.mc_h) + "</td>" +
    '<td class="n">' + p2(rf.mc_f) + "</td>" +
    '<td class="n" style="border-right:1.2pt solid #000;">' + p2(rf.mc_t) + "</td>" +
    '<td class="n">' + p2(ra.arabe_inst_h) + "</td>" +
    '<td class="n">' + p2(ra.arabe_inst_f) + "</td>" +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(ra.arabe_inst_t) + "</td>" +
    '<td class="n">' + p2(ra.arabe_inst_adj_h) + "</td>" +
    '<td class="n">' + p2(ra.arabe_inst_adj_f) + "</td>" +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(ra.arabe_inst_adj_t) + "</td>" +
    '<td class="n">' + p2(ra.arabe_mc_h) + "</td>" +
    '<td class="n">' + p2(ra.arabe_mc_f) + "</td>" +
    '<td class="n">' + p2(ra.arabe_mc_t) + "</td>" +
  "</tr>" +
"</table>" +
'<h2 class="section plain tight">PERSONNEL DE SERVICE</h2>' +
'<table class="grid compact">' +
  "<tr>" +
    '<th style="width:5%;">N°</th>' +
    '<th style="width:27%;">PRENOMS</th>' +
    '<th style="width:27%;">NOMS</th>' +
    '<th style="width:15%;">N° CNI</th>' +
    '<th style="width:13%;">DATE AFFECTATION</th>' +
    '<th style="width:13%;">EMPLOYEUR</th>' +
  "</tr>" +
  (function () {
    var out = "";
    ctx.service.forEach(function (s) {
      out += "<tr>" +
        '<td class="c">' + s.num + "</td>" +
        "<td>" + u(s.prenoms) + "</td>" +
        "<td>" + u(s.noms) + "</td>" +
        '<td class="c">' + u(s.cni) + "</td>" +
        '<td class="c">' + u(s.date_affectation) + "</td>" +
        "<td>" + u(s.employeur) + "</td>" +
      "</tr>";
    });
    out += blankRows(ctx.service.length, 5, 6);
    return out;
  })() +
"</table>";

    return html;
  }

  /* -----------------------------------------------------------------------
     PAGE 4 : I (effectifs, sans colonne N°Maître) + J (mobiliers) + pied
     ----------------------------------------------------------------------- */
  function typeEff(v) {
    var s = String(v === null || v === undefined ? "" : v).trim().toLowerCase();
    if (s === "simple") { return "SIMPLE"; }
    if (s === "cmg") { return "CMG"; }
    return s ? s.toUpperCase() : "";
  }

  function page4(ctx) {
    var t = ctx.effectifs_total;

    var html =
'<h2 class="section">I. &nbsp; SITUATION DES EFFECTIFS</h2>' +
'<table class="grid">' +
  "<tr>" +
    '<th rowspan="2" style="width:16%;">SECTIONS</th>' +
    '<th colspan="3" class="cat" style="border-right:1.2pt solid #000;">' +
      'EFFECTIF</th>' +
    '<th colspan="3" class="cat" style="border-right:1.2pt solid #000;">' +
      'HANDICAPÉ</th>' +
    '<th colspan="3" class="cat" style="border-right:1.2pt solid #000;">' +
      'Nbre d\'élèves qui n\'ont<br>pas de pièces d\'état civil</th>' +
    '<th rowspan="2" style="width:12%;">Type : Simple/<br>&nbsp;/CMG</th>' +
  "</tr>" +
  "<tr>" +
    '<th>G</th><th>F</th>' +
    '<th style="border-right:1.2pt solid #000;">T</th>' +
    '<th>G</th><th>F</th>' +
    '<th style="border-right:1.2pt solid #000;">T</th>' +
    '<th>G</th><th>F</th>' +
    '<th style="border-right:1.2pt solid #000;">T</th>' +
  "</tr>";

    /* 10 lignes fixes : données saisies, puis lignes vides du modèle. */
    for (var i = 0; i < 10; i++) {
      var r = ctx.effectifs[i];
      html += "<tr>";
      if (!r) {
        html += '<td>&nbsp;</td>' +
                '<td colspan="9">&nbsp;</td>' +
                "<td>&nbsp;</td>";
      } else {
        html += '<td class="c">' + u(r.section) + "</td>" +
          '<td class="n">' + r.eff_g + "</td>" +
          '<td class="n">' + r.eff_f + "</td>" +
          '<td class="n" style="border-right:1.2pt solid #000;">' + r.eff_t + "</td>" +
          '<td class="n">' + r.hand_g + "</td>" +
          '<td class="n">' + r.hand_f + "</td>" +
          '<td class="n" style="border-right:1.2pt solid #000;">' + r.hand_t + "</td>" +
          '<td class="n">' + r.sec_g + "</td>" +
          '<td class="n">' + r.sec_f + "</td>" +
          '<td class="n" style="border-right:1.2pt solid #000;">' + r.sec_t + "</td>" +
          '<td class="c">' + u(typeEff(r.type)) + "</td>";
      }
      html += "</tr>";
    }

    html +=
  '<tr class="totale">' +
    '<td class="c">TOTAL</td>' +
    '<td class="n">' + t.eff_g + "</td>" +
    '<td class="n">' + t.eff_f + "</td>" +
    '<td class="n" style="border-right:1.2pt solid #000;">' + t.eff_t + "</td>" +
    '<td class="n">' + t.hand_g + "</td>" +
    '<td class="n">' + t.hand_f + "</td>" +
    '<td class="n" style="border-right:1.2pt solid #000;">' + t.hand_t + "</td>" +
    '<td class="n">' + t.sec_g + "</td>" +
    '<td class="n">' + t.sec_f + "</td>" +
    '<td class="n" style="border-right:1.2pt solid #000;">' + t.sec_t + "</td>" +
    "<td></td>" +
  "</tr>" +
"</table>";

    /* ---- J. Mobiliers (16 lignes fixes) ---- */
    html +=
'<h2 class="section">J. &nbsp; MOBLIERS</h2>' +
'<table class="grid">' +
  "<tr>" +
    '<th style="width:40%;">Mobilier</th>' +
    '<th style="width:15%;">Bon</th>' +
    '<th style="width:15%;">A réparer</th>' +
    '<th style="width:15%;">Total</th>' +
    '<th style="width:15%;">Déficit</th>' +
  "</tr>";

    ctx.mobilier.forEach(function (m) {
      html += "<tr>" +
        "<td>" + u(m.designation) + "</td>" +
        '<td class="n">' + p2(m.bon) + "</td>" +
        '<td class="n">' + p2(m.a_reparer) + "</td>" +
        '<td class="n">' + p2(m.total) + "</td>" +
        '<td class="n">' + p2(m.deficit) + "</td>" +
      "</tr>";
    });
    html += "</table>";

    html += '<div class="pied">Généré le ' + u(ctx.meta.soumission) +
            " — Soumission n° " + u(ctx.meta.id) + "</div>";

    return html;
  }

  /* -----------------------------------------------------------------------
     ASSEMBLAGE — 4 PAGES PAYSAGE STRICTES (garde-fou)
     ----------------------------------------------------------------------- */
  function pageContents(ctx) {
    var contenus = [page1(ctx), page2(ctx), page3(ctx), page4(ctx)];
    if (contenus.length !== 4 || TITRES.length !== 4) {
      throw new Error("Le rapport général préscolaire doit comporter " +
                      "exactement 4 pages.");
    }
    return contenus;
  }

  /** HTML complet : 4 <div class="pdf-page"> A4 PAYSAGE (275 x 194 mm). */
  function buildPages(ctx) {
    return pageContents(ctx).map(function (content, i) {
      return '<div class="apercu-slot">' +
               '<div class="pdf-page" data-page="' + (i + 1) + '">' +
                 '<div class="page-inner">' + content + "</div>" +
               "</div>" +
               '<div class="apercu-legende"></div>' +
             "</div>";
    }).join("\n");
  }

  /* -----------------------------------------------------------------------
     AUTO-AJUSTEMENT : garantit le contenu dans chaque page
     1) compression de la taille de police par paliers de −0,25 pt (3 max) ;
     2) dernier rempart : overflow:hidden + transform: scale() compensé.
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

  /** Injecte les 4 pages, auto-ajuste puis ajuste l'échelle d'affichage. */
  function renderPreview(container, ctx) {
    container.innerHTML = buildPages(ctx);
    var pages = container.querySelectorAll(".pdf-page");
    Array.prototype.forEach.call(pages, autoAjuster);
    fitPreview(container);
    return pages;
  }

  /* -----------------------------------------------------------------------
     FIT APERÇU — échelle PAYSAGE (275 x 194 mm), identique pour les 4 pages.
     La page garde sa hauteur non transformée dans le flux : la légende
     est remontée de H × (échelle − 1), valeur négative.
     ----------------------------------------------------------------------- */
  function fitPreview(container) {
    var pages = container.querySelectorAll(".pdf-page");
    if (!pages.length) { return; }
    var avail = container.clientWidth ||
                (container.parentElement && container.parentElement.clientWidth) || 1040;
    var pagePx = 275 * 96 / 25.4;
    var hauteurPx = 194 * 96 / 25.4;
    var scale = Math.min(1, (avail - 4) / pagePx);

    Array.prototype.forEach.call(pages, function (pg, i) {
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
    container.style.setProperty("--apercu-echelle", scale);
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

  R.generalPrescolaire = {
    buildContext: buildContext,
    buildPages: buildPages,
    renderPreview: renderPreview,
    fitPreview: fitPreview,
    titres: TITRES
  };

}(window));
