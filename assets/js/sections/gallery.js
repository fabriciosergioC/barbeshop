/* ============================================================
   sections/gallery.js — Galeria + lightbox + antes/depois
   ============================================================ */

(function () {
  "use strict";
  const { qs, qsa, el, track } = window.Helpers;

  /* ---------------- Lightbox ---------------- */
  function initLightbox(items, onIndexChange) {
    const lb = qs("#lightbox");
    const img = qs(".lightbox img", lb);
    const cap = qs(".lightbox__caption", lb);
    let idx = 0;

    function show(i) {
      idx = (i + items.length) % items.length;
      img.src = items[idx].image;
      img.alt = items[idx].title || "";
      cap.textContent = items[idx].title || "";
      if (onIndexChange) onIndexChange(idx);
    }
    function open(i) { show(i); lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
    function close() { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }

    qs(".lightbox__close", lb).addEventListener("click", close);
    qs(".lightbox__nav--prev", lb).addEventListener("click", () => show(idx - 1));
    qs(".lightbox__nav--next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });

    return { open, close };
  }

  /* ---------------- Galeria ---------------- */
  async function initGallery() {
    const grid = qs("#gallery-grid");
    const filtersWrap = qs("#gallery-filters");
    if (!grid) return;

    const [items, categories] = await Promise.all([
      window.API.getGallery(),
      Promise.resolve(window.DEMO_DATA.galleryCategories)
    ]);

    const lightbox = initLightbox(items);

    function render(catId) {
      const visible = items
        .map((it, i) => ({ it, i }))
        .filter(({ it }) => catId === "todos" || it.category === catId);
      grid.replaceChildren(...visible.map(({ it, i }) =>
        el("figure", { class: "gallery-item", "data-index": i }, [
          el("img", { src: it.image, alt: it.title, loading: "lazy", width: 480, height: 480 }),
          el("figcaption", { class: "caption", text: it.title })
        ])
      ));
    }

    filtersWrap.replaceChildren();
    categories.forEach((c, i) => {
      const btn = el("button", {
        class: "filter-btn" + (i === 0 ? " is-active" : ""),
        type: "button",
        text: c.label
      });
      btn.addEventListener("click", () => {
        qsa(".filter-btn", filtersWrap).forEach((b) => b.classList.toggle("is-active", b === btn));
        render(c.id);
      });
      filtersWrap.appendChild(btn);
    });

    grid.addEventListener("click", (e) => {
      const fig = e.target.closest(".gallery-item");
      if (fig) lightbox.open(Number(fig.dataset.index));
    });

    render("todos");
  }

  /* ---------------- Antes / Depois ---------------- */
  function bindBeforeAfter(itemEl) {
    const afterImg = qs(".ba-after", itemEl);
    const handle = qs(".ba-handle", itemEl);
    const slider = qs(".ba-slider", itemEl);
    let dragging = false;

    function setPos(clientX) {
      const rect = slider.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
      afterImg.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = pct + "%";
    }

    handle.addEventListener("pointerdown", (e) => { dragging = true; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener("pointermove", (e) => { if (dragging) setPos(e.clientX); });
    handle.addEventListener("pointerup", () => { dragging = false; });
    handle.addEventListener("pointercancel", () => { dragging = false; });
    slider.addEventListener("click", (e) => setPos(e.clientX));
  }

  async function initBeforeAfter() {
    const grid = qs("#beforeafter-grid");
    if (!grid) return;
    const items = await window.API.getBeforeAfter();

    grid.replaceChildren(...items.map((item) => {
      const card = el("article", { class: "card card--hover ba-item" }, [
        el("div", { class: "ba-slider" }, [
          el("img", { src: item.before, alt: `Antes — ${item.title}`, loading: "lazy" }),
          el("img", { class: "ba-after", src: item.after, alt: `Depois — ${item.title}`, loading: "lazy" }),
          el("span", { class: "ba-tag ba-tag--before", text: "ANTES" }),
          el("span", { class: "ba-tag ba-tag--after", text: "DEPOIS" }),
          el("div", { class: "ba-handle", role: "slider", "aria-label": "Comparar antes e depois", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": 50, tabindex: 0 })
        ]),
        el("div", { class: "ba-info" }, [
          el("h3", { text: item.title }),
          el("p", { text: `${item.service} • ${item.barber}` }),
          el("p", { text: item.description })
        ]),
        el("div", { style: "padding: 0 var(--space-5) var(--space-5);" }, [
          el("button", { class: "btn btn--outline btn--block", type: "button", text: "Quero esse resultado", "data-open-booking": "" })
        ])
      ]);
      bindBeforeAfter(card);
      return card;
    }));

    grid.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-booking]") && window.BookingWizard) {
        track("click_agendar", { source: "before_after" });
        window.BookingWizard.open({});
      }
    });
  }

  window.SectionsGallery = { initGallery, initBeforeAfter };
})();
