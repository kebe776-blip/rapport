/* =========================================================================
   xlsx-modele.js - En-tetes, fusions et largeurs des feuilles du modele
   officiel « STRUCTURES ET EFFECTIFS ELEMENTAIRES » (Academie de Kaolack).
   -------------------------------------------------------------------------
   Genere a partir du fichier modele : seules les lignes d'en-tete sont
   reprises, les lignes de donnees sont reconstruites par xlsx-export.js
   a partir des rapports soumis. Fusions en indices 0-based [r0,c0,r1,c1].
   ========================================================================= */
window.RR_MODELE = {
  type_classe: {
    titre: "FEUILLE DE SYNTHESE DES CLASSES SPECIALES",
    lignes_entete: 4,
    decalage: 0,
    nb_colonnes: 171,
    entetes: [["N°","Etablissement","Nombre de classes","Nombre de CL simples","Nombre de CMG","Nombre de CDF","CLASSES SIMPLES","","","","","","CLASSES MULTIGRADES","","","","","","","","","","","","","","","CLASSES DOUBLE FLUX","","","","","","EFFECTIFS DANS LES CLASSES SIMPLES","","","","","","","","","","","","","","","","","","Total Effectifs élèves dans les Classes simples","","","Effectifs dans les CMG","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","Effectifs élèves dans les CDF","","","","","","","","","","","","","","","","","","","","","TOTAL GENERAL ECOLE","",""],["","","","","","","CI","CP","CE1","CE2","CM1","CM2","CI/CP","CE1/CE2","CM1/CM2","CP/CE1","CE2/CM1","CI/CE1","CI/CE2","CI/CM1","CI/CM2","CP/CE2","CP/CM1","CP/CM2","CE1/CM1","CE1/CM2","CE2/CM2","CI","CP","CE1","CE2","CM1","CM2","CI","","","CP","","","CE1","","","CE2","","","CM1","","","CM2","","","","","","CI/CP","","","","","","CE1/CE2","","","","","","CM1/CM2","","","","","","CP/CE1","","","","","","CE2/CM1","","","","","","CI/CE1","","","","","","CI/CE2","","","","","","CI/CM1","","","","","","CI/CM2","","","","","","CP/CE2","","","","","","CP/CM1","","","","","","CP/CM2","","","","","","CE1/CM1","","","","","","CE1/CM2","","","","","","CE2/CM2","","","","","","","","","CI","","","CP","","","CE1","","","CE2","","","CM1","","","CM2","","","TOTAL EFFECTIFS DANS LES CDF","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","GP1","","","GP2","","","GP1","","","GP2","","","CP1","","","CP2","","","GP1","","","CP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","GP1","","","GP2","","","TOTAL effectifs CMG","","","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","Garçons","Filles","Total","Garçons","Filles","Total","Garçons","Filles","Total","Garçons","Filles","Total","Garçons","Filles","Total","Garçons","Filles","Total","Garçons","Filles","Total","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T","G","F","T"]],
    merges: [[3,0,6,0],[3,1,6,1],[3,2,6,2],[3,3,6,3],[3,4,6,4],[3,5,6,5],[3,6,3,11],[3,12,3,26],[3,27,3,32],[3,33,3,50],[3,51,5,53],[3,54,3,146],[3,147,3,167],[3,168,5,170],[4,6,6,6],[4,7,6,7],[4,8,6,8],[4,9,6,9],[4,10,6,10],[4,11,6,11],[4,12,6,12],[4,13,6,13],[4,14,6,14],[4,15,6,15],[4,16,6,16],[4,17,6,17],[4,18,6,18],[4,19,6,19],[4,20,6,20],[4,21,6,21],[4,22,6,22],[4,23,6,23],[4,24,6,24],[4,25,6,25],[4,26,6,26],[4,27,6,27],[4,28,6,28],[4,29,6,29],[4,30,6,30],[4,31,6,31],[4,32,6,32],[4,33,5,35],[4,36,5,38],[4,39,5,41],[4,42,5,44],[4,45,5,47],[4,48,5,50],[4,54,4,59],[4,60,4,65],[4,66,4,71],[4,72,4,77],[4,78,4,83],[4,84,4,89],[4,90,4,95],[4,96,4,101],[4,102,4,107],[4,108,4,113],[4,114,4,119],[4,120,4,125],[4,126,4,131],[4,132,4,137],[4,138,4,143],[4,147,5,149],[4,150,5,152],[4,153,5,155],[4,156,5,158],[4,159,5,161],[4,162,5,164],[4,165,5,167],[5,54,5,56],[5,57,5,59],[5,60,5,62],[5,63,5,65],[5,66,5,68],[5,69,5,71],[5,72,5,74],[5,75,5,77],[5,78,5,80],[5,81,5,83],[5,84,5,86],[5,87,5,89],[5,90,5,92],[5,93,5,95],[5,96,5,98],[5,99,5,101],[5,102,5,104],[5,105,5,107],[5,108,5,110],[5,111,5,113],[5,114,5,116],[5,117,5,119],[5,120,5,122],[5,123,5,125],[5,126,5,128],[5,129,5,131],[5,132,5,134],[5,135,5,137],[5,138,5,140],[5,141,5,143],[5,144,5,146]],
    largeurs: [6.0,38.4,11.4,null,null,null,null,null,null,null,null,null,6.4,8.9,9.0,8.9,null,null,null,9.3,null,8.6,10.1,9.9,10.6,10.7,null,5.0,4.1,5.3,null,5.7,null,8.6,8.0,null,8.6,8.0,null,8.6,8.0,null,8.6,8.0,null,8.6,8.0,null,8.6,8.0,null,9.6,null,9.6,8.0,null,null,8.0,null,8.0,8.0,null,null,8.0,null,null,6.6,null,8.0,6.6,null,8.0,6.6,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,5.0,null,null,null,null,null,null,null,6.6,5.0,null,null,null,6.6,null,5.0,null,6.6,5.0,6.6,null,5.0,null,6.6,5.0,null,null,null,null,null,null,null,6.6,5.0,null,null,6.6,null,null,null,null,null,5.0,null,6.6,5.0,null,6.6,5.0,6.6,null,5.0,null,6.6,8.0,9.6,null,6.6,10.9,null,null,null,null,null,null,null,null,null,null,null,null,null,11.4,10.9,null,10.9,null,null,10.9,null,null]
  },
  personnel: {
    titre: "FEUILLE DE SYNTHESE SUR  LE PERSONNEL ENSEIGNANT",
    lignes_entete: 3,
    decalage: 1,
    nb_colonnes: 51,
    entetes: [["N°","Etablissement","Statut","Nbre cours","INSTITUTEURS","","","","","","INSTITUTEURS ADJOINTS","","","","","","MAITRES CONTRACTUELS","","","","","","AUTRES","","","","","","TOTAL PERSONNEL","","","","","","DIRECTEURS","","","","","","","","","","PERSONNELS NON TITULAIRES DE CLASSE","","","SURPLUS","","DEFICIT",""],["","","","","Français","","","Arabe","","","Français","","","Arabe","","","Français","","","Arabe","","","Français","","","Arabe","","","Français","","","Arabe","","","","","","","","","","","","","","","","","","",""],["","","","","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Hommes","Femmes","Total","Homme","Femme","Chargé","Déchargé","Titulaire","Interimaire","Institut.","Instit. Adjt","MC","Autre","Supléant","Malade","Congé Mat.","FR","AR","FR","AR"]],
    merges: [[4,0,6,0],[4,1,6,1],[4,2,6,2],[4,3,6,3],[4,4,4,9],[4,10,4,15],[4,16,4,21],[4,22,4,27],[4,28,4,33],[4,34,5,43],[4,44,5,46],[4,47,5,48],[4,49,5,50],[5,4,5,6],[5,7,5,9],[5,10,5,12],[5,13,5,15],[5,16,5,18],[5,19,5,21],[5,22,5,24],[5,25,5,27],[5,28,5,30],[5,31,5,33]],
    largeurs: [6.4,57.6,9.6,8.6,11.7,11.4,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,8.7,8.4,8.4,9.6,9.3,11.9,8.4,11.0,4.9,6.6,11.4,null,null,null,null,null,null]
  },
  liste_personnel: {
    titre: "LISTE DES ENSEIGNANTS DE L'ELEMENTAIRE",
    lignes_entete: 1,
    decalage: 1,
    nb_colonnes: 17,
    entetes: [["N°","ETABLISSEMENT","PRENOM","NOM","SEXE","GRADE","Matricule","FONCTION","Discipline","DIPL. ACAD","DIPL. PROF","Date d’entrée enseignement","Date affectation école","Cours tenu","CONTACT","Colonne1","Colonne2"]],
    merges: [],
    largeurs: [5.4,41.3,37.9,25.0,null,null,13.1,14.0,13.1,14.9,14.4,33.0,26.4,14.3,16.3,14.4,15.1]
  },
  ouvrages: {
    titre: "FEUILLE DE SYNTHESE DES OUVRAGES ANNEXES",
    lignes_entete: 2,
    decalage: 1,
    nb_colonnes: 27,
    entetes: [["N°","Etablissement","Classes en dur","Utilisées","Non utilisées","Abris provisoires","A Réhabiliter","BLOCS D'HYGIENE","Colonne1","Colonne2","POINT D'EAU","Colonne3","Colonne4","Colonne5","ELECTRICITE","Colonne6","Bloc Administ.","Magasin","Clôture","Cuisine","Cantine","Coopérative scolaire","Jardin","Malette pédagogique","Bibliothèque","Terrain","Boite pharmacie"],["","","","","","","","Nbre Cabines","Fonct.","Non fonct.","Robinet","Puits","Fonct.","Non fonct.","Réseau","Solaire","","","","","","","","","","",""]],
    merges: [],
    largeurs: [6.9,57.4,15.4,10.9,13.9,17.1,14.4,21.4,11.0,null,16.0,11.0,null,null,16.6,11.4,15.6,11.4,null,12.1,11.4,19.9,11.4,20.4,13.6,11.4,16.9]
  },
  mobilier: {
    titre: "FEUILLE DE SYNTHESE SUR LE MOBILIER ET LES EQUIPEMENTS",
    lignes_entete: 2,
    decalage: 1,
    nb_colonnes: 42,
    entetes: [["N°","Etablissement","TABLES BANCS","","","","TABLES BUREAUX MAITRE","","","","CHAISES","","","","ARMOIRES","","","","PLACARDS","","","","TABLEAUX","","","","ORDINATEURS","","","","IMPRIMANTES","","","","VIDEO PROJECTEURS","","","","PHOTOCOPIEUSES","","",""],["","","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit","Bon","A réparer","Total","Déficit"]],
    merges: [[4,0,5,0],[4,1,5,1],[4,2,4,5],[4,6,4,9],[4,10,4,13],[4,14,4,17],[4,18,4,21],[4,22,4,25],[4,26,4,29],[4,30,4,33],[4,34,4,37],[4,38,4,41]],
    largeurs: [6.6,48.3,9.4,11.4,9.1,7.6,8.3,10.4,7.3,7.6,9.0,10.4,8.1,7.6,7.1,10.4,6.1,7.6,6.3,10.4,6.1,7.6,7.4,10.4,8.9,7.6,5.9,10.4,6.1,7.6,5.1,10.4,6.1,7.6,5.1,10.4,6.1,7.6,5.1,10.4,6.1,7.6]
  },
  manuels: {
    titre: "FEUILLE DE SYNTHESE DES MANUELS ET MATERIELS DIDACTIQUES",
    lignes_entete: 1,
    decalage: 1,
    nb_colonnes: 44,
    entetes: [["N°","Etablissement","Année de création","Statut","Maths CI","Français CI","Maths CP","Français CP","Guide Maths CI/CP","Guide Français CI/CP","Maths CE1","Français CE1","Maths CE2","Français CE2","Découverte du monde CE1","Découverte du monde CE2","Guide Maths CE1/CE2","Guide Français CE1/CE2","Guide Déc du monde CE1/CE2","Maths CM1","Français CM1","Maths CM2","Français CM2","Découverte du monde CM1","Découverte du monde CM2","Guide Maths CM1/CM2","Guide Français CM1/CM2","Guide Déc du monde CM1/CM2","Guide révisé","Dictionnaire","Equerre","Rapporteur","Compas","Règle plate","Décamètre","Mètre pliant","Balance","Poids","Globe Terrestre","Carte murale","Chaine d’arpenteur","Cachet","Encreur","Seau"]],
    merges: [],
    largeurs: [5.7,44.9,10.9,null,7.7,9.1,7.9,8.4,8.6,9.3,7.1,8.6,7.4,9.3,11.1,11.0,9.4,9.9,null,7.6,9.1,7.0,9.7,null,null,null,null,null,null,11.7,8.3,null,8.7,null,null,7.4,8.6,6.4,9.1,8.6,null,7.6,8.1,5.9]
  }
};
