"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PRESET_CATEGORIES, type LocationDetail } from "@/lib/providers/locations";
import { Navigation, MapPin, Coffee, Activity, Plane, Star } from "lucide-react";

interface MockMapProps {
  originAddress?: string;
  originLat?: number;
  originLng?: number;
  destinationAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
  status?: string;
  provider?: string;
  showPreviewOnly?: boolean;
}

export function MockMap({
  originAddress = "Current location",
  originLat = 37.7880,
  originLng = -122.4075,
  destinationAddress = "Destination",
  destinationLat = 37.6213,
  destinationLng = -122.3790,
  status = "SEARCHING",
  provider = "Easy Ride Agent",
  showPreviewOnly = false,
}: MockMapProps) {
  const [progress, setProgress] = useState(0);

  // Animate the car along the route when ride is active
  useEffect(() => {
    if (showPreviewOnly) {
      setProgress(0);
      return;
    }

    if (status === "SETTLED" || status === "COMPLETED") {
      setProgress(100);
      return;
    }

    if (status === "CANCELLED") {
      return;
    }

    // If accepted or in progress, animate car moving along the route
    let interval: NodeJS.Timeout;
    if (status === "IN_PROGRESS" || status === "ACCEPTED" || status === "ESCROW_FUNDED") {
      const startTime = Date.now();
      const duration = 25000; // 25s loop for the mock progress

      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) % duration;
        const currentProgress = (elapsed / duration) * 100;
        setProgress(currentProgress);
      }, 50);
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [status, showPreviewOnly]);

  const width = 500;
  const height = 280;

  // Gather landmarks to plot on the map for city ambiance
  const landmarks = useMemo(() => {
    const list: (LocationDetail & { type: "airport" | "eatery" | "hospital" | "other" })[] = [];
    
    // Add airports
    PRESET_CATEGORIES.airport.forEach(a => list.push({ ...a, type: "airport" }));
    // Add eateries
    PRESET_CATEGORIES.eatery.forEach(e => list.push({ ...e, type: "eatery" }));
    // Add hospitals
    PRESET_CATEGORIES.hospital.forEach(h => list.push({ ...h, type: "hospital" }));
    // Add others
    PRESET_CATEGORIES.other.forEach(o => list.push({ ...o, type: "other" }));

    return list;
  }, []);

  // Compute projection scales
  const bounds = useMemo(() => {
    const lats = [originLat, destinationLat, ...landmarks.map(l => l.lat)];
    const lngs = [originLng, destinationLng, ...landmarks.map(l => l.lng)];

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;
    const padLat = latRange * 0.2;
    const padLng = lngRange * 0.2;

    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
    };
  }, [originLat, originLng, destinationLat, destinationLng, landmarks]);

  const toX = (lng: number) => {
    return ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
  };
  const toY = (lat: number) => {
    return (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height;
  };

  const xA = toX(originLng);
  const yA = toY(originLat);
  const xB = toX(destinationLng);
  const yB = toY(destinationLat);

  // Draw a curved route path using a quadratic bezier curve
  const midX = (xA + xB) / 2 + (yB - yA) * 0.2; // Add curve offset
  const midY = (yA + yB) / 2 + (xA - xB) * 0.2;
  const pathD = `M ${xA} ${yA} Q ${midX} ${midY} ${xB} ${yB}`;

  // Helper to sample position along the Bezier curve
  const getPointAtPercent = (t: number) => {
    // Quadratic bezier formula: B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
    const x = (1 - t) * (1 - t) * xA + 2 * (1 - t) * t * midX + t * t * xB;
    const y = (1 - t) * (1 - t) * yA + 2 * (1 - t) * t * midY + t * t * yB;
    
    // Approximate tangent angle
    const tNext = Math.min(1, t + 0.01);
    const xNext = (1 - tNext) * (1 - tNext) * xA + 2 * (1 - tNext) * tNext * midX + tNext * tNext * xB;
    const yNext = (1 - tNext) * (1 - tNext) * yA + 2 * (1 - tNext) * tNext * midX + tNext * tNext * yB;
    const angle = Math.atan2(yNext - y, xNext - x) * (180 / Math.PI);

    return { x, y, angle };
  };

  const carPos = getPointAtPercent(progress / 100);

  // Map icons for landmarks
  const getLandmarkIcon = (type: string) => {
    switch (type) {
      case "airport": return <Plane className="h-3 w-3 text-sky-400" />;
      case "eatery": return <Coffee className="h-3 w-3 text-amber-400" />;
      case "hospital": return <Activity className="h-3 w-3 text-rose-400" />;
      default: return <Star className="h-3 w-3 text-indigo-400" />;
    }
  };

  const cleanLabel = (addr: string) => {
    return addr.split(",")[0];
  };

  return (
    <div className="glass-gradient-border relative w-full overflow-hidden rounded-2xl bg-slate-950/40 p-1">
      {/* HUD Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="rounded-lg bg-slate-950/75 px-2.5 py-1 text-[11px] font-medium tracking-wide text-muted/90 backdrop-blur-md border border-white/5">
          ROUTE RADAR · {provider.toUpperCase()}
        </div>
        {status && !showPreviewOnly && (
          <div className="rounded-lg bg-teal/10 border border-teal/20 px-2.5 py-1 text-[11px] font-semibold text-teal backdrop-blur-md">
            {status}
          </div>
        )}
      </div>

      {/* SVG Canvas Map */}
      <svg
        className="w-full bg-[#080d19]/90 transition-all duration-300"
        viewBox={`0 0 ${width} ${height}`}
        style={{ minHeight: "240px" }}
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Fake Neon Street Lines (for atmosphere) */}
        <path d="M 0 50 L 500 50" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
        <path d="M 120 0 L 120 280" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
        <path d="M 380 0 L 380 280" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />
        <path d="M 0 200 L 500 200" stroke="rgba(255,255,255,0.02)" strokeWidth="3" />

        {/* Plot Landmarks (Eateries, Hospitals, etc.) */}
        {landmarks.map((landmark, idx) => {
          const x = toX(landmark.lng);
          const y = toY(landmark.lat);

          // Skip if outside or too close to origin/dest
          const distToA = Math.hypot(x - xA, y - yA);
          const distToB = Math.hypot(x - xB, y - yB);
          if (distToA < 30 || distToB < 30) return null;
          if (x < 10 || x > width - 10 || y < 10 || y > height - 10) return null;

          return (
            <g key={idx} className="opacity-45 hover:opacity-100 transition-opacity cursor-help">
              <circle cx={x} cy={y} r="8" fill="rgba(30, 41, 59, 0.7)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <foreignObject x={x - 6} y={y - 6} width="12" height="12">
                <div className="flex items-center justify-center h-full w-full">
                  {getLandmarkIcon(landmark.type)}
                </div>
              </foreignObject>
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="fill-muted/70 text-[8px] font-medium tracking-tight"
                style={{ fontSize: "8px", pointerEvents: "none" }}
              >
                {cleanLabel(landmark.label)}
              </text>
            </g>
          );
        })}

        {/* Route Line (Glow and Main) */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#neon-grad)"
          strokeWidth="5"
          className="opacity-20 blur-sm"
        />
        <path
          d={pathD}
          fill="none"
          stroke="url(#neon-grad)"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="animate-route-pulse"
        />

        {/* Origin Marker */}
        <g className="cursor-default">
          <circle cx={xA} cy={yA} r="14" className="fill-teal/10 stroke-teal/40" strokeWidth="1.5" />
          <circle cx={xA} cy={yA} r="6" className="fill-teal animate-pulse" />
          <text
            x={xA}
            y={yA - 18}
            textAnchor="middle"
            className="fill-teal text-[10px] font-bold"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}
          >
            START
          </text>
        </g>

        {/* Destination Marker */}
        <g className="cursor-default">
          <circle cx={xB} cy={yB} r="14" className="fill-indigo/10 stroke-indigo/40" strokeWidth="1.5" />
          <path
            d={`M ${xB} ${yB - 8} L ${xB + 5} ${yB - 3} L ${xB - 5} ${yB - 3} Z`}
            className="fill-indigo"
          />
          <circle cx={xB} cy={yB} r="4" className="fill-indigo" />
          <text
            x={xB}
            y={yB - 18}
            textAnchor="middle"
            className="fill-indigo text-[10px] font-bold"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}
          >
            END
          </text>
        </g>

        {/* Active Vehicle Marker */}
        {status !== "CANCELLED" && (
          <g transform={`translate(${carPos.x}, ${carPos.y}) rotate(${carPos.angle})`}>
            {/* Glow ring */}
            <circle cx="0" cy="0" r="12" className="fill-teal/20 animate-ping" style={{ animationDuration: "2s" }} />
            {/* Solid Vehicle Pointer */}
            <g transform="rotate(-90)">
              <polygon
                points="0,-8 6,6 0,3 -6,6"
                className="fill-teal stroke-white"
                strokeWidth="1.5"
              />
            </g>
          </g>
        )}
      </svg>

      {/* Route Address Footer Panel */}
      <div className="flex justify-between items-center bg-slate-950/75 p-3 text-xs border-t border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-teal shrink-0" />
          <div className="text-left">
            <p className="text-[10px] text-muted tracking-wide font-medium">FROM</p>
            <p className="font-semibold text-foreground truncate max-w-[170px]" title={originAddress}>
              {cleanLabel(originAddress)}
            </p>
          </div>
        </div>
        
        <div className="h-6 w-[1px] bg-white/10" />

        <div className="flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-indigo shrink-0" />
          <div className="text-left">
            <p className="text-[10px] text-muted tracking-wide font-medium">TO</p>
            <p className="font-semibold text-foreground truncate max-w-[170px]" title={destinationAddress}>
              {cleanLabel(destinationAddress)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
