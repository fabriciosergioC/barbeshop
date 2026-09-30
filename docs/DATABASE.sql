-- ============================================================
-- DATABASE.sql — Modelo completo do sistema (PostgreSQL 14+)
-- Entidades para landing + agendamento + CRM + financeiro +
-- fidelidade + estoque + multiunidade. RLS para multi-tenant.
-- ============================================================

-- ---------- IDENTIDADE E ACESSO ----------
CREATE TABLE branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  phone         TEXT,
  whatsapp      TEXT,
  address_json  JSONB NOT NULL DEFAULT '{}',
  timezone      TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id          SMALLSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,            -- ADMIN | MANAGER | BARBER | RECEPTION | CUSTOMER
  description TEXT NOT NULL
);

CREATE TABLE permissions (
  id    SMALLSERIAL PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE                   -- ex.: appointments.write, finance.read
);

CREATE TABLE role_permissions (
  role_id       SMALLINT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id SMALLINT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID REFERENCES branches(id),
  role_id       SMALLINT NOT NULL REFERENCES roles(id),
  name          TEXT NOT NULL,
  email         CITEXT UNIQUE,
  phone         TEXT,
  password_hash TEXT,                          -- argon2/bcrypt — NUNCA texto puro
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- CATÁLOGO ----------
CREATE TABLE service_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE services (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id      UUID REFERENCES branches(id),
  category_id    UUID REFERENCES service_categories(id),
  name           TEXT NOT NULL,
  description    TEXT,
  duration_min   INT NOT NULL CHECK (duration_min > 0),
  price_cents    INT NOT NULL CHECK (price_cents >= 0),
  promo_cents    INT,
  image_url      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE barbers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE REFERENCES users(id),
  branch_id         UUID REFERENCES branches(id),
  display_name      TEXT NOT NULL,
  bio               TEXT,
  photo_url         TEXT,
  specialties       TEXT[] NOT NULL DEFAULT '{}',
  commission_type   TEXT NOT NULL DEFAULT 'percent' CHECK (commission_type IN ('percent','fixed','per_service')),
  commission_value  NUMERIC(10,2) NOT NULL DEFAULT 40,
  rating_avg        NUMERIC(3,2) NOT NULL DEFAULT 0,
  appointments_count INT NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  instagram         TEXT
);

-- ---------- AGENDAMENTO ----------
CREATE TABLE business_hours (
  branch_id  UUID REFERENCES branches(id),
  weekday    SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens      TIME NOT NULL,
  closes     TIME NOT NULL,
  PRIMARY KEY (branch_id, weekday)
);

CREATE TABLE holidays (
  branch_id UUID REFERENCES branches(id),
  date      DATE NOT NULL,
  label     TEXT,
  PRIMARY KEY (branch_id, date)
);

-- folgas/férias/bloqueios por barbeiro
CREATE TABLE blocked_times (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id  UUID REFERENCES barbers(id),
  branch_id  UUID REFERENCES branches(id),     -- bloqueio da unidade inteira (null barber)
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  reason     TEXT
);

CREATE TABLE customers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id          UUID REFERENCES branches(id),
  user_id            UUID UNIQUE REFERENCES users(id),
  name               TEXT NOT NULL,
  phone              TEXT NOT NULL,
  whatsapp           TEXT,
  email              CITEXT,
  birth_date         DATE,
  address_json       JSONB DEFAULT '{}',
  notes              TEXT,
  preferences_json   JSONB DEFAULT '{}',       -- ex.: {"clipper":"3","style":"degrade"}
  preferred_barber_id UUID REFERENCES barbers(id),
  classification     TEXT NOT NULL DEFAULT 'NEW'
                     CHECK (classification IN ('NEW','ACTIVE','RECURRING','INACTIVE','VIP')),
  total_spent_cents  BIGINT NOT NULL DEFAULT 0,
  visits_count       INT NOT NULL DEFAULT 0,
  last_visit_at      TIMESTAMPTZ,
  next_visit_at      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_classification ON customers(classification);
CREATE INDEX idx_customers_birth_month ON customers(birth_date);

CREATE TABLE appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id    UUID NOT NULL REFERENCES branches(id),
  customer_id  UUID NOT NULL REFERENCES customers(id),
  barber_id    UUID REFERENCES barbers(id),    -- null = "qualquer profissional"
  service_id   UUID NOT NULL REFERENCES services(id),
  date         DATE NOT NULL,
  start_time   TIME NOT NULL,
  duration_min INT NOT NULL,
  price_cents  INT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  source       TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website','whatsapp','reception','barber','customer_portal')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Regra crítica: sem conflito para o mesmo barbeiro na mesma unidade
  CONSTRAINT no_double_booking EXCLUDE USING gist (
    branch_id WITH =,
    COALESCE(barber_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
    tsrange((date + start_time)::timestamp, (date + start_time)::timestamp + (duration_min || ' minutes')::interval) WITH &&
  ) WHERE (status IN ('pending','confirmed'))
);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_barber ON appointments(barber_id, date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);

-- ---------- FINANCEIRO ----------
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID REFERENCES appointments(id),
  customer_id     UUID REFERENCES customers(id),
  subscription_id UUID,
  amount_cents    INT NOT NULL CHECK (amount_cents > 0),
  method          TEXT NOT NULL CHECK (method IN ('pix','credit','debit','cash','online')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','failed')),
  gateway         TEXT,                         -- 'mercadopago','stripe',…
  gateway_ref     TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id   UUID REFERENCES branches(id),
  type        TEXT NOT NULL CHECK (type IN ('income','expense')),
  category    TEXT NOT NULL,                    -- service|product|plan|salary|commission|supplier|other
  description TEXT,
  amount_cents BIGINT NOT NULL,
  occurred_at DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE commissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id      UUID NOT NULL REFERENCES barbers(id),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  amount_cents   INT NOT NULL,
  paid           BOOLEAN NOT NULL DEFAULT false,
  paid_at        TIMESTAMPTZ
);

-- ---------- PRODUTOS / ESTOQUE ----------
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID REFERENCES branches(id),
  sku           TEXT NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT,
  price_cents   INT NOT NULL,
  cost_cents    INT NOT NULL DEFAULT 0,
  stock_qty     INT NOT NULL DEFAULT 0,
  min_stock_qty INT NOT NULL DEFAULT 0,
  supplier      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (branch_id, sku)
);

CREATE TABLE inventory_moves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  move_type  TEXT NOT NULL CHECK (move_type IN ('in','out','adjust')),
  qty        INT NOT NULL,
  reason     TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- MARKETING / CRM ----------
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  customer_id    UUID REFERENCES customers(id),
  barber_id      UUID REFERENCES barbers(id),
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  source         TEXT NOT NULL DEFAULT 'internal' CHECK (source IN ('internal','google')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  discount_type  TEXT NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value INT NOT NULL,
  valid_from     DATE,
  valid_until    DATE,
  max_uses       INT,
  uses_count     INT NOT NULL DEFAULT 0,
  service_ids    UUID[] DEFAULT '{}',           -- vazio = todos
  is_active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  audience    TEXT NOT NULL CHECK (audience IN ('all','active','inactive','vip','birthday','new')),
  channel     TEXT NOT NULL DEFAULT 'whatsapp',
  message     TEXT NOT NULL,
  coupon_id   UUID REFERENCES coupons(id),
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  campaign_id UUID REFERENCES campaigns(id),
  channel     TEXT NOT NULL DEFAULT 'whatsapp',
  template    TEXT,                             -- confirmation|reminder|aftercare|rescheduled|cancelled|custom
  body        TEXT NOT NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('out','in')),
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','read','failed')),
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE loyalty_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  points      INT NOT NULL,                     -- negativo = resgate
  reason      TEXT NOT NULL,                    -- visit|birthday|referral|review|redeem
  ref_id      UUID,
  expires_at  DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES customers(id),
  referred_id   UUID UNIQUE REFERENCES customers(id),
  code          TEXT NOT NULL,
  converted_at  TIMESTAMPTZ,
  rewardGranted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  plan_code   TEXT NOT NULL,                    -- monthly|premium
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  price_cents INT NOT NULL,
  gateway     TEXT,
  gateway_ref TEXT,
  started_at  DATE NOT NULL,
  cancelled_at DATE
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),        -- destinatário interno; null = broadcast admin
  type        TEXT NOT NULL,                    -- new_appointment|cancellation|new_customer|payment|low_stock|review
  payload     JSONB NOT NULL DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  branch_id  UUID REFERENCES branches(id),
  key        TEXT NOT NULL,                     -- ex.: whatsapp_templates, seo, lgpd
  value_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (branch_id, key)
);

-- seeds mínimos
INSERT INTO roles (code, description) VALUES
  ('ADMIN','Acesso total'),
  ('MANAGER','Operacional + financeiro'),
  ('BARBER','Próprios agendamentos'),
  ('RECEPTION','Agendamentos e clientes'),
  ('CUSTOMER','Portal do cliente');
