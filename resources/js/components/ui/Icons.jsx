// resources/js/components/ui/Icons.jsx
import {
  // Core / Dashboard
  LayoutDashboard,
  Users,
  Briefcase,
  ShieldCheck,
  ScrollText,
  BarChart3,

  // Cashier
  ShoppingCart,
  FileText,
  Repeat2,
  UserRound,
  CreditCard,

  // Rider
  Truck,
  MapPin,
  ClipboardList,
  History,

  // Inventory
  Boxes,
  ArrowLeftRight,
  AlertTriangle,
  PackagePlus,
  Building2,
  Package,
  Info,
  ChevronRight,

  // Inventory actions / shared actions
  ArrowRight,
  PlusCircle,
  Bell,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,

  // Accountant
  BookOpen,
  CalendarDays,
  BadgeDollarSign,

  // POS / UI / Actions
  Wallet,
  Smartphone,
  ScanLine,
  Receipt,
  Search,
  Tag,
  Flame,
  Wrench,
  ChefHat,
  Plus,
  Minus,
  Trash2,
  Banknote,
} from "lucide-react";

/**
 * Sidebar icons
 * Used for navigation across all roles
 */
export const sidebarIconMap = {
  // Core
  overview: LayoutDashboard,

  users: Users,
  employees: Briefcase,
  roles: ShieldCheck,
  audit: ScrollText,
  reports: BarChart3,

  // Cashier
  newSale: ShoppingCart,
  transactions: FileText,
  refillSwap: Repeat2,
  customers: UserRound,
  payments: CreditCard,

  // Rider
  deliveries: Truck,
  status: MapPin,
  remittance: ClipboardList,
  history: History,

  // Inventory
  counts: Boxes,
  movements: ArrowLeftRight,
  lowStock: AlertTriangle,
  purchases: PackagePlus,
  suppliers: Building2,
  products: Package,
  thresholds: SlidersHorizontal,

  // Accountant
  daily: CalendarDays,
  ledger: BookOpen,
  payroll: BadgeDollarSign,
  vatSettings: Banknote,
  payables: Wallet,
  costTracking: Banknote,
  promos: Tag,
};

/**
 * Inventory + Admin action icons
 * Used in tables, modals, buttons
 */
export const inventoryActionIcons = {
  warning: AlertTriangle,
  info: Info,
  notify: Bell,
  newPurchase: PlusCircle,
  approve: CheckCircle2,
  reject: XCircle,
  thresholds: SlidersHorizontal,
  arrow: ArrowRight,
  chevron: ChevronRight,
};

/**
 * POS / transactional icons
 * Shared across cashier & POS UI
 */
export const posIcons = {
  cart: ShoppingCart,
  cash: Wallet,
  cashAlt: Banknote,
  gcash: Smartphone,
  card: CreditCard,
  barcode: ScanLine,
  receipt: Receipt,
  search: Search,

  add: Plus,
  minus: Minus,
  remove: Trash2,
  next: ArrowRight,

  lpg: Flame,
  stove: ChefHat,
  accessories: Wrench,
};
