import { useState } from "react";
import { useApp } from "../store/AppContext";
import { GitBranch, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";

interface Option {
  id: number;
  label: string;
  desc: string;
  newStart: string;
  newEnd: string;
  conflicts: number;
  impact: string;
  availability: string;
}

const SCENARIO_OPTIONS: Option[] = [
  { id: 1, label: "Delay block by 40 minutes", desc: "Shift B-023 start from 02:00 to 02:40, end from 06:00 to 06:40", newStart: "02:40", newEnd: "06:40", conflicts: 0, impact: "Low", availability: "94.2%" },
  { id: 2, label: "Move to next available window", desc: "Reschedule B-023 to 08:00–12:00 low-traffic window", newStart: "08:00", newEnd: "12:00", conflicts: 1, impact: "Medium", availability: "92.1%" },
  { id: 3, label: "Combine with B-025", desc: "Merge activities from B-023 and B-025 into a single 6-hour block", newStart: "10:00", newEnd: "16:00", conflicts: 0, impact: "Low", availability: "95.3%" },
];

export default function WhatIfAnalysis() {
  const { updateBlockTime, blocks } = useApp();
  const [trainDelay, setTrainDelay] = useState(35);
  const [maintDuration, setMaintDuration] = useState(4);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [applied, setApplied] = useState(false);
  const [changeDetected, setChangeDetected] = useState(true);

  const b023 = blocks.find(b => b.id === "B-023");

  const handleApply = () => {
    if (selectedOption === null) return;
    const opt = SCENARIO_OPTIONS.find(o => o.id === selectedOption);
    if (!opt) return;
    updateBlockTime("B-023", opt.newStart, opt.newEnd);
    setApplied(true);
    setChangeDetected(false);
    setTimeout(() => setApplied(false), 4000);
  };

  const impactColor = (impact: string) => ({
    Low: "text-emerald-600", Medium: "text-amber-600", High: "text-[#c0392b]",
  }[impact] || "text-gray-600");

  return (
    <div className="p-5">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">What-If Analysis</h1>
        <p className="text-sm text-gray-500">Evaluate operational changes and their impact on the maintenance schedule</p>
      </div>

      {applied && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm px-4 py-2.5 rounded flex items-center gap-2">
          <CheckCircle size={14} />
          Schedule updated. The Block Planner now reflects the new time.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Input parameters */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Scenario Parameters</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Train Delay (minutes)</label>
              <input type="number" min={0} max={120} className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" value={trainDelay} onChange={e => setTrainDelay(+e.target.value)} />
              <div className="text-[10px] text-gray-400 mt-1">Train 12845 Bilaspur–Nagpur Exp.</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Maintenance Duration (hours)</label>
              <input type="number" min={1} max={12} className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" value={maintDuration} onChange={e => setMaintDuration(+e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Track Availability</label>
              <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option>Available (Normal)</option>
                <option>Partial restriction</option>
                <option>Emergency block</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Priority Override</label>
              <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option>No override</option>
                <option>Elevate to Critical</option>
                <option>Defer to next cycle</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic rescheduling alert */}
        <div className="col-span-2 space-y-4">
          {changeDetected && (
            <div className="bg-amber-50 border border-amber-300 rounded p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={15} className="text-amber-600" />
                <span className="font-semibold text-amber-800 text-sm">Operational Change Detected</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div><span className="text-gray-500">Affected Train:</span> <span className="font-mono font-bold">12845</span></div>
                <div><span className="text-gray-500">Delay:</span> <span className="font-mono font-bold text-amber-700">{trainDelay} minutes</span></div>
                <div><span className="text-gray-500">Affected Block:</span> <span className="font-mono font-bold">B-023</span></div>
                <div><span className="text-gray-500">Current Window:</span> <span className="font-mono">{b023?.startTime ?? "02:00"}–{b023?.endTime ?? "06:00"}</span></div>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white border border-amber-200 rounded p-2">
                <Clock size={12} className="text-amber-500" />
                <span className="text-gray-600">Current:</span>
                <span className="font-mono font-semibold">{b023?.startTime ?? "02:00"}–{b023?.endTime ?? "06:00"}</span>
                <span className="text-gray-400 mx-1">→</span>
                <span className="text-gray-600">Recommended:</span>
                <span className="font-mono font-semibold text-amber-700">
                  {b023 ? `0${2 + Math.ceil(trainDelay / 60)}:${String(trainDelay % 60).padStart(2, "0")}` : "02:40"}–
                  {b023 ? `0${6 + Math.ceil(trainDelay / 60)}:${String(trainDelay % 60).padStart(2, "0")}` : "06:40"}
                </span>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Rescheduling Options</h2>
            <div className="text-xs text-gray-500 mb-3">Impact analysis for Block B-023 given {trainDelay}min train delay:</div>
            <div className="space-y-2">
              {SCENARIO_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left border rounded p-3 transition-colors ${selectedOption === opt.id ? "border-[#0f2040] bg-[#0f2040]/5" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedOption === opt.id ? "border-[#0f2040]" : "border-gray-300"}`}>
                          {selectedOption === opt.id && <div className="w-2 h-2 rounded-full bg-[#0f2040]" />}
                        </div>
                        <span className="text-sm font-medium text-gray-800">Option {opt.id}: {opt.label}</span>
                      </div>
                      <div className="text-xs text-gray-500 ml-6">{opt.desc}</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="font-mono text-xs font-semibold text-gray-700">{opt.newStart}–{opt.newEnd}</div>
                    </div>
                  </div>
                  <div className="mt-2 ml-6 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-gray-50 rounded p-1.5">
                      <div className="text-gray-400">Conflicts</div>
                      <div className={`font-mono font-bold ${opt.conflicts === 0 ? "text-emerald-600" : "text-amber-600"}`}>{opt.conflicts}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5">
                      <div className="text-gray-400">Op. Impact</div>
                      <div className={`font-semibold ${impactColor(opt.impact)}`}>{opt.impact}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-1.5">
                      <div className="text-gray-400">Availability</div>
                      <div className="font-mono font-bold text-blue-600">{opt.availability}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleApply}
              disabled={selectedOption === null}
              className="mt-3 w-full bg-[#0f2040] text-white py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors disabled:opacity-40"
            >
              Apply Selected Option
            </button>
          </div>

          {/* Impact summary */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Current Schedule Impact</h2>
            <div className="grid grid-cols-4 gap-3 text-xs">
              {[
                { label: "Blocks Affected", value: "1", icon: GitBranch, color: "text-amber-600" },
                { label: "Requests Delayed", value: "2", icon: Clock, color: "text-orange-600" },
                { label: "Asset Availability", value: "94.8%", icon: Activity, color: "text-emerald-600" },
                { label: "Conflict Risk", value: "Low", icon: AlertTriangle, color: "text-blue-600" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="border border-gray-100 rounded p-2 text-center">
                    <Icon size={14} className={`${s.color} mx-auto mb-1`} />
                    <div className={`font-mono font-bold text-sm ${s.color}`}>{s.value}</div>
                    <div className="text-gray-400 text-[10px] mt-0.5">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
