import { useState } from "react";
import { useApp, Conflict } from "../store/AppContext";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

const SEVERITY_COLOR: Record<string, string> = {
  Critical: "bg-red-100 text-[#c0392b] border border-red-300",
  High: "bg-orange-100 text-orange-700 border border-orange-300",
  Medium: "bg-amber-100 text-amber-700 border border-amber-300",
  Low: "bg-gray-100 text-gray-600 border border-gray-300",
};

export default function Conflicts() {
  const { conflicts, requests, resolveConflict, createBundledBlock, bundles } = useApp();
  const [selected, setSelected] = useState<Conflict | null>(null);
  const [resolvedMsg, setResolvedMsg] = useState("");

  const unresolvedConflicts = conflicts.filter(c => !c.resolved);
  const resolvedConflicts = conflicts.filter(c => c.resolved);
  const critical = unresolvedConflicts.filter(c => c.severity === "Critical").length;
  const high = unresolvedConflicts.filter(c => c.severity === "High").length;
  const medium = unresolvedConflicts.filter(c => c.severity === "Medium").length;

  const getRequest = (id: string) => requests.find(r => r.id === id);

  const canCombine = (c: Conflict) => {
    return c.conflictType.includes("Overlapping") || c.conflictType.includes("Overlap");
  };

  const handleCreateBlock = (c: Conflict) => {
    const matchBundle = bundles.find(b => b.requestIds.includes(c.requestId1) && b.requestIds.includes(c.requestId2));
    if (matchBundle) {
      createBundledBlock(matchBundle.id);
    }
    resolveConflict(c.id);
    setResolvedMsg(`Conflict ${c.id} resolved. Combined block created.`);
    setSelected(null);
    setTimeout(() => setResolvedMsg(""), 4000);
  };

  const handleResolve = (c: Conflict) => {
    resolveConflict(c.id);
    setResolvedMsg(`Conflict ${c.id} marked as resolved.`);
    setSelected(null);
    setTimeout(() => setResolvedMsg(""), 4000);
  };

  return (
    <div className="p-5 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">Planning Conflicts</h1>
          <p className="text-sm text-gray-500">Detected scheduling conflicts requiring planner review</p>
        </div>

        {resolvedMsg && (
          <div className="mb-3 bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm px-4 py-2.5 rounded flex items-center gap-2">
            <CheckCircle size={14} />
            {resolvedMsg}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Conflicts", value: unresolvedConflicts.length, color: "text-gray-800" },
            { label: "Critical", value: critical, color: "text-[#c0392b]" },
            { label: "High", value: high, color: "text-orange-600" },
            { label: "Medium", value: medium, color: "text-amber-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Conflicts Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Active Conflicts ({unresolvedConflicts.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Conflict ID", "Section", "Request 1", "Request 2", "Type", "Severity", "Suggested Action", ""].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unresolvedConflicts.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelected(c)}>
                  <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#0f2040]">{c.id}</td>
                  <td className="px-3 py-2.5 font-mono text-xs font-medium">{c.section}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{c.requestId1}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{c.requestId2}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{c.conflictType}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${SEVERITY_COLOR[c.severity]}`}>{c.severity}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{c.suggestedAction}</td>
                  <td className="px-3 py-2.5">
                    <AlertTriangle size={13} className="text-amber-400" />
                  </td>
                </tr>
              ))}
              {unresolvedConflicts.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-emerald-600">✓ No active conflicts detected.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resolved */}
        {resolvedConflicts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-700">Resolved ({resolvedConflicts.length})</h2>
            </div>
            <table className="w-full text-sm opacity-60">
              <tbody>
                {resolvedConflicts.map(c => (
                  <tr key={c.id} className="border-b border-gray-50">
                    <td className="px-3 py-2 font-mono text-xs font-bold text-gray-500">{c.id}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">{c.section}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{c.conflictType}</td>
                    <td className="px-3 py-2"><CheckCircle size={13} className="text-emerald-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="font-mono text-sm font-bold text-gray-900">{selected.id}</div>
              <div className="text-xs text-gray-500">Conflict Details</div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div className="bg-red-50 border border-red-100 rounded p-3 text-xs text-gray-700 leading-relaxed">
              Both requests require Section <span className="font-mono font-semibold">{selected.section}</span> during overlapping maintenance windows.
            </div>

            <div className="space-y-3">
              <div className="border border-gray-100 rounded p-3">
                <div className="text-[10px] text-gray-400 uppercase mb-1">Request 1</div>
                <div className="font-mono text-sm font-bold text-gray-800">{selected.requestId1}</div>
                {(() => { const r = getRequest(selected.requestId1); return r ? <div className="text-xs text-gray-500 mt-0.5">{r.workType} · {r.duration}h · {r.priority}</div> : null; })()}
              </div>
              <div className="border border-gray-100 rounded p-3">
                <div className="text-[10px] text-gray-400 uppercase mb-1">Request 2</div>
                <div className="font-mono text-sm font-bold text-gray-800">{selected.requestId2}</div>
                {(() => { const r = getRequest(selected.requestId2); return r ? <div className="text-xs text-gray-500 mt-0.5">{r.workType} · {r.duration}h · {r.priority}</div> : null; })()}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-600 mb-1.5">Conflict Type</div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${SEVERITY_COLOR[selected.severity]}`}>{selected.severity} — {selected.conflictType}</span>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1.5">Suggested Solution</div>
              <p className="text-xs text-gray-600 leading-relaxed bg-blue-50 border border-blue-100 p-3 rounded">
                {selected.suggestedAction === "Combine into one block"
                  ? `Combine ${getRequest(selected.requestId1)?.workType} and ${getRequest(selected.requestId2)?.workType} into a common maintenance block on Section ${selected.section}.`
                  : selected.suggestedAction}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {canCombine(selected) ? (
                <button
                  onClick={() => handleCreateBlock(selected)}
                  className="w-full bg-[#0f2040] text-white py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors"
                >
                  Create Combined Block
                </button>
              ) : (
                <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 p-2 rounded">
                  Activities are not compatible for bundling. Use the suggested action above.
                </div>
              )}
              <button
                onClick={() => handleResolve(selected)}
                className="w-full border border-gray-200 text-gray-600 py-2 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
