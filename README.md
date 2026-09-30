# Sistema Digital para Barbearia — Landing Page + Agendamento

Ecossistema digital para barbearia: **landing page premium orientada à conversão** com
**sistema de agendamento funcional em modo demonstração**, arquitetado para evoluir para
CRM, WhatsApp, financeiro, fidelidade, estoque, pagamentos e multiunidade **sem reconstrução**.

> **Estado atual:** FASE 1 (Landing) + FASE 2 (Agendamento) implementadas e funcionais.
> Fases 3–12 estão especificadas em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e o modelo
> de dados completo em [docs/DATABASE.sql](docs/DATABASE.sql).

---

## ⚡ Rodando localmente

É um site estático — nenhum build é necessário:

```bash
# qualquer servidor estático serve. Exemplos:
npx serve .
# ou
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

> O service worker (PWA) só é registrado em `https://` ou `localhost`.

---

## 🔧 Configuração inicial (dados reais)

**1. Preencha a configuração central** — [assets/js/core/businessConfig.js](assets/js/core/businessConfig.js):

| Campo | O que preencher |
|---|---|
| `name`, `shortName`, `slogan` | Identidade da barbearia |
| `phone`, `whatsapp`, `email` | Contato (WhatsApp **só números, com DDI+DD**, ex. `5511999990000`) |
| `address` | Endereço completo |
| `instagram` | Perfil (ex. `@barbearia`) |
| `businessHours` | Horário de funcionamento por dia da semana (`0`=Domingo) |
| `booking` | Granularidade de horários, antecedência, prazo de cancelamento |
| `whatsappTemplates` | Mensagens automáticas (confirmação, lembrete, pós-atendimento…) |

Enquanto houver placeholders `[ASSIM]`, a página exibe o texto do placeholder
(ao invés de dados falsos) — **nenhum dado é inventado**.

**2. Imagens reais:** substitua os SVGs de [assets/img/placeholders/](assets/img/placeholders/)
mantendo os mesmos nomes de arquivo (ou aponte os caminhos em [assets/js/core/demoData.js](assets/js/core/demoData.js)).

**3. Ao conectar um backend real**, defina `BUSINESS_CONFIG.integrations.apiBaseUrl`.
A camada [assets/js/core/api.js](assets/js/core/api.js) passa a chamar a API REST
(especificação em [docs/API.md](docs/API.md)) e o modo demonstração é desativado automaticamente.

---

## 📁 Estrutura

```
index.html                     Landing page (SEO, schema.org BarberShop)
manifest.webmanifest           PWA
sw.js                          Service worker (cache offline)
assets/
  css/
    tokens.css                 Design tokens (cores, tipografia, espaçamento)
    base.css                   Reset, tipografia, botões, formulários, grid
    components.css             Header, hero, cards, wizard, modais, toasts…
  js/
    core/
      businessConfig.js        ★ CONFIGURAÇÃO CENTRAL (edite aqui)
      demoData.js              Dados fictícios (DEMO DATA, isolado)
      availability.js          Motor de disponibilidade (funções puras)
      api.js                   Camada de dados: API real ↔ modo demo
    components/
      booking-wizard.js        Wizard de agendamento em 6 etapas
      ui.js                    Header, menu, popups, LGPD, flutuantes
    sections/                  Renderizadores por seção da landing
    icons/icons.js             Ícones SVG inline
    utils/helpers.js           DOM, formatação, toasts, modais, analytics
scripts/
  generate-placeholders.mjs    Gera os placeholders SVG identificados
docs/
  ARCHITECTURE.md              Arquitetura e roadmap das fases 3–12
  DATABASE.sql                 Modelo completo (27 entidades)
  API.md                       Contrato REST da API
  politica-privacidade.md      LGPD — modelo para revisão jurídica
  termos-uso.md                Termos — modelo para revisão jurídica
```

---

## ✅ O que já funciona hoje

- **Landing completa**: hero, barra de confiança animada, sobre, serviços com filtros,
  antes/depois com slider, galeria com lightbox, barbeiros, avaliações, planos, FAQ, contato com mapa, footer
- **Agendamento em 6 etapas** (serviço → profissional → data → horário → dados → confirmar)
  com progresso, voltar sem perder dados, rascunho recuperável e revalidação anti-conflito
- **Motor de disponibilidade**: horário de funcionamento, fechamento semanal, feriados,
  folgas por barbeiro, duração do serviço, antecedência mínima, limite de agendamento
- **Pós-agendamento**: tela de sucesso, download `.ics` (calendário), WhatsApp, reagendar, cancelar
- **Conversão**: CTAs em todos os pontos, CTA fixo no mobile, WhatsApp flutuante,
  popups de 1ª visita e exit-intent (com cooldown de 24h)
- **LGPD**: banner de consentimento, analytics só dispara após aceite, política e termos
- **Analytics/funil**: eventos `page_view → click_agendar → … → agendamento_confirmado`
  bufferizados localmente e enviados quando GA4/Pixel estiverem configurados
- **SEO**: Open Graph, Twitter Cards, `schema.org/BarberShop`, meta tags locais
- **PWA**: instalável, funciona offline (cache de assets)
- **Acessibilidade**: semântica, skip-link, foco visível, ARIA, `prefers-reduced-motion`
- **Responsivo**: mobile-first, testado de 360px a 1920px

## 🚧 O que exige backend (não simulado)

Painel admin/CRM/financeiro/fidelidade/pagamentos **não existem por here** — estão
especificados e aguardando a Fase 3+. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):

- Autenticação e perfis (ADMIN/GERENTE/BARBEIRO/RECEPÇÃO/CLIENTE)
- CRM, campanhas, automações, cupons, fidelidade, indicação
- Financeiro, comissões, pagamentos (PIX/cartão — gateway real)
- Estoque, produtos, relatórios, notificações, multiunidade

O modo demonstração persiste agendamentos **apenas no localStorage do navegador**,
claramente separado de produção.

---

## 🧪 Checklist de validação

- [x] Desktop / tablet / mobile (360–1920px)
- [x] Menu mobile, âncoras, botões
- [x] Wizard completo + rascunho + conflito de horário
- [x] Lightbox, FAQ, galeria, antes/depois
- [x] Estados: loading, vazio, erro, sucesso, processando
- [x] LGPD + analytics condicionados a consentimento
- [x] SEO + schema.org + PWA
- [x] Acessibilidade (teclado, ARIA, contraste)
