/* ============================================================
   sections/services.js — Grid de serviços com filtros
   ============================================================ */

(function () {
  "use strict";
  const { qs, qsa, el, BRL, track } = window.Helpers;

  function serviceCard(s) {
    const hasPromo = s.promoPrice != null && s.promoPrice < s.price;
    const priceBlock = el("div", { class: "price-block" }, [
      hasPromo
        ? el("span", { class: "price price--old", text: BRL(s.price) })
        : null,
      el("span", {
        class: "price" + (hasPromo ? " price--promo" : ""),
        text: BRL(hasPromo ? s.promoPrice : s.price)
      })
    ]);

    return el("article", { class: "card card--hover service-card", "data-category": s.category }, [
      el("div", { class: "service-card__media" }, [
        el("img", { src: s.image, alt: s.name, loading: "lazy", width: 640, height: 400 })
      ]),
      el("div", { class: "service-card__body" }, [
        el("h3", { class: "service-card__title", text: s.name }),
        el("p", { class: "service-card__desc", text: s.description }),
        el("div", { class: "service-card__meta" }, [
          Icons.el("clock", 16),
          el("span", { text: `${s.duration} min` })
        ]),
        el("div", { class: "service-card__footer" }, [
          priceBlock,
          el("button", {
            class: "btn btn--primary btn--sm",
            type: "button",
            "data-book-service": s.id,
            text: "Agendar"
          })
        ])
      ])
    ]);
  }

  async function init() {
    const grid = qs("#services-grid");
    const filtersWrap = qs("#services-filters");
    if (!grid) return;

    grid.innerHTML = '<div class="state"><span class="spinner" role="status" aria-label="Carregando serviços"></span>Carregando serviços…</div>';

    const [services, categories] = await Promise.all([
      window.API.getServices(),
      window.API.getServiceCategories()
    ]);

    if (!services.length) {
      grid.innerHTML = '<div class="state"><span class="state__icon">✂️</span>Nenhum serviço disponível no momento.</div>';
      return;
    }

    // Filtros
    filtersWrap.replaceChildren();
    const state = { current: "todos" };
    categories.forEach((c, i) => {
      const btn = el("button", {
        class: "filter-btn" + (i === 0 ? " is-active" : ""),
        type: "button",
        text: c.label
      });
      btn.addEventListener("click", () => {
        state.current = c.id;
        qsa(".filter-btn", filtersWrap).forEach((b) => b.classList.toggle("is-active", b === btn));
        qsa("[data-category]", grid).forEach((card) => {
          const show = c.id === "todos" || card.dataset.category === c.id;
          card.style.display = show ? "" : "none";
        });
      });
      filtersWrap.appendChild(btn);
    });

    grid.replaceChildren(...services.map(serviceCard));

    // Botões "Agendar" → abrem wizard pré-selecionado
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-book-service]");
      if (!btn) return;
      const svc = services.find((s) => s.id === btn.dataset.bookService);
      if (svc && window.BookingWizard) window.BookingWizard.open({ service: svc });
    });

    window.__SERVICES__ = services; // referência para o wizard
  }

  window.SectionsServices = { init };
})();
