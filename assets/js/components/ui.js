/* ============================================================
   components/ui.js — Interações gerais da página
   ============================================================ */

(function () {
  "use strict";
  const { qs, qsa, el, storage, setConsent, hasConsent, track, openWhatsApp } = window.Helpers;

  /* ---------------- Header sticky ---------------- */
  function initHeader() {
    const header = qs("#header");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- Menu mobile ---------------- */
  function initMobileMenu() {
    const burger = qs("#hamburger");
    const nav = qs("#nav");
    if (!burger || !nav) return;

    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- Indicador aberto/fechado ---------------- */
  function initOpenStatus() {
    const indicators = qsa("[data-open-status]");
    if (!indicators.length) return;

    const hours = window.BUSINESS_CONFIG.businessHours || {};
    const now = new Date();
    const h = hours[now.getDay()];
    const openNow = !!h && now.getHours() * 60 + now.getMinutes() >= window.Helpers.hhmmToMinutes(h.open) &&
                    now.getHours() * 60 + now.getMinutes() < window.Helpers.hhmmToMinutes(h.close);

    indicators.forEach((elm) => {
      elm.classList.toggle("is-closed", !openNow);
      elm.querySelector("[data-status-text]").textContent = openNow
        ? `Aberto agora · até ${h.close}`
        : "Fechado agora";
    });
  }

  /* ---------------- Animações de entrada ---------------- */
  function initReveal() {
    const items = qsa("[data-animate]");
    if (!items.length || !("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach((i) => io.observe(i));
  }

  /* ---------------- Popups estratégicos ---------------- */
  const POPUP_SEEN = "bb_popup_seen_at";

  function showPopup(title, text, ctaLabel) {
    const overlay = el("div", { class: "popup-overlay", role: "dialog", "aria-modal": "true", "aria-label": title });
    const popup = el("div", { class: "popup" }, [
      el("button", { class: "popup__close", type: "button", "aria-label": "Fechar" }, [Icons.el("x", 16)]),
      el("h3", { text: title }),
      el("p", { text: text }),
      el("button", { class: "btn btn--primary btn--block", type: "button", text: ctaLabel || "Agendar meu horário" })
    ]);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    const close = () => { overlay.remove(); storage.set(POPUP_SEEN, Date.now()); };
    popup.querySelector(".popup__close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
    popup.querySelector(".btn--primary").addEventListener("click", () => {
      close();
      if (window.BookingWizard) window.BookingWizard.open({});
    });
    setTimeout(() => overlay.classList.add("is-open"), 30);
  }

  function initPopups() {
    const cfg = (window.BUSINESS_CONFIG.popups || {});
    const seenAt = storage.get(POPUP_SEEN, 0);
    const COOLDOWN = 24 * 60 * 60 * 1000; // não repetir em 24h
    if (Date.now() - seenAt < COOLDOWN) return;
    if (window.Helpers.storage.get(window.Helpers.CONSENT_KEY, false) === null) { /* sem consentimento ainda: popup é first-party, ok */ }

    // Primeira visita
    if (cfg.firstVisit && cfg.firstVisit.enabled && !storage.get("bb_returning", false)) {
      storage.set("bb_returning", true);
      setTimeout(() => showPopup(cfg.firstVisit.title, cfg.firstVisit.text), (cfg.firstVisit.delaySeconds || 18) * 1000);
      return;
    }
    // Exit intent (desktop)
    if (cfg.exitIntent && cfg.exitIntent.enabled) {
      document.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget && e.clientY < 8) {
          showPopup(cfg.exitIntent.title, cfg.exitIntent.text);
        }
      }, { once: true });
    }
  }

  /* ---------------- Banner LGPD ---------------- */
  function initLgpd() {
    // Já escolheu? Não mostra novamente.
    if (storage.get("bb_lgpd_choice", null) !== null) return;

    const banner = qs("#lgpd-banner");
    if (!banner) return;
    banner.classList.add("is-visible");

    const accept = banner.querySelector("[data-lgpd-accept]");
    const reject = banner.querySelector("[data-lgpd-reject]");
    const decide = (v) => {
      setConsent(v);
      storage.set("bb_lgpd_choice", v);
      banner.classList.remove("is-visible");
    };
    accept.addEventListener("click", () => decide(true));
    reject.addEventListener("click", () => decide(false));
  }

  /* ---------------- CTA flutuante mobile ---------------- */
  function initFloat() {
    document.body.classList.add("has-float-cta");
    qsa("[data-float-booking]").forEach((b) =>
      b.addEventListener("click", () => window.BookingWizard && window.BookingWizard.open({}))
    );
    qsa("[data-float-wa]").forEach((b) =>
      b.addEventListener("click", () => openWhatsApp())
    );
  }

  window.UI = { initHeader, initMobileMenu, initOpenStatus, initReveal, initPopups, initLgpd, initFloat };
})();
