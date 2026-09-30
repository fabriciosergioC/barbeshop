/* ============================================================
   sections/faq.js — FAQ accordion + seção Sobre
   ============================================================ */

(function () {
  "use strict";
  const { qs, el } = window.Helpers;

  async function initFaq() {
    const wrap = qs("#faq-list");
    if (!wrap) return;
    const faq = await window.API.getFaq();

    wrap.replaceChildren(...faq.map((item, i) => {
      const btn = el("button", {
        class: "faq-item__q",
        type: "button",
        "aria-expanded": "false",
        "aria-controls": `faq-a-${i}`
      }, [
        el("span", { text: item.q }),
        el("span", { class: "icon", "aria-hidden": "true", text: "+" })
      ]);
      const panel = el("div", { class: "faq-item__a", id: `faq-a-${i}`, role: "region" }, [
        el("div", {}, [el("p", { text: item.a })])
      ]);
      btn.addEventListener("click", () => {
        const open = wrap.querySelector(".faq-item[data-open]") === itemEl && itemEl.hasAttribute("data-open");
        // fecha os outros
        wrap.querySelectorAll(".faq-item[data-open]").forEach((o) => {
          o.removeAttribute("data-open");
          o.querySelector(".faq-item__q").setAttribute("aria-expanded", "false");
        });
        if (!open) {
          itemEl.setAttribute("data-open", "");
          btn.setAttribute("aria-expanded", "true");
        }
      });
      const itemEl = el("div", { class: "faq-item" }, [btn, panel]);
      return itemEl;
    }));
  }

  function initAbout() {
    const c = window.BUSINESS_CONFIG;
    const list = qs("#about-features");
    if (list && window.DEMO_DATA.aboutFeatures) {
      list.replaceChildren(...window.DEMO_DATA.aboutFeatures.map((f) =>
        el("li", { class: "about-feature" }, [
          el("span", { class: "ico" }, [Icons.el(f.icon, 18)]),
          el("span", { text: f.text })
        ])
      ));
    }
    // Textos vindos da config quando existirem
    const story = qs("#about-story");
    if (story && c.about && c.about.story) story.textContent = c.about.story;
  }

  window.SectionsFaq = { initFaq, initAbout };
})();
