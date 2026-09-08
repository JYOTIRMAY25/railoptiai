import { useApp } from "../store/AppContext";
import { AlertTriangle, ClipboardList, Calendar, Activity, CheckCircle, AlertCircle, Info, Inbox } from "lucide-react";

const CORRIDOR = [
  { name: "Raipur", type: "station" },
  { name: "A12", type: "section", state: "maintenance" },
  { name: "Bhilai", type: "station" },
  { name: "A13", type: "section", state: "available" },
  { name: "Durg", type: "station" },
  { name: "B07", type: "section", state: "planned" },
  { name: "Rajnandgaon", type: "station" },
  { name: "C03", type: "section", state: "conflict" },
  { name: "Dongargarh", type: "station" },
];

const STATE_COLOR: Record<string, string> = {
  maintenance: "bg-amber-100 border-amber-400 text-amber-700",
  available: "bg-emerald-100 border-emerald-400 text-emerald-700",
  planned: "bg-blue-100 border-blue-400 text-blue-700",
  conflict: "bg-red-100 border-red-400 text-red-700",
};

const SECTION_DATA = [
  { section: "A12", requests: 6, critical: 2, status: "Attention" },
  { section: "A13", requests: 4, critical: 0, status: "Planned" },
  { section: "B07", requests: 7, critical: 1, status: "Planned" },
  { section: "C03", requests: 3, critical: 1, status: "Conflict" },
  { section: "D04", requests: 5, critical: 0, status: "Available" },
];

const ALERTS = [
  { type: "critical", icon: AlertCircle, title: "Critical maintenance request pending", desc: "Signal S-42 requires immediate planning. MR-1025 unscheduled.", color: "border-l-[#c0392b] bg-red-50" },
  { type: "warning", icon: AlertTriangle, title: "Overlapping requests", desc: "2 requests are using Section A12. Conflict C-014 detected.", color: "border-l-amber-500 bg-amber-50" },
  { type: "info", icon: Info, title: "Operational change", desc: "Train 12845 delayed by 35 minutes. Block B-023 may be affected.", color: "border-l-blue-400 bg-blue-50" },
  { type: "info", icon: Inbox, title: "New requests", desc: "5 maintenance requests received today and pending assignment.", color: "border-l-gray-400 bg-gray-50" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Attention: "bg-amber-100 text-amber-700 border border-amber-300",
    Planned: "bg-blue-100 text-blue-700 border border-blue-300",
    Conflict: "bg-red-100 text-red-700 border border-red-300",
    Available: "bg-emerald-100 text-emerald-700 border border-emerald-300",
  };
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

export default function Dashboard() {
  const { requests, blocks, conflicts } = useApp();
  const pending = requests.filter(r => r.status === "Pending").length;
  const critical = requests.filter(r => r.priority === "Critical").length;
  const unresolved = conflicts.filter(c => !c.resolved).length;
  const approvedBlocks = blocks.filter(b => b.status === "Approved" || b.status === "AI Recommended").length;

  const KPIs = [
    { label: "Pending Requests", value: pending, icon: ClipboardList, color: "text-gray-700", sub: "Awaiting planning" },
    { label: "Critical", value: critical, icon: AlertCircle, color: "text-[#c0392b]", sub: "Immediate action" },
    { label: "Planned Blocks", value: approvedBlocks, icon: Calendar, color: "text-blue-600", sub: "Scheduled" },
    { label: "Conflicts", value: unresolved, icon: AlertTriangle, color: "text-amber-600", sub: "Unresolved" },
    { label: "Asset Availability", value: "94.8%", icon: Activity, color: "text-emerald-600", sub: "Raipur Division" },
  ];

  return (
    <div className="p-5 max-w-full">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-sm text-gray-500">Maintenance planning overview for Raipur Division</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {KPIs.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{k.label}</span>
                <Icon size={14} className={k.color} />
              </div>
              <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Planning Status Table */}
        <div className="col-span-2 bg-white border border-gray-200 rounded">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Maintenance Planning Status</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Section</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Requests</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Critical</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {SECTION_DATA.map((row, i) => (
                <tr key={row.section} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : ""}`}>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-sm font-medium text-gray-800">{row.section}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">{row.requests}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-mono ${row.critical > 0 ? "text-[#c0392b] font-semibold" : "text-gray-400"}`}>{row.critical}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Planning Alerts</h2>
          </div>
          <div className="p-3 space-y-2">
            {ALERTS.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <div key={i} className={`border-l-4 p-3 rounded-r text-sm ${alert.color}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={13} className="flex-shrink-0" />
                    <span className="font-medium text-gray-800 text-xs">{alert.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">{alert.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Corridor Overview */}
      <div className="mt-4 bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Corridor Overview — Raipur Division</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />Maintenance</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />Available</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" />Planned</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />Conflict</span>
          </div>
        </div>
        <div className="flex items-center gap-0 overflow-x-auto py-2">
          {CORRIDOR.map((item, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              {item.type === "station" ? (
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#0f2040] border-2 border-[#0f2040]" />
                  <div className="text-[10px] font-medium text-gray-700 mt-1 whitespace-nowrap">{item.name}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center mx-1">
                  <div className={`px-2 py-1 rounded border text-[10px] font-mono font-semibold ${STATE_COLOR[item.state || "available"]}`}>
                    {item.name}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5 capitalize">{item.state}</div>
                </div>
              )}
              {i < CORRIDOR.length - 1 && item.type === "station" && (
                <div className="w-8 h-0.5 bg-gray-400 mx-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
