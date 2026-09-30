/* ============================================================
   components/booking-wizard.js — Fluxo de agendamento em 6 etapas
   Etapas: Serviço → Profissional → Data → Horário → Dados → Confirmar
   Regras: voltar preserva dados; conflitos revalidados no submit;
   erros técnicos nunca aparecem cruos ao usuário.
   ============================================================ */

(function () {
  "use strict";
  const { qs, qsa, el, BRL, formatDateISO, formatDateLong, todayISO, addDaysISO,
          openModal, closeModal, bindModalDismiss, track, toast, storage } = window.Helpers;

  const STEPS = ["Serviço", "Profissional", "Data", "Horário", "Seus dados", "Confirmar"];
  const DRAFT_KEY = "bb_booking_draft";
  const MAX_DATE_CHIPS = 30;

  const state = {
    step: 0,
    service: null,
    barberId: "any",
    date: null,
    time: null,
    customer: { name: "", phone: "", whatsapp: "", email: "" },
    confirmed: null
  };

  let modal, body, progressWrap, navWrap, servicesCache = null, barbersCache = null;

  /* ---------------- utilidades do wizard ---------------- */
  function saveDraft() {
    storage.set(DRAFT_KEY, {
      step: state.step, serviceId: state.service && state.service.id,
      barberId: state.barberId, date: state.date, time: state.time,
      customer: state.customer
    });
  }

  function clearDraft() { storage.remove(DRAFT_KEY); }

  function resetState() {
    state.step = 0;
    state.service = null;
    state.barberId = "any";
    state.date = null;
    state.time = null;
    state.customer = { name: "", phone: "", whatsapp: "", email: "" };
    state.confirmed = null;
  }

  /* ---------------- render do shell ---------------- */
  function renderShell() {
    modal.innerHTML = "";
    modal.appendChild(el("div", { class: "modal__dialog modal__dialog--wide", role: "document" }, [
      el("div", { class: "modal__header" }, [
        el("h2", { id: "booking-title", text: "Agendar horário" }),
        el("button", { class: "modal__close", type: "button", "data-close-modal": "", "aria-label": "Fechar" }, [Icons.el("x", 18)])
      ]),
      (progressWrap = el("div", { class: "wizard-progress", "aria-hidden": "true" })),
      (body = el("div", { class: "modal__body" })),
      (navWrap = el("div", { class: "wizard-nav" }))
    ]));
    bindModalDismiss(modal, () => { saveDraft(); });
  }

  function renderProgress() {
    progressWrap.replaceChildren(...STEPS.map((label, i) =>
      el("div", {
        class: "step" + (i === state.step ? " is-current" : "") + (i < state.step ? " is-done" : ""),
        text: `${i + 1}. ${label}`
      })
    ));
  }

  /* ---------------- navegação ---------------- */
  function goTo(step) {
    state.step = step;
    saveDraft();
    renderProgress();
    renderNav();
    renderStep();
    body.scrollTop = 0;
  }

  function renderNav() {
    navWrap.replaceChildren();
    if (state.confirmed) return;
    if (state.step > 0) {
      navWrap.appendChild(el("button", { class: "btn btn--ghost", type: "button", text: "← Voltar", onclick: () => goTo(state.step - 1) }));
    }
    if (state.step === 4) {
      navWrap.appendChild(el("button", { class: "btn btn--primary", type: "button", text: "Revisar agendamento →", onclick: () => validateForm(true) }));
    } else if (state.step === 5) {
      navWrap.appendChild(el("button", { class: "btn btn--primary", type: "button", text: "Confirmar agendamento", id: "btn-confirm" }));
    }
  }

  /* ---------------- etapas ---------------- */
  function renderStep() {
    body.replaceChildren();
    if (state.confirmed) return renderSuccess();

    switch (state.step) {
      case 0: return renderStepService();
      case 1: return renderStepBarber();
      case 2: return renderStepDate();
      case 3: return renderStepTime();
      case 4: return renderStepForm();
      case 5: return renderStepConfirm();
    }
  }

  async function ensureCaches() {
    if (!servicesCache) servicesCache = await window.API.getServices();
    if (!barbersCache) barbersCache = await window.API.getBarbers();
  }

  /* --- Etapa 1: serviço --- */
  function renderStepService() {
    body.appendChild(el("h3", { text: "Escolha o serviço", style: "font-size:var(--font-size-xl);margin-bottom:var(--space-4);" }));
    const list = el("div", { class: "choice-list" });
    servicesCache.forEach((s) => {
      const hasPromo = s.promoPrice != null && s.promoPrice < s.price;
      const btn = el("button", { class: "choice-item", type: "button" }, [
        el("div", { class: "grow" }, [
          el("strong", { text: s.name }),
          el("small", { text: `${s.duration} min` })
        ]),
        el("span", { class: "right", text: BRL(hasPromo ? s.promoPrice : s.price) })
      ]);
      btn.addEventListener("click", () => {
        state.service = s;
        track("servico_selecionado", { service_id: s.id, service_name: s.name });
        goTo(1);
      });
      list.appendChild(btn);
    });
    body.appendChild(list);
  }

  /* --- Etapa 2: profissional --- */
  function renderStepBarber() {
    body.appendChild(el("h3", { text: "Escolha o profissional", style: "font-size:var(--font-size-xl);margin-bottom:var(--space-4);" }));
    const list = el("div", { class: "choice-list" });

    const anyBtn = el("button", { class: "choice-item" + (state.barberId === "any" ? " is-selected" : ""), type: "button" }, [
      el("div", { class: "grow" }, [
        el("strong", { text: "Qualquer profissional disponível" }),
        el("small", { text: "Mais horários livres" })
      ])
    ]);
    anyBtn.addEventListener("click", () => { state.barberId = "any"; track("profissional_selecionado", { barber: "any" }); goTo(2); });
    list.appendChild(anyBtn);

    barbersCache.forEach((b) => {
      const btn = el("button", { class: "choice-item" + (state.barberId === b.id ? " is-selected" : ""), type: "button" }, [
        el("img", { src: b.photo, alt: "", width: 44, height: 44 }),
        el("div", { class: "grow" }, [
          el("strong", { text: b.name }),
          el("small", { text: `${b.role} • ★ ${b.rating.toFixed(1)}` })
        ])
      ]);
      btn.addEventListener("click", () => { state.barberId = b.id; track("profissional_selecionado", { barber: b.id }); goTo(2); });
      list.appendChild(btn);
    });

    body.appendChild(list);
  }

  /* --- Etapa 3: data --- */
  function renderStepDate() {
    body.appendChild(el("h3", { text: "Escolha a data", style: "font-size:var(--font-size-xl);margin-bottom:var(--space-4);" }));
    const strip = el("div", { class: "choice-list", style: "grid-template-columns:repeat(auto-fill,minmax(104px,1fr));" });
    const hours = window.BUSINESS_CONFIG.businessHours || {};

    for (let i = 0; i < MAX_DATE_CHIPS; i++) {
      const iso = addDaysISO(todayISO(), i);
      const closed = hours[new Date(iso + "T12:00:00").getDay()] == null;
      const chip = el("button", {
        class: "slot-btn" + (state.date === iso ? " is-selected" : ""),
        type: "button",
        disabled: closed ? "" : null
      }, [
        el("div", { text: formatDateISO(iso).slice(0, 5) }),
        el("small", { style: "font-weight:400;opacity:.75;", text: closed ? "Fechado" : new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short" }) })
      ]);
      if (!closed) chip.addEventListener("click", () => { state.date = iso; state.time = null; goTo(3); });
      strip.appendChild(chip);
    }
    body.appendChild(strip);
    if (!state.date) navWrap.replaceChildren(el("button", { class: "btn btn--ghost", type: "button", text: "← Voltar", onclick: () => goTo(1) }));
  }

  /* --- Etapa 4: horário --- */
  async function renderStepTime() {
    body.appendChild(el("h3", { text: "Horários disponíveis", style: "font-size:var(--font-size-xl);margin-bottom:var(--space-2);" }));
    body.appendChild(el("p", { class: "hint", style: "color:var(--muted-color);font-size:var(--font-size-sm);margin-bottom:var(--space-4);", text: formatDateLong(state.date) }));
    const slotWrap = el("div", { class: "slot-grid" }, [
      el("div", { class: "state", style: "grid-column:1/-1;padding:var(--space-5);" }, [
        el("span", { class: "spinner", role: "status", "aria-label": "Carregando horários" }),
        "Carregando horários…"
      ])
    ]);
    body.appendChild(slotWrap);

    const slots = await window.API.getAvailability(state.date, state.service.duration, state.barberId);
    slotWrap.replaceChildren();

    if (!slots.length) {
      slotWrap.appendChild(el("div", { class: "state", style: "grid-column:1/-1;padding:var(--space-5);" }, [
        el("span", { class: "state__icon", text: "🕐" }),
        el("span", { text: "Nenhum horário disponível nesta data. Escolha outro dia." })
      ]));
      return;
    }

    slots.forEach((t) => {
      const b = el("button", { class: "slot-btn" + (state.time === t ? " is-selected" : ""), type: "button", text: t });
      b.addEventListener("click", () => {
        state.time = t;
        track("horario_selecionado", { date: state.date, time: t });
        goTo(4);
      });
      slotWrap.appendChild(b);
    });
  }

  /* --- Etapa 5: dados do cliente --- */
  function renderStepForm() {
    body.appendChild(el("h3", { text: "Seus dados", style: "font-size:var(--font-size-xl);margin-bottom:var(--space-4);" }));

    const fNome = field("nome", "Nome completo*", "text", state.customer.name, "Como devemos te chamar?");
    const fFone = field("phone", "Telefone / WhatsApp*", "tel", state.customer.phone, "(DDD) 99999-9999");
    const fMail = field("email", "E-mail (opcional)", "email", state.customer.email, "Para receber a confirmação");

    body.appendChild(fNome.wrap);
    body.appendChild(fFone.wrap);
    body.appendChild(fMail.wrap);

    const consentInput = el("input", { type: "checkbox", id: "lgpd-consent", checked: state.customer.consent ? "" : null });
    const consent = el("label", { style: "display:flex;gap:var(--space-2);font-size:var(--font-size-sm);color:var(--muted-color);align-items:flex-start;cursor:pointer;" }, [
      consentInput,
      el("span", { html: 'Concordo com o uso dos meus dados para este agendamento, conforme a <a href="docs/politica-privacidade.md" target="_blank">Política de Privacidade</a> (LGPD).' })
    ]);
    body.appendChild(consent);

    function field(id, label, type, value, placeholder) {
      const input = el("input", { class: "input", id: `bk-${id}`, type, value: value || "", placeholder, autocomplete: "on" });
      const wrap = el("div", { class: "field" }, [
        el("label", { for: `bk-${id}`, text: label }),
        input,
        el("span", { class: "field-error", text: "Preencha este campo corretamente." })
      ]);
      input.addEventListener("input", () => {
        wrap.classList.remove("has-error");
        input.removeAttribute("aria-invalid");
      });
      return { wrap, input };
    }

    window.__BK_FIELDS__ = { nome: fNome.input, phone: fFone.input, email: fMail.input, consent: consentInput };
  }

  function validateForm(advance) {
    const f = window.__BK_FIELDS__;
    if (!f) return false;
    let ok = true;

    const checks = [
      [f.nome, (v) => v.trim().length >= 2],
      [f.phone, (v) => v.replace(/\D/g, "").length >= 10],
      [f.email, (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)]
    ];
    checks.forEach(([input, test]) => {
      const wrap = input.closest(".field");
      const valid = test(input.value);
      wrap.classList.toggle("has-error", !valid);
      if (!valid) { input.setAttribute("aria-invalid", "true"); ok = false; }
    });
    if (!f.consent.checked) {
      ok = false;
      const term = f.consent.closest("label");
      if (term) term.style.color = "var(--error-color)";
      toast("É necessário aceitar a Política de Privacidade para concluir.", "error");
    } else {
      const term = f.consent.closest("label");
      if (term) term.style.color = "";
    }
    if (!ok || !advance) return ok;

    state.customer = {
      name: f.nome.value.trim(),
      phone: f.phone.value.trim(),
      whatsapp: f.phone.value.trim(),
      email: f.email.value.trim(),
      consent: true
    };
    goTo(5);
    return true;
  }

  /* --- Etapa 6: confirmação --- */
  function renderStepConfirm() {
    const s = state.service;
    const barberName = state.barberId === "any"
      ? "Qualquer profissional disponível"
      : (barbersCache.find((b) => b.id === state.barberId) || {}).name || "";

    body.appendChild(el("h3", { text: "Confirme seu agendamento", style: "font-size:var(--font-size-xl);margin-bottom:var(--space-4);" }));
    body.appendChild(el("div", { class: "booking-summary" }, [
      el("dl", {}, [
        el("dt", { text: "Serviço" }), el("dd", { text: s.name }),
        el("dt", { text: "Profissional" }), el("dd", { text: barberName }),
        el("dt", { text: "Data" }), el("dd", { text: formatDateLong(state.date) }),
        el("dt", { text: "Horário" }), el("dd", { text: state.time }),
        el("dt", { text: "Duração" }), el("dd", { text: `${s.duration} min` }),
        el("dt", { text: "Valor" }), el("dd", { text: BRL(s.promoPrice ?? s.price) })
      ])
    ]));

    const confirmBtn = qs("#btn-confirm", navWrap) || navWrap.appendChild(el("button", { class: "btn btn--primary", type: "button", text: "Confirmar agendamento" }));
    confirmBtn.replaceChildren(document.createTextNode("Confirmar agendamento"));
    confirmBtn.onclick = submit;
  }

  async function submit() {
    const btn = qs("#btn-confirm", navWrap);
    btn.disabled = true;
    btn.textContent = "Processando…";

    const result = await window.API.createAppointment({
      service: state.service,
      barberId: state.barberId,
      date: state.date,
      start: state.time,
      customer: state.customer
    });

    if (!result.ok) {
      toast(result.error, "error");
      if (result.error && result.error.includes("preenchido")) {
        state.time = null;
        goTo(3); // volta para escolher outro horário
      }
      btn.disabled = false;
      btn.textContent = "Confirmar agendamento";
      return;
    }

    state.confirmed = result.appointment;
    track("agendamento_confirmado", { service: state.service.id, date: state.date, time: state.time });
    clearDraft();
    goTo(0);
    renderSuccess();
  }

  /* ---------------- sucesso ---------------- */
  function renderSuccess() {
    progressWrap.style.display = "none";
    navWrap.replaceChildren();
    const a = state.confirmed;

    body.replaceChildren(el("div", { class: "success-state" }, [
      el("div", { class: "check", text: "✓", role: "img", "aria-label": "Agendamento confirmado" }),
      el("h3", { text: "Agendamento confirmado!", style: "font-size:var(--font-size-2xl);" }),
      el("div", { class: "booking-summary", style: "text-align:left;" }, [
        el("dl", {}, [
          el("dt", { text: "Serviço" }), el("dd", { text: a.service.name }),
          el("dt", { text: "Data" }), el("dd", { text: formatDateLong(a.date) }),
          el("dt", { text: "Horário" }), el("dd", { text: a.start }),
          el("dt", { text: "Endereço" }), el("dd", { text: addressLine() })
        ])
      ]),
      el("p", { style: "font-size:var(--font-size-sm);color:var(--muted-color);", text: "Você receberá uma confirmação e um lembrete pelo WhatsApp." }),
      el("div", { class: "success-actions" }, [
        el("button", { class: "btn btn--outline btn--sm", type: "button", text: "📅 Adicionar ao calendário", onclick: () => downloadICS(a) }),
        el("button", { class: "btn btn--primary btn--sm", type: "button", text: "💬 Falar no WhatsApp", onclick: () => {
          const tpl = (window.BUSINESS_CONFIG.whatsappTemplates || {}).confirmation || "";
          const msg = tpl.replace("{nome}", a.customer.name.split(" ")[0]).replace("{data}", formatDateISO(a.date)).replace("{horario}", a.start);
          window.Helpers.openWhatsApp(msg, { context: "booking_confirmation" });
        } }),
        el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Reagendar", onclick: () => {
          state.confirmed = null;
          state.time = null;
          progressWrap.style.display = "";
          goTo(2);
        } }),
        el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Cancelar agendamento", onclick: () => {
          if (window.API.isDemo()) {
            window.API.cancelLocalAppointment(a.id);
            toast("Agendamento cancelado.", "success");
            window.Helpers.openWhatsApp((window.BUSINESS_CONFIG.whatsappTemplates || {}).cancelled || "Meu agendamento foi cancelado.", { context: "cancel" });
            closeModal(modal);
          } else {
            // Cancelamento real exige backend (DELETE /appointments/:id)
            toast("Cancelamento online disponível em breve. Fale conosco pelo WhatsApp.", "info");
          }
        } })
      ])
    ]));
  }

  function addressLine() {
    const c = window.BUSINESS_CONFIG.address || {};
    const parts = [c.street, c.number, c.district, c.city, c.state].filter((p) => p && !String(p).includes("["));
    return parts.length ? parts.join(", ") : "Endereço em configuração";
  }

  /* ---------------- ICS (adicionar ao calendário) ---------------- */
  function downloadICS(a) {
    const [y, m, d] = a.date.split("-");
    const [hh, mm] = a.start.split(":");
    const start = `${y}${m}${d}T${hh}${mm}00`;
    const endMin = Number(hh) * 60 + Number(mm) + a.duration;
    const end = `${y}${m}${d}T${String(Math.floor(endMin / 60)).padStart(2, "0")}${String(endMin % 60).padStart(2, "0")}00`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Barbearia//Booking//PT-BR",
      "BEGIN:VEVENT",
      `UID:${a.id}@barbearia`,
      `DTSTART;TZID=America/Sao_Paulo:${start}`,
      `DTEND;TZID=America/Sao_Paulo:${end}`,
      `SUMMARY:${a.service.name} — ${window.BUSINESS_CONFIG.name}`,
      `LOCATION:${addressLine()}`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = el("a", { href: url, download: `agendamento-${a.date}-${a.start.replace(":", "")}.ics` });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------------- API pública ---------------- */
  async function open(pre) {
    pre = pre || {};
    await ensureCaches();

    if (!modal) {
      modal = el("div", { class: "modal", id: "booking-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "booking-title", "aria-hidden": "true" });
      document.body.appendChild(modal);
      renderShell();
    }

    progressWrap.style.display = "";
    resetState();

    // pré-seleções vindas de cards (serviço/barbeiro) têm prioridade
    if (pre.service) state.service = pre.service;
    if (pre.barberId) state.barberId = pre.barberId;

    const draft = storage.get(DRAFT_KEY, null);
    const resumingDraft = draft && !pre.service && !pre.barberId;
    if (resumingDraft) {
      // retomar rascunho de sessão anterior
      const svc = servicesCache.find((s) => s.id === draft.serviceId);
      state.service = svc || null;
      state.barberId = draft.barberId || "any";
      state.date = draft.date || null;
      state.time = draft.time || null;
      state.customer = draft.customer || state.customer;
      state.step = Math.min(draft.step || 0, state.service ? 4 : 0);
      toast("Você estava agendando seu horário. Continue de onde parou!", "info");
    }

    // definição da etapa inicial conforme o que já foi escolhido
    if (!state.service) state.step = 0;
    else if (pre.barberId) state.step = 2;   // serviço + barbeiro → data
    else if (!resumingDraft || !state.date) state.step = 1; // serviço → profissional
    track("inicio_agendamento", { preset_service: !!pre.service, preset_barber: !!pre.barberId });

    openModal(modal);
    goTo(state.step);
  }

  function init() {
    // CTA principal e todos os [data-open-booking]
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-open-booking]");
      if (trigger) {
        track("click_agendar", { source: trigger.dataset.bookingSource || trigger.closest("section")?.id || "unknown" });
        open({});
      }
    });
  }

  window.BookingWizard = { open, init };
})();
