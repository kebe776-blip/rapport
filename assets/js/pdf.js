/* =========================================================================
   pdf.js — Génération du PDF A4 directement dans le navigateur
   Une image par <div class="pdf-page"> → jsPDF (A4), marges officielles
   11 mm latérales / 8 mm verticales.
   Orientation PAR PAGE : paysage par défaut (275 x 194 mm) ; une page
   portant data-orientation="portrait" est produite en portrait
   (188 x 281 mm) — rapport succinct préscolaire (page 2).
   Aucun serveur requis : fonctionne aussi hors-ligne.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR = global.RR || {};

  var PAGE_W = 275, PAGE_H = 194;   /* mm — zone utile PAYSAGE */
  var PORT_W = 188, PORT_H = 281;   /* mm — zone utile PORTRAIT (page 2) */
  var MARGE_X = 11, MARGE_Y = 8;    /* mm — marges officielles */

  /* Bibliothèques lourdes (≈ 550 Ko) : téléchargées à la 1re génération,
     pas à l'ouverture de la page (gain ≈ 550 Ko sur le 1er chargement). */
  var LIB_PDF = ["assets/vendor/html2canvas.min.js",
                 "assets/vendor/jspdf.umd.min.js"];
  var prete = null;

  /** Promesse unique de chargement des bibliothèques PDF (réutilisable). */
  function precharger() {
    if (!prete) {
      prete = R.chargerScripts(LIB_PDF).catch(function (e) {
        prete = null;                   /* échec : on pourra réessayer */
        throw e;
      });
    }
    return prete;
  }

  /** Nettoie une chaîne pour en faire un nom de fichier sûr. */
  function safeName(s) {
    return String(s || "ECOLE")
      .normalize ? String(s || "ECOLE").replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
      : "ECOLE";
  }

  /**
   * Génère et retourne l'objet jsPDF des pages (paysage et/ou portrait).
   * @param {NodeList|Array} pageEls  éléments .pdf-page affichés à l'écran
   * @param {Object} ctx              contexte (pour le nom de fichier)
   * @param {Function} onProgress     (i, total) => void
   */
  async function generate(pageEls, ctx, onProgress) {
    await precharger();                 /* jsPDF + html2canvas au 1er usage */
    var jsPDF = global.jspdf && global.jspdf.jsPDF;
    if (!jsPDF) { throw new Error("jsPDF non chargé."); }
    if (typeof global.html2canvas !== "function") {
      throw new Error("html2canvas non chargé.");
    }

    var doc = null;                   /* créé sur la page 1 (orientation) */

    var pages = Array.prototype.slice.call(pageEls);
    var total = pages.length;

    for (var i = 0; i < total; i++) {
      var el = pages[i];

      /* Orientation PAR PAGE : data-orientation="portrait" (rapport succinct
         préscolaire : page 2). Sans attribut → paysage : comportement
         strictement identique à avant pour les 6 pages élémentaires. */
      var portrait = el.getAttribute("data-orientation") === "portrait";
      var orient = portrait ? "portrait" : "landscape";
      var largeur = portrait ? PORT_W : PAGE_W;
      var hauteur = portrait ? PORT_H : PAGE_H;

      if (i === 0) {
        doc = new jsPDF({
          orientation: orient,
          unit: "mm",
          format: "a4",
          compress: true
        });
      } else {
        doc.addPage("a4", orient);
      }

      /* On capture la page à taille réelle (l'échelle d'aperçu est neutralisée). */
      var transforme = el.style.transform;
      var slot = el.parentElement;
      var overflowSlot = slot ? slot.style.overflow : "";
      el.style.transform = "none";
      if (slot) { slot.style.overflow = "visible"; }

      var canvas;
      try {
        canvas = await global.html2canvas(el, {
          scale: 2,                    /* ~190 dpi : net et léger */
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 15000,
          width: el.scrollWidth,
          height: el.scrollHeight,
          windowWidth: document.documentElement.clientWidth,
          windowHeight: document.documentElement.clientHeight
        });
      } finally {
        el.style.transform = transforme;
        if (slot) { slot.style.overflow = overflowSlot; }
      }

      var data = canvas.toDataURL("image/jpeg", 0.92);
      doc.addImage(data, "JPEG", MARGE_X, MARGE_Y, largeur, hauteur,
                   undefined, "FAST");

      canvas.width = canvas.height = 0;   /* libère la mémoire */
      if (onProgress) { onProgress(i + 1, total); }
    }

    doc.__nomFichier = nomFichier(ctx);
    return doc;
  }

  /** Nom officiel : Rapport_Rentree_NOM_ECOLE_2026-2027.pdf */
  function nomFichier(ctx) {
    var ecole = ((ctx && ctx.meta && ctx.meta.ecole) || "ECOLE")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    var annee = ((ctx && ctx.meta && ctx.meta.annee) || "0000-0000")
      .replace("/", "-");
    return "Rapport_Rentree_" + (ecole || "ECOLE") + "_" + annee + ".pdf";
  }

  /** Génère puis déclenche le téléchargement automatique. */
  async function download(pageEls, ctx, onProgress) {
    var doc = await generate(pageEls, ctx, onProgress);
    doc.save(doc.__nomFichier || nomFichier(ctx));
    return doc.__nomFichier;
  }

  R.pdf = {
    generate: generate,
    download: download,
    precharger: precharger,
    nomFichier: nomFichier,
    safeName: safeName
  };

}(window));
