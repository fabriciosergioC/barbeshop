/* ============================================================
   demoData.js — DADOS FICTÍCIOS PARA DEMONSTRAÇÃO
   ⚠️ DEMO DATA — NUNCA misturar com produção.
   Usado APENAS quando BUSINESS_CONFIG.integrations.apiBaseUrl
   está null (sem backend). Ao conectar API real, é ignorado.
   Números fictícios para não usar placeholders na UI.
   ============================================================ */

(function () {
  const IMG = "assets/img/photos/";

  window.DEMO_DATA = {
    stats: [
      { icon: "users",  value: 5200, suffix: "+", label: "Clientes atendidos" },
      { icon: "award",  value: 12,   suffix: "",  label: "Anos de experiência" },
      { icon: "scissors", value: 6,  suffix: "",  label: "Barbeiros" },
      { icon: "star",   value: 4.9,  suffix: "/5", label: "Nota média", decimals: 1 },
      { icon: "chat",   value: 530,  suffix: "+", label: "Avaliações" }
    ],

    services: [
      {
        id: "svc-corte-tradicional",
        category: "cabelo",
        name: "Corte Tradicional",
        description: "Corte clássico com acabamento na navalha e finalização.",
        duration: 40, price: 60,
        image: IMG + "service-corte.webp"
      },
      {
        id: "svc-corte-degrade",
        category: "cabelo",
        name: "Corte Degradê",
        description: "Fade personalizado com desenho e finalização premium.",
        duration: 50, price: 30,
        image: IMG + "service-degrade.webp"
      },
      {
        id: "svc-corte-barba",
        category: "combo",
        name: "Corte + Barba",
        description: "Combo completo: corte, barba desenhada e toalha quente.",
        duration: 80, price: 110, promoPrice: 95,
        image: IMG + "service-combo.webp"
      },
      {
        id: "svc-barba-completa",
        category: "barba",
        name: "Barba Completa",
        description: "Modelagem, navalha, toalha quente e óleo finalizador.",
        duration: 40, price: 55,
        image: IMG + "service-barba.webp"
      },
      {
        id: "svc-sobrancelha",
        category: "barba",
        name: "Sobrancelha",
        description: "Design e alinhamento na navalha.",
        duration: 15, price: 20,
        image: IMG + "service-sobrancelha.webp"
      },
      {
        id: "svc-pigmentacao",
        category: "tratamentos",
        name: "Pigmentação",
        description: "Camuflagem de falhas com pigmento de longa duração.",
        duration: 45, price: 80,
        image: IMG + "service-pigmentacao.webp"
      },
      {
        id: "svc-platinado",
        category: "tratamentos",
        name: "Platinado",
        description: "Descoloração global com matização e tratamento.",
        duration: 180, price: 280,
        image: IMG + "service-platinado.webp"
      },
      {
        id: "svc-corte-infantil",
        category: "cabelo",
        name: "Corte Infantil",
        description: "Atendimento especial para os pequenos (até 10 anos).",
        duration: 30, price: 45,
        image: IMG + "service-infantil.webp"
      },
      {
        id: "svc-terapia-capilar",
        category: "tratamentos",
        name: "Terapia Capilar",
        description: "Detox, hidratação e massagem no couro cabeludo.",
        duration: 40, price: 70,
        image: IMG + "service-terapia.webp"
      }
    ],

    serviceCategories: [
      { id: "todos", label: "Todos" },
      { id: "cabelo", label: "Cabelo" },
      { id: "barba", label: "Barba" },
      { id: "combo", label: "Combos" },
      { id: "tratamentos", label: "Tratamentos" }
    ],

    barbers: [
      {
        id: "brb-1", name: "Carlos Mendes", role: "Master Barber",
        specialties: ["Degradê", "Navalha", "Barba"],
        experienceYears: 14, rating: 4.9, appointments: 3200,
        bio: "Especialista em degradês milimétricos e atendimento premium.",
        photo: IMG + "barber-1.webp", instagram: null
      },
      {
        id: "brb-2", name: "Rafael Costa", role: "Barbeiro Sênior",
        specialties: ["Cortes clássicos", "Pigmentação"],
        experienceYears: 9, rating: 4.8, appointments: 2100,
        bio: "Mestre dos cortes clássicos e pigmentação de falhas.",
        photo: IMG + "barber-2.webp", instagram: null
      },
      {
        id: "brb-3", name: "Diego Souza", role: "Barbeiro & Colorista",
        specialties: ["Platinado", "Terapia capilar"],
        experienceYears: 7, rating: 4.8, appointments: 1600,
        bio: "Referência em transformações de cor e cuidado capilar.",
        photo: IMG + "barber-3.webp", instagram: null
      }
    ],

    gallery: [
      { category: "cortes", title: "Degradê navalhado", image: IMG + "gallery-1.webp" },
      { category: "barbas", title: "Barba desenhada", image: IMG + "gallery-2.webp" },
      { category: "ambiente", title: "Nosso espaço", image: IMG + "gallery-3.webp" },
      { category: "cortes", title: "Clássico moderno", image: IMG + "gallery-4.webp" },
      { category: "transformacoes", title: "Platinado", image: IMG + "gallery-5.webp" },
      { category: "equipe", title: "A equipe", image: IMG + "gallery-6.jpg" }
    ],

    galleryCategories: [
      { id: "todos", label: "Todos" },
      { id: "cortes", label: "Cortes" },
      { id: "barbas", label: "Barbas" },
      { id: "transformacoes", label: "Transformações" },
      { id: "ambiente", label: "Ambiente" },
      { id: "equipe", label: "Equipe" }
    ],

    beforeAfter: [
      {
        title: "Platinado completo",
        service: "Platinado",
        barber: "Diego Souza",
        description: "De corte escuro a platinado matizado em uma sessão.",
        before: IMG + "ba-1-before.webp",
        after: IMG + "ba-1-after.webp"
      },
      {
        title: "Degradê + barba",
        service: "Corte + Barba",
        barber: "Carlos Mendes",
        description: "Transformação completa com navalha e toalha quente.",
        before: IMG + "ba-2-before.webp",
        after: IMG + "ba-2-after.webp"
      }
    ],

    reviews: [
      { name: "Lucas P.", rating: 5, date: "2026-09-12", service: "Corte + Barba", text: "Atendimento impecável. O melhor degradê que já fiz.", avatar: IMG + "avatar-1.webp" },
      { name: "Bruno T.", rating: 5, date: "2026-08-30", service: "Barba Completa", text: "Ambiente premium e pontualidade britânica.", avatar: IMG + "avatar-2.webp" },
      { name: "André M.", rating: 4, date: "2026-08-18", service: "Platinado", text: "Resultado excelente, só demorou um pouco mais que o previsto.", avatar: IMG + "avatar-3.webp" },
      { name: "Felipe R.", rating: 5, date: "2026-07-27", service: "Corte Tradicional", text: "Sempre saio de lá renovado. Recomendo de olhos fechados.", avatar: IMG + "avatar-4.webp" }
    ],

    plans: [
      {
        id: "plan-mensal", name: "Plano Mensal", price: 110, period: "/mês", featured: false,
        benefits: [
          "2 cortes por mês",
          "15% de desconto em barba",
          "Prioridade no agendamento",
          "10% de desconto em produtos"
        ]
      },
      {
        id: "plan-premium", name: "Plano Premium", price: 180, period: "/mês", featured: true,
        benefits: [
          "Cortes ilimitados (conforme regras)",
          "Barba inclusa em todos os cortes",
          "Prioridade máxima no agendamento",
          "15% de desconto em produtos",
          "Cupom de aniversário"
        ]
      }
    ],

    faq: [
      { q: "Precisa agendar?", a: "Recomendamos agendar para garantir seu horário, mas também atendemos sem agendamento conforme disponibilidade." },
      { q: "Posso escolher o barbeiro?", a: "Sim! No agendamento você escolhe o profissional ou deixa \"qualquer profissional disponível\"." },
      { q: "Posso cancelar ou reagendar?", a: "Sim, até 3 horas antes do horário, sem custo, pelo WhatsApp ou pela confirmação que você recebeu." },
      { q: "Quanto tempo dura cada serviço?", a: "Depende do serviço: de 15 minutos (sobrancelha) a 3 horas (platinado). A duração aparece em cada card." },
      { q: "Aceita cartão e PIX?", a: "Sim, aceitamos cartão, PIX e dinheiro. Pagamentos online estarão disponíveis em breve." },
      { q: "Onde vocês ficam?", a: "Nosso endereço completo está na seção Contato, com mapa e botão de rota." },
      { q: "Existe estacionamento?", a: "Sim, temos estacionamento conveniado próximo à unidade." },
      { q: "Atendem crianças?", a: "Sim! Temos o serviço Corte Infantil com atendimento especializado." }
    ],

    aboutFeatures: [
      { icon: "scissors", text: "Barbeiros certificados e em constante atualização" },
      { icon: "star", text: "Produtos premium e esterilização rigorosa" },
      { icon: "clock", text: "Pontualidade: seu horário respeitado" },
      { icon: "shield", text: "Ambiente climatizado e confortável" }
    ]
  };
})();
