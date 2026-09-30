/* ============================================================
   api.js — Camada de acesso a dados
   1) Se BUSINESS_CONFIG.integrations.apiBaseUrl existe → HTTP real.
   2) Caso contrário → modo demonstração (DEMO_DATA + disponibilidade
      calculada localmente, agendamentos em localStorage).
   Nenhuma integração é fingida: sem backend, o modo demo é explícito.
   ============================================================ */

(function () {
  "use strict";

  const H = window.Helpers;
  const AV = window.Availability;

  const LS_APPTS = "bb_appointments_demo";

  function isDemo() {
    const c = window.BUSINESS_CONFIG || {};
    return !c.integrations || !c.integrations.apiBaseUrl;
  }

  function buildCtx() {
    const c = window.BUSINESS_CONFIG || {};
    const demo = window.DEMO_DATA || {};
    const appointments = H.storage.get(LS_APPTS, []);
    return {
      businessHours: c.businessHours || {},
      booking: c.booking || {},
      holidays: (window.DEMO_HOLIDAYS || []),
      barbers: demo.barbers || [],
      timeOff: [],
      appointments
    };
  }

  /* ---------- Mensagens de erro amigáveis ---------- */
  const FRIENDLY_ERRORS = {
    ERR_NETWORK: "Não foi possível conectar. Verifique sua internet e tente novamente.",
    ERR_DATABASE: "Não foi possível concluir agora. Tente novamente em alguns instantes.",
    ERR_CONFLICT: "Ops! Esse horário acabou de ser preenchido. Escolha outro, por favor.",
    ERR_VALIDATION: "Revise os dados informados e tente novamente."
  };
  function friendlyError(code) {
    return FRIENDLY_ERRORS[code] || "Não foi possível concluir agora. Tente novamente em alguns instantes.";
  }

  /* ---------- Fetch com timeout ---------- */
  async function http(path, options) {
    const base = window.BUSINESS_CONFIG.integrations.apiBaseUrl;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(base.replace(/\/$/, "") + path, {
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        ...options
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.message || "ERR_DATABASE");
        err.code = data.code || (res.status === 409 ? "ERR_CONFLICT" : "ERR_DATABASE");
        throw err;
      }
      return data;
    } catch (e) {
      if (e.name === "AbortError") { const err = new Error("timeout"); err.code = "ERR_NETWORK"; throw err; }
      if (!e.code) e.code = "ERR_NETWORK";
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  const API = {
    isDemo,

    async getServices() {
      if (!isDemo()) return http("/services");
      return window.DEMO_DATA.services;
    },

    async getServiceCategories() {
      if (!isDemo()) return http("/service-categories");
      return window.DEMO_DATA.serviceCategories;
    },

    async getBarbers() {
      if (!isDemo()) return http("/barbers");
      return window.DEMO_DATA.barbers;
    },

    async getGallery() {
      if (!isDemo()) return http("/gallery");
      return window.DEMO_DATA.gallery;
    },

    async getBeforeAfter() {
      if (!isDemo()) return http("/before-after");
      return window.DEMO_DATA.beforeAfter;
    },

    async getReviews() {
      if (!isDemo()) return http("/reviews");
      return window.DEMO_DATA.reviews;
    },

    async getPlans() {
      if (!isDemo()) return http("/plans");
      return window.DEMO_DATA.plans;
    },

    async getFaq() {
      if (!isDemo()) return http("/faq");
      return window.DEMO_DATA.faq;
    },

    async getStats() {
      if (!isDemo()) return http("/stats");
      return window.DEMO_DATA.stats;
    },

    /**
     * Consulta horários livres.
     * @returns {Promise<string[]>}
     */
    async getAvailability(dateISO, serviceDuration, barberId) {
      if (!isDemo()) {
        const q = new URLSearchParams({ date: dateISO, duration: serviceDuration, barber: barberId });
        try {
          const r = await http(`/availability?${q}`);
          return r.slots;
        } catch (e) {
          H.toast(friendlyError(e.code), "error");
          return [];
        }
      }
      // Pequeno atraso simulado p/ estados de loading
      await new Promise((r) => setTimeout(r, 250));
      return AV.getAvailableSlots(buildCtx(), dateISO, serviceDuration, barberId);
    },

    /**
     * Cria agendamento (modo demo persiste em localStorage).
     * @returns {Promise<{ok:boolean, appointment?:object, error?:string}>}
     */
    async createAppointment(payload) {
      if (!isDemo()) {
        try {
          const r = await http("/appointments", { method: "POST", body: JSON.stringify(payload) });
          return { ok: true, appointment: r.appointment || r };
        } catch (e) {
          return { ok: false, error: friendlyError(e.code) };
        }
      }
      await new Promise((r) => setTimeout(r, 600));

      // Revalida disponibilidade (regra crítica: sem conflito)
      const ctx = buildCtx();
      const free = AV.isSlotAvailable(ctx, payload.date, payload.start, payload.service.duration, payload.barberId);
      if (!free) return { ok: false, error: friendlyError("ERR_CONFLICT") };

      // "Qualquer profissional": atribui o primeiro barbeiro livre no horário
      // (comportamento real: recepção/sistema designa; preserva capacidade dos demais)
      let assignedBarberId = payload.barberId === "any" ? null : payload.barberId;
      if (payload.barberId === "any") {
        assignedBarberId = ctx.barbers.map((b) => b.id).find(
          (bid) => AV.isSlotAvailable(ctx, payload.date, payload.start, payload.service.duration, bid)
        ) || null;
        if (!assignedBarberId) return { ok: false, error: friendlyError("ERR_CONFLICT") };
      }

      const appointment = {
        id: "demo-" + Date.now().toString(36),
        date: payload.date,
        start: payload.start,
        duration: payload.service.duration,
        barberId: assignedBarberId,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        service: {
          id: payload.service.id, name: payload.service.name,
          duration: payload.service.duration, price: payload.service.promoPrice ?? payload.service.price
        },
        customer: {
          name: payload.customer.name,
          phone: payload.customer.phone,
          whatsapp: payload.customer.whatsapp || payload.customer.phone,
          email: payload.customer.email || null
        }
      };
      const list = H.storage.get(LS_APPTS, []);
      list.push(appointment);
      H.storage.set(LS_APPTS, list);
      return { ok: true, appointment };
    },

    listLocalAppointments() {
      return H.storage.get(LS_APPTS, []);
    },

    cancelLocalAppointment(id) {
      const list = H.storage.get(LS_APPTS, []);
      const item = list.find((a) => a.id === id);
      if (item) item.status = "cancelled";
      H.storage.set(LS_APPTS, list);
    },

    friendlyError
  };

  window.API = API;
})();
