/* =========================================================================
   rapport.js — Générateur HTML du rapport officiel (6 pages A4 PAYSAGE)
   Portage fidèle de templates/rapport.html validé sous Flask/xhtml2pdf.
   Chaque page est isolée dans <div class="pdf-page"> (275 x 194 mm),
   ce qui garantit qu'aucune section n'est jamais coupée.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR = global.RR || {};
  var CFG = global.RR_CONFIG || {};

  /* -----------------------------------------------------------------------
     AIDE-MEMOIRE
     ----------------------------------------------------------------------- */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function p2(n) { return esc(R.pad2(n)); }
  function u(s) { return esc(String(s === null || s === undefined ? "" : s)); }
  function raw(v) { return u(v); }

  /** Réponse d'observation : texte saisi ou « R.A.S ». */
  function obs(v) {
    var s = String(v === null || v === undefined ? "" : v).trim();
    return esc(s || "R.A.S");
  }

  /** Remplit un tableau jusqu'à « min » lignes vides numérotées. */
  function blankRows(count, min, cols, numCol) {
    var out = "";
    for (var i = count; i < min; i++) {
      out += '<tr><td class="c">' + (i + 1) + '</td>' +
             '<td colspan="' + (cols - 1) + '">&nbsp;</td></tr>';
      if (numCol) { /* colonne N° toujours présente */ }
    }
    return out;
  }

  /** Lignes vides sans numérotation (manuels, matériel…). */
  function emptyRows(count, min, cols) {
    var out = "";
    for (var i = count; i < min; i++) {
      out += '<tr><td>&nbsp;</td>' +
             new Array(cols).join('<td></td>') + "</tr>";
    }
    return out;
  }

  /* -----------------------------------------------------------------------
     EN-TÊTE OFFICIEL (page 1)
     ----------------------------------------------------------------------- */
  function entete(ctx) {
    var logo = CFG.LOGO
      ? '<img class="logo-img" src="' + esc(CFG.LOGO) + '" alt="Logo">'
      : '<div class="logo-box">LOGO<br>MEN</div>';
    return '' +
'<table class="entete"><tr>' +
  '<td style="width:70px;"><table class="drapeau"><tr>' +
    '<td class="d1"></td><td class="d2">*</td><td class="d3"></td>' +
  '</tr></table></td>' +
  '<td class="titre-officiel">' +
    '<div class="rep">RÉPUBLIQUE DU SÉNÉGAL</div>' +
    '<div class="devis">Un Peuple - Un But - Une Foi</div>' +
    '<div class="niv">' + u(ctx.insp.ministere) + '</div>' +
    '<div class="niv">' + u(ctx.insp.inspection) + '</div>' +
    '<div class="niv">' + u(ctx.insp.ief) + '</div>' +
  '</td>' +
  '<td style="width:80px; text-align:right;">' + logo + '</td>' +
'</tr></table>' +
'<div class="titre-rapport">RAPPORT GÉNÉRAL DE RENTRÉE ÉLÉMENTAIRE ' +
  u(ctx.meta.annee) + '</div>';
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
  '<tr>' +
    '<td class="lbl">Nom de l\'école :</td><td class="val">' + u(a.nom_ecole) + '</td>' +
    '<td class="lbl">Statut :</td><td class="val">' + u(a.statut) + '</td>' +
    '<td class="lbl">Date de création :</td><td class="val">' + u(a.date_creation) + '</td>' +
  '</tr>' +
  '<tr>' +
    '<td class="lbl">Commune de :</td><td class="val">' + u(a.commune) + '</td>' +
    '<td class="lbl">District de :</td><td class="val">' + u(a.district) + '</td>' +
    '<td class="lbl">CODEC de :</td><td class="val">' + u(a.codec) + '</td>' +
  '</tr>' +
  '<tr>' +
    '<td class="lbl">Villages polarisés :</td>' +
    '<td class="val lg" colspan="3">' + u(a.villages_polarises) + '</td>' +
    '<td class="lbl">Langue nationale :</td><td class="val">' + u(a.langue_nationale) + '</td>' +
  '</tr>' +
'</table>';

    /* ---- B. Classes pédagogiques ---- */
    html +=
'<h2 class="section">B. &nbsp; SITUATION DES CLASSES PÉDAGOGIQUES</h2>' +
'<table class="grid">' +
  '<tr>' +
    '<th style="width:25%;">Nombre de cours</th>' +
    '<th style="width:25%;">Nombre de classes simples</th>' +
    '<th style="width:25%;">Nombre de CMG</th>' +
    '<th style="width:25%;">Nombre de CDF</th>' +
  '</tr>' +
  '<tr>' +
    '<td class="n">' + p2(b.nb_cours) + '</td>' +
    '<td class="n">' + p2(b.nb_classes_simples) + '</td>' +
    '<td class="n">' + p2(b.nb_cmg) + '</td>' +
    '<td class="n">' + p2(b.nb_cdf) + '</td>' +
  '</tr>' +
'</table>' +
'<div class="ligne"><span class="lbl">Cours jumelés — CMG (multi-grades) :</span> ' +
  '<span class="souligne">' + u(b.cours_jumeles_cmg) + '</span></div>' +
'<div class="ligne"><span class="lbl">Cours jumelés — CDF (double flux) :</span> ' +
  '<span class="souligne">' + u(b.cours_jumeles_cdf) + '</span></div>';

    /* ---- C. Classes physiques ---- */
    html +=
'<h2 class="section">C. &nbsp; SITUATION DES CLASSES PHYSIQUES</h2>' +
'<table class="grid">' +
  '<tr>' +
    '<th colspan="4" style="border-bottom:0.7pt solid #000;">SALLES DE CLASSE EN DUR</th>' +
    '<th rowspan="2">UTILISÉES</th>' +
    '<th rowspan="2">NON UTILISÉES</th>' +
    '<th rowspan="2">ABRIS<br>PROVISOIRES</th>' +
    '<th rowspan="2">A réhabiliter</th>' +
  '</tr>' +
  '<tr>' +
    '<th>BONNES</th><th>ACCEPTABLES</th><th>MAUVAISES</th><th>TOTALE</th>' +
  '</tr>' +
  '<tr>' +
    '<td class="n">' + p2(c.salles_bonnes) + '</td>' +
    '<td class="n">' + p2(c.salles_acceptables) + '</td>' +
    '<td class="n">' + p2(c.salles_mauvaises) + '</td>' +
    '<td class="n">' + p2(c.salles_totale) + '</td>' +
    '<td class="n">' + p2(c.salles_utilisees) + '</td>' +
    '<td class="n">' + p2(c.salles_non_utilisees) + '</td>' +
    '<td class="n">' + p2(c.abris_provisoires) + '</td>' +
    '<td class="n">' + p2(c.a_rehabiliter) + '</td>' +
  '</tr>' +
'</table>' +
'<div class="ligne"><span class="lbl">Nombre de classes en cours de construction ou inachevées :</span> ' +
  '<span class="souligne">' + p2(c.cours_construction) + '</span></div>' +
'<div class="ligne"><span class="lbl">Pour les classes en cours de construction ou inachevées, ' +
  'préciser le programme et l\'année :</span> ' +
  '<span class="souligne">' + u(c.programme_construction) + '</span></div>';

    /* ---- D. Directeur ---- */
    html +=
'<h2 class="section">D. &nbsp; RENSEIGNEMENTS SUR LE DIRECTEUR</h2>' +
'<table class="kv">' +
  '<tr>' +
    '<td class="lbl">Prénom et Nom :</td><td class="val">' + u(d.prenom_nom) + '</td>' +
    '<td class="lbl">Grade :</td><td class="val">' + u(d.grade) + '</td>' +
    '<td class="lbl">Matricule :</td><td class="val">' + u(d.matricule) + '</td>' +
  '</tr>' +
  '<tr>' +
    '<td class="lbl">Date et lieu de naissance :</td>' +
    '<td class="val">' + u(d.date_naissance) + ' à ' + u(d.lieu_naissance) + '</td>' +
    '<td class="lbl">Diplôme Acad. :</td><td class="val">' + u(d.diplome_academique) + '</td>' +
    '<td class="lbl">Diplôme Prof. :</td><td class="val">' + u(d.diplome_professionnel) + '</td>' +
  '</tr>' +
  '<tr>' +
    '<td class="lbl">Date d\'entrée dans l\'enseignement :</td>' +
    '<td class="val">' + u(d.date_entree_enseignement) + '</td>' +
    '<td class="lbl">Date d\'affectation à l\'école :</td>' +
    '<td class="val">' + u(d.date_affectation) + '</td>' +
    '<td class="lbl">Statut :</td><td class="val">' + u(d.statut_directeur) + '</td>' +
  '</tr>' +
  '<tr>' +
    '<td class="lbl">Références de l\'acte d\'affectation :</td>' +
    '<td class="val">' + u(d.references_affectation) + '</td>' +
    '<td class="lbl">Position (Charge : Titulaire de classe) :</td>' +
    '<td class="val">' + u(d.position) + '</td>' +
    '<td class="lbl">Déchargé :</td><td class="val">' + u(d.decharge) + '</td>' +
  '</tr>' +
  '<tr>' +
    '<td class="lbl">Numéro de contact :</td><td class="val">' + u(d.telephone1) + '</td>' +
    '<td class="lbl">Numéro (2ème possible) :</td><td class="val">' + u(d.telephone2) + '</td>' +
    '<td class="lbl">Numéro WhatsApp :</td><td class="val">' + u(d.whatsapp) + '</td>' +
  '</tr>' +
'</table>';

    return html;
  }

  /* -----------------------------------------------------------------------
     PAGE 2 : E + F + G
     ----------------------------------------------------------------------- */
  function page2(ctx) {
    var e = ctx.e, f = ctx.f, g = ctx.g;

    var html =
'<h2 class="section">E. &nbsp; SITUATION DES OUVRAGES ANNEXES</h2>' +
'<div class="ligne">' +
  '<span class="lbl">Existence de toilettes :</span> <span class="souligne">' + u(e.toilettes) + '</span>' +
  ' : <span class="lbl">Nombre de blocs :</span> <span class="souligne">' + p2(e.nb_blocs) + '</span>' +
  ' : <span class="lbl">Nombre de cabines :</span> <span class="souligne">' + p2(e.nb_cabines) + '</span>' +
  ' : <span class="lbl">Fonctionnelles :</span> <span class="souligne">' + p2(e.cabines_fonctionnelles) + '</span>' +
  ' : <span class="lbl">Non fonctionnelles :</span> <span class="souligne">' + p2(e.cabines_non_fonctionnelles) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_toilettes) + '</span>' +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">Existence d\'un point d\'eau :</span> <span class="souligne">' + u(e.point_eau) + '</span>' +
  ' : <span class="lbl">Robinet :</span> <span class="souligne">' + p2(e.nb_robinets) + '</span>' +
  ' : <span class="lbl">Etat :</span> <span class="souligne">' + u(e.etat_point_eau) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_point_eau) + '</span>' +
  ' : <span class="lbl">Puits :</span> <span class="souligne">' + u(e.puits) + '</span>' +
  ' : <span class="lbl">Etat :</span> <span class="souligne">' + u(e.etat_puits) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_puits) + '</span>' +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">Senelec :</span> <span class="souligne">' + u(e.senelec) + '</span>' +
  ' : <span class="lbl">Etat des installations :</span> <span class="souligne">' + u(e.etat_electricite) + '</span>' +
  ' : <span class="lbl">Plaques solaires :</span> <span class="souligne">' + u(e.plaques_solaires) + '</span>' +
  ' : <span class="lbl">Etat :</span> <span class="souligne">' + u(e.etat_plaques_solaires) + '</span>' +
  ' : <span class="lbl">Groupe électrogène :</span> <span class="souligne">' + u(e.groupe_electrogene) + '</span>' +
  ' : <span class="lbl">Etat :</span> <span class="souligne">' + u(e.etat_groupe_electrogene) + '</span>' +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">L\'école dispose-t-elle d\'une connexion internet ?</span> ' +
  '<span class="souligne">' + u(e.internet) + '</span>' +
  ' : <span class="lbl">Préciser si l\'école bénéficie d\'un modem wifi du MEN :</span> ' +
  '<span class="souligne">' + u(e.modem_wifi_men) + '</span>' +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">Bureau :</span> <span class="souligne">' + u(e.bureau) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_bureau) + '</span>' +
  '&nbsp;&nbsp;' +
  '<span class="lbl">Magasin :</span> <span class="souligne">' + u(e.magasin) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_magasin) + '</span>' +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">Clôture :</span> <span class="souligne">' + u(e.cloture) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_cloture) + '</span>' +
  '&nbsp;&nbsp;' +
  '<span class="lbl">Cuisine :</span> <span class="souligne">' + u(e.cuisine) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_cuisine) + '</span>' +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">Logement :</span> <span class="souligne">' + u(e.logement) + '</span>' +
  ' : <span class="lbl">Bailleur :</span> <span class="souligne">' + u(e.bailleur_logement) + '</span>' +
'</div>';

    /* ---- F ---- */
    html +=
'<h2 class="section">F. &nbsp; ACTIVITÉS PÉRI ET PARA SCOLAIRES</h2>' +
'<div class="ligne">' +
  '<span class="lbl">1 &nbsp; L\'école dispose-t-elle d\'un CGE fonctionnel ?</span> ' +
  '<span class="souligne">' + u(f.cge) + '</span><br>' +
  '<span class="lbl">&nbsp;&nbsp;&nbsp;&nbsp;Si oui préciser la date de la mise en place du bureau ' +
  'dont le mandat est en cours :</span> ' +
  '<span class="souligne">' + u(f.cge_date_mise_en_place) + '</span><br>' +
  '<span class="lbl">&nbsp;&nbsp;&nbsp;&nbsp;Le président :</span> ' +
  '<span class="souligne">' + u(f.cge_president) + '</span> ' +
  '<span class="lbl">Tél :</span> <span class="souligne">' + u(f.cge_tel) + '</span> ' +
  '<span class="lbl">&nbsp;&nbsp;A-t-il fait déjà deux mandats consécutifs ?</span> ' +
  '<span class="souligne">' + u(f.cge_deux_mandats) + '</span>' +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">2 &nbsp; L\'école est-elle concernée par un autre programme intervenant ' +
  'dans le secteur éducatif ? (PASED, RELIT, PAIRE L\'ÉCOLE, PAAME)&nbsp;:</span> ' +
  '<span class="souligne">' + u(f.programmes_intervenants) + '</span>' +
  (f.programmes_intervenants_preciser
    ? '<br>&nbsp;&nbsp;&nbsp;&nbsp;<span class="souligne">' +
      u(f.programmes_intervenants_preciser) + '</span>'
    : "") +
'</div>' +
'<div class="ligne">' +
  '<span class="lbl">3 &nbsp; L\'école dispose-t-elle :</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'une cantine scolaire ? <span class="souligne">' + u(f.cantine) + '</span>' +
  '&nbsp;&nbsp;<span class="lbl">Bailleur :</span> <span class="souligne">' + u(f.bailleur_cantine) + '</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'une coopérative scolaire ? <span class="souligne">' + u(f.cooperative) + '</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'un jardin scolaire ? <span class="souligne">' + u(f.jardin) + '</span>' +
  '&nbsp;&nbsp;<span class="lbl">Bailleur :</span> <span class="souligne">' + u(f.bailleur_jardin) + '</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'un champ communautaire ? <span class="souligne">' + u(f.champ_communaute) + '</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'une mallette pédagogique ? <span class="souligne">' + u(f.mallette_pedagogique) + '</span>' +
  '&nbsp;&nbsp;<span class="lbl">Nbre :</span> <span class="souligne">' + p2(f.nb_mallettes) + '</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'une bibliothèque ? <span class="souligne">' + u(f.bibliotheque) + '</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'un terrain de sport ? <span class="souligne">' + u(f.terrain_sport) + '</span><br>' +
  '&nbsp;&nbsp;&nbsp;&nbsp;- d\'une boîte pharmacie ? <span class="souligne">' + u(f.boite_pharmacie) + '</span>' +
'</div>';

    /* ---- G ---- */
    html +=
'<h2 class="section">G. &nbsp; OBSERVATIONS DU DIRECTEUR</h2>' +
'<div class="obs"><span class="num">1 &nbsp; Sur le plan matériel :</span> ' +
  '<span class="reponse">' + obs(g.obs_materiel) + '</span></div>' +
'<div class="obs"><span class="num">2 &nbsp; Sur le plan du personnel :</span> ' +
  '<span class="reponse">' + obs(g.obs_personnel) + '</span></div>' +
'<div class="obs"><span class="num">3 &nbsp; Sur le plan pédagogique :</span> ' +
  '<span class="reponse">' + obs(g.obs_pedagogique) + '</span></div>';

    return html;
  }

  /* -----------------------------------------------------------------------
     PAGE 3 : H (personnel + suppléants + malades + récapitulation)
     ----------------------------------------------------------------------- */
  var PERS_HEAD =
'<tr>' +
  '<th style="width:3%;">N°</th>' +
  '<th style="width:11%;">PRÉNOM</th>' +
  '<th style="width:11%;">NOM</th>' +
  '<th style="width:6%;">GRADE</th>' +
  '<th style="width:11%;">Matricule</th>' +
  '<th style="width:9%;">Discipline</th>' +
  '<th style="width:7%;">DIPL.<br>ACAD.</th>' +
  '<th style="width:7%;">DIPL.<br>PROF.</th>' +
  '<th style="width:11%;">Date d\'entrée dans<br>l\'enseignement</th>' +
  '<th style="width:11%;">Date d\'affectation<br>à l\'école</th>' +
  '<th style="width:6%;">Cours tenu</th>' +
  '<th style="width:7%;">Contact</th>' +
'</tr>';

  function persRow(p) {
    return '<tr>' +
      '<td class="c">' + p.num + '</td>' +
      '<td>' + u(p.prenom) + '</td>' +
      '<td>' + u(p.nom) + '</td>' +
      '<td class="c">' + u(p.grade) + '</td>' +
      '<td class="c">' + u(p.matricule) + '</td>' +
      '<td class="c">' + u(p.discipline) + '</td>' +
      '<td class="c">' + u(p.diplome_acad) + '</td>' +
      '<td class="c">' + u(p.diplome_prof) + '</td>' +
      '<td class="c">' + u(p.date_entree) + '</td>' +
      '<td class="c">' + u(p.date_affectation) + '</td>' +
      '<td class="c">' + u(p.cours_tenu) + '</td>' +
      '<td class="c">' + u(p.contact) + '</td>' +
    '</tr>';
  }

  function persTable(list, min) {
    var html = '<table class="grid ultracompact">' + PERS_HEAD;
    list.forEach(function (p) { html += persRow(p); });
    html += blankRows(list.length, min, 12);
    html += '</table>';
    return html;
  }

  function page3(ctx) {
    var rf = ctx.recap_fr, ra = ctx.recap_ar;

    var html =
'<h2 class="section">H. &nbsp; SITUATION DU PERSONNEL ENSEIGNANT ' +
  '<span style="font-size:7.5pt; font-style:italic; text-decoration:none;">' +
  '(Inscrire le Directeur et mettre le titre qu\'il tient ou s\'il est déchargé)</span>' +
'</h2>' +
persTable(ctx.personnel, 20) +
'<h2 class="section plain tight">SUPPLÉANTS</h2>' +
persTable(ctx.suppleants, 3) +
'<h2 class="section plain tight">MALADES / CONGÉS DE MATERNITÉ</h2>' +
persTable(ctx.malades, 3) +
'<h2 class="section plain tight">RÉCAPITULATION ' +
  '<span style="font-size:7.5pt; font-style:italic;">(Prendre en compte le Directeur)</span>' +
'</h2>' +
'<table class="grid ultracompact">' +
  '<tr>' +
    '<th colspan="9" class="cat" style="border-right:1.2pt solid #000;">FRANÇAIS</th>' +
    '<th colspan="9" class="cat">ARABE</th>' +
  '</tr>' +
  '<tr>' +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">INSTITUTEURS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">INSTITUTEURS ADJOINTS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:1.2pt solid #000;">MAÎTRES CONTRACTUELS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">INSTITUTEURS</th>' +
    '<th colspan="3" class="cat plain" style="border-right:0.7pt solid #000;">INSTITUTEURS ADJOINTS</th>' +
    '<th colspan="3" class="cat plain">MAÎTRES CONTRACTUELS</th>' +
  '</tr>' +
  '<tr>' +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:1.2pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th style="border-right:0.7pt solid #000;">T</th>' +
    '<th>H</th><th>F</th><th>T</th>' +
  '</tr>' +
  '<tr>' +
    '<td class="n">' + p2(rf.inst_h) + '</td>' +
    '<td class="n">' + p2(rf.inst_f) + '</td>' +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(rf.inst_t) + '</td>' +
    '<td class="n">' + p2(rf.inst_adj_h) + '</td>' +
    '<td class="n">' + p2(rf.inst_adj_f) + '</td>' +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(rf.inst_adj_t) + '</td>' +
    '<td class="n">' + p2(rf.mc_h) + '</td>' +
    '<td class="n">' + p2(rf.mc_f) + '</td>' +
    '<td class="n" style="border-right:1.2pt solid #000;">' + p2(rf.mc_t) + '</td>' +
    '<td class="n">' + p2(ra.arabe_inst_h) + '</td>' +
    '<td class="n">' + p2(ra.arabe_inst_f) + '</td>' +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(ra.arabe_inst_t) + '</td>' +
    '<td class="n">' + p2(ra.arabe_inst_adj_h) + '</td>' +
    '<td class="n">' + p2(ra.arabe_inst_adj_f) + '</td>' +
    '<td class="n" style="border-right:0.7pt solid #000;">' + p2(ra.arabe_inst_adj_t) + '</td>' +
    '<td class="n">' + p2(ra.arabe_mc_h) + '</td>' +
    '<td class="n">' + p2(ra.arabe_mc_f) + '</td>' +
    '<td class="n">' + p2(ra.arabe_mc_t) + '</td>' +
  '</tr>' +
'</table>';

    return html;
  }

  /* -----------------------------------------------------------------------
     PAGE 4 : I + J
     ----------------------------------------------------------------------- */
  function page4(ctx) {
    var t = ctx.effectifs_total;

    var html =
'<h2 class="section">I. &nbsp; SITUATION DES EFFECTIFS</h2>' +
'<table class="grid">' +
  '<tr>' +
    '<th rowspan="2" class="cat plain" style="width:6%;">COURS</th>' +
    '<th rowspan="2" class="cat plain" style="width:5%;">Nbr<br>classe</th>' +
    '<th colspan="3" class="cat" style="border-right:1.2pt solid #000;">EFFECTIF</th>' +
    '<th colspan="3" class="cat" style="border-right:1.2pt solid #000;">REDOUBLANTS</th>' +
    '<th colspan="3" class="cat" style="border-right:1.2pt solid #000;">HANDICAPÉS</th>' +
    '<th colspan="3" class="cat" style="border-right:1.2pt solid #000;">Nbre d\'élèves qui n\'ont<br>pas de pièces d\'état civil</th>' +
  '</tr>' +
  '<tr>' +
    '<th>G</th><th>F</th><th style="border-right:1.2pt solid #000;">T</th>' +
    '<th>G</th><th>F</th><th style="border-right:1.2pt solid #000;">T</th>' +
    '<th>G</th><th>F</th><th style="border-right:1.2pt solid #000;">T</th>' +
    '<th>G</th><th>F</th><th style="border-right:1.2pt solid #000;">T</th>' +
  '</tr>';

    ctx.effectifs.forEach(function (e) {
      html += '<tr>' +
        '<td class="c">' + u(e.cours) + '</td>' +
        '<td class="n">' + (e.nb_classes || 0) + '</td>' +
        '<td class="n">' + e.eff_g + '</td><td class="n">' + e.eff_f + '</td>' +
        '<td class="n" style="border-right:1.2pt solid #000;">' + e.eff_t + '</td>' +
        '<td class="n">' + e.red_g + '</td><td class="n">' + e.red_f + '</td>' +
        '<td class="n" style="border-right:1.2pt solid #000;">' + e.red_t + '</td>' +
        '<td class="n">' + e.hand_g + '</td><td class="n">' + e.hand_f + '</td>' +
        '<td class="n" style="border-right:1.2pt solid #000;">' + e.hand_t + '</td>' +
        '<td class="n">' + e.sans_etat_g + '</td><td class="n">' + e.sans_etat_f + '</td>' +
        '<td class="n" style="border-right:1.2pt solid #000;">' + e.sans_etat_t + '</td>' +
      '</tr>';
    });

    html +=
  '<tr class="totale">' +
    '<td class="c">TOTAL</td>' +
    '<td></td>' +
    '<td class="n">' + t.eff_g + '</td><td class="n">' + t.eff_f + '</td>' +
    '<td class="n" style="border-right:1.2pt solid #000;">' + t.eff_t + '</td>' +
    '<td class="n">' + t.red_g + '</td><td class="n">' + t.red_f + '</td>' +
    '<td class="n" style="border-right:1.2pt solid #000;">' + t.red_t + '</td>' +
    '<td class="n">' + t.hand_g + '</td><td class="n">' + t.hand_f + '</td>' +
    '<td class="n" style="border-right:1.2pt solid #000;">' + t.hand_t + '</td>' +
    '<td class="n">' + t.sans_etat_g + '</td><td class="n">' + t.sans_etat_f + '</td>' +
    '<td class="n" style="border-right:1.2pt solid #000;">' + t.sans_etat_t + '</td>' +
  '</tr>' +
'</table>';

    /* ---- J. Mobilier ---- */
    html +=
'<h2 class="section">J. &nbsp; MOBILIER SCOLAIRE</h2>' +
'<table class="grid">' +
  '<tr>' +
    '<th style="width:40%;">Moblier</th>' +
    '<th style="width:15%;">Bon</th>' +
    '<th style="width:15%;">A réparer</th>' +
    '<th style="width:15%;">Total</th>' +
    '<th style="width:15%;">Défécit</th>' +
  '</tr>';

    ctx.mobilier.forEach(function (m) {
      html += '<tr>' +
        '<td>' + u(m.designation) + '</td>' +
        '<td class="n">' + p2(m.bon) + '</td>' +
        '<td class="n">' + p2(m.a_reparer) + '</td>' +
        '<td class="n">' + p2(m.total) + '</td>' +
        '<td class="n">' + p2(m.defecat) + '</td>' +
      '</tr>';
    });
    html += '</table>';

    return html;
  }

  /* -----------------------------------------------------------------------
     TABLEAU 5 COLONNES RÉUTILISABLE (K, L, M, N)
     ----------------------------------------------------------------------- */
  function stuffTable(list, min, titreEntete) {
    var html =
'<table class="grid compact">' +
  '<tr>' +
    '<th style="width:38%;">' + titreEntete + '</th>' +
    '<th style="width:11%;">Quantité</th>' +
    '<th style="width:14%;">Provenance</th>' +
    '<th style="width:11%;">Besoins</th>' +
    '<th style="width:26%;">Observations</th>' +
  '</tr>';

    if (!list.length) {
      html += '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>';
      min = min - 1;
    }
    list.forEach(function (m) {
      html += '<tr>' +
        '<td>' + u(m.titre) + '</td>' +
        '<td class="n">' + p2(m.quantite) + '</td>' +
        '<td class="c">' + u(m.provenance) + '</td>' +
        '<td class="n">' + u(m.besoins) + '</td>' +
        '<td>' + u(m.observations) + '</td>' +
      '</tr>';
    });
    html += emptyRows(list.length, min, 5);
    html += '</table>';
    return html;
  }

  /* -----------------------------------------------------------------------
     PAGE 5 : K
     ----------------------------------------------------------------------- */
  function page5(ctx) {
    return '<h2 class="section">K. &nbsp; RECENSESEMENT DES MANUELS</h2>' +
           stuffTable(ctx.manuels, 6, "Titre");
  }

  /* -----------------------------------------------------------------------
     PAGE 6 : L + M + N + signature
     ----------------------------------------------------------------------- */
  function page6(ctx) {
    var html =
'<h2 class="section">L. &nbsp; AUTRES MANUELS DISPONIBLES A L\'ÉCOLE</h2>' +
stuffTable(ctx.autres_manuels, 6, "Titre") +
'<h2 class="section">M. &nbsp; RECENSESEMENT DU MATÉRIEL DIDACTIQUE</h2>' +
stuffTable(ctx.materiel, 14, "Désignation") +
'<h2 class="section">N. &nbsp; AUTRES MATÉRIEL DISPONIBLE A L\'ÉCOLE</h2>' +
stuffTable(ctx.autres_materiels, 4, "Désignation") +
'<div class="signature">Le Directeur</div>' +
'<div class="pied">Généré le ' + u(ctx.meta.soumission) +
  ' — Soumission n° ' + u(ctx.meta.id) + '</div>';

    return html;
  }

  /* -----------------------------------------------------------------------
     ASSEMBLAGE
     ----------------------------------------------------------------------- */
  var TITRES_PAGES = [
    "En-tête + A + B + C + D",
    "E + F + G",
    "H — Personnel",
    "I + J",
    "K — Manuels",
    "L + M + N + signature"
  ];

  /** Renvoie le tableau des 6 contenus de page (sans le conteneur). */
  function pageContents(ctx) {
    return [page1(ctx), page2(ctx), page3(ctx),
            page4(ctx), page5(ctx), page6(ctx)];
  }

  /** Renvoie le HTML complet des 6 <div class="pdf-page">. */
  function buildPages(ctx) {
    return pageContents(ctx).map(function (content, i) {
      return '<div class="pdf-page" data-page="' + (i + 1) + '">' +
               '<div class="page-inner">' + content + '</div>' +
             '</div>';
    }).join("\n");
  }

  /** Injecte le rapport dans un conteneur et ajuste l'échelle d'affichage. */
  function renderPreview(container, ctx) {
    container.innerHTML = buildPages(ctx);
    fitPreview(container);
    return container.querySelectorAll(".pdf-page");
  }

  /** Réduit chaque page à la largeur disponible (aperçu écran). */
  function fitPreview(container) {
    var pages = container.querySelectorAll(".pdf-page");
    if (!pages.length) { return; }
    var avail = container.clientWidth ||
                (container.parentElement && container.parentElement.clientWidth) || 1040;
    var pagePx = 275 * 96 / 25.4;               /* 275 mm en pixels */
    var scale = Math.min(1, (avail - 4) / pagePx);
    var hauteurPx = 194 * 96 / 25.4;
    Array.prototype.forEach.call(pages, function (pg, i) {
      pg.style.transform = "scale(" + scale + ")";
      pg.style.transformOrigin = "top left";
      var slot = pg.parentElement;
      if (slot && slot.classList.contains("apercu-slot")) {
        slot.style.height = Math.ceil(hauteurPx * scale) + 26 + "px";
      }
      var leg = slot && slot.querySelector(".apercu-legende");
      if (leg) { leg.textContent = "Page " + (i + 1) + " / 6 — " + TITRES_PAGES[i]; }
    });
    container.style.setProperty("--apercu-echelle", scale);
  }

  R.esc = esc;
  R.buildPages = buildPages;
  R.pageContents = pageContents;
  R.renderPreview = renderPreview;
  R.fitPreview = fitPreview;
  R.TITRES_PAGES = TITRES_PAGES;

}(window));
