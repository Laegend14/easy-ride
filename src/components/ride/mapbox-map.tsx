"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation, MapPin, Car, AlertTriangle } from "lucide-react";

interface MapboxMapProps {
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

export function MapboxMap({
  originAddress = "Current location",
  originLat = 37.7880,
  originLng = -122.4075,
  destinationAddress = "Destination",
  destinationLat = 37.6213,
  destinationLng = -122.3790,
  status = "SEARCHING",
  provider = "Easy Ride Agent",
  showPreviewOnly = false,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const carMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  useEffect(() => {
    if (!token) {
      setTokenMissing(true);
      return;
    }

    mapboxgl.accessToken = token;

    if (!mapContainer.current) return;

    const centerLng = (originLng + destinationLng) / 2;
    const centerLat = (originLat + destinationLat) / 2;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [centerLng, centerLat],
      zoom: 11,
      attributionControl: false,
    });

    map.current = m;

    m.on("load", async () => {
      // 1. Add Origin Marker
      const originEl = document.createElement("div");
      originEl.className = "flex items-center justify-center w-8 h-8 rounded-full bg-teal text-white shadow-lg border-2 border-white";
      originEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
      new mapboxgl.Marker(originEl).setLngLat([originLng, originLat]).addTo(m);

      // 2. Add Destination Marker
      const destEl = document.createElement("div");
      destEl.className = "flex items-center justify-center w-8 h-8 rounded-full bg-violet text-white shadow-lg border-2 border-white";
      destEl.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
      new mapboxgl.Marker(destEl).setLngLat([destinationLng, destinationLat]).addTo(m);

      // 3. Fetch Directions
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destinationLng},${destinationLat}?steps=true&geometries=geojson&access_token=${token}`
        );
        const json = await query.json();
        const data = json.routes?.[0];
        if (data?.geometry?.coordinates) {
          const coords = data.geometry.coordinates as [number, number][];
          setRouteCoordinates(coords);

          // Add route line to map
          m.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
          });

          m.addLayer({
            id: "route-glow",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#2dd4bf",
              "line-width": 8,
              "line-opacity": 0.3,
            },
          });

          m.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#2dd4bf",
              "line-width": 4,
              "line-opacity": 0.9,
            },
          });

          // Fit bounds
          const bounds = new mapboxgl.LngLatBounds();
          coords.forEach((coord) => bounds.extend(coord));
          m.fitBounds(bounds, { padding: 40 });

          // 4. Add Animated Vehicle Marker if active
          if (!showPreviewOnly && (status === "ACCEPTED" || status === "IN_PROGRESS" || status === "ESCROW_FUNDED")) {
            const carEl = document.createElement("div");
            carEl.className = "flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background shadow-2xl border-2 border-teal transition-transform";
            carEl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;

            const marker = new mapboxgl.Marker(carEl).setLngLat(coords[0]!).addTo(m);
            carMarkerRef.current = marker;

            // Animate along coordinates
            let step = 0;
            const animate = () => {
              step = (step + 1) % coords.length;
              if (coords[step]) {
                marker.setLngLat(coords[step]!);
              }
              animationFrameRef.current = requestAnimationFrame(animate);
            };
            animationFrameRef.current = requestAnimationFrame(animate);
          }
        }
      } catch (err) {
        console.error("Mapbox Directions API failed:", err);
      }
    });

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      m.remove();
    };
  }, [token, originLat, originLng, destinationLat, destinationLng, status, showPreviewOnly]);

  if (tokenMissing) {
    return (
      <div className="relative w-full h-[280px] rounded-2xl overflow-hidden bg-background/80 border border-white/10 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center text-teal mb-3">
          <Navigation className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-foreground text-sm">Mapbox Route Preview</h4>
        <p className="text-xs text-muted max-w-sm mt-1">
          {originAddress} → {destinationAddress}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#f6c177] bg-[#f6c177]/10 px-3 py-1.5 rounded-full border border-[#f6c177]/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN for live tiles & driving routes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Route Badge Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs shadow-lg">
        <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
        <span className="font-medium text-foreground">{provider}</span>
        <span className="text-muted">•</span>
        <span className="text-muted">Live Navigation</span>
      </div>
    </div>
  );
}
