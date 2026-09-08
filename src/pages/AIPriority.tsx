import { useState } from "react";
import { useApp, MaintenanceRequest } from "../store/AppContext";
import { X, Info } from "lucide-react";

const WEIGHTS = { safety: 35, operational: 25, assetCriticality: 25, urgency: 15 };

function ScoreBar({ label, value, weight, color }: { label: string; value: number; weight: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">{label} <span className="text-gray-400">({weight}% weight)</span></span>
        <span className="font-mono font-semibold text-gray-800">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Recommendation({ score }: { score: number }) {
  if (score >= 85) return <span className="text-xs text-[#c0392b] font-medium">Schedule earliest available window.</span>;
  if (score >= 70) return <span className="text-xs text-amber-700 font-medium">Schedule within 48 hours.</span>;
  if (score >= 55) return <span className="text-xs text-blue-700 font-medium">Schedule in current planning cycle.</span>;
  return <span className="text-xs text-gray-600 font-medium">Schedule at next available opportunity.</span>;
}

function WhyReason({ r }: { r: MaintenanceRequest }) {
  const reasons: string[] = [];
  if (r.priority === "Critical") reasons.push("critical priority designation");
  if (r.department === "Signalling") reasons.push("critical signalling asset");
  if ((r.safetyScore ?? 0) >= 85) reasons.push("high safety impact score");
  if ((r.operationalScore ?? 0) >= 80) reasons.push("significant operational impact");
  if ((r.assetCriticalityScore ?? 0) >= 85) reasons.push("asset is operationally critical");
  if (r.section === "A12") reasons.push("high-density section A12");
  if (reasons.length === 0) reasons.push("moderate risk profile");
  return (
    <p className="text-xs text-gray-600 leading-relaxed">
      High priority because the request affects a {reasons.join(", ")}.
    </p>
  );
}

export default function AIPriority() {
  const { requests } = useApp();
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);

  const sorted = [...requests].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));

  const scoreColor = (score: number) => {
    if (score >= 85) return "text-[#c0392b]";
    if (score >= 70) return "text-amber-600";
    if (score >= 55) return "text-blue-600";
    return "text-gray-500";
  };

  return (
    <div className="p-5 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">AI Priority Assessment</h1>
          <p className="text-sm text-gray-500">Decision-support scoring system — AI recommends priority only. Planner approves.</p>
        </div>

        {/* Model explanation */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3 flex gap-2">
          <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <span className="font-semibold">Priority model (prototype simulation):</span> Safety Impact (35%) · Operational Impact (25%) · Asset Criticality (25%) · Urgency (15%). Scores are deterministic. This is NOT a trained AI model.
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Request</th>
                <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium">Safety</th>
                <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium">Operational</th>
                <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium">Asset Crit.</th>
                <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium">Urgency</th>
                <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">AI Score</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelected(r)}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-[#0f2040]">{r.id}</div>
                    <div className="text-[10px] text-gray-400">{r.department} · {r.workType}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-gray-700">{r.safetyScore ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-gray-700">{r.operationalScore ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-gray-700">{r.assetCriticalityScore ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-gray-700">{r.urgencyScore ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-sm font-bold ${scoreColor(r.aiScore ?? 0)}`}>{r.aiScore ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3"><Recommendation score={r.aiScore ?? 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Weight breakdown */}
        <div className="mt-4 bg-white border border-gray-200 rounded p-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Priority Weight Breakdown</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Safety Impact", weight: WEIGHTS.safety, color: "bg-[#c0392b]" },
              { label: "Operational Impact", weight: WEIGHTS.operational, color: "bg-amber-500" },
              { label: "Asset Criticality", weight: WEIGHTS.assetCriticality, color: "bg-blue-500" },
              { label: "Urgency", weight: WEIGHTS.urgency, color: "bg-gray-400" },
            ].map(w => (
              <div key={w.label} className="text-center">
                <div className={`w-full h-1.5 rounded-full ${w.color} mb-1`} />
                <div className="font-mono text-lg font-bold text-gray-800">{w.weight}%</div>
                <div className="text-xs text-gray-400">{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="font-mono text-sm font-bold text-gray-900">{selected.id}</div>
              <div className="text-xs text-gray-500">Priority Analysis</div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-center py-3 border border-gray-100 rounded">
              <div className={`text-3xl font-mono font-bold ${scoreColor(selected.aiScore ?? 0)}`}>{selected.aiScore}</div>
              <div className="text-xs text-gray-400 mt-0.5">AI Priority Score</div>
              <div className="mt-2"><Recommendation score={selected.aiScore ?? 0} /></div>
            </div>

            <div className="space-y-3">
              <ScoreBar label="Safety Impact" value={selected.safetyScore ?? 0} weight={WEIGHTS.safety} color="bg-[#c0392b]" />
              <ScoreBar label="Operational Impact" value={selected.operationalScore ?? 0} weight={WEIGHTS.operational} color="bg-amber-500" />
              <ScoreBar label="Asset Criticality" value={selected.assetCriticalityScore ?? 0} weight={WEIGHTS.assetCriticality} color="bg-blue-500" />
              <ScoreBar label="Urgency" value={selected.urgencyScore ?? 0} weight={WEIGHTS.urgency} color="bg-gray-400" />
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-600 mb-1.5">Why this priority?</div>
              <WhyReason r={selected} />
            </div>

            <div className="border-t border-gray-100 pt-3 text-xs text-gray-400">
              <Info size={11} className="inline mr-1" />
              AI recommends priority only. Planner approval required to schedule.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
