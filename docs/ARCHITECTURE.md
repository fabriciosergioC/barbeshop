# Arquitetura — Sistema Digital para Barbearia

## Princípios

1. **Nenhum dado inventado em produção** — placeholders `[ASSIM]` até informação real existir.
2. **Modo demonstração explícito** — sem backend, o sistema roda com `DEMO_DATA` isolado
   e persistência em `localStorage`; nunca misturado com dados reais.
3. **Integração não simulada** — pagamentos, WhatsApp API oficial, Google Reviews e IA são
   *camadas preparadas* (interfaces e pontos de extensão), nunca fingidas.
4. **Configuração central** — mudar a barbearia = editar `businessConfig.js` (+ tokens CSS se mudar marca).
5. **Conversão acima de enfeite** — cada elemento tem função estratégica no funil.

## Camadas

```
┌─────────────────────────────────────────────────────┐
│ FRONTEND (estático, framework-free, zero deps)      │
│  index.html · CSS tokens/base/components · JS ES5+  │
│  sections/ · components/ · utils/ · icons/          │
├─────────────────────────────────────────────────────┤
│ CAMADA DE DADOS (api.js)                            │
│  apiBaseUrl configurado?  → REST real (docs/API.md) │
│  não configurado?         → DEMO_DATA + localStorage│
├─────────────────────────────────────────────────────┤
│ BACKEND (futuro — contratos prontos em docs/API.md) │
│  Auth · Agendamentos · CRM · Financeiro · Estoque   │
├─────────────────────────────────────────────────────┤
│ BANCO (docs/DATABASE.sql — 27 entidades)            │
│ PostgreSQL recomendado (JSONB + RLS p/ multiunidade)│
├─────────────────────────────────────────────────────┤
│ INTEGRAÇÕES (todas com ponto de extensão definido)  │
│ WhatsApp Cloud API · Gateway de pagamento (PIX/     │
│ cartão) · GA4/GTM/Pixel · Google Reviews · IA       │
└─────────────────────────────────────────────────────┘
```

## Frontend

- **Zero dependências**: sem frameworks, sem build obrigatório. `npx serve` e pronto.
- **Design tokens** ([assets/css/tokens.css](assets/css/tokens.css)): única fonte de verdade
  visual. Trocar a identidade = editar um arquivo.
- **Motor de disponibilidade puro** ([assets/js/core/availability.js](assets/js/core/availability.js)):
  não conhece fontes de dados; recebe contexto (horários, feriados, folgas, agendamentos)
  e devolve slots. Reutilizável pelo backend futuro (mesmas regras, portável para Node).
- **Wizard de agendamento**: máquina de estados com 6 etapas, rascunho persistido,
  revalidação de conflito no submit (`ERR_CONFLICT` → volta para horários).
- **Estados de UI padronizados**: loading (spinner), vazio, erro amigável, sucesso, processando.
- **Acessibilidade**: semântica, ARIA, foco visível, skip-link, contraste, reduced-motion.
- **Performance**: sem libs externas (apenas Google Fonts), lazy loading de imagens,
  service worker com cache, imagens otimizáveis (substituir SVG por WebP/AVIF reais).

## Segurança (aplicada e planejada)

| Vetor | Mitigação |
|---|---|
| XSS | Todo conteúdo dinâmico escapado (`Helpers.escapeHtml`); sem `innerHTML` com dados de usuário |
| Injeção SQL | Backend futuro: queries parametrizadas (ver DATABASE.sql) |
| CSRF | Backend: tokens anti-CSRF em mutações + SameSite cookies |
| Senhas | `bcrypt`/`argon2` — nunca texto puro (entidade users já prevê hash) |
| Permissões | RBAC com 5 perfis (ADMIN/GERENTE/BARBEIRO/RECEPÇÃO/CLIENTE) — matriz em DATABASE.sql |
| LGPD | Consentimento explícito, analytics condicionado, política/termos, direito à exclusão |

## Roadmap de fases

| Fase | Escopo | Status |
|---|---|---|
| 1 | Landing page completa + SEO + PWA | ✅ Implementada |
| 2 | Agendamento funcional (demo) + disponibilidade | ✅ Implementado |
| 3 | Painel administrativo (auth, calendário, dashboard) | 📐 Especificado |
| 4 | CRM (clientes, histórico, segmentação, automações) | 📐 Especificado |
| 5 | WhatsApp (Cloud API, templates, lembretes agendados) | 📐 Especificado |
| 6 | Financeiro (entradas/saídas, comissões, relatórios) | 📐 Especificado |
| 7 | Fidelidade (pontos, referidos, cupons) | 📐 Especificado |
| 8 | Pagamentos (PIX/cartão via gateway real) | 📐 Especificado |
| 9 | Estoque e produtos | 📐 Especificado |
| 10 | Automações e campanhas | 📐 Especificado |
| 11 | Multiunidade | 📐 Especificado |
| 12 | Assistente de IA (camada de integração) | 📐 Especificado |

Detalhes de cada fase nos documentos: [DATABASE.sql](DATABASE.sql) (entidades),
[API.md](API.md) (contratos).

## Pontos de extensão já preparados no código

| Integração | Onde |
|---|---|
| API REST | `BUSINESS_CONFIG.integrations.apiBaseUrl` → `api.js` roteia tudo |
| Google Analytics / GTM / Pixel | `BUSINESS_CONFIG.integrations.analytics` + `Helpers.track()` |
| WhatsApp API oficial | `BUSINESS_CONFIG.integrations.whatsappApi` + templates em `whatsappTemplates` |
| Google Maps embed | `BUSINESS_CONFIG.integrations.googleMapsEmbed` (iframe em index.html) |
| Google Reviews | `BUSINESS_CONFIG.integrations.googleReviewsPlaceId` (seção Avaliações) |
| Pagamentos | Endpoints `POST /payments/…` em API.md (frontend ainda não chama) |
| IA | Endpoint `POST /assistant/query` em API.md |
