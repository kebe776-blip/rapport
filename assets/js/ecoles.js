/* =========================================================================
   ecoles.js — Listes fermées de l'inspection
   -------------------------------------------------------------------------
   • RR_ECOLES : les écoles de l'IEF de KEUR MADIABEL (liste officielle).
   • RR_CODECS : les CODEC rattachés (facultatif, mais fermé s'il est saisi).

   Ces tableaux alimentent les champs « combo » du formulaire (champs.js) :
   la saisie hors liste est REFUSÉE à la validation. Pour rattacher une
   école ou un CODEC nouveau, ajoutez simplement l'entrée ici (et relisez
   l'orthographe : une faute bloquerait la soumission de cette école).
   ========================================================================= */
(function (global) {
  "use strict";

  /* --- Écoles (101) — tri alphabétique, sans doublon --- */
  global.RR_ECOLES = [
    "BOWE",
    "DARA MODERNE MATAM",
    "DAROU SALAM MOURIDE",
    "DJISSA ALIOU",
    "EFA NGAYÉNE SINE",
    "EFA CHEIKH ABOUBACAR GASSAMA",
    "EFA KEUR MADIABEL 3",
    "EFA KEUR TAPHA",
    "EFA KEUR YERI",
    "EFA MBAKERY",
    "EFA NDIBA",
    "EFA NGUER BABOU",
    "EFA THIAMBENE",
    "EFA THIAMENE DIOGO",
    "EFA WACK NGOUNA",
    "EL HADJI OUSMANE DIALLO EX VELINGARA WALO",
    "FETTO",
    "GORIA",
    "KEUR ABDOU DIAFFE",
    "KEUR AMADY NGUENAR",
    "KEUR AMATH SEYDOU",
    "KEUR BIRANE",
    "KEUR DAME",
    "KEUR DIAGA DIALE",
    "KEUR FODÉ",
    "KEUR GORY",
    "KEUR LAHINE SAKHO",
    "KEUR MABA DIAKHOU",
    "KEUR MADIABEL 1",
    "KEUR MADIABEL 2",
    "KEUR MADIABEL 4",
    "KEUR MADIABEL 5",
    "KEUR MADY YACINE",
    "KEUR MALICK RAMATA",
    "KEUR MALO",
    "KEUR MAMADOU NENE",
    "KEUR MAMOUR COUMBA",
    "KEUR MANDONGO",
    "KEUR MANIEBE",
    "KEUR MODOU BONGUEL",
    "KEUR MOMAR ANTA",
    "KEUR NDONGO",
    "KEUR NGOR",
    "KEUR SACOUMBA",
    "KEUR SAMBA KA",
    "KEUR SAMBA YACINE",
    "KEUR SAROKHY",
    "KEUR SERIGNE BA",
    "KEUR YORO KHODIA",
    "KOTENETE",
    "KOUDOM EFA",
    "KOURANKO",
    "KOUTANGO",
    "LOUMENE OUSMANE",
    "MANDERA",
    "MBOULEDJI",
    "MEDINA THIAMENE",
    "MERALA",
    "MISSIRAH DINI",
    "NAOULEROU",
    "NDEME",
    "NDEMENEL",
    "NDIAGNE WALO",
    "NDIAGO 1",
    "NDIAGO 2",
    "NDIAYE COUNDA",
    "NDIAYENE KADD",
    "NDIAYENE MOMATH",
    "NDIAYENE POSTE",
    "NDIENGHENE IBRA",
    "NDIENGGUENE MODY",
    "NDIOBENE K GAYE",
    "NDIOBENE WALO",
    "NDRAMÉ DIMB",
    "NDRAMÉ ESCALE",
    "NDRAME PEULH",
    "NGUÉYENE MAMADY",
    "NIANGHÉNE KEUR MABA",
    "NIASSENE WALO",
    "PANE ABDOULAYE DIOP",
    "PANE SADER",
    "SABOYA",
    "SAMAKO TOUCOULEUR",
    "SAMBOUMBA",
    "SANTHIE MAKHA",
    "SANTHIE NDIOBENE",
    "SANTHIE OMAR DIAGNE",
    "TAIBA MBAYENE",
    "THIAMENE KEUR MASSAMBA",
    "THIAMENE MAKA",
    "THIAMENE MOMATH BINTA",
    "THIAMENE OUSMANE",
    "THIARENE DJISSA",
    "THIARENE MATAR",
    "THILLA GALLO",
    "THILLA GRAND",
    "THILLA NDIAYE",
    "THIOYENE",
    "THIWALO",
    "TOUBA 2",
    "WACK NGOUNA"
  ];

  /* --- Communes de l'IEF (5) — liste officielle, fermée --- */
  global.RR_COMMUNES = [
    "KEUR MABA DIAKHOU",
    "KEUR MADIABEL",
    "KEUR MANDONGO",
    "NDRAMÉ ESCALE",
    "WACK NGOUNA"
  ];

  /* --- CODEC (15) — facultatif, mais fermé s'il est saisi --- */
  global.RR_CODECS = [
    "KEUR DAME",
    "KEUR MABA DIAKHOU",
    "KEUR MADIABEL 1",
    "KEUR MADIABEL 2",
    "KEUR MADY YACINE",
    "KEUR YORO",
    "KOUTANGO",
    "MANDERA",
    "NDIOBENE WALO",
    "NDRAMÉ ESCALE",
    "NDRAME PEULH",
    "TAIBA MBAYENE",
    "THILLA GRAND",
    "VELINGARA WALO",
    "WACK NGOUNA"
  ];

}(window));
