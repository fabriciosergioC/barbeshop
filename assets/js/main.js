/* ============================================================
   main.js — Bootstrap da aplicação
   Ordem de inicialização: config → dados → seções → interações
   ============================================================ */

(function () {
  "use strict";
  const H = window.Helpers;

  document.addEventListener("DOMContentLoaded", () => {
    // 1. Configuração → DOM (placeholders [X] permanecem visíveis até preencher)
    H.applyConfigToDom();

    // 2. Interações base
    window.UI.initHeader();
    window.UI.initMobileMenu();
    window.UI.initOpenStatus();
    window.UI.initReveal();
    window.UI.initLgpd();
    window.UI.initFloat();

    // 3. Wizard de agendamento
    window.BookingWizard.init();

    // 4. Seções dinâmicas
    window.SectionsServices.init();
    window.SectionsGallery.initGallery();
    window.SectionsGallery.initBeforeAfter();
    window.SectionsTeam.initBarbers();
    window.SectionsTeam.initStats();
    window.SectionsTeam.initReviews();
    window.SectionsTeam.initPlans();
    window.SectionsFaq.initFaq();
    window.SectionsFaq.initAbout();

    // 5. Popups (por último, para não atrapalhar o carregamento)
    window.UI.initPopups();

    // 6. PWA: service worker (https ou localhost)
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch(() => { /* PWA opcional */ });
    }

    // 7. Analytics
    H.track("page_view", { path: location.pathname });
  });
})();
