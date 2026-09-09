import { useState } from "react";
import { useApp, ExecutionActivity, ExecutionStatus } from "../store/AppContext";
import { X, Play, CheckCircle, AlertTriangle, Clock, ChevronRight, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STATUS_COLOR: Record<ExecutionStatus, string> = {
  Planned: "bg-gray-100 text-gray-600 border border-gray-300",
  "In Progress": "bg-blue-100 text-blue-700 border border-blue-300",
  Completed: "bg-emerald-100 text-emerald-700 border border-emerald-300",
  Delayed: "bg-red-100 text-[#c0392b] border border-red-300",
};

const STATUS_DOT: Record<ExecutionStatus, string> = {
  Planned: "bg-gray-400",
  "In Progress": "bg-blue-500",
  Completed: "bg-emerald-500",
  Delayed: "bg-[#c0392b]",
};

const PROGRESS_BAR: Record<ExecutionStatus, string> = {
  Planned: "bg-gray-300",
  "In Progress": "bg-blue-500",
  Completed: "bg-emerald-500",
  Delayed: "bg-[#c0392b]",
};

function ProgressBar({ value, status }: { value: number; status: ExecutionStatus }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${PROGRESS_BAR[status]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-xs text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}

interface EditForm {
  status: ExecutionStatus;
  progress: number;
  actualStart: string;
  actualEnd: string;
  delayMinutes: number;
  delayReason: string;
  remarks: string;
}

export default function ProgressReports() {
  const { executionActivities, updateExecution, blocks, setCurrentPage } = useApp() as ReturnType<typeof useApp> & { setCurrentPage: (p: string) => void };
  const [selected, setSelected] = useState<ExecutionActivity | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const total = executionActivities.length;
  const completed = executionActivities.filter(a => a.status === "Completed").length;
  const inProgress = executionActivities.filter(a => a.status === "In Progress").length;
  const delayed = executionActivities.filter(a => a.status === "Delayed").length;
  const planned = executionActivities.filter(a => a.status === "Planned").length;

  const delayedActivities = executionActivities.filter(a => a.status === "Delayed");

  const chartData = [
    { label: "Planned", value: planned, fill: "#94a3b8" },
    { label: "In Progress", value: inProgress, fill: "#3b82f6" },
    { label: "Completed", value: completed, fill: "#059669" },
    { label: "Delayed", value: delayed, fill: "#c0392b" },
  ];

  const openEdit = (a: ExecutionActivity) => {
    setSelected(a);
    setEditForm({
      status: a.status,
      progress: a.progress,
      actualStart: a.actualStart,
      actualEnd: a.actualEnd,
      delayMinutes: a.delayMinutes,
      delayReason: a.delayReason,
      remarks: a.remarks,
    });
  };

  const handleSave = () => {
    if (!selected || !editForm) return;
    updateExecution(selected.id, editForm);
    setSuccessMsg(`Activity ${selected.requestId} updated successfully.`);
    setSelected(null);
    setEditForm(null);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const quickAction = (a: ExecutionActivity, action: "start" | "complete" | "delay") => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (action === "start") {
      updateExecution(a.id, { status: "In Progress", actualStart: timeStr, progress: 5 });
      setSuccessMsg(`${a.activity} started at ${timeStr}.`);
    } else if (action === "complete") {
      updateExecution(a.id, { status: "Completed", actualEnd: timeStr, progress: 100 });
      setSuccessMsg(`${a.activity} marked complete.`);
    } else {
      updateExecution(a.id, { status: "Delayed" });
      setSuccessMsg(`${a.activity} marked as delayed.`);
    }
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const getBlock = (blockId: string) => blocks.find(b => b.id === blockId);

  return (
    <div className="p-5 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">Maintenance Progress Reports</h1>
          <p className="text-sm text-gray-500">Execution tracking for approved maintenance blocks — Raipur Division</p>
        </div>

        {successMsg && (
          <div className="mb-3 bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm px-4 py-2.5 rounded flex items-center gap-2">
            <CheckCircle size={14} />
            {successMsg}
          </div>
        )}

        {/* Delay alerts */}
        {delayedActivities.length > 0 && (
          <div className="mb-4 space-y-2">
            {delayedActivities.map(a => (
              <div key={a.id} className="bg-red-50 border border-red-200 rounded p-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-[#c0392b] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {a.activity} <span className="font-mono text-[#c0392b]">{a.requestId}</span> is delayed
                      {a.delayMinutes > 0 && <span className="text-[#c0392b]"> by {a.delayMinutes} minutes</span>}
                    </div>
                    {a.delayReason && <div className="text-xs text-gray-600 mt-0.5">Reason: {a.delayReason}</div>}
                    <div className="text-xs text-gray-500 mt-0.5">
                      Recommended action: <span className="font-medium">Review affected maintenance block <span className="font-mono">{a.blockId}</span>.</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPage("whatif")}
                  className="flex-shrink-0 text-xs bg-[#0f2040] text-white px-3 py-1.5 rounded hover:bg-[#1a3056] transition-colors whitespace-nowrap"
                >
                  Dynamic Rescheduling →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* KPI Summary */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: "Total Activities", value: total, color: "text-gray-700" },
            { label: "Completed", value: completed, color: "text-emerald-600" },
            { label: "In Progress", value: inProgress, color: "text-blue-600" },
            { label: "Delayed", value: delayed, color: "text-[#c0392b]" },
            { label: "Planned", value: planned, color: "text-gray-500" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded p-3">
              <div className="text-xs text-gray-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Activity table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Execution Status</h2>
            <span className="text-xs text-gray-400">Click a row to update</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Request ID", "Block ID", "Dept", "Section", "Activity", "Planned", "Actual", "Progress", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {executionActivities.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs font-bold text-[#0f2040]">{a.requestId}</td>
                  <td className="px-3 py-3 font-mono text-xs font-medium text-gray-600">{a.blockId}</td>
                  <td className="px-3 py-3 text-xs text-gray-700">{a.department}</td>
                  <td className="px-3 py-3 font-mono text-xs font-medium">{a.section}</td>
                  <td className="px-3 py-3 text-xs text-gray-800 max-w-32">
                    <div className="truncate">{a.activity}</div>
                    {a.delayMinutes > 0 && (
                      <div className="text-[10px] text-[#c0392b] flex items-center gap-0.5 mt-0.5">
                        <Clock size={9} />+{a.delayMinutes}min
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                    {a.plannedStart}–{a.plannedEnd}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                    {a.actualStart ? (
                      <span>{a.actualStart}{a.actualEnd ? `–${a.actualEnd}` : "–"}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 w-28">
                    <ProgressBar value={a.progress} status={a.status} />
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 w-fit ${STATUS_COLOR[a.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {a.status === "Planned" && (
                        <button onClick={() => quickAction(a, "start")} className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors" title="Start">
                          <Play size={11} />
                        </button>
                      )}
                      {a.status === "In Progress" && (
                        <>
                          <button onClick={() => quickAction(a, "complete")} className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded transition-colors" title="Complete">
                            <CheckCircle size={11} />
                          </button>
                          <button onClick={() => quickAction(a, "delay")} className="p-1 bg-red-50 hover:bg-red-100 text-[#c0392b] rounded transition-colors" title="Mark Delayed">
                            <AlertTriangle size={11} />
                          </button>
                        </>
                      )}
                      <button onClick={() => openEdit(a)} className="p-1 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded transition-colors" title="Edit details">
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remarks panel for delayed */}
        {executionActivities.some(a => a.remarks) && (
          <div className="bg-white border border-gray-200 rounded p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Field Remarks</h2>
            <div className="space-y-2">
              {executionActivities.filter(a => a.remarks).map(a => (
                <div key={a.id} className="flex items-start gap-3 text-xs border-l-2 border-gray-200 pl-3">
                  <div className="flex-shrink-0 font-mono font-bold text-gray-500">{a.requestId}</div>
                  <div className="text-gray-600">{a.remarks}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column: chart */}
      <div className="w-56 flex-shrink-0 space-y-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart2 size={13} className="text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-700">Progress Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Block execution summary */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">Block Execution</h3>
          <div className="space-y-2">
            {["B-023", "B-024", "B-025", "B-026", "B-027"].map(blockId => {
              const acts = executionActivities.filter(a => a.blockId === blockId);
              if (acts.length === 0) return null;
              const block = getBlock(blockId);
              const avgProgress = Math.round(acts.reduce((s, a) => s + a.progress, 0) / acts.length);
              const hasDelay = acts.some(a => a.status === "Delayed");
              return (
                <div key={blockId} className="border border-gray-100 rounded p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-gray-700">{blockId}</span>
                    {hasDelay && <AlertTriangle size={10} className="text-[#c0392b]" />}
                  </div>
                  <div className="text-[10px] text-gray-400 mb-1">{block?.section} · {block?.startTime}–{block?.endTime}</div>
                  <ProgressBar value={avgProgress} status={hasDelay ? "Delayed" : avgProgress === 100 ? "Completed" : avgProgress > 0 ? "In Progress" : "Planned"} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow guide */}
        <div className="bg-[#0f2040] rounded p-3 text-xs text-[#8ab0d4] space-y-1.5">
          <div className="text-white text-[11px] font-semibold mb-2">Execution Workflow</div>
          {["Approved Plan", "Maintenance Execution", "Progress Update", "Delay Detection", "Dynamic Rescheduling", "Updated Plan", "Final Progress Report"].map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#4a7ab5] flex-shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Drawer */}
      {selected && editForm && (
        <div className="fixed right-0 top-12 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto z-40 shadow-lg">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="font-mono text-sm font-bold text-gray-900">{selected.requestId}</div>
              <div className="text-xs text-gray-500">{selected.activity} · {selected.blockId}</div>
            </div>
            <button onClick={() => { setSelected(null); setEditForm(null); }} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div><span className="text-gray-400">Section</span><div className="font-mono font-semibold text-gray-800 mt-0.5">{selected.section}</div></div>
              <div><span className="text-gray-400">Department</span><div className="font-semibold text-gray-800 mt-0.5">{selected.department}</div></div>
              <div><span className="text-gray-400">Planned Start</span><div className="font-mono text-gray-800 mt-0.5">{selected.plannedStart}</div></div>
              <div><span className="text-gray-400">Planned End</span><div className="font-mono text-gray-800 mt-0.5">{selected.plannedEnd}</div></div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                value={editForm.status}
                onChange={e => setEditForm(f => f ? { ...f, status: e.target.value as ExecutionStatus } : f)}
              >
                {(["Planned", "In Progress", "Completed", "Delayed"] as ExecutionStatus[]).map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Progress %</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={100} step={5}
                  className="flex-1"
                  value={editForm.progress}
                  onChange={e => setEditForm(f => f ? { ...f, progress: +e.target.value } : f)}
                />
                <span className="font-mono text-sm font-bold text-gray-700 w-10 text-right">{editForm.progress}%</span>
              </div>
              <ProgressBar value={editForm.progress} status={editForm.status} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Actual Start</label>
                <input
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-400"
                  placeholder="HH:MM"
                  value={editForm.actualStart}
                  onChange={e => setEditForm(f => f ? { ...f, actualStart: e.target.value } : f)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Actual End</label>
                <input
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-400"
                  placeholder="HH:MM"
                  value={editForm.actualEnd}
                  onChange={e => setEditForm(f => f ? { ...f, actualEnd: e.target.value } : f)}
                />
              </div>
            </div>

            {(editForm.status === "Delayed" || editForm.delayMinutes > 0) && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Delay Duration (minutes)</label>
                  <input
                    type="number" min={0}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
                    value={editForm.delayMinutes}
                    onChange={e => setEditForm(f => f ? { ...f, delayMinutes: +e.target.value } : f)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Delay Reason</label>
                  <input
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="Reason for delay..."
                    value={editForm.delayReason}
                    onChange={e => setEditForm(f => f ? { ...f, delayReason: e.target.value } : f)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-gray-500 block mb-1">Remarks</label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                placeholder="Field observations, notes..."
                value={editForm.remarks}
                onChange={e => setEditForm(f => f ? { ...f, remarks: e.target.value } : f)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} className="flex-1 bg-[#0f2040] text-white py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors">
                Save Update
              </button>
              <button onClick={() => { setSelected(null); setEditForm(null); }} className="border border-gray-200 px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
