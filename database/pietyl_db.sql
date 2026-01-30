SET FOREIGN_KEY_CHECKS = 0;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_no VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  hired_at DATE NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  employee_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_users_employee_id
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_user_roles_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role_id
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_user_roles_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  perm_key VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role_id
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission_id
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(255) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_audit_logs_actor_user_id
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_actor (actor_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  customer_type VARCHAR(50) NOT NULL DEFAULT 'walkin',
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_customers_phone (phone),
  INDEX idx_customers_type (customer_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(100) NOT NULL DEFAULT 'home',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  barangay VARCHAR(255) NULL,
  city VARCHAR(255) NOT NULL,
  province VARCHAR(255) NULL,
  postal_code VARCHAR(20) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_customer_addresses_customer_id
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE,
  INDEX idx_customer_addresses_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  address TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_suppliers_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'lpg',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_products_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_products_category (category),
  INDEX idx_products_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_variants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  size_value DECIMAL(12,3) NULL,
  size_unit VARCHAR(20) NULL,
  container_type VARCHAR(50) NOT NULL DEFAULT 'cylinder',
  barcode VARCHAR(120) NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_product_variants_product_id
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  INDEX idx_variants_product (product_id),
  INDEX idx_variants_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supplier_products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  supplier_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  supplier_sku VARCHAR(120) NULL,
  lead_time_days INT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_supplier_products_supplier_id
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_supplier_products_variant_id
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_supplier_variant (supplier_id, product_variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE price_lists (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_price_lists_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE price_list_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  price_list_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'PHP',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_price_list_items_list
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_price_list_items_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_price_list_variant (price_list_id, product_variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location_type VARCHAR(50) NOT NULL DEFAULT 'warehouse',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_locations_type (location_type),
  INDEX idx_locations_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_balances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  location_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  qty_on_hand DECIMAL(12,3) NOT NULL DEFAULT 0,
  qty_reserved DECIMAL(12,3) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_inventory_balances_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_inventory_balances_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_location_variant (location_id, product_variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  location_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  qty DECIMAL(12,3) NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id BIGINT UNSIGNED NULL,
  performed_by_user_id BIGINT UNSIGNED NOT NULL,
  moved_at DATETIME NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_stock_movements_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_stock_movements_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_stock_movements_user
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_stock_movements_loc_time (location_id, moved_at),
  INDEX idx_stock_movements_variant_time (product_variant_id, moved_at),
  INDEX idx_stock_movements_ref (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchases (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  purchase_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id BIGINT UNSIGNED NOT NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  ordered_at DATETIME NULL,
  received_at DATETIME NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_purchases_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_purchases_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_purchases_status (status),
  INDEX idx_purchases_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  purchase_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  qty DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_purchase_items_purchase
    FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_purchase_items_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE RESTRICT,
  INDEX idx_purchase_items_purchase (purchase_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_number VARCHAR(50) NOT NULL UNIQUE,
  sale_type VARCHAR(50) NOT NULL DEFAULT 'walkin',
  customer_id BIGINT UNSIGNED NULL,
  cashier_user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'paid',
  sale_datetime DATETIME NOT NULL,
  price_list_id BIGINT UNSIGNED NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_sales_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_sales_cashier
    FOREIGN KEY (cashier_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_sales_price_list
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id)
    ON DELETE SET NULL,
  INDEX idx_sales_datetime (sale_datetime),
  INDEX idx_sales_status (status),
  INDEX idx_sales_type (sale_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sale_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  qty DECIMAL(12,3) NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  pricing_source VARCHAR(50) NOT NULL DEFAULT 'price_list',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_sale_items_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE RESTRICT,
  INDEX idx_sale_items_sale (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payment_methods (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  method_key VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  payment_method_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  reference_no VARCHAR(120) NULL,
  received_by_user_id BIGINT UNSIGNED NOT NULL,
  paid_at DATETIME NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_payments_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payments_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_payments_received_by
    FOREIGN KEY (received_by_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_payments_paid_at (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE receipts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL UNIQUE,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  printed_count INT NOT NULL DEFAULT 0,
  issued_at DATETIME NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_receipts_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE CASCADE,
  INDEX idx_receipts_issued_at (issued_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  delivery_number VARCHAR(50) NOT NULL UNIQUE,
  sale_id BIGINT UNSIGNED NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  address_id BIGINT UNSIGNED NOT NULL,
  assigned_rider_user_id BIGINT UNSIGNED NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  scheduled_at DATETIME NULL,
  dispatched_at DATETIME NULL,
  delivered_at DATETIME NULL,
  proof_type VARCHAR(50) NULL,
  proof_url TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_deliveries_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_deliveries_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_deliveries_address
    FOREIGN KEY (address_id) REFERENCES customer_addresses(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_deliveries_rider
    FOREIGN KEY (assigned_rider_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_deliveries_status (status),
  INDEX idx_deliveries_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE delivery_status_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  delivery_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(50) NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NOT NULL,
  changed_at DATETIME NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_delivery_status_logs_delivery
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_delivery_status_logs_user
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_delivery_status_logs_delivery_time (delivery_id, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cashier_shifts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cashier_user_id BIGINT UNSIGNED NOT NULL,
  opened_at DATETIME NOT NULL,
  closed_at DATETIME NULL,
  opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_cash DECIMAL(12,2) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_cashier_shifts_cashier
    FOREIGN KEY (cashier_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_cashier_shifts_status (status),
  INDEX idx_cashier_shifts_opened (opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE remittances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cashier_shift_id BIGINT UNSIGNED NULL,
  cashier_user_id BIGINT UNSIGNED NOT NULL,
  accountant_user_id BIGINT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  method VARCHAR(50) NOT NULL DEFAULT 'cash',
  reference_no VARCHAR(120) NULL,
  remitted_at DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_remittances_shift
    FOREIGN KEY (cashier_shift_id) REFERENCES cashier_shifts(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_remittances_cashier
    FOREIGN KEY (cashier_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_remittances_accountant
    FOREIGN KEY (accountant_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_remittances_status (status),
  INDEX idx_remittances_date (remitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chart_of_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_accounts_type (account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ledger_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entry_date DATE NOT NULL,
  reference_type VARCHAR(50) NULL,
  reference_id BIGINT UNSIGNED NULL,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  memo TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_ledger_entries_user
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_ledger_entries_date (entry_date),
  INDEX idx_ledger_entries_ref (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ledger_lines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ledger_entry_id BIGINT UNSIGNED NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL,
  debit DECIMAL(12,2) NOT NULL DEFAULT 0,
  credit DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_ledger_lines_entry
    FOREIGN KEY (ledger_entry_id) REFERENCES ledger_entries(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_ledger_lines_account
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
    ON DELETE RESTRICT,
  INDEX idx_ledger_lines_entry (ledger_entry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cylinders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  serial_no VARCHAR(120) NULL UNIQUE,
  cylinder_size VARCHAR(50) NOT NULL,
  owner_type VARCHAR(50) NOT NULL DEFAULT 'company',
  status VARCHAR(50) NOT NULL DEFAULT 'in_stock',
  current_location_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_cylinders_location
    FOREIGN KEY (current_location_id) REFERENCES locations(id)
    ON DELETE SET NULL,
  INDEX idx_cylinders_status (status),
  INDEX idx_cylinders_size (cylinder_size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cylinder_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NULL,
  delivery_id BIGINT UNSIGNED NULL,
  customer_id BIGINT UNSIGNED NULL,
  cylinder_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by_user_id BIGINT UNSIGNED NOT NULL,
  performed_at DATETIME NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_cylinder_tx_sale
    FOREIGN KEY (sale_id) REFERENCES sales(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_cylinder_tx_delivery
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_cylinder_tx_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_cylinder_tx_cylinder
    FOREIGN KEY (cylinder_id) REFERENCES cylinders(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_cylinder_tx_user
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  INDEX idx_cylinder_tx_time (performed_at),
  INDEX idx_cylinder_tx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restock_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  request_number VARCHAR(50) NOT NULL UNIQUE,
  location_id BIGINT UNSIGNED NOT NULL,
  requested_by_user_id BIGINT UNSIGNED NOT NULL,
  approved_by_user_id BIGINT UNSIGNED NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(50) NOT NULL DEFAULT 'normal',
  needed_by_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_restock_requests_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_restock_requests_requested_by
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_restock_requests_approved_by
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_restock_requests_status (status),
  INDEX idx_restock_requests_location (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE restock_request_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  restock_request_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  current_qty DECIMAL(12,3) NOT NULL DEFAULT 0,
  reorder_level DECIMAL(12,3) NOT NULL DEFAULT 0,
  requested_qty DECIMAL(12,3) NOT NULL DEFAULT 0,
  supplier_id BIGINT UNSIGNED NULL,
  linked_purchase_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_restock_items_request
    FOREIGN KEY (restock_request_id) REFERENCES restock_requests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_restock_items_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_restock_items_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_restock_items_purchase
    FOREIGN KEY (linked_purchase_id) REFERENCES purchases(id)
    ON DELETE SET NULL,
  INDEX idx_restock_items_request (restock_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
  email VARCHAR(255) NOT NULL PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL, 
  payload LONGTEXT NOT NULL,
  last_activity INT NOT NULL,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cache (
  `key` VARCHAR(255) NOT NULL PRIMARY KEY,
  value MEDIUMTEXT NOT NULL,
  expiration INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cache_locks (
  `key` VARCHAR(255) NOT NULL PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  expiration INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
