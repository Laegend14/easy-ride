"use client";

import { Car, Users, Crown, Zap, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RideOfferLite } from "@/app/(app)/ride/actions";
import type { VehicleClass } from "@/lib/providers";

const VEHICLE_ICON: Record<VehicleClass, React.ComponentType<{ className?: string }>> = {
  standard: Car,
  shared: Users,
  premium: Crown,
  ev: Zap,
};

function usd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface RideOfferCardProps {
  offer: RideOfferLite;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function RideOfferCard({ offer, isSelected, onSelect }: RideOfferCardProps) {
  const Icon = VEHICLE_ICON[offer.vehicleClass] ?? Car;
  const active = isSelected !== undefined ? isSelected : offer.selected;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-2xl p-4 transition space-y-3 cursor-pointer select-none",
        active ? "glass-gradient-border ring-2 ring-teal/50 shadow-lg" : "glass hover:bg-white/[0.04]",
        !offer.withinBudget && "opacity-60",
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl transition",
            active ? "bg-gradient-brand text-white shadow-md" : "bg-white/5 text-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{offer.provider}</span>
            {offer.selected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
                <Check className="h-3 w-3" /> AI Recommended
              </span>
            ) : null}
            {active && !offer.selected ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet/20 px-2 py-0.5 text-xs font-medium text-violet border border-violet/30">
                Selected
              </span>
            ) : null}
            {!offer.withinBudget ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted">
                Over budget
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-sm text-muted">
            <span>{offer.productName}</span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-violet" />
              {offer.rating.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-display text-lg font-semibold">{usd(offer.fareCents)}</div>
          <div className="text-sm text-muted">{offer.etaMinutes} min</div>
        </div>
      </div>

      {/* Driver and Vehicle mock details */}
      {offer.driverName && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-4 text-xs animate-fade-in">
          {/* Driver details */}
          <div className="flex items-center gap-2.5 min-w-0">
            {offer.driverPhoto && (
              <img
                src={offer.driverPhoto}
                alt={offer.driverName}
                className="h-8 w-8 rounded-full border border-white/10 object-cover bg-white/5 shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{offer.driverName}</p>
              <p className="text-[10px] text-muted flex items-center gap-1">
                <span>{offer.driverSex}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 text-violet" />
                  {offer.driverRating?.toFixed(1)}
                </span>
              </p>
            </div>
          </div>

          {/* Vehicle details */}
          {offer.vehicleName && (
            <div className="flex items-center gap-2.5 min-w-0 text-right justify-end">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{offer.vehicleName}</p>
                <p className="text-[10px] text-muted font-display tracking-wide uppercase">Driver vehicle</p>
              </div>
              {offer.vehiclePhoto && (
                <img
                  src={offer.vehiclePhoto}
                  alt={offer.vehicleName}
                  className="h-8 w-12 rounded-lg border border-white/10 object-cover bg-white/5 shrink-0"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
