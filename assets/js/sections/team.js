/* ============================================================
   sections/team.js — Barbeiros, stats, avaliações e planos
   ============================================================ */

(function () {
  "use strict";
  const { qs, qsa, el, BRL, track } = window.Helpers;

  /* ---------------- Barbeiros ---------------- */
  async function initBarbers() {
    const grid = qs("#barbers-grid");
    if (!grid) return;

    const barbers = await window.API.getBarbers();
    if (!barbers.length) {
      grid.innerHTML = '<div class="state">Equipe em atualização.</div>';
      return;
    }

    grid.replaceChildren(...barbers.map((b) => {
      const social = el("div", { class: "barber-card__social" });
      if (b.instagram) {
        social.appendChild(el("a", { href: b.instagram, target: "_blank", rel: "noopener", "aria-label": `Instagram de ${b.name}` }, [Icons.el("instagram", 18)]));
      }

      return el("article", { class: "card card--hover barber-card" }, [
        el("img", { class: "barber-card__photo", src: b.photo, alt: `Foto de ${b.name}`, loading: "lazy", width: 480, height: 480 }),
        el("div", { class: "barber-card__body" }, [
          el("h3", { class: "barber-card__name", text: b.name }),
          el("span", { class: "barber-card__role", text: b.role }),
          el("div", { class: "barber-card__stars" }, [
            el("span", { text: "★".repeat(Math.round(b.rating)) + "☆".repeat(5 - Math.round(b.rating)) }),
            el("small", { text: ` ${b.rating.toFixed(1)} • ${b.appointments.toLocaleString("pt-BR")} atendimentos` })
          ]),
          el("div", { class: "barber-card__tags" }, b.specialties.map((s) => el("span", { class: "badge", text: s }))),
          el("button", { class: "btn btn--outline btn--sm", type: "button", "data-book-barber": b.id, text: "Agendar com " + b.name.split(" ")[0] })
        ]),
        social
      ]);
    }));

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-book-barber]");
      if (!btn) return;
      const barber = barbers.find((b) => b.id === btn.dataset.bookBarber);
      if (barber && window.BookingWizard) window.BookingWizard.open({ barberId: barber.id });
    });

    window.__BARBERS__ = barbers;
  }

  /* ---------------- Stats animados ---------------- */
  async function initStats() {
    const grid = qs("#stats-grid");
    if (!grid) return;
    const stats = await window.API.getStats();

    grid.replaceChildren(...stats.map((s) =>
      el("div", { class: "stat" }, [
        el("div", {
          class: "stat__value",
          "data-count-to": s.value,
          "data-decimals": s.decimals || 0,
          text: "0" + (s.suffix || "")
        }),
        el("div", { class: "stat__label", text: s.label })
      ])
    ));

    // Contagem animada ao entrar na viewport
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (elm) => {
      const target = parseFloat(elm.dataset.countTo);
      const decimals = parseInt(elm.dataset.decimals || "0", 10);
      const suffix = elm.textContent.replace(/^[\d.,]+/, "");
      if (reduceMotion) { elm.textContent = target.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; return; }
      const t0 = performance.now(), dur = 1400;
      (function tick(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        elm.textContent = (target * eased).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    qsa("[data-count-to]", grid).forEach((n) => io.observe(n));
  }

  /* ---------------- Avaliações ---------------- */
  async function initReviews() {
    const track_ = qs("#reviews-track");
    const scoreEl = qs("#reviews-score");
    if (!track_) return;

    const reviews = await window.API.getReviews();
    if (!reviews.length) {
      track_.innerHTML = '<div class="state">Avaliações em breve.</div>';
      return;
    }

    track_.replaceChildren(...reviews.map((r) =>
      el("article", { class: "card review-card" }, [
        el("div", { class: "review-card__stars", text: "★".repeat(r.rating) + "☆".repeat(5 - r.rating), "aria-label": `${r.rating} de 5 estrelas` }),
        el("p", { class: "review-card__text", text: `“${r.text}”` }),
        el("div", { class: "review-card__author" }, [
          el("img", { src: r.avatar, alt: `Foto de ${r.name}`, loading: "lazy", width: 44, height: 44 }),
          el("div", {}, [
            el("strong", { text: r.name }),
            el("small", { text: `${r.service} • ${window.Helpers.formatDateISO(r.date)}` })
          ])
        ])
      ])
    ));

    if (scoreEl) {
      const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
      scoreEl.textContent = avg.toFixed(1).replace(".", ",") + "/5";
    }
  }

  /* ---------------- Planos ---------------- */
  async function initPlans() {
    const grid = qs("#plans-grid");
    if (!grid) return;
    const plans = await window.API.getPlans();

    grid.replaceChildren(...plans.map((p) =>
      el("article", { class: `card plan-card${p.featured ? " plan-card--featured" : ""}` }, [
        p.featured ? el("span", { class: "plan-card__flag", text: "Mais popular" }) : null,
        el("h3", { class: "plan-card__name", text: p.name }),
        el("div", { class: "plan-card__price" }, [
          el("span", { text: BRL(p.price) }),
          el("small", { text: p.period })
        ]),
        el("ul", {}, p.benefits.map((b) => el("li", { text: b }))),
        el("button", { class: "btn " + (p.featured ? "btn--primary" : "btn--outline") + " btn--block", type: "button", "data-open-booking": "", text: "Assinar e agendar" })
      ])
    ));

    grid.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-booking]") && window.BookingWizard) {
        track("click_agendar", { source: "plans" });
        window.BookingWizard.open({});
      }
    });
  }

  window.SectionsTeam = { initBarbers, initStats, initReviews, initPlans };
})();
