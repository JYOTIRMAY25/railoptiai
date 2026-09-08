import { useState } from "react";
import { useApp, Department, Priority, MaintenanceRequest } from "../store/AppContext";
import { Search, Plus, X, ChevronRight } from "lucide-react";

const PRIORITY_COLOR: Record<string, string> = {
  Critical: "bg-red-100 text-[#c0392b] border border-red-300",
  High: "bg-orange-100 text-orange-700 border border-orange-300",
  Medium: "bg-amber-100 text-amber-700 border border-amber-300",
  Low: "bg-gray-100 text-gray-600 border border-gray-300",
};

const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  Planned: "bg-blue-50 text-blue-700 border border-blue-300",
  Conflict: "bg-red-50 text-red-700 border border-red-300",
  Approved: "bg-emerald-50 text-emerald-700 border border-emerald-300",
  Rejected: "bg-gray-100 text-gray-500 border border-gray-300",
};

const DEPARTMENTS: Department[] = ["Engineering", "Signalling", "Traction", "Electrical", "Telecom"];
const PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];
const SECTIONS = ["A12", "A13", "B07", "C03", "D04"];

interface FormData {
  department: Department;
  assetType: string;
  assetId: string;
  section: string;
  workType: string;
  requestedDate: string;
  preferredTime: string;
  duration: number;
  priority: Priority;
  staffRequired: number;
  equipment: string;
  description: string;
}

const INITIAL_FORM: FormData = {
  department: "Engineering",
  assetType: "",
  assetId: "",
  section: "A12",
  workType: "",
  requestedDate: "08 Sep",
  preferredTime: "02:00",
  duration: 2,
  priority: "Medium",
  staffRequired: 4,
  equipment: "",
  description: "",
};

export default function MaintenanceRequests() {
  const { requests, addRequest } = useApp();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const filtered = requests.filter(r => {
    const matchSearch = r.id.toLowerCase().includes(search.toLowerCase()) || r.workType.toLowerCase().includes(search.toLowerCase()) || r.assetId.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || r.department === deptFilter;
    const matchPriority = priorityFilter === "All" || r.priority === priorityFilter;
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchDept && matchPriority && matchStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = addRequest({ ...form, status: "Pending" });
    setSuccessMsg(`Maintenance request ${id} added successfully.`);
    setShowForm(false);
    setForm(INITIAL_FORM);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="p-5 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Maintenance Requests</h1>
            <p className="text-sm text-gray-500">{requests.length} total requests · {requests.filter(r => r.status === "Pending").length} pending</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#0f2040] text-white text-sm px-3 py-2 rounded hover:bg-[#1a3056] transition-colors">
            <Plus size={14} />
            Add Request
          </button>
        </div>

        {successMsg && (
          <div className="mb-3 bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm px-4 py-2.5 rounded flex items-center gap-2">
            <span className="font-medium">✓</span> {successMsg}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
            <input
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:border-blue-400 w-48"
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="border border-gray-200 rounded text-sm px-2 py-1.5 bg-white focus:outline-none" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="border border-gray-200 rounded text-sm px-2 py-1.5 bg-white focus:outline-none" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="border border-gray-200 rounded text-sm px-2 py-1.5 bg-white focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {["Pending", "Planned", "Conflict", "Approved", "Rejected"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Request ID", "Department", "Asset", "Section", "Work Type", "Date", "Duration", "Priority", "Status", ""].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelected(r)}>
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-[#0f2040]">{r.id}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{r.department}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs text-gray-700">{r.assetType}</div>
                    <div className="text-[10px] font-mono text-gray-400">{r.assetId}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs font-medium text-gray-700">{r.section}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{r.workType}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{r.requestedDate}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{r.duration}h</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLOR[r.priority]}`}>{r.priority}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <ChevronRight size={14} className="text-gray-300" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No requests match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Drawer */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <div className="font-mono text-sm font-bold text-gray-900">{selected.id}</div>
              <div className="text-xs text-gray-500">{selected.workType}</div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">Department</span><div className="font-medium mt-0.5">{selected.department}</div></div>
              <div><span className="text-gray-400">Section</span><div className="font-mono font-medium mt-0.5">{selected.section}</div></div>
              <div><span className="text-gray-400">Asset ID</span><div className="font-mono font-medium mt-0.5">{selected.assetId}</div></div>
              <div><span className="text-gray-400">Asset Type</span><div className="font-medium mt-0.5">{selected.assetType}</div></div>
              <div><span className="text-gray-400">Date</span><div className="font-medium mt-0.5">{selected.requestedDate}</div></div>
              <div><span className="text-gray-400">Preferred Time</span><div className="font-mono font-medium mt-0.5">{selected.preferredTime}</div></div>
              <div><span className="text-gray-400">Duration</span><div className="font-mono font-medium mt-0.5">{selected.duration}h</div></div>
              <div><span className="text-gray-400">Staff</span><div className="font-mono font-medium mt-0.5">{selected.staffRequired}</div></div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Priority</span>
              <div className="mt-1"><span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_COLOR[selected.priority]}`}>{selected.priority}</span></div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Status</span>
              <div className="mt-1"><span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[selected.status]}`}>{selected.status}</span></div>
            </div>
            {selected.equipment && (
              <div><span className="text-xs text-gray-400">Equipment</span><div className="text-xs mt-0.5">{selected.equipment}</div></div>
            )}
            {selected.description && (
              <div><span className="text-xs text-gray-400">Description</span><p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{selected.description}</p></div>
            )}
            {selected.aiScore !== undefined && (
              <div className="border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400 block mb-2">AI Priority Score</span>
                <div className="text-2xl font-mono font-bold text-[#0f2040]">{selected.aiScore}<span className="text-sm font-normal text-gray-400">/100</span></div>
                <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                  <div className="text-gray-500">Safety: <span className="font-mono font-semibold text-gray-800">{selected.safetyScore}</span></div>
                  <div className="text-gray-500">Operational: <span className="font-mono font-semibold text-gray-800">{selected.operationalScore}</span></div>
                  <div className="text-gray-500">Asset Crit: <span className="font-mono font-semibold text-gray-800">{selected.assetCriticalityScore}</span></div>
                  <div className="text-gray-500">Urgency: <span className="font-mono font-semibold text-gray-800">{selected.urgencyScore}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Request Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Add Maintenance Request</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Department *</label>
                  <select required className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value as Department }))}>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Asset Type *</label>
                  <input required className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Track, Signal, OHE" value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Asset ID *</label>
                  <input required className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" placeholder="e.g. T-21, S-42" value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Track Section *</label>
                  <select required className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
                    {SECTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Maintenance Type *</label>
                  <input required className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Track Inspection" value={form.workType} onChange={e => setForm(f => ({ ...f, workType: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Priority *</label>
                  <select required className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Requested Date</label>
                  <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. 08 Sep" value={form.requestedDate} onChange={e => setForm(f => ({ ...f, requestedDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Preferred Time</label>
                  <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" placeholder="HH:MM" value={form.preferredTime} onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Duration (hours) *</label>
                  <input required type="number" min={1} max={12} className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Staff Required</label>
                  <input type="number" min={1} className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" value={form.staffRequired} onChange={e => setForm(f => ({ ...f, staffRequired: +e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Equipment Required</label>
                <input className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Track geometry car, Signal test kit" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" placeholder="Describe the maintenance work..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="bg-[#0f2040] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors">Submit Request</button>
                <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
