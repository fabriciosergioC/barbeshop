/* ============================================================
   businessConfig.js — CONFIGURAÇÃO CENTRAL DA BARBEARIA
   Único ponto de edição para dados REAIS do negócio.
   Alterar apenas este arquivo atualiza toda a landing page.
   Placeholders entre colchetes [ ] devem ser preenchidos.
   ============================================================ */

window.BUSINESS_CONFIG = {
  /* ---------- Identidade ---------- */
  name: "[NOME DA BARBEARIA]",
  shortName: "[NOME]",
  slogan: "Seu estilo começa aqui",
  logo: null, // caminho p/ "assets/img/logo.svg" quando houver
  logoText: true, // renderiza o nome em texto enquanto não houver logo

  /* ---------- Contato (preencher com dados reais) ---------- */
  phone: "[TELEFONE]",               // ex.: (11) 99999-0000
  whatsapp: "[WHATSAPP]",            // ex.: 5511999990000 (só números, com DDI)
  whatsappMessage: "Olá! Gostaria de agendar um horário.",
  email: "[E-MAIL]",
  address: {
    street: "[ENDEREÇO]",
    number: "[NÚMERO]",
    district: "[BAIRRO]",
    city: "[CIDADE]",
    state: "[UF]",
    zip: "[CEP]"
  },
  instagram: "[INSTAGRAM]",          // ex.: @barbearia
  facebook: null,
  tiktok: null,

  /* ---------- Horário de funcionamento (0=Dom … 6=Sáb) ---------- */
  businessHours: {
    0: null,                 // Domingo fechado
    1: { open: "09:00", close: "20:00" },
    2: { open: "09:00", close: "20:00" },
    3: { open: "09:00", close: "20:00" },
    4: { open: "09:00", close: "20:00" },
    5: { open: "09:00", close: "20:00" },
    6: { open: "09:00", close: "18:00" }
  },

  /* ---------- Regras de agendamento ---------- */
  booking: {
    slotInterval: 30,          // granularidade dos horários (min)
    maxAdvanceDays: 60,        // limite de antecedência
    minAdvanceHours: 2,        // antecedência mínima
    cancellationCutoffHours: 3 // prazo mínimo p/ cancelar sem taxa
  },

  /* ---------- Integrações (null = não configurado) ---------- */
  integrations: {
    apiBaseUrl: null,          // ex.: "https://api.minhabarbearia.com"
    googleMapsEmbed: null,     // URL de embed do Google Maps
    googleReviewsPlaceId: null,// Place ID p/ Google Reviews
    analytics: {
      gaMeasurementId: null,   // G-XXXXXXX
      gtmId: null,             // GTM-XXXXXX
      metaPixelId: null
    },
    whatsappApi: null          // futura API oficial (Cloud API)
  },

  /* ---------- Mensagens WhatsApp (configuráveis pelo admin) ---------- */
  whatsappTemplates: {
    confirmation: "Olá, {nome}! Seu horário foi confirmado para {data} às {horario}. Até logo! ✂️",
    reminder: "Olá, {nome}! Passando para lembrar que seu horário é amanhã às {horario}.",
    aftercare: "Olá, {nome}! Esperamos que tenha gostado do atendimento. Avalie sua experiência: {link}",
    rescheduled: "Olá, {nome}! Seu horário foi reagendado para {data} às {horario}.",
    cancelled: "Olá, {nome}! Seu agendamento de {data} às {horario} foi cancelado."
  },

  /* ---------- SEO ---------- */
  seo: {
    title: "[NOME DA BARBEARIA] — Barbearia em [CIDADE] | Agende Online",
    description: "Barbearia premium em [CIDADE]. Cortes, barba e tratamentos com profissionais experientes. Agende seu horário online pelo WhatsApp.",
    keywords: "barbearia, [CIDADE], corte masculino, barba, degradê, agendamento online"
  },

  /* ---------- Popups ---------- */
  popups: {
    firstVisit: { enabled: true, delaySeconds: 18, title: "Ganhe 10% na primeira visita", text: "Agende agora e use o cupom [CUPOM] no atendimento." },
    exitIntent: { enabled: true, title: "Antes de sair…", text: "Que tal garantir seu horário? Leva menos de 1 minuto." }
  },

  /* ---------- LGPD ---------- */
  lgpd: {
    policyUrl: "docs/politica-privacidade.md",
    contactEmail: "[E-MAIL]"
  },

  /* ---------- Admin (usuários autorizados a conectar produção) ---------- */
  admin: {
    note: "Painel administrativo, CRM, financeiro, fidelidade e pagamentos exigem backend. Veja docs/ARCHITECTURE.md e docs/DATABASE.sql."
  }
};
