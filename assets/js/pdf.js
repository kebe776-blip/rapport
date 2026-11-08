/* =========================================================================
   pdf.js — Génération du PDF A4 PAYSAGE directement dans le navigateur
   Une image par <div class="pdf-page"> (275 x 194 mm) → jsPDF (297 x 210 mm),
   marges officielles 11 mm latérales / 8 mm verticales.
   Aucun serveur requis : fonctionne aussi hors-ligne.
   ========================================================================= */
(function (global) {
  "use strict";

  var R = global.RR = global.RR || {};

  var PAGE_W = 275, PAGE_H = 194;   /* mm — zone utile */
  var MARGE_X = 11, MARGE_Y = 8;    /* mm — marges officielles */

  /** Nettoie une chaîne pour en faire un nom de fichier sûr. */
  function safeName(s) {
    return String(s || "ECOLE")
      .normalize ? String(s || "ECOLE").replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")
      : "ECOLE";
  }

  /**
   * Génère et retourne l'objet jsPDF des 6 pages.
   * @param {NodeList|Array} pageEls  éléments .pdf-page affichés à l'écran
   * @param {Object} ctx              contexte (pour le nom de fichier)
   * @param {Function} onProgress     (i, total) => void
   */
  async function generate(pageEls, ctx, onProgress) {
    var jsPDF = global.jspdf && global.jspdf.jsPDF;
    if (!jsPDF) { throw new Error("jsPDF non chargé."); }
    if (typeof global.html2canvas !== "function") {
      throw new Error("html2canvas non chargé.");
    }

    var doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    });

    var pages = Array.prototype.slice.call(pageEls);
    var total = pages.length;

    for (var i = 0; i < total; i++) {
      var el = pages[i];

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

      if (i > 0) { doc.addPage("a4", "landscape"); }
      var data = canvas.toDataURL("image/jpeg", 0.92);
      doc.addImage(data, "JPEG", MARGE_X, MARGE_Y, PAGE_W, PAGE_H,
                   undefined, "FAST");

      canvas.width = canvas.height = 0;   /* libère la mémoire */
      if (onProgress) { onProgress(i + 1, total); }
    }

    doc.__nomFichier = nomFichier(ctx);
    return doc;
  }

  /** Nom officiel : Rapport_Rentree_NOM_ECOLE_2025-2026.pdf */
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
    nomFichier: nomFichier,
    safeName: safeName
  };

}(window));
