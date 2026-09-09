import { useState } from "react";
import { useApp, VerificationRecord, VerificationStatus } from "../store/AppContext";
import {
  Camera, CheckCircle, AlertTriangle, Clock, X, Eye,
  MessageSquare, RefreshCw, Upload, Info
} from "lucide-react";

const STATUS_STYLE: Record<VerificationStatus, { badge: string; dot: string }> = {
  "Not Started":  { badge: "bg-gray-100 text-gray-600 border border-gray-300",         dot: "bg-gray-400" },
  "In Progress":  { badge: "bg-blue-100 text-blue-700 border border-blue-300",          dot: "bg-blue-500" },
  "Completed":    { badge: "bg-emerald-100 text-emerald-700 border border-emerald-300", dot: "bg-emerald-500" },
  "Delayed":      { badge: "bg-orange-100 text-orange-700 border border-orange-300",    dot: "bg-orange-500" },
  "Photo Pending":{ badge: "bg-red-100 text-[#c0392b] border border-red-300",           dot: "bg-[#c0392b]" },
};

function PhotoBadge({ photo, label }: { photo: { timestamp: string; label: string } | null; label: string }) {
  if (!photo) return (
    <span className="text-[10px] text-gray-300 flex items-center gap-0.5">
      <Camera size={9} />—
    </span>
  );
  return (
    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5" title={`${label}: ${photo.label}\n${photo.timestamp}`}>
      <Camera size={9} />
      <span className="font-mono">{photo.timestamp.split(" ").pop()}</span>
    </span>
  );
}

function ProgressBar({ value, status }: { value: number; status: VerificationStatus }) {
  const color: Record<VerificationStatus, string> = {
    "Not Started": "bg-gray-300", "In Progress": "bg-blue-500",
    "Completed": "bg-emerald-500", "Delayed": "bg-orange-500", "Photo Pending": "bg-[#c0392b]",
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-16">
        <div className={`h-full rounded-full ${color[status]}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-[10px] text-gray-500 w-7 text-right flex-shrink-0">{value}%</span>
    </div>
  );
}

export default function ProgressVerification() {
  const { verificationRecords, uploadStartPhoto, uploadEndPhoto, updateVerification, setCurrentPage } = useApp();
  const [selected, setSelected] = useState<VerificationRecord | null>(null);
  const [photoView, setPhotoView] = useState<{ rec: VerificationRecord; type: "start" | "end" } | null>(null);
  const [remarksTarget, setRemarksTarget] = useState<VerificationRecord | null>(null);
  const [remarksText, setRemarksText] = useState("");
  const [gracePeriod, setGracePeriod] = useState(15);
  const [toast, setToast] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleUploadStart = (rec: VerificationRecord) => {
    setUploading(rec.id + "-start");
    setTimeout(() => {
      uploadStartPhoto(rec.id);
      setUploading(null);
      showToast(`Start photo uploaded for ${rec.requestId} — ${rec.activity}. Status set to In Progress.`);
    }, 900);
  };

  const handleUploadEnd = (rec: VerificationRecord) => {
    setUploading(rec.id + "-end");
    setTimeout(() => {
      uploadEndPhoto(rec.id);
      setUploading(null);
      showToast(`End photo uploaded for ${rec.requestId}. Status set to Completed. Progress 100%.`);
    }, 900);
  };

  const handleSaveRemarks = () => {
    if (!remarksTarget) return;
    updateVerification(remarksTarget.id, { remarks: remarksText });
    setRemarksTarget(null);
    setRemarksText("");
    showToast("Remarks saved.");
  };

  const flagged = verificationRecords.filter(r => r.flagged);
  const summary = {
    total: verificationRecords.length,
    notStarted: verificationRecords.filter(r => r.status === "Not Started").length,
    inProgress: verificationRecords.filter(r => r.status === "In Progress").length,
    completed: verificationRecords.filter(r => r.status === "Completed").length,
    delayed: verificationRecords.filter(r => r.status === "Delayed").length,
    photoPending: verificationRecords.filter(r => r.status === "Photo Pending").length,
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Progress Verification</h1>
          <p className="text-sm text-gray-500">Photo-based execution verification for approved maintenance blocks — Raipur Division</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded px-3 py-1.5 bg-white">
            <Clock size={11} />
            Grace Period:
            <select
              className="font-mono font-semibold text-gray-700 focus:outline-none bg-transparent"
              value={gracePeriod}
              onChange={e => setGracePeriod(+e.target.value)}
            >
              {[5, 10, 15, 20, 30].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded font-mono">
            PROTOTYPE — SYNTHETIC DATA
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-3 bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm px-4 py-2.5 rounded flex items-center gap-2">
          <CheckCircle size={14} />{toast}
        </div>
      )}

      {/* Operational alerts for flagged records */}
      {flagged.length > 0 && (
        <div className="mb-4 space-y-2">
          {flagged.map(r => (
            <div key={r.id} className="bg-red-50 border border-red-200 rounded p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-[#c0392b] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    {r.activity} <span className="font-mono text-[#c0392b]">{r.requestId}</span>
                    {r.status === "Not Started" && " — Not Started"}
                    {r.status === "Photo Pending" && " — End photo missing"}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{r.flagReason}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Recommended: <span className="font-medium">Review block <span className="font-mono">{r.blockId}</span> and reschedule if required.</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentPage("whatif")}
                className="flex-shrink-0 flex items-center gap-1 text-xs bg-[#0f2040] text-white px-3 py-1.5 rounded hover:bg-[#1a3056] transition-colors whitespace-nowrap"
              >
                <RefreshCw size={11} />Dynamic Rescheduling
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        {[
          { label: "Total Approved", value: summary.total, color: "text-gray-700" },
          { label: "Not Started",    value: summary.notStarted,  color: "text-gray-500" },
          { label: "In Progress",    value: summary.inProgress,  color: "text-blue-600" },
          { label: "Completed",      value: summary.completed,   color: "text-emerald-600" },
          { label: "Delayed",        value: summary.delayed,     color: "text-orange-600" },
          { label: "Photo Pending",  value: summary.photoPending,color: "text-[#c0392b]" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded p-3">
            <div className="text-[10px] text-gray-400 mb-1 leading-tight">{s.label}</div>
            <div className={`text-2xl font-mono font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Verification Records</h2>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Info size={10} />
            Field engineers upload start/end photos. Planner verifies and remarks.
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Block ID","Request ID","Dept","Section","Activity","Planned","Actual","Start Photo","End Photo","Progress","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {verificationRecords.map(r => {
                const st = STATUS_STYLE[r.status];
                const isUploadingStart = uploading === r.id + "-start";
                const isUploadingEnd   = uploading === r.id + "-end";
                return (
                  <tr key={r.id} className={`border-b border-gray-50 transition-colors ${r.flagged ? "bg-red-50/40" : "hover:bg-gray-50"}`}>
                    <td className="px-3 py-3 font-mono text-xs font-bold text-[#0f2040]">{r.blockId}</td>
                    <td className="px-3 py-3 font-mono text-xs font-semibold text-gray-700">{r.requestId}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{r.department}</td>
                    <td className="px-3 py-3 font-mono text-xs font-medium">{r.section}</td>
                    <td className="px-3 py-3 text-xs text-gray-800 max-w-36">
                      <div className="truncate">{r.activity}</div>
                      {r.flagged && <div className="text-[10px] text-[#c0392b] flex items-center gap-0.5 mt-0.5"><AlertTriangle size={9} />Flagged</div>}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{r.plannedStart}–{r.plannedEnd}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {r.actualStart
                        ? <>{r.actualStart}{r.actualEnd ? `–${r.actualEnd}` : <span className="text-gray-300">–</span>}</>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    {/* Start Photo */}
                    <td className="px-3 py-3">
                      {r.startPhoto ? (
                        <button
                          onClick={() => setPhotoView({ rec: r, type: "start" })}
                          className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors"
                          title={r.startPhoto.label}
                        >
                          <Camera size={11} />
                          <span className="font-mono">{r.startPhoto.timestamp.split(" ").pop()}</span>
                          <Eye size={9} className="opacity-60" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUploadStart(r)}
                          disabled={!!uploading}
                          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#0f2040] border border-dashed border-gray-300 hover:border-[#0f2040] rounded px-1.5 py-0.5 transition-colors disabled:opacity-40"
                        >
                          {isUploadingStart ? <RefreshCw size={9} className="animate-spin" /> : <Upload size={9} />}
                          Upload
                        </button>
                      )}
                    </td>
                    {/* End Photo */}
                    <td className="px-3 py-3">
                      {r.endPhoto ? (
                        <button
                          onClick={() => setPhotoView({ rec: r, type: "end" })}
                          className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors"
                          title={r.endPhoto.label}
                        >
                          <Camera size={11} />
                          <span className="font-mono">{r.endPhoto.timestamp.split(" ").pop()}</span>
                          <Eye size={9} className="opacity-60" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUploadEnd(r)}
                          disabled={!!uploading || !r.startPhoto}
                          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#0f2040] border border-dashed border-gray-300 hover:border-[#0f2040] rounded px-1.5 py-0.5 transition-colors disabled:opacity-30"
                          title={!r.startPhoto ? "Upload start photo first" : "Upload end photo"}
                        >
                          {isUploadingEnd ? <RefreshCw size={9} className="animate-spin" /> : <Upload size={9} />}
                          Upload
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3 w-28">
                      <ProgressBar value={r.progress} status={r.status} />
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 w-fit whitespace-nowrap ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(r)}
                          title="View details"
                          className="p-1 bg-gray-50 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                        >
                          <Eye size={11} />
                        </button>
                        <button
                          onClick={() => { setRemarksTarget(r); setRemarksText(r.remarks); }}
                          title="Add remarks"
                          className="p-1 bg-gray-50 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                        >
                          <MessageSquare size={11} />
                        </button>
                        {r.flagged && (
                          <button
                            onClick={() => setCurrentPage("whatif")}
                            title="Reschedule"
                            className="p-1 bg-red-50 hover:bg-red-100 rounded text-[#c0392b] transition-colors"
                          >
                            <RefreshCw size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded px-4 py-3 flex items-center gap-6 text-xs text-gray-500">
        <span className="font-medium text-gray-600">Status workflow:</span>
        {(["Not Started","In Progress","Completed","Delayed","Photo Pending"] as VerificationStatus[]).map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[s].dot}`} />
            {s}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1">
          <Info size={10} />No real railway integration. Synthetic prototype data only.
        </span>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed right-0 top-12 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto z-40 shadow-lg">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <div className="font-mono text-sm font-bold text-gray-900">{selected.requestId}</div>
              <div className="text-xs text-gray-500">{selected.activity} · {selected.blockId}</div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">Section</span><div className="font-mono font-semibold text-gray-800 mt-0.5">{selected.section}</div></div>
              <div><span className="text-gray-400">Department</span><div className="font-semibold text-gray-800 mt-0.5">{selected.department}</div></div>
              <div><span className="text-gray-400">Planned Start</span><div className="font-mono text-gray-800 mt-0.5">{selected.plannedStart}</div></div>
              <div><span className="text-gray-400">Planned End</span><div className="font-mono text-gray-800 mt-0.5">{selected.plannedEnd}</div></div>
              <div><span className="text-gray-400">Actual Start</span><div className="font-mono text-gray-800 mt-0.5">{selected.actualStart || "—"}</div></div>
              <div><span className="text-gray-400">Actual End</span><div className="font-mono text-gray-800 mt-0.5">{selected.actualEnd || "—"}</div></div>
              <div><span className="text-gray-400">Grace Period</span><div className="font-mono text-gray-800 mt-0.5">{selected.gracePeriodMinutes} min</div></div>
              <div><span className="text-gray-400">Progress</span><div className="font-mono font-bold text-gray-800 mt-0.5">{selected.progress}%</div></div>
            </div>

            <div>
              <span className="text-xs text-gray-400 block mb-1.5">Status</span>
              <span className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1.5 w-fit ${STATUS_STYLE[selected.status].badge}`}>
                <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[selected.status].dot}`} />
                {selected.status}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <span className="text-xs font-semibold text-gray-600 block mb-2">Photo Evidence</span>
              <div className="space-y-2">
                <div className="border border-gray-100 rounded p-2">
                  <div className="text-[10px] text-gray-400 mb-1">Start Photo</div>
                  {selected.startPhoto ? (
                    <div>
                      <div className="font-mono text-xs text-emerald-700 flex items-center gap-1"><Camera size={11} />{selected.startPhoto.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{selected.startPhoto.timestamp}</div>
                    </div>
                  ) : (
                    <button onClick={() => { handleUploadStart(selected); setSelected(null); }} className="flex items-center gap-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded px-2 py-1 hover:border-[#0f2040] transition-colors">
                      <Upload size={11} />Upload Start Photo
                    </button>
                  )}
                </div>
                <div className="border border-gray-100 rounded p-2">
                  <div className="text-[10px] text-gray-400 mb-1">End Photo</div>
                  {selected.endPhoto ? (
                    <div>
                      <div className="font-mono text-xs text-emerald-700 flex items-center gap-1"><Camera size={11} />{selected.endPhoto.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{selected.endPhoto.timestamp}</div>
                    </div>
                  ) : (
                    <button onClick={() => { handleUploadEnd(selected); setSelected(null); }} disabled={!selected.startPhoto} className="flex items-center gap-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded px-2 py-1 hover:border-[#0f2040] transition-colors disabled:opacity-40">
                      <Upload size={11} />Upload End Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {selected.flagged && (
              <div className="border border-red-200 bg-red-50 rounded p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c0392b] mb-1"><AlertTriangle size={12} />Operational Alert</div>
                <p className="text-xs text-gray-700">{selected.flagReason}</p>
                <button onClick={() => { setSelected(null); setCurrentPage("whatif"); }} className="mt-2 flex items-center gap-1 text-xs bg-[#0f2040] text-white px-3 py-1.5 rounded hover:bg-[#1a3056] transition-colors">
                  <RefreshCw size={11} />Go to Dynamic Rescheduling
                </button>
              </div>
            )}

            {selected.remarks && (
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-400 mb-1">Remarks</div>
                <p className="text-xs text-gray-600 leading-relaxed">{selected.remarks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo viewer modal */}
      {photoView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setPhotoView(null)}>
          <div className="bg-white rounded border border-gray-200 max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{photoView.type === "start" ? "Start" : "End"} Photo — {photoView.rec.requestId}</div>
                <div className="text-xs text-gray-500">{photoView.rec.activity} · {photoView.rec.section}</div>
              </div>
              <button onClick={() => setPhotoView(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
            </div>

            {/* Synthetic photo placeholder */}
            <div className="bg-gray-900 rounded h-48 flex flex-col items-center justify-center mb-3 border border-gray-700">
              <Camera size={32} className="text-gray-600 mb-2" />
              <div className="text-gray-400 text-xs font-mono text-center px-4">
                {(photoView.type === "start" ? photoView.rec.startPhoto : photoView.rec.endPhoto)?.label}
              </div>
              <div className="text-gray-600 text-[10px] mt-2">Synthetic prototype — no real image stored</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Timestamp</span>
                <span className="font-mono font-semibold text-gray-800">
                  {(photoView.type === "start" ? photoView.rec.startPhoto : photoView.rec.endPhoto)?.timestamp}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Block ID</span><span className="font-mono font-semibold text-gray-800">{photoView.rec.blockId}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Department</span><span className="font-semibold text-gray-800">{photoView.rec.department}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Section</span><span className="font-mono font-semibold text-gray-800">{photoView.rec.section}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remarks modal */}
      {remarksTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded border border-gray-200 max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900 text-sm">Add Remarks — {remarksTarget.requestId}</div>
              <button onClick={() => setRemarksTarget(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
            </div>
            <div className="text-xs text-gray-500 mb-2">{remarksTarget.activity} · {remarksTarget.section} · {remarksTarget.blockId}</div>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none mb-3"
              placeholder="Enter field observations, safety notes, or follow-up actions..."
              value={remarksText}
              onChange={e => setRemarksText(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveRemarks} className="bg-[#0f2040] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors">Save Remarks</button>
              <button onClick={() => setRemarksTarget(null)} className="border border-gray-200 px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
