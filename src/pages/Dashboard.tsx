import { MapComponent } from "@/components/MapComponent";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TriangleAlert,
  CircleCheck,
  Clock,
  Gauge,
  MapPin,
  Signal,
  Wifi,
  WifiOff,
} from "lucide-react";

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

function formatCount(n: number): string {
  return n.toLocaleString("en-NG");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel("reports_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          setReports((prev) => [payload.new as Report, ...prev]);
          toast.success("New report received", {
            description: `Severity: ${(payload.new as Report).severity}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          setReports((prev) =>
            prev.map((r) =>
              r.id === (payload.new as Report).id ? (payload.new as Report) : r
            )
          );
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          toast.error("Realtime connection lost");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchReports() {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .neq("status", "invalid")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }
    setReports(data || []);
  }

  async function updateStatus(id: number, newStatus: string) {
    const updates: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("reports")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Report #${id} marked as ${newStatus.replace("_", " ")}`);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }

  const highCount = reports.filter((r) => r.severity === "high").length;
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const filtered = reports.filter((r) => {
    if (filter !== "all" && r.severity !== filter) return false;
    if (
      search &&
      !r.category.toLowerCase().includes(search.toLowerCase()) &&
      !r.hazard_description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const severityBorder = (s: string) => {
    if (s === "high") return "border-l-red-500";
    if (s === "medium") return "border-l-amber-500";
    return "border-l-emerald-500";
  };

  const severityBg = (s: string) => {
    if (s === "high") return "bg-red-500/10 text-red-400";
    if (s === "medium") return "bg-amber-500/10 text-amber-400";
    return "bg-emerald-500/10 text-emerald-400";
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-end px-5 py-2 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-4 font-mono text-[10px] sm:text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            {connected ? (
              <Wifi size={14} className="text-emerald-400" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
            <span>{connected ? "LIVE" : "OFFLINE"}</span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <StatBadge
              icon={<TriangleAlert size={13} />}
              label="High"
              value={formatCount(highCount)}
              color="text-red-400"
            />
            <StatBadge
              icon={<Clock size={13} />}
              label="Pending"
              value={formatCount(pendingCount)}
              color="text-amber-400"
            />
            <StatBadge
              icon={<CircleCheck size={13} />}
              label="Resolved"
              value={formatCount(resolvedCount)}
              color="text-emerald-400"
            />
            <StatBadge
              icon={<Gauge size={13} />}
              label="Total"
              value={formatCount(reports.length)}
              color="text-slate-300"
            />
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors text-xs font-mono"
          >
            {sidebarOpen ? "HIDE" : "LIST"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } transition-all duration-200 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden shrink-0`}
        >
          <div className="p-3 border-b border-slate-800 space-y-2">
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
            <div className="flex gap-1.5">
              {["all", "high", "medium", "low"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-mono transition-colors ${
                    filter === f
                      ? "bg-slate-700 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                <Signal size={24} />
                <span className="text-xs font-mono">NO REPORTS</span>
              </div>
            ) : (
              filtered.map((r) => (
                <div
                  key={r.id}
                  className={`border-l-2 ${severityBorder(
                    r.severity
                  )} px-3 py-2.5 border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition-colors`}
                  onClick={() => {
                    const event = new CustomEvent("fly-to-report", {
                      detail: { lat: r.lat, lng: r.lng, id: r.id },
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                      #{r.id} - {r.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono ${severityBg(
                        r.severity
                      )}`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                    {r.hazard_description}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {timeAgo(r.created_at)}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase ${
                        r.status === "resolved"
                          ? "text-emerald-400"
                          : r.status === "in_progress"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <MapComponent reports={reports} onUpdateStatus={updateStatus} />
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className="text-slate-500 text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <span className={`${color} font-mono font-bold tabular-nums`}>
        {value}
      </span>
    </div>
  );
}