import { AppProvider, useApp } from "./store/AppContext";
import Dashboard from "./pages/Dashboard";
import MaintenanceRequests from "./pages/MaintenanceRequests";
import BlockPlanner from "./pages/BlockPlanner";
import AIPriority from "./pages/AIPriority";
import Conflicts from "./pages/Conflicts";
import SmartBundling from "./pages/SmartBundling";
import WhatIfAnalysis from "./pages/WhatIfAnalysis";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import {
  LayoutDashboard, ClipboardList, Calendar, AlertTriangle,
  Brain, Layers, GitBranch, BarChart2, FileText,
  Settings, ChevronDown, Bell, User, Wifi, Train
} from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "requests", label: "Maintenance Requests", icon: ClipboardList },
  { id: "planner", label: "Block Planning", icon: Calendar },
  { id: "conflicts", label: "Conflicts", icon: AlertTriangle },
  { id: "ai-priority", label: "AI Priority", icon: Brain },
  { id: "smart-bundling", label: "Smart Bundling", icon: Layers },
  { id: "whatif", label: "What-If Analysis", icon: GitBranch },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "reports", label: "Reports", icon: FileText },
];

function AppShell() {
  const { currentPage, setCurrentPage, conflicts, requests } = useApp();
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const unresolvedConflicts = conflicts.filter(c => !c.resolved).length;

  const PageComponent = {
    dashboard: Dashboard,
    requests: MaintenanceRequests,
    planner: BlockPlanner,
    conflicts: Conflicts,
    "ai-priority": AIPriority,
    "smart-bundling": SmartBundling,
    whatif: WhatIfAnalysis,
    analytics: Analytics,
    reports: Reports,
  }[currentPage] || Dashboard;

  return (
    <div className="flex h-full bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#0f2040] flex flex-col border-r border-[#1e3a6e]">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[#1e3a6e]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#c0392b] rounded flex items-center justify-center flex-shrink-0">
              <Train size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">RailOptiAI</div>
              <div className="text-[#4a7ab5] text-[10px] leading-tight">Block Planning System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const badge = item.id === "conflicts" ? unresolvedConflicts : item.id === "requests" ? pendingCount : 0;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors relative ${
                  isActive
                    ? "bg-[#1a3056] text-white border-l-2 border-[#c0392b]"
                    : "text-[#8ab0d4] hover:bg-[#1a3056] hover:text-white border-l-2 border-transparent"
                }`}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 leading-tight">{item.label}</span>
                {badge > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.id === "conflicts" ? "bg-[#c0392b] text-white" : "bg-[#d97706] text-white"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#1e3a6e] px-4 py-3 space-y-1">
          <button className="w-full flex items-center gap-3 py-2 text-[#8ab0d4] hover:text-white text-sm transition-colors">
            <Settings size={14} />
            <span>Settings</span>
          </button>
          <div className="flex items-center gap-2 py-2">
            <div className="w-6 h-6 bg-[#1a3056] rounded-full flex items-center justify-center">
              <User size={12} className="text-[#8ab0d4]" />
            </div>
            <div>
              <div className="text-white text-xs font-medium">Demo User</div>
              <div className="text-[#4a7ab5] text-[10px]">Planner</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="text-gray-400 text-xs">Division:</span>
              <span className="font-semibold text-gray-800">Raipur</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <span className="text-gray-400 text-xs">Planning Date:</span>
              <span className="font-medium text-gray-800">07 Sep 2026</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-sm">
              <Wifi size={12} className="text-emerald-500" />
              <span className="text-emerald-600 font-medium text-xs">System Online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded font-mono">
              DEMO ENV — SYNTHETIC DATA
            </div>
            <button className="relative p-1.5 hover:bg-gray-100 rounded transition-colors">
              <Bell size={16} className="text-gray-500" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#c0392b] rounded-full" />
            </button>
            <button className="flex items-center gap-1.5 p-1.5 hover:bg-gray-100 rounded transition-colors">
              <div className="w-6 h-6 bg-[#0f2040] rounded-full flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <span className="text-sm text-gray-700 font-medium">Demo User</span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <PageComponent />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
