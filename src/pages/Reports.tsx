import { useState } from "react";
import { useApp } from "../store/AppContext";
import { FileText, Download, Eye, CheckCircle, XCircle, Send } from "lucide-react";

const REPORT_TYPES = [
  { id: "weekly-block", title: "Weekly Block Plan", desc: "Complete maintenance block schedule for 07–13 Sep 2026", icon: FileText },
  { id: "conflict", title: "Conflict Report", desc: "Detected conflicts, resolutions, and outstanding issues", icon: FileText },
  { id: "maintenance-summary", title: "Maintenance Summary", desc: "Summary of all maintenance requests and their status", icon: FileText },
  { id: "asset-availability", title: "Asset Availability Report", desc: "Section-wise availability metrics for the planning period", icon: FileText },
  { id: "dept-summary", title: "Department Summary", desc: "Breakdown of requests and blocks by department", icon: FileText },
];

export default function Reports() {
  const { requests, blocks, conflicts, planStatus, approvePlan, rejectPlan } = useApp();
  const [viewReport, setViewReport] = useState<string | null>(null);
  const [planMsg, setPlanMsg] = useState("");

  const approvedBlocks = blocks.filter(b => b.status === "Approved");
  const critical = requests.filter(r => r.priority === "Critical");
  const unresolvedConflicts = conflicts.filter(c => !c.resolved);

  const handleApprove = () => {
    approvePlan();
    setPlanMsg("✓ Weekly maintenance plan approved. All AI Recommended blocks have been approved.");
    setTimeout(() => setPlanMsg(""), 5000);
  };

  const handleReject = () => {
    rejectPlan();
    setPlanMsg("Plan returned for revision. Generate a new optimized plan before re-submitting.");
    setTimeout(() => setPlanMsg(""), 5000);
  };

  return (
    <div className="p-5">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Plan review, approval, and report export</p>
      </div>

      {planMsg && (
        <div className={`mb-4 text-sm px-4 py-2.5 rounded border flex items-center gap-2 ${planMsg.startsWith("✓") ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-amber-50 border-amber-300 text-amber-700"}`}>
          {planMsg.startsWith("✓") ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {planMsg}
        </div>
      )}

      {/* Plan review */}
      <div className="bg-white border border-gray-200 rounded mb-4">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Plan Review — 07–13 Sep 2026</h2>
          <span className={`text-xs px-2 py-0.5 rounded font-medium border ${planStatus.approved ? "bg-emerald-100 text-emerald-700 border-emerald-300" : planStatus.generated ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
            {planStatus.approved ? "Approved" : planStatus.generated ? "Ready for Review" : "Not Generated"}
          </span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-3 mb-4 text-xs">
            {[
              { label: "Planning Period", value: "07–13 Sep 2026" },
              { label: "Division", value: "Raipur" },
              { label: "Total Blocks", value: blocks.length },
              { label: "Critical Tasks", value: critical.length },
              { label: "Remaining Conflicts", value: unresolvedConflicts.length },
              { label: "Expected Availability", value: planStatus.generated ? `${planStatus.availabilityAfter}%` : "—" },
            ].map(s => (
              <div key={s.label} className="border border-gray-100 rounded p-2">
                <div className="text-gray-400">{s.label}</div>
                <div className="font-mono font-semibold text-gray-800 mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Block table */}
          <div className="border border-gray-200 rounded overflow-hidden mb-4">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-600">Final Block Schedule</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Block ID", "Section", "Date", "Time", "Duration", "Departments", "Priority", "Status"].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blocks.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono font-bold text-[#0f2040]">{b.id}</td>
                    <td className="px-3 py-2 font-mono font-medium">{b.section}</td>
                    <td className="px-3 py-2 text-gray-600">{b.date}</td>
                    <td className="px-3 py-2 font-mono">{b.startTime}–{b.endTime}</td>
                    <td className="px-3 py-2 font-mono">{b.duration}h</td>
                    <td className="px-3 py-2 text-gray-600">{b.departments.join(", ")}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.priority === "Critical" ? "bg-red-100 text-[#c0392b]" : "bg-amber-100 text-amber-700"}`}>{b.priority}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${b.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!planStatus.approved && (
            <div className="flex gap-2">
              <button onClick={handleApprove} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition-colors">
                <CheckCircle size={14} />Approve Plan
              </button>
              <button onClick={handleReject} className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                <Send size={14} />Send Back
              </button>
              <button className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                <Download size={14} />Export
              </button>
            </div>
          )}

          {planStatus.approved && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded px-4 py-2.5">
              <CheckCircle size={16} />
              <span className="font-semibold">Weekly maintenance plan approved</span>
              {planStatus.approvedAt && <span className="text-emerald-500 text-xs">at {planStatus.approvedAt}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Report list */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Available Reports</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {REPORT_TYPES.map(r => {
            const Icon = r.icon;
            return (
              <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <Icon size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{r.title}</div>
                  <div className="text-xs text-gray-400">{r.desc}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewReport(viewReport === r.id ? null : r.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Eye size={12} />View
                  </button>
                  <button className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#0f2040] text-white rounded hover:bg-[#1a3056] transition-colors">
                    <Download size={12} />Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewReport && (
        <div className="mt-4 bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{REPORT_TYPES.find(r => r.id === viewReport)?.title}</h3>
            <button onClick={() => setViewReport(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4 font-mono text-xs text-gray-600 space-y-1">
            <div className="font-bold text-gray-800 mb-2">RAIPUR DIVISION — REPORT PREVIEW</div>
            <div>Planning Period: 07–13 Sep 2026</div>
            <div>Generated: {new Date().toLocaleString()}</div>
            <div>Division: Raipur | Environment: Demo — Synthetic Railway Data</div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div>Total Requests: {requests.length}</div>
              <div>Total Blocks: {blocks.length}</div>
              <div>Approved Blocks: {approvedBlocks.length}</div>
              <div>Unresolved Conflicts: {unresolvedConflicts.length}</div>
              <div>Asset Availability: {planStatus.generated ? `${planStatus.availabilityAfter}%` : "94.8%"}</div>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 text-gray-400">
              [Full report export available in production environment]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
