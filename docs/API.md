# API — Contrato REST

Base: `BUSINESS_CONFIG.integrations.apiBaseUrl` (ex.: `https://api.barbearia.com/v1`).
Todas as respostas são JSON. Autenticação: `Authorization: Bearer <jwt>`.

## Convenções de erro

```json
{ "code": "ERR_CONFLICT", "message": "horário não está mais disponível" }
```

| code | HTTP | Significado |
|---|---|---|
| `ERR_VALIDATION` | 400 | Payload inválido |
| `ERR_UNAUTHORIZED` | 401 | Sem credencial |
| `ERR_FORBIDDEN` | 403 | Sem permissão (RBAC) |
| `ERR_NOT_FOUND` | 404 | Recurso inexistente |
| `ERR_CONFLICT` | 409 | Conflito de horário/estoque/uso de cupom |
| `ERR_DATABASE` | 500 | Erro interno |
| `ERR_NETWORK` | — | Timeout/falha de rede (cliente) |

O frontend converte qualquer código em **mensagem amigável** (`api.js → FRIENDLY_ERRORS`).

---

## Público (landing page)

### `GET /services`
Lista serviços ativos. `?branch=` opcional (multiunidade).
```json
{ "services": [ { "id": "…", "category": "cabelo", "name": "Corte Degradê",
  "description": "…", "duration": 50, "price": 70, "promoPrice": null, "image": "…" } ] }
```

### `GET /service-categories` · `GET /barbers` · `GET /gallery`
`GET /before-after` · `GET /reviews` · `GET /plans` · `GET /faq` · `GET /stats`
Mesmo formato de `DEMO_DATA` (contrato idêntico ao modo demonstração).

### `GET /availability?date=YYYY-MM-DD&duration=50&barber=any|<id>`
```json
{ "slots": ["09:00","09:30","10:00"] }
```
Regras aplicadas no servidor: horário de funcionamento, feriados, folgas
(`blocked_times`), duração, antecedência mínima/máxima e **conflito por barbeiro**
(constraint `no_double_booking` do banco).

### `POST /appointments`
```json
{
  "serviceId": "…", "barberId": "any|…",
  "date": "2026-10-05", "start": "14:00",
  "customer": { "name": "…", "phone": "…", "whatsapp": "…", "email": null,
                "consent": true },
  "couponCode": null
}
```
- `201` → `{ "appointment": { … } }`
- `409 ERR_CONFLICT` → horário preenchido (frontend devolve o usuário à etapa de horários)

### `PUT /appointments/:id` — reagendar (`date`, `start`, `barberId`)
### `DELETE /appointments/:id` — cancelar (respeita `cancellationCutoffHours`)

### `POST /coupons/validate`
`{ "code": "BARBER10", "serviceId": "…" }` → `{ "valid": true, "discount": 10 }` | `409`

### `POST /reviews`
`{ "appointmentId": "…", "rating": 5, "comment": "…" }`

### `POST /leads` — captura de popup/exit-intent
`{ "name": "…", "phone": "…", "source": "exit_intent" }`

---

## Autenticados (fases 3–9)

### Dashboard `GET /dashboard?range=today|week|month`
Retorna faturamento, agendamentos, taxa de ocupação, ticket médio, novos × recorrentes,
cancelamentos, comparativo mês anterior.

### Agendamentos (recepção/admin)
`GET /appointments?from&to&barber&service&status&q` · `POST /blocks` (bloqueios)

### CRM
`GET /customers?segment=inactive_30|inactive_60|vip|birthday|…` ·
`GET /customers/:id` (com histórico completo) · `PUT /customers/:id`

### Campanhas / automações
`POST /campaigns` · `POST /campaigns/:id/send` ·
`GET /automations` · `PUT /automations/:id` (gatilhos: inactive_30d, birthday, first_visit, vip, cancellation)

### Financeiro
`GET /finance/summary?from&to` · `GET /finance/transactions` · `POST /finance/expenses` ·
`GET /barbers/:id/commissions?from&to`

### Pagamentos (fase 8 — gateway real, nunca simulado)
`POST /payments/intent` → integra PIX/cartão (ex.: Mercado Pago/Stripe).
Webhook `POST /webhooks/gateway` (assinatura verificada no servidor).

### Estoque
`GET /products?low_stock=1` · `POST /inventory/moves` (in/out/adjust)

### IA (fase 12 — camada de integração)
`POST /assistant/query`
`{ "sessionId": "…", "message": "quero agendar corte amanhã às 15h" }`
Resposta com `action`: `reply | availability | create_appointment | reschedule | cancel`.
Sem configuração de provedor, o endpoint **não existe** e o frontend não exibe o recurso.
