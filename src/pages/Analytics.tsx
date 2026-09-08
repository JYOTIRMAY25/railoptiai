import { useApp } from "../store/AppContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, Cell
} from "recharts";

const DEPT_COLORS = ["#0f2040", "#c0392b", "#d97706", "#059669", "#3b82f6"];

const BEFORE_AFTER = [
  { name: "Requested", value: 23, fill: "#94a3b8" },
  { name: "Optimized", value: 16, fill: "#0f2040" },
];

const CONFLICT_DATA = [
  { week: "W31", before: 14, after: 3 },
  { week: "W32", before: 11, after: 2 },
  { week: "W33", before: 9, after: 1 },
  { week: "W34", before: 12, after: 4 },
  { week: "W35", before: 11, after: 2 },
];

const AVAILABILITY_DATA = [
  { day: "Mon", availability: 88 },
  { day: "Tue", availability: 91 },
  { day: "Wed", availability: 89 },
  { day: "Thu", availability: 93 },
  { day: "Fri", availability: 94.8 },
  { day: "Sat", availability: 96 },
  { day: "Sun", availability: 95 },
];

const HOURS_DATA = [
  { week: "W31", before: 84, after: 62 },
  { week: "W32", before: 72, after: 54 },
  { week: "W33", before: 68, after: 48 },
  { week: "W34", before: 79, after: 58 },
  { week: "W35", before: 72, after: 54 },
];

export default function Analytics() {
  const { requests } = useApp();

  const deptData = ["Engineering", "Signalling", "Traction", "Electrical", "Telecom"].map(d => ({
    name: d,
    count: requests.filter(r => r.department === d).length,
  }));

  const critical = requests.filter(r => r.priority === "Critical").length;
  const total = requests.length;

  return (
    <div className="p-5">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Raipur Division · Planning cycle performance metrics · Prototype Simulation Data</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Dept chart */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Maintenance Requests by Department</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {deptData.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conflicts chart */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Conflicts Before vs After Optimization</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CONFLICT_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="before" name="Before" fill="#f87171" radius={[2, 2, 0, 0]} />
              <Bar dataKey="after" name="After" fill="#059669" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Availability */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Asset Availability (%) — Current Week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={AVAILABILITY_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0" }} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="availability" stroke="#0f2040" strokeWidth={2} dot={{ r: 3, fill: "#0f2040" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hours saved */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Maintenance Hours Saved</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={HOURS_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="before" name="Before (h)" fill="#94a3b8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="after" name="After (h)" fill="#0f2040" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Requests", value: total, color: "text-gray-800" },
          { label: "Critical Tasks", value: critical, color: "text-[#c0392b]" },
          { label: "Hours Saved (avg)", value: "18h", color: "text-emerald-600" },
          { label: "Optimization Rate", value: "30%", color: "text-blue-600" },
          { label: "Avg Availability", value: "93.7%", color: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded p-3 text-center">
            <div className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-3">Prototype simulation data only. Not real Indian Railways statistics.</p>
    </div>
  );
}
