# 🔥 Pietyl LPG Management System

![Laravel](https://img.shields.io/badge/Laravel-10-red)
![React](https://img.shields.io/badge/React-18-blue)
![Inertia](https://img.shields.io/badge/Inertia.js-SPA-purple)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.x-teal)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

A **role based LPG (Liquefied Petroleum Gas) business management system** built with **Laravel, Inertia.js, React, and Tailwind CSS**.  
Designed for real world LPG operations including **sales, inventory, deliveries, accounting, and audit tracking**.

> One system. One dashboard. Multiple roles.

---

## ✨ Highlights

- 🔐 Role based access control
- 📊 Single adaptive dashboard for all roles
- 🧭 Clean, collapsible sidebar navigation
- 🧾 Full audit logging
- 📦 Inventory & product lifecycle management
- 💰 Financial visibility for owners
- 🎨 Minimalist, Google style UI

---

## 🧑‍💼 Supported Roles

| Role | Description |
|---|---|
| **Admin** | Company owner with full system control |
| **Cashier** | Sales and customer transactions |
| **Accountant** | Financial summaries and reports |
| **Rider** | Delivery tracking and status updates |
| **Inventory Manager** | Stock, movements, suppliers |

---

## 📊 Dashboard Architecture

This system uses **one shared dashboard** that adapts dynamically based on user role.

### Why this approach?
- Consistent UI across the system
- Less duplicated code
- Easier maintenance
- Scales better as roles grow

Role behavior is controlled via configuration, not duplicated pages.

---

## 🧭 Sidebar Navigation

- Collapsible sidebar
- Icons only when collapsed
- Logo click toggles collapse / expand
- Centralized icon mapping
- Minimal animations (professional, non flashy)

---

## 🧾 Audit Logging

Every critical action is recorded:
- User and employee changes
- Role and permission updates
- Product and inventory actions
- Financial and operational events

Admins can review activity history for accountability.

---

## 📦 Product & Inventory Management

- **Admin**
  - Creates new LPG products
  - Manages suppliers
  - Controls product catalog structure

- **Inventory Manager**
  - Manages stock counts
  - Tracks movements
  - Handles low stock alerts
  - Manages purchases

This separation ensures control and operational efficiency.

---

## 💰 Financial Oversight

- Cashiers handle transactions
- Accountants manage remittances and reports
- Admins view high level financial summaries

Clear separation between **execution** and **oversight**.

---

## 🎨 Design System

- Rounded cards (`rounded-3xl`)
- Subtle borders (`ring-1 ring-slate-200`)
- Consistent spacing (`gap-6`)
- Standard icon size (`h-5 w-5`)
- Minimal motion, smooth transitions

Inspired by **Google Workspace UI principles**.

---

## Security Validation

This project includes a dedicated security regression suite for the implemented cybersecurity controls.

Run it with:

```bash
composer test:security
```

Reference guide:

- `SECURITY_VALIDATION.md`

---

## 🛠 Tech Stack

- **Backend:** Laravel
- **Frontend:** React + Inertia.js
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion (minimal)
- **Icons:** Lucide React
- **Database:** MySQL / MariaDB



