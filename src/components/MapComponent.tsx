import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Report {
  id: number;
  created_at: string;
  category: string;
  severity: "low" | "medium" | "high";
  hazard_description: string;
  immediate_action_recommendation: string;
  image_url: string | null;
  lat: number;
  lng: number;
  status: "pending" | "in_progress" | "resolved" | "invalid";
}

function createIcon(severity: string, isActive: boolean) {
  const colors: Record<string, string> = {
    high: "#EF4444",
    medium: "#F59E0B",
    low: "#10B981",
  };
  const color = colors[severity] || "#6B7280";
  const size = isActive ? 36 : 28;
  const halo = isActive ? 12 : 8;

  const animEl = isActive
    ? '<animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.25;0.05;0.25" dur="2s" repeatCount="indefinite"/>'
    : "";

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="${halo}" fill="${color}" opacity="0.25">${animEl}</circle><circle cx="12" cy="12" r="5" fill="${color}" stroke="#0F172A" stroke-width="2"/><circle cx="12" cy="10" r="1.5" fill="#0F172A" opacity="0.7"/><path d="M12 22C12 22 20 16 20 10C20 5.58 16.42 2 12 2C7.58 2 4 5.58 4 10C4 16 12 22 12 22Z" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="0.5"/></svg>`;

  return L.divIcon({
    className: "custom-marker",
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FlyToHandler({ activeReport }: { activeReport: Report | null }) {
  const map = useMap();
  useEffect(() => {
    if (activeReport) {
      map.flyTo([activeReport.lat, activeReport.lng], 16, { duration: 1.2 });
    }
  }, [activeReport, map]);
  return null;
}

function MapEventBridge() {
  const map = useMap();
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      map.flyTo([detail.lat, detail.lng], 16, { duration: 1 });
    };
    window.addEventListener("fly-to-report", handler);
    return () => window.removeEventListener("fly-to-report", handler);
  }, [map]);
  return null;
}

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, " ");
}

function severityBadgeClass(s: string): string {
  if (s === "high") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (s === "medium") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}

function statusBadgeClass(s: string): string {
  if (s === "resolved") return "bg-emerald-500/20 text-emerald-400";
  if (s === "in_progress") return "bg-blue-500/20 text-blue-400";
  return "bg-amber-500/20 text-amber-400";
}

export function MapComponent({
  reports,
  onUpdateStatus,
}: {
  reports: Report[];
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeReport = useMemo(
    () => reports.find((r) => r.id === activeId) || null,
    [reports, activeId]
  );

  return (
    <MapContainer
      center={[6.5244, 3.3792]}
      zoom={12}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapEventBridge />
      <FlyToHandler activeReport={activeReport} />

      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={createIcon(r.severity, r.id === activeId)}
          eventHandlers={{ click: () => setActiveId(r.id) }}
        >
          <Popup className="custom-popup" maxWidth={340} minWidth={300}>
            <div className="bg-slate-900 text-slate-100 rounded-lg overflow-hidden font-sans text-sm">
              {r.image_url && (
                <div className="w-full h-36 overflow-hidden">
                  <img
                    src={r.image_url}
                    alt="Report"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
                    REPORT #{r.id}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${severityBadgeClass(r.severity)}`}
                  >
                    {r.severity}
                  </span>
                </div>

                <div className="text-sm font-semibold capitalize">
                  {categoryLabel(r.category)}
                </div>

                {r.hazard_description && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {r.hazard_description}
                  </p>
                )}

                {r.immediate_action_recommendation && (
                  <div className="bg-slate-800 rounded-md p-2 border border-slate-700">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                      Recommendation
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                      {r.immediate_action_recommendation}
                    </p>
                  </div>
                )}

                <div className="font-mono text-[10px] text-slate-500">
                  {r.lat.toFixed(6)}, {r.lng.toFixed(6)}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${statusBadgeClass(r.status)}`}
                  >
                    {r.status.replace("_", " ")}
                  </span>

                  <div className="flex gap-1">
                    {r.status !== "in_progress" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(r.id, "in_progress");
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors font-mono uppercase"
                      >
                        Dispatch
                      </button>
                    )}
                    {r.status !== "resolved" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(r.id, "resolved");
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-mono uppercase"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 font-mono">
                  {new Date(r.created_at).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
