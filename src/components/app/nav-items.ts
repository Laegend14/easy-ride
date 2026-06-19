import {
  Home,
  Clock,
  CircleDollarSign,
  Gauge,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Activity", href: "/activity", icon: Clock },
  { label: "Balance", href: "/balance", icon: CircleDollarSign },
  { label: "Insights", href: "/analytics", icon: Gauge },
  { label: "Settings", href: "/settings", icon: Settings },
];
