import { useState } from "react";
import { useApp, Block } from "../store/AppContext";
import { X, CheckCircle, XCircle, RefreshCw, Loader } from "lucide-react";

const SECTIONS = ["A12", "A13", "B07", "C03", "D04"];
const HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const TOTAL_HOURS = 24;
const PX_PER_HOUR = 52;

const STATUS_COLORS: Record<string, string> = {
  "AI Recommended": "bg-blue-100 border border-blue-300 text-blue-800",
  "Approved": "bg-emerald-100 border border-emerald-300 text-emerald-800",
  "Rejected": "bg-gray-100 border border-gray-300 text-gray-500",
  "Draft": "bg-amber-100 border border-amber-300 text-amber-800",
};

const PRIORITY_STRIPE: Record<string, string> = {
  Critical: "border-l-4 border-l-[#c0392b]",
  High: "border-l-4 border-l-orange-500",
  Medium: "border-l-4 border-l-amber-400",
  Low: "border-l-4 border-l-gray-300",
};

const GENERATION_STEPS = [
  "Checking maintenance requests...",
  "Detecting conflicts...",
  "Prioritizing critical work...",
  "Checking task compatibility...",
  "Bundling compatible activities...",
  "Optimizing maintenance windows...",
  "Generating schedule...",
];

function timeToPercent(time: string) {
  const [h, m] = time.split(":").map(Number);
  return ((h + m / 60) / TOTAL_HOURS) * 100;
}

function timeToX(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h + m / 60) * PX_PER_HOUR;
}

export default function BlockPlanner() {
  const { blocks, planStatus, generateOptimizedPlan, updateBlockStatus, requests } = useApp();
  const [selected, setSelected] = useState<Block | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const handleGenerate = () => {
    setGenerating(true);
    setStepIndex(0);
    setShowResults(false);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setStepIndex(step);
      if (step >= GENERATION_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          generateOptimizedPlan();
          setGenerating(false);
          setShowResults(true);
        }, 600);
      }
    }, 550);
  };

  const handleBlockAction = (blockId: string, status: Block["status"]) => {
    updateBlockStatus(blockId, status);
    const msgs: Record<string, string> = { Approved: "Block approved.", Rejected: "Block rejected." };
    setActionMsg(msgs[status] || "Block updated.");
    setSelected(null);
    setTimeout(() => setActionMsg(""), 3000);
  };

  const ganttWidth = TOTAL_HOURS * PX_PER_HOUR;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Maintenance Block Planner</h1>
          <p className="text-sm text-gray-500">Raipur Division · Weekly: 07–13 Sep 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 border border-gray-200 rounded px-3 py-1.5 bg-white">
            <span className="text-gray-500">Division:</span> Raipur &nbsp;|&nbsp; <span className="text-gray-500">Planning:</span> Weekly &nbsp;|&nbsp; <span className="text-gray-500">From:</span> 07 Sep 2026 &nbsp;|&nbsp; <span className="text-gray-500">To:</span> 13 Sep 2026
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 bg-[#0f2040] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors disabled:opacity-60"
          >
            <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
            Generate Optimized Plan
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="mb-3 bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm px-4 py-2.5 rounded">
          ✓ {actionMsg}
        </div>
      )}

      {/* Generation progress */}
      {generating && (
        <div className="mb-4 bg-[#0f2040] text-white rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <Loader size={14} className="animate-spin" />
            <span className="text-sm font-medium">Generating Optimized Plan...</span>
          </div>
          <div className="space-y-1.5">
            {GENERATION_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i <= stepIndex ? "opacity-100" : "opacity-20"}`}>
                {i < stepIndex ? <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" /> : i === stepIndex ? <Loader size={11} className="animate-spin text-blue-300 flex-shrink-0" /> : <div className="w-2.5 h-2.5 rounded-full border border-gray-500 flex-shrink-0" />}
                <span className={i < stepIndex ? "text-emerald-300" : i === stepIndex ? "text-white" : "text-gray-500"}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization results */}
      {showResults && planStatus.generated && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="text-emerald-600" />
            <span className="font-semibold text-emerald-800 text-sm">Optimized Plan Generated</span>
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Prototype Simulation Results</span>
          </div>
          <div className="grid grid-cols-5 gap-3 text-xs">
            {[
              { label: "Requested Blocks", before: planStatus.requestedBlocks, after: planStatus.optimizedBlocks, unit: "" },
              { label: "Conflicts Resolved", before: planStatus.conflictsBefore, after: planStatus.conflictsAfter, unit: "" },
              { label: "Maintenance Hours", before: planStatus.hoursBefore, after: planStatus.hoursAfter, unit: "h" },
              { label: "Asset Availability", before: `${planStatus.availabilityBefore}%`, after: `${planStatus.availabilityAfter}%`, unit: "" },
              { label: "Plan Status", before: "Unoptimized", after: "Optimized", unit: "" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded border border-emerald-200 p-2">
                <div className="text-gray-500 mb-1">{s.label}</div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 line-through">{s.before}{s.unit}</span>
                  <span className="text-emerald-600">→</span>
                  <span className="font-mono font-bold text-emerald-700">{s.after}{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">These are prototype simulation results. Not real Indian Railways statistics. AI/ML prioritization + constraint-based optimization (OR-Tools concept). Planner approval required.</p>
        </div>
      )}

      {/* Gantt chart */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: ganttWidth + 120 }}>
            {/* Timeline header */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-16 flex-shrink-0 px-3 py-2 text-xs text-gray-500 font-medium border-r border-gray-200">Section</div>
              <div className="flex-1 relative" style={{ width: ganttWidth }}>
                <div className="flex">
                  {HOURS.map(h => (
                    <div key={h} className="flex-shrink-0 text-center text-[10px] text-gray-400 font-mono border-r border-gray-100 py-2" style={{ width: PX_PER_HOUR * 2 }}>
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section rows */}
            {SECTIONS.map(section => {
              const sectionBlocks = blocks.filter(b => b.section === section);
              return (
                <div key={section} className="flex border-b border-gray-100 hover:bg-gray-50/50">
                  <div className="w-16 flex-shrink-0 px-3 flex items-center border-r border-gray-100">
                    <span className="font-mono text-xs font-semibold text-gray-700">{section}</span>
                  </div>
                  <div className="relative" style={{ width: ganttWidth, height: 44 }}>
                    {/* Grid lines */}
                    {HOURS.map(h => (
                      <div key={h} className="absolute top-0 bottom-0 border-r border-gray-50" style={{ left: h * PX_PER_HOUR }} />
                    ))}
                    {/* Blocks */}
                    {sectionBlocks.map(block => {
                      const left = timeToX(block.startTime);
                      const width = block.duration * PX_PER_HOUR;
                      return (
                        <button
                          key={block.id}
                          onClick={() => setSelected(block)}
                          className={`absolute top-2 bottom-2 rounded text-[10px] font-medium px-2 overflow-hidden hover:opacity-90 transition-opacity text-left ${STATUS_COLORS[block.status]} ${PRIORITY_STRIPE[block.priority]}`}
                          style={{ left, width: Math.max(width - 2, 20) }}
                          title={`${block.id} · ${block.startTime}–${block.endTime}`}
                        >
                          <div className="truncate font-mono font-bold">{block.id}</div>
                          <div className="truncate">{block.activities[0]}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded ${v.split(" ")[0]}`} />
              {k}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-gray-400">Click a block to view details</span>
        </div>
      </div>

      {/* Block detail drawer */}
      {selected && (
        <div className="fixed right-0 top-12 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto z-40 shadow-lg">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="font-mono text-sm font-bold text-gray-900">{selected.id}</div>
              <div className="text-xs text-gray-500">Block Details</div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">Block ID</span><div className="font-mono font-bold text-gray-900 mt-0.5">{selected.id}</div></div>
              <div><span className="text-gray-400">Section</span><div className="font-mono font-semibold mt-0.5">{selected.section}</div></div>
              <div><span className="text-gray-400">Time</span><div className="font-mono mt-0.5">{selected.startTime}–{selected.endTime}</div></div>
              <div><span className="text-gray-400">Duration</span><div className="font-mono mt-0.5">{selected.duration}h</div></div>
              <div><span className="text-gray-400">Priority</span><div className="mt-0.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${selected.priority === "Critical" ? "bg-red-100 text-[#c0392b]" : "bg-amber-100 text-amber-700"}`}>{selected.priority}</span></div></div>
              <div><span className="text-gray-400">Op. Impact</span><div className="mt-0.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${selected.operationalImpact === "Low" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{selected.operationalImpact}</span></div></div>
              <div><span className="text-gray-400">Status</span><div className="mt-0.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div></div>
              <div><span className="text-gray-400">Date</span><div className="text-gray-700 mt-0.5">{selected.date}</div></div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">Departments</div>
              <div className="flex flex-wrap gap-1">
                {selected.departments.map(d => <span key={d} className="bg-[#0f2040] text-white text-[10px] px-2 py-0.5 rounded">{d}</span>)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-1">Activities</div>
              <div className="space-y-1">
                {selected.activities.map(a => <div key={a} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">{a}</div>)}
              </div>
            </div>

            {selected.aiReason && (
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs font-semibold text-gray-600 mb-1.5">Why this block?</div>
                <div className="text-xs text-gray-600 bg-blue-50 border border-blue-100 p-3 rounded leading-relaxed">
                  {selected.aiReason.split(". ").map((line, i) => line && (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <span className="text-blue-400 flex-shrink-0">·</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              {selected.status !== "Approved" && (
                <button onClick={() => handleBlockAction(selected.id, "Approved")} className="flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded text-sm font-medium hover:bg-emerald-700 transition-colors">
                  <CheckCircle size={14} />Approve
                </button>
              )}
              <button className="flex items-center justify-center gap-1.5 border border-[#0f2040] text-[#0f2040] py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                Modify
              </button>
              {selected.status !== "Rejected" && (
                <button onClick={() => handleBlockAction(selected.id, "Rejected")} className="flex items-center justify-center gap-1.5 border border-red-300 text-[#c0392b] py-2 rounded text-sm font-medium hover:bg-red-50 transition-colors">
                  <XCircle size={14} />Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
