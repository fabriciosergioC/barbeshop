/* ============================================================
   helpers.js — Utilitários compartilhados
   DOM, formatação, storage, toasts, modais, analytics, WhatsApp
   ============================================================ */

(function () {
  "use strict";

  const CFG = () => window.BUSINESS_CONFIG || {};

  /* ---------------- DOM ---------------- */
  const qs = (sel, root) => (root || document).querySelector(sel);
  const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null) continue;
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v; // apenas com conteúdo interno confiável
        else if (k === "text") node.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      }
    }
    (children || []).filter((c) => c !== null && c !== undefined)
      .forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }

  /* Escape de conteúdo dinâmico (anti-XSS) */
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------------- Formatação ---------------- */
  const BRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function formatDateISO(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }

  const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  function formatDateLong(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${wd}, ${d} de ${MONTHS[m - 1]} de ${y}`;
  }

  function todayISO() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  }

  function addDaysISO(iso, days) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
  }

  function minutesToHHmm(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function hhmmToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  /* ---------------- Storage seguro (cookies não essenciais só após consentimento) ---------------- */
  const storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* noop */ }
    }
  };

  const CONSENT_KEY = "bb_consent_v1";
  function hasConsent() { return storage.get(CONSENT_KEY, false) === true; }
  function setConsent(v) { storage.set(CONSENT_KEY, !!v); }

  /* ---------------- Analytics (eventos do funil) ---------------- */
  const funnelEvents = [
    "page_view", "click_agendar", "inicio_agendamento", "servico_selecionado",
    "profissional_selecionado", "horario_selecionado", "agendamento_confirmado",
    "whatsapp_click", "cupom_aplicado", "checkout_iniciado"
  ];

  function track(event, params) {
    const payload = Object.assign({ event, ts: Date.now() }, params || {});
    // Sempre registra no buffer local (recuperação de agendamento + depuração do funil)
    const buf = storage.get("bb_funnel_events", []);
    buf.push(payload);
    storage.set("bb_funnel_events", buf.slice(-50));

    // Envia apenas com consentimento
    if (!hasConsent()) return;
    const integ = CFG().integrations || {};
    if (integ.analytics && typeof window.gtag === "function") {
      window.gtag("event", event, params || {});
    }
    if (integ.analytics && typeof window.fbq === "function") {
      window.fbq("trackCustom", event, params || {});
    }
  }

  /* ---------------- Toast ---------------- */
  let toastContainer;
  function toast(message, type) {
    if (!toastContainer) {
      toastContainer = el("div", { class: "toast-container", role: "status", "aria-live": "polite" });
      document.body.appendChild(toastContainer);
    }
    const t = el("div", { class: `toast toast--${type || "info"}` }, [
      Icons.el(type === "error" ? "x" : "check", 18),
      el("span", { text: message })
    ]);
    toastContainer.appendChild(t);
    setTimeout(() => {
      t.classList.add("is-leaving");
      setTimeout(() => t.remove(), 300);
    }, 4200);
  }

  /* ---------------- Modal genérico ---------------- */
  function openModal(modalEl) {
    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const focusable = modalEl.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (focusable) focusable.focus();
  }
  function closeModal(modalEl) {
    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function bindModalDismiss(modalEl, onClose) {
    modalEl.addEventListener("click", (e) => { if (e.target === modalEl) { closeModal(modalEl); if (onClose) onClose(); } });
    qsa("[data-close-modal]", modalEl).forEach((b) =>
      b.addEventListener("click", () => { closeModal(modalEl); if (onClose) onClose(); })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalEl.classList.contains("is-open")) { closeModal(modalEl); if (onClose) onClose(); }
    });
  }

  /* ---------------- WhatsApp ---------------- */
  function waLink(message) {
    const num = String(CFG().whatsapp || "").replace(/\D/g, "");
    if (!num || num.includes("[")) {
      // Sem número configurado: não gera link real
      return null;
    }
    return `https://wa.me/${num}?text=${encodeURIComponent(message || CFG().whatsappMessage || "")}`;
  }
  function openWhatsApp(message, eventParams) {
    track("whatsapp_click", eventParams);
    const url = waLink(message);
    if (!url) { toast("WhatsApp não configurado. Preencha BUSINESS_CONFIG.whatsapp.", "error"); return; }
    window.open(url, "_blank", "noopener");
  }

  /* Aplica dados da config em elementos [data-cfg] */
  function applyConfigToDom() {
    const c = CFG();
    qsa("[data-cfg]").forEach((elm) => {
      const path = elm.getAttribute("data-cfg").split(".");
      let v = c;
      for (const p of path) v = v == null ? undefined : v[p];
      if (v != null && !String(v).includes("[")) elm.textContent = v;
    });
    // Links dinâmicos
    const wa = waLink();
    qsa("[data-wa-link]").forEach((a) => { if (wa) a.href = wa; else a.removeAttribute("href"); });
  }

  window.Helpers = {
    qs, qsa, el, escapeHtml, BRL, formatDateISO, formatDateLong, todayISO, addDaysISO,
    minutesToHHmm, hhmmToMinutes, storage, hasConsent, setConsent, track, toast,
    openModal, closeModal, bindModalDismiss, waLink, openWhatsApp, applyConfigToDom,
    WEEKDAYS, MONTHS, CONSENT_KEY
  };
})();
