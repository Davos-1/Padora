-- Orders, inventory and yearly order-number counters.
CREATE TABLE IF NOT EXISTS inventory (
  variant_sku TEXT PRIMARY KEY,          -- e.g. VP-MNT-BASE-PET or VP-BAL-3ER
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,                   -- PDR-2026-0001
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'shipped')),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  address_json TEXT NOT NULL,
  items_json TEXT NOT NULL,              -- [{variantSku, name, qty, priceChf}]
  subtotal_chf REAL NOT NULL,
  shipping_chf REAL NOT NULL,
  total_chf REAL NOT NULL,
  payment_method TEXT,                   -- twint | card | invoice
  payrexx_gateway_id TEXT,
  payrexx_transaction_id TEXT,
  access_token TEXT NOT NULL,            -- random, required to view the thank-you page
  stock_applied INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_gateway ON orders (payrexx_gateway_id);

CREATE TABLE IF NOT EXISTS order_counters (
  year INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0
);
