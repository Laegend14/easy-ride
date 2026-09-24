import {
  Home,
  Clock,
  CircleDollarSign,
  Gauge,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  devOnly?: boolean;
};

/**
 * Navigation items visible to all users
 */
export const BASE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Activity", href: "/activity", icon: Clock },
  { label: "Balance", href: "/balance", icon: CircleDollarSign },
  { label: "Insights", href: "/analytics", icon: Gauge },
  { label: "Settings", href: "/settings", icon: Settings },
];

/**
 * Founder / Developer only navigation item
 */
export const DEV_NAV_ITEM: NavItem = {
  label: "Revenue",
  href: "/admin",
  icon: TrendingUp,
  devOnly: true,
};

/**
 * Returns navigation items filtered by user role.
 * Only authorized developers see the admin / revenue link.
 */
export function getNavItems(isDev: boolean = false): NavItem[] {
  return isDev ? [...BASE_NAV_ITEMS, DEV_NAV_ITEM] : BASE_NAV_ITEMS;
}

// Default export for standard users
export const NAV_ITEMS: NavItem[] = BASE_NAV_ITEMS;
