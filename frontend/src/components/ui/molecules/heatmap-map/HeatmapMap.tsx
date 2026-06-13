import * as React from "react";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface HeatmapSector {
  id: string;
  name: string;
  shortage_level: "low" | "medium" | "critical";
  details: string;
  active_requests: number;
  critical_groups: string[];
  /** GeoJSON polygon coordinates [lng, lat][] */
  coordinates: [number, number][];
  /** Approx center for label marker */
  center: [number, number];
}

interface HeatmapMapProps {
  sectors: HeatmapSector[];
  selectedSectorId?: string | null;
  onSectorClick?: (sector: HeatmapSector) => void;
  className?: string;
  height?: string;
}

const SHORTAGE_STYLES = {
  low: {
    color: "#22c55e",
    fillColor: "#22c55e",
    fillOpacity: 0.18,
    weight: 2,
  },
  medium: {
    color: "#f59e0b",
    fillColor: "#f59e0b",
    fillOpacity: 0.22,
    weight: 2,
  },
  critical: {
    color: "#ef4444",
    fillColor: "#ef4444",
    fillOpacity: 0.3,
    weight: 2.5,
  },
};

const SHORTAGE_SELECTED = {
  low: { color: "#16a34a", fillOpacity: 0.45, weight: 3 },
  medium: { color: "#d97706", fillOpacity: 0.5, weight: 3 },
  critical: { color: "#dc2626", fillOpacity: 0.55, weight: 3.5 },
};

export const HeatmapMap: React.FC<HeatmapMapProps> = ({
  sectors,
  selectedSectorId,
  onSectorClick,
  className = "",
  height = "340px",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<Map<string, L.Polygon>>(new Map());

  // Initialize map on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [13.0827, 80.2707], // Chennai, India
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false, // mouse wheel scroll → page scrolls normally
      touchZoom: false,       // trackpad pinch → page zoom, not map zoom
      doubleClickZoom: true,  // double-click to zoom still works
      dragging: true,         // click-and-drag pan still works
    });

    // Mac trackpads send pinch as ctrl+wheel events.
    // Leaflet intercepts these even when scrollWheelZoom is false,
    // so we block them at the DOM level and let the browser handle them.
    const container = map.getContainer();
    const blockCtrlWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.stopPropagation();
      }
    };
    container.addEventListener("wheel", blockCtrlWheel, { capture: true, passive: true });

    // OpenStreetMap dark-styled tiles via CartoDB
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      container.removeEventListener("wheel", blockCtrlWheel, { capture: true });
      map.remove();
      mapInstanceRef.current = null;
      polygonLayersRef.current.clear();
    };
  }, []);

  // Draw / update polygons whenever sectors change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old polygons
    polygonLayersRef.current.forEach((poly) => map.removeLayer(poly));
    polygonLayersRef.current.clear();

    sectors.forEach((sector) => {
      // Convert [lng, lat] → Leaflet LatLng [lat, lng]
      const latLngs: L.LatLngExpression[] = sector.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      const isSelected = sector.id === selectedSectorId;
      const baseStyle = SHORTAGE_STYLES[sector.shortage_level];
      const selectedStyle = SHORTAGE_SELECTED[sector.shortage_level];
      const style: L.PathOptions = isSelected
        ? { ...baseStyle, ...selectedStyle }
        : baseStyle;

      const poly = L.polygon(latLngs, style);

      // Build a rich popup
      const shortageLabel =
        sector.shortage_level === "critical"
          ? `<span style="color:#ef4444;font-weight:700">⚠ CRITICAL</span>`
          : sector.shortage_level === "medium"
          ? `<span style="color:#f59e0b;font-weight:700">⚡ MEDIUM</span>`
          : `<span style="color:#22c55e;font-weight:700">✓ LOW</span>`;

      const criticalGroupHtml =
        sector.critical_groups.length > 0
          ? `<div style="margin-top:6px;font-size:11px;color:#94a3b8">Critical types: <strong style="color:#f87171">${sector.critical_groups.join(", ")}</strong></div>`
          : "";

      poly.bindTooltip(
        `<div style="font-family:Inter,sans-serif;min-width:160px;">
          <div style="font-weight:700;font-size:13px;color:#f1f5f9">${sector.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin:4px 0 2px">${sector.id}</div>
          <div style="font-size:12px">Risk: ${shortageLabel}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px">${sector.details}</div>
          ${criticalGroupHtml}
          ${sector.active_requests > 0 ? `<div style="margin-top:6px;font-size:11px;color:#60a5fa">Active requests: <strong>${sector.active_requests}</strong></div>` : ""}
        </div>`,
        {
          sticky: true,
          className: "leaflet-dark-tooltip",
          opacity: 0.97,
        }
      );

      poly.on("click", () => {
        onSectorClick?.(sector);
      });

      poly.on("mouseover", () => {
        if (sector.id !== selectedSectorId) {
          poly.setStyle({ fillOpacity: style.fillOpacity! + 0.15, weight: style.weight! + 0.5 });
        }
      });

      poly.on("mouseout", () => {
        if (sector.id !== selectedSectorId) {
          poly.setStyle(style);
        }
      });

      poly.addTo(map);
      polygonLayersRef.current.set(sector.id, poly);

      // Add a divIcon label at center
      const label = L.divIcon({
        className: "",
        html: `<div style="
          font-family:Inter,ui-sans-serif,sans-serif;
          font-size:10px;
          font-weight:700;
          color:#f1f5f9;
          background:rgba(15,23,42,0.7);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:4px;
          padding:2px 6px;
          white-space:nowrap;
          backdrop-filter:blur(4px);
          pointer-events:none;
        ">${sector.id}</div>`,
        iconAnchor: [20, 10],
      });
      L.marker([sector.center[1], sector.center[0]], { icon: label }).addTo(map);
    });
  }, [sectors, selectedSectorId, onSectorClick]);

  // Update polygon styles when selected sector changes (without redrawing all)
  useEffect(() => {
    polygonLayersRef.current.forEach((poly, id) => {
      const sector = sectors.find((s) => s.id === id);
      if (!sector) return;
      const isSelected = id === selectedSectorId;
      const baseStyle = SHORTAGE_STYLES[sector.shortage_level];
      const selectedStyle = SHORTAGE_SELECTED[sector.shortage_level];
      poly.setStyle(isSelected ? { ...baseStyle, ...selectedStyle } : baseStyle);
    });
  }, [selectedSectorId, sectors]);

  return (
    <>
      {/* Inject dark tooltip styles */}
      <style>{`
        .leaflet-dark-tooltip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #f1f5f9;
          padding: 10px 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          backdrop-filter: blur(12px);
        }
        .leaflet-dark-tooltip::before {
          border-top-color: rgba(15,23,42,0.95) !important;
        }
        .leaflet-container {
          font-family: Inter, ui-sans-serif, sans-serif;
        }
        .leaflet-control-attribution {
          background: rgba(15,23,42,0.7) !important;
          color: #64748b !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: #60a5fa !important;
        }
      `}</style>
      <div
        ref={mapRef}
        className={className}
        style={{ height, width: "100%", borderRadius: "8px", overflow: "hidden" }}
      />
    </>
  );
};

export default HeatmapMap;
