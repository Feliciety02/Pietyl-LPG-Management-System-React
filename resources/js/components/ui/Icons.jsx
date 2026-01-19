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

  // Accountant
  BookOpen,
  CalendarDays,

  // POS UI + Actions
  Wallet,
  Smartphone,
  ScanLine,
  Receipt,
  Search,
  Flame,
  Wrench,

  Plus,
  Minus,
  Trash2,
  Banknote,
  ArrowRight,
} from "lucide-react";

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

  // Accountant
  daily: CalendarDays,
  ledger: BookOpen,

  // POS icons (shared, not sidebar specific)
  posCart: ShoppingCart,
  posCash: Wallet,
  posCashAlt: Banknote,
  posGcash: Smartphone,
  posCard: CreditCard,
  posBarcode: ScanLine,
  posReceipt: Receipt,
  posSearch: Search,

  posAdd: Plus,
  posMinus: Minus,
  posRemove: Trash2,
  posNext: ArrowRight,

  posLpg: Flame,
  posAccessories: Wrench,
};
