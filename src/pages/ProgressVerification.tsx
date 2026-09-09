import { useState } from "react";
import { useApp } from "../store/AppContext";
import type { VerificationRecord, VerificationStatus, PhotoRecord } from "../store/AppContext";
import {
  Camera, CheckCircle, AlertTriangle, Clock, X, Eye,
  MessageSquare, RefreshCw, Upload, Info, ShieldCheck, ShieldAlert
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<VerificationStatus, { badge: string; dot: string; label: string }> = {
  "Planned":            { badge: "bg-gray-100 text-gray-600 border border-gray-300",          dot: "bg-gray-400",      label: "PLANNED" },
  "Not Started":        { badge: "bg-red-100 text-[#c0392b] border border-red-300",            dot: "bg-[#c0392b]",    label: "NOT STARTED" },
  "In Progress":        { badge: "bg-blue-100 text-blue-700 border border-blue-300",           dot: "bg-blue-500",      label: "IN PROGRESS" },
  "Completed":          { badge: "bg-emerald-100 text-emerald-700 border border-emerald-300",  dot: "bg-emerald-500",   label: "COMPLETED" },
  "Delayed":            { badge: "bg-orange-100 text-orange-700 border border-orange-300",     dot: "bg-orange-500",    label: "DELAYED" },
  "Completion Pending": { badge: "bg-amber-100 text-amber-700 border border-amber-300",        dot: "bg-amber-500",     label: "COMPLETION PENDING" },
};

const PROGRESS_COLOR: Record<VerificationStatus, string> = {
  "Planned": "bg-gray-300", "Not Started": "bg-[#c0392b]", "In Progress": "bg-blue-500",
  "Completed": "bg-emerald-500", "Delayed": "bg-orange-500", "Completion Pending": "bg-amber-500",
};

// ─── Small reusable pieces ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded tracking-wide ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ProgressBar({ value, status }: { value: number; status: VerificationStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${PROGRESS_COLOR[status]}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-[10px] text-gray-500 w-7 text-right flex-shrink-0">{value}%</span>
    </div>
  );
}

// Compact photo cell used inside the table
function PhotoCell({
  photo, type, onUpload, onView, uploading, canUpload,
}: {
  photo: PhotoRecord | null;
  type: "start" | "end";
  onUpload: () => void;
  onView: () => void;
  uploading: boolean;
  canUpload: boolean;
}) {
  if (photo) {
    return (
      <div>
        <button
          onClick={onView}
          className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium hover:text-emerald-800 transition-colors group"
        >
          <div className="w-6 h-6 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-center flex-shrink-0 group-hover:border-emerald-400 transition-colors">
            <Camera size={10} className="text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <CheckCircle size={9} className="text-emerald-500" />
              <span className="font-mono">{photo.timestamp.split(" ").pop()}</span>
            </div>
            <div className="text-[9px] text-emerald-500">{type === "start" ? "Start Verified" : "Completion Verified"}</div>
          </div>
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onUpload}
      disabled={uploading || !canUpload}
      title={!canUpload ? "Upload start photo first" : `Upload ${type} photo`}
      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#0f2040] border border-dashed border-gray-300 hover:border-[#0f2040] rounded px-1.5 py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {uploading
        ? <RefreshCw size={9} className="animate-spin" />
        : <Upload size={9} />}
      <span>{uploading ? "Uploading…" : `Upload ${type === "start" ? "Start" : "End"} Photo`}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProgressVerification() {
  const { verificationRecords, uploadStartPhoto, uploadEndPhoto, updateVerification, setCurrentPage } = useApp();

  const [drawerRec, setDrawerRec] = useState<VerificationRecord | null>(null);
  const [photoModal, setPhotoModal] = useState<{ rec: VerificationRecord; type: "start" | "end" } | null>(null);
  const [remarksModal, setRemarksModal] = useState<VerificationRecord | null>(null);
  const [remarksText, setRemarksText] = useState("");
  const [gracePeriod, setGracePeriod] = useState(15);
  const [uploading, setUploading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4500);
  };

  const handleUploadStart = (rec: VerificationRecord) => {
    const key = rec.id + "-start";
    setUploading(key);
    setTimeout(() => {
      uploadStartPhoto(rec.id);
      setUploading(null);
      showToast(`Start photo recorded for ${rec.requestId}. Actual start time set. Status → In Progress.`);
    }, 900);
  };

  const handleUploadEnd = (rec: VerificationRecord) => {
    const key = rec.id + "-end";
    setUploading(key);
    setTimeout(() => {
      uploadEndPhoto(rec.id);
      setUploading(null);
      showToast(`End photo recorded for ${rec.requestId}. Progress 100%. Status → Completed.`);
    }, 900);
  };

  const handleSaveRemarks = () => {
    if (!remarksModal) return;
    updateVerification(remarksModal.id, { remarks: remarksText });
    setRemarksModal(null);
    setRemarksText("");
    showToast("Remarks saved.");
  };

  // Summary counts — reactive to state
  const counts = {
    total:             verificationRecords.length,
    planned:           verificationRecords.filter(r => r.status === "Planned").length,
    notStarted:        verificationRecords.filter(r => r.status === "Not Started").length,
    inProgress:        verificationRecords.filter(r => r.status === "In Progress").length,
    completed:         verificationRecords.filter(r => r.status === "Completed").length,
    delayed:           verificationRecords.filter(r => r.status === "Delayed").length,
    completionPending: verificationRecords.filter(r => r.status === "Completion Pending").length,
  };

  const flaggedRecords = verificationRecords.filter(r => r.flagged);

  return (
    <div className="p-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Progress Verification</h1>
          <p className="text-sm text-gray-500">Photo-based execution verification for approved maintenance blocks — Raipur Division</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded px-3 py-1.5 bg-white">
            <Clock size={11} />
            Grace Period:
            <select
              className="font-mono font-semibold text-gray-700 focus:outline-none bg-transparent ml-0.5"
              value={gracePeriod}
              onChange={e => setGracePeriod(+e.target.value)}
            >
              {[5, 10, 15, 20, 30].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded font-mono font-semibold">
            DEMO ENV — SYNTHETIC RAILWAY DATA
          </div>
        </div>
      </div>

      {/* Purpose line */}
      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <Info size={10} />
        Field engineers upload start and completion photos. Planners use photo evidence to verify maintenance progress and take action when execution is delayed.
      </p>

      {/* ── Toast ── */}
      {toast && (
        <div className={`mb-3 text-sm px-4 py-2.5 rounded flex items-center gap-2 border ${toast.ok ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-red-50 border-red-300 text-red-700"}`}>
          {toast.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* ── Planner alerts for flagged records ── */}
      {flaggedRecords.length > 0 && (
        <div className="mb-4 space-y-2">
          {flaggedRecords.map(r => {
            const isNoStart = r.status === "Not Started";
            return (
              <div key={r.id} className="border border-red-200 bg-red-50 rounded p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <AlertTriangle size={14} className="text-[#c0392b] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {isNoStart ? "⚠ Start Photo Missing" : "⚠ End Photo Missing"}
                        </span>
                        <span className="font-mono text-xs text-[#c0392b] font-bold">{r.requestId}</span>
                        <span className="font-mono text-xs text-gray-500">{r.blockId}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-gray-700 mt-1">
                        {isNoStart
                          ? "No start photo was uploaded within the allowed grace period."
                          : "Completion evidence has not been uploaded after the planned end time."}
                      </p>
                      {/* Detail grid */}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] font-mono text-gray-500">
                        <span>Block: <span className="text-gray-800 font-semibold">{r.blockId}</span></span>
                        <span>Request: <span className="text-gray-800 font-semibold">{r.requestId}</span></span>
                        <span>Section: <span className="text-gray-800 font-semibold">{r.section}</span></span>
                        <span>Planned {isNoStart ? "Start" : "End"}: <span className="text-gray-800 font-semibold">{isNoStart ? r.plannedStart : r.plannedEnd}</span></span>
                        <span>Grace Period: <span className="text-gray-800 font-semibold">{r.gracePeriodMinutes} min</span></span>
                        {isNoStart && <span className="text-[#c0392b] font-semibold">Time Overdue: ~{r.gracePeriodMinutes + 12} min</span>}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 italic">
                        Note: A missing photo may indicate a technical upload issue, not necessarily that work has not started. Planner review required before rescheduling.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setDrawerRec(r)}
                      className="flex items-center gap-1 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                    >
                      <Eye size={11} />Review
                    </button>
                    <button
                      onClick={() => setCurrentPage("whatif")}
                      className="flex items-center gap-1 text-xs bg-[#0f2040] text-white px-3 py-1.5 rounded hover:bg-[#1a3056] transition-colors whitespace-nowrap"
                    >
                      <RefreshCw size={11} />Reschedule Task
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {[
          { label: "Total Approved",     value: counts.total,             color: "text-gray-800" },
          { label: "Planned",            value: counts.planned,           color: "text-gray-500" },
          { label: "Not Started",        value: counts.notStarted,        color: "text-[#c0392b]" },
          { label: "In Progress",        value: counts.inProgress,        color: "text-blue-600" },
          { label: "Completed",          value: counts.completed,         color: "text-emerald-600" },
          { label: "Delayed",            value: counts.delayed,           color: "text-orange-600" },
          { label: "Completion Pending", value: counts.completionPending, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded p-3">
            <div className="text-[10px] text-gray-400 mb-0.5 leading-tight">{s.label}</div>
            <div className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Verification table ── */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Verification Records</h2>
          <span className="text-[10px] text-gray-400">Photo upload triggers automatic status and timestamp update</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Block","Request","Dept","Section","Activity","Planned","Actual","Start Photo","End Photo","Progress","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {verificationRecords.map(r => {
                const isUploadingStart = uploading === r.id + "-start";
                const isUploadingEnd   = uploading === r.id + "-end";
                const rowBg = r.flagged ? "bg-red-50/50" : r.status === "Completed" ? "bg-emerald-50/30" : "hover:bg-gray-50";
                return (
                  <tr key={r.id} className={`border-b border-gray-50 transition-colors ${rowBg}`}>
                    <td className="px-3 py-3 font-mono font-bold text-[#0f2040]">{r.blockId}</td>
                    <td className="px-3 py-3 font-mono font-semibold text-gray-700">{r.requestId}</td>
                    <td className="px-3 py-3 text-gray-600">{r.department}</td>
                    <td className="px-3 py-3 font-mono font-medium">{r.section}</td>
                    <td className="px-3 py-3 max-w-32">
                      <div className="truncate text-gray-800">{r.activity}</div>
                      {r.flagged && (
                        <div className="flex items-center gap-0.5 text-[9px] text-[#c0392b] mt-0.5">
                          <ShieldAlert size={8} />Photo missing
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-gray-600 whitespace-nowrap">{r.plannedStart}–{r.plannedEnd}</td>
                    <td className="px-3 py-3 font-mono text-gray-600 whitespace-nowrap">
                      {r.actualStart
                        ? <span>{r.actualStart}{r.actualEnd ? `–${r.actualEnd}` : <span className="text-gray-300">–</span>}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Start photo cell */}
                    <td className="px-3 py-3">
                      <PhotoCell
                        photo={r.startPhoto}
                        type="start"
                        onUpload={() => handleUploadStart(r)}
                        onView={() => setPhotoModal({ rec: r, type: "start" })}
                        uploading={isUploadingStart}
                        canUpload={true}
                      />
                    </td>

                    {/* End photo cell */}
                    <td className="px-3 py-3">
                      <PhotoCell
                        photo={r.endPhoto}
                        type="end"
                        onUpload={() => handleUploadEnd(r)}
                        onView={() => setPhotoModal({ rec: r, type: "end" })}
                        uploading={isUploadingEnd}
                        canUpload={!!r.startPhoto}
                      />
                    </td>

                    <td className="px-3 py-3 w-24">
                      <ProgressBar value={r.progress} status={r.status} />
                    </td>

                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDrawerRec(r)} title="View details" className="p-1 bg-gray-50 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                          <Eye size={11} />
                        </button>
                        <button onClick={() => { setRemarksModal(r); setRemarksText(r.remarks); }} title="Add remarks" className="p-1 bg-gray-50 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                          <MessageSquare size={11} />
                        </button>
                        {r.flagged && (
                          <button onClick={() => setCurrentPage("whatif")} title="Reschedule" className="p-1 bg-red-50 hover:bg-red-100 rounded text-[#c0392b] transition-colors">
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

      {/* ── Workflow legend ── */}
      <div className="bg-white border border-gray-200 rounded px-4 py-2.5 flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
        <span className="font-semibold text-gray-600 text-xs">Workflow:</span>
        {(["Planned","In Progress","Completed"] as VerificationStatus[]).map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">→</span>}
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[s].dot}`} />
            {STATUS_CFG[s].label}
          </span>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        {(["Not Started","Delayed","Completion Pending"] as VerificationStatus[]).map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[s].dot}`} />
            {STATUS_CFG[s].label}
          </span>
        ))}
        <span className="ml-auto text-gray-400 flex items-center gap-1">
          <Info size={9} />No real railway integration. Synthetic prototype data only.
        </span>
      </div>

      {/* ══════════ DETAIL DRAWER ══════════ */}
      {drawerRec && (
        <div className="fixed right-0 top-12 bottom-0 w-84 bg-white border-l border-gray-200 overflow-y-auto z-40 shadow-xl" style={{ width: 340 }}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <div className="font-mono text-sm font-bold text-gray-900">{drawerRec.requestId} · {drawerRec.blockId}</div>
              <div className="text-xs text-gray-500">{drawerRec.activity} · {drawerRec.section}</div>
            </div>
            <button onClick={() => setDrawerRec(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>

          <div className="p-4 space-y-4">
            {/* Status */}
            <div>
              <StatusBadge status={drawerRec.status} />
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Department", drawerRec.department],
                ["Section", drawerRec.section],
                ["Planned Start", drawerRec.plannedStart],
                ["Planned End", drawerRec.plannedEnd],
                ["Actual Start", drawerRec.actualStart || "—"],
                ["Actual End", drawerRec.actualEnd || "—"],
                ["Grace Period", `${drawerRec.gracePeriodMinutes} min`],
                ["Progress", `${drawerRec.progress}%`],
              ].map(([label, val]) => (
                <div key={label}>
                  <span className="text-gray-400">{label}</span>
                  <div className="font-mono font-semibold text-gray-800 mt-0.5">{val}</div>
                </div>
              ))}
            </div>

            <ProgressBar value={drawerRec.progress} status={drawerRec.status} />

            {/* Photo evidence */}
            <div className="border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-gray-400" />Photo Evidence
              </div>
              <div className="space-y-2">
                {/* Start photo */}
                <div className={`border rounded p-3 ${drawerRec.startPhoto ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Start Photo</span>
                    {drawerRec.startPhoto
                      ? <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold"><CheckCircle size={10} />Start Verified</span>
                      : <span className="text-[10px] text-gray-400">Not uploaded</span>}
                  </div>
                  {drawerRec.startPhoto ? (
                    <>
                      {/* Thumbnail sim */}
                      <button
                        onClick={() => setPhotoModal({ rec: drawerRec, type: "start" })}
                        className="w-full h-16 bg-gray-900 border border-gray-700 rounded mb-2 flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <div className="text-center">
                          <Camera size={16} className="text-gray-500 mx-auto mb-0.5" />
                          <div className="text-[9px] text-gray-500 font-mono">{drawerRec.startPhoto.label.slice(0, 28)}…</div>
                        </div>
                      </button>
                      <div className="text-[10px] text-gray-500 space-y-0.5">
                        <div>Uploaded: <span className="font-mono text-gray-700">{drawerRec.startPhoto.timestamp}</span></div>
                        <div>By: <span className="font-medium text-gray-700">{drawerRec.startPhoto.uploadedBy}</span></div>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => { handleUploadStart(drawerRec); setDrawerRec(null); }}
                      className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded py-2 text-xs text-gray-500 hover:border-[#0f2040] hover:text-[#0f2040] transition-colors"
                    >
                      <Upload size={11} />Upload Start Photo
                    </button>
                  )}
                </div>

                {/* End photo */}
                <div className={`border rounded p-3 ${drawerRec.endPhoto ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">End Photo</span>
                    {drawerRec.endPhoto
                      ? <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold"><CheckCircle size={10} />Completion Verified</span>
                      : <span className="text-[10px] text-gray-400">Not uploaded</span>}
                  </div>
                  {drawerRec.endPhoto ? (
                    <>
                      <button
                        onClick={() => setPhotoModal({ rec: drawerRec, type: "end" })}
                        className="w-full h-16 bg-gray-900 border border-gray-700 rounded mb-2 flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <div className="text-center">
                          <Camera size={16} className="text-gray-500 mx-auto mb-0.5" />
                          <div className="text-[9px] text-gray-500 font-mono">{drawerRec.endPhoto.label.slice(0, 28)}…</div>
                        </div>
                      </button>
                      <div className="text-[10px] text-gray-500 space-y-0.5">
                        <div>Uploaded: <span className="font-mono text-gray-700">{drawerRec.endPhoto.timestamp}</span></div>
                        <div>By: <span className="font-medium text-gray-700">{drawerRec.endPhoto.uploadedBy}</span></div>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => { handleUploadEnd(drawerRec); setDrawerRec(null); }}
                      disabled={!drawerRec.startPhoto}
                      className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded py-2 text-xs text-gray-500 hover:border-[#0f2040] hover:text-[#0f2040] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Upload size={11} />Upload End Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Flag / alert */}
            {drawerRec.flagged && (
              <div className="border border-red-200 bg-red-50 rounded p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c0392b] mb-1">
                  <AlertTriangle size={12} />Planner Alert
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">{drawerRec.flagReason}</p>
                <p className="text-[10px] text-gray-500 italic mb-2">
                  Review the situation before rescheduling. A missing photo may be a technical issue.
                </p>
                <button
                  onClick={() => { setDrawerRec(null); setCurrentPage("whatif"); }}
                  className="flex items-center gap-1 text-xs bg-[#0f2040] text-white px-3 py-1.5 rounded hover:bg-[#1a3056] transition-colors"
                >
                  <RefreshCw size={11} />Open Dynamic Rescheduling
                </button>
              </div>
            )}

            {/* Remarks */}
            {drawerRec.remarks && (
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-500 font-semibold mb-1">Field Remarks</div>
                <p className="text-xs text-gray-600 leading-relaxed">{drawerRec.remarks}</p>
              </div>
            )}

            <button
              onClick={() => { setRemarksModal(drawerRec); setRemarksText(drawerRec.remarks); setDrawerRec(null); }}
              className="w-full flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 py-2 rounded text-xs hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={11} />Add / Edit Remarks
            </button>
          </div>
        </div>
      )}

      {/* ══════════ PHOTO VIEWER MODAL ══════════ */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setPhotoModal(null)}>
          <div className="bg-white rounded border border-gray-200 w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {photoModal.type === "start" ? "START PHOTO" : "END PHOTO"}
                  <span className="ml-2 font-mono text-[#0f2040]">{photoModal.rec.requestId}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{photoModal.rec.activity} · Section {photoModal.rec.section}</div>
              </div>
              <button onClick={() => setPhotoModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={15} /></button>
            </div>

            {/* Photo area — synthetic */}
            <div className="mx-5 mt-4 bg-gray-900 rounded-sm border border-gray-700 h-52 flex flex-col items-center justify-center">
              <Camera size={36} className="text-gray-600 mb-2" />
              <div className="text-gray-500 text-xs font-mono text-center px-4">
                {(photoModal.type === "start" ? photoModal.rec.startPhoto : photoModal.rec.endPhoto)?.label}
              </div>
              <div className="mt-2 px-3 py-1 bg-gray-800 rounded text-[9px] text-gray-500 font-mono">
                SYNTHETIC PROTOTYPE — NO REAL IMAGE STORED
              </div>
            </div>

            {/* Metadata */}
            <div className="px-5 py-4 space-y-2 text-xs">
              {[
                ["Photo Type",   photoModal.type === "start" ? "START PHOTO" : "END PHOTO"],
                ["Block ID",     photoModal.rec.blockId],
                ["Request ID",   photoModal.rec.requestId],
                ["Section",      photoModal.rec.section],
                ["Activity",     photoModal.rec.activity],
                ["Uploaded by",  (photoModal.type === "start" ? photoModal.rec.startPhoto : photoModal.rec.endPhoto)?.uploadedBy ?? "—"],
                ["Timestamp",    (photoModal.type === "start" ? photoModal.rec.startPhoto : photoModal.rec.endPhoto)?.timestamp ?? "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-baseline gap-4 border-b border-gray-50 pb-1">
                  <span className="text-gray-400 flex-shrink-0">{label}</span>
                  <span className="font-mono font-semibold text-gray-800 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ REMARKS MODAL ══════════ */}
      {remarksModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded border border-gray-200 max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-gray-900 text-sm">Planner Remarks</div>
              <button onClick={() => setRemarksModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
            </div>
            <div className="text-xs text-gray-500 mb-3">{remarksModal.requestId} · {remarksModal.activity} · {remarksModal.blockId}</div>
            <textarea
              rows={4}
              autoFocus
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none mb-3"
              placeholder="Field observations, safety notes, action items..."
              value={remarksText}
              onChange={e => setRemarksText(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveRemarks} className="bg-[#0f2040] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors">Save Remarks</button>
              <button onClick={() => setRemarksModal(null)} className="border border-gray-200 px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
