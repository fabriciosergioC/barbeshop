/* ============================================================
   availability.js — MOTOR DE DISPONIBILIDADE (funções puras)
   Regras: horário de funcionamento, feriados, folgas/bloqueios,
   conflito de agenda por barbeiro, duração do serviço,
   antecedência mínima e máxima.
   Nunca permite dois agendamentos no mesmo intervalo do mesmo
   profissional. Não conhece fontes de dados (recebe tudo pronto).
   ============================================================ */

(function () {
  "use strict";

  const { hhmmToMinutes, minutesToHHmm, todayISO, addDaysISO } = window.Helpers;

  /**
   * @param {Object} ctx
   *   businessHours: {0..6: {open,close}|null}
   *   holidays:      ["2026-12-25", ...] (data fechada)
   *   timeOff:       [{barberId, from, to, reason}] (intervalo inclusivo, ISO)
   *   appointments:  [{id, barberId|null, date, start, duration, status}]
   *   booking:       {slotInterval, maxAdvanceDays, minAdvanceHours}
   * @returns {string[]} ["09:00", "09:30", …] horários livres
   */
  function getAvailableSlots(ctx, dateISO, serviceDuration, barberId) {
    const cfg = ctx.booking || {};
    const interval = cfg.slotInterval || 30;
    const maxAdvance = cfg.maxAdvanceDays || 60;
    const minAdvance = cfg.minAdvanceHours || 0;

    const today = todayISO();
    if (dateISO < today) return [];
    if (dateISO > addDaysISO(today, maxAdvance)) return [];

    // Fechado no dia (folga geral / feriado)
    const wd = new Date(dateISO + "T12:00:00").getDay();
    const hours = (ctx.businessHours || {})[wd];
    if (!hours) return [];
    if ((ctx.holidays || []).includes(dateISO)) return [];

    const openMin = hhmmToMinutes(hours.open);
    const closeMin = hhmmToMinutes(hours.close);
    const duration = serviceDuration || 30;

    // Barbeiros candidatos
    const allBarberIds = (ctx.barbers || []).map((b) => b.id);
    const candidates = barberId && barberId !== "any" ? [barberId] : allBarberIds;
    if (!candidates.length) return [];

    // Agendamentos ativos do dia
    const active = (ctx.appointments || []).filter(
      (a) => a.date === dateISO && a.status !== "cancelled"
    );

    // Folgas (time off) por barbeiro
    const onTimeOff = (bid) =>
      (ctx.timeOff || []).some((t) => t.barberId === bid && dateISO >= t.from && dateISO <= t.to);

    const now = new Date();
    const minStartMinutes = (() => {
      if (dateISO !== today) return 0;
      const minsNow = now.getHours() * 60 + now.getMinutes();
      return minsNow + minAdvance * 60;
    })();

    const slots = [];
    for (let start = openMin; start + duration <= closeMin; start += interval) {
      if (start < minStartMinutes) continue;
      const time = minutesToHHmm(start);
      const end = start + duration;

      const anyFree = candidates.some((bid) => {
        if (onTimeOff(bid)) return false;
        return !active.some((a) => {
          if (a.barberId && a.barberId !== bid) return false;
          const aStart = hhmmToMinutes(a.start);
          const aEnd = aStart + (a.duration || duration);
          return start < aEnd && end > aStart; // conflito de intervalo
        });
      });
      if (anyFree) slots.push(time);
    }
    return slots;
  }

  /** Valida se um horário específico continua livre (revalidação no submit). */
  function isSlotAvailable(ctx, dateISO, time, serviceDuration, barberId) {
    return getAvailableSlots(ctx, dateISO, serviceDuration, barberId).includes(time);
  }

  /** Próximas datas com ao menos um horário livre (para “primeira data disponível”). */
  function findNextAvailableDates(ctx, serviceDuration, barberId, limit) {
    const out = [];
    let d = todayISO();
    const max = addDaysISO(d, (ctx.booking && ctx.booking.maxAdvanceDays) || 60);
    while (d <= max && out.length < (limit || 14)) {
      if (getAvailableSlots(ctx, d, serviceDuration, barberId).length) out.push(d);
      d = addDaysISO(d, 1);
    }
    return out;
  }

  window.Availability = { getAvailableSlots, isSlotAvailable, findNextAvailableDates };
})();
