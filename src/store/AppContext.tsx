import React, { createContext, useContext, useState, useCallback } from "react";

export type Priority = "Critical" | "High" | "Medium" | "Low";
export type Status = "Pending" | "Planned" | "Conflict" | "Approved" | "Rejected";
export type Department = "Engineering" | "Signalling" | "Traction" | "Electrical" | "Telecom";

export interface MaintenanceRequest {
  id: string;
  department: Department;
  assetType: string;
  assetId: string;
  section: string;
  workType: string;
  requestedDate: string;
  preferredTime: string;
  duration: number; // hours
  priority: Priority;
  status: Status;
  staffRequired: number;
  equipment: string;
  description: string;
  aiScore?: number;
  safetyScore?: number;
  operationalScore?: number;
  assetCriticalityScore?: number;
  urgencyScore?: number;
}

export interface Block {
  id: string;
  section: string;
  startTime: string; // HH:MM
  endTime: string;
  date: string;
  duration: number;
  departments: string[];
  activities: string[];
  priority: Priority;
  status: "Draft" | "Approved" | "Rejected" | "AI Recommended";
  requestIds: string[];
  operationalImpact: "Low" | "Medium" | "High";
  aiReason?: string;
}

export interface Conflict {
  id: string;
  section: string;
  requestId1: string;
  requestId2: string;
  conflictType: string;
  severity: Priority;
  suggestedAction: string;
  resolved: boolean;
}

export interface Bundle {
  id: string;
  section: string;
  requestIds: string[];
  individualHours: number;
  combinedHours: number;
  reasons: string[];
  status: "Suggested" | "Created" | "Rejected";
}

export type ExecutionStatus = "Planned" | "In Progress" | "Completed" | "Delayed";

export interface ExecutionActivity {
  id: string;
  requestId: string;
  blockId: string;
  department: Department;
  section: string;
  activity: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  progress: number; // 0–100
  status: ExecutionStatus;
  delayMinutes: number;
  delayReason: string;
  remarks: string;
}

export interface PlanStatus {
  generated: boolean;
  approved: boolean;
  period: string;
  approvedAt?: string;
  requestedBlocks: number;
  optimizedBlocks: number;
  conflictsBefore: number;
  conflictsAfter: number;
  hoursBefore: number;
  hoursAfter: number;
  availabilityBefore: number;
  availabilityAfter: number;
}

interface AppState {
  requests: MaintenanceRequest[];
  blocks: Block[];
  conflicts: Conflict[];
  executionActivities: ExecutionActivity[];
  updateExecution: (id: string, patch: Partial<ExecutionActivity>) => void;
  bundles: Bundle[];
  planStatus: PlanStatus;
  addRequest: (r: Omit<MaintenanceRequest, "id" | "aiScore" | "safetyScore" | "operationalScore" | "assetCriticalityScore" | "urgencyScore">) => string;
  updateBlockStatus: (blockId: string, status: Block["status"]) => void;
  updateBlockTime: (blockId: string, startTime: string, endTime: string) => void;
  resolveConflict: (conflictId: string, blockId?: string) => void;
  createBundledBlock: (bundleId: string) => void;
  generateOptimizedPlan: () => void;
  approvePlan: () => void;
  rejectPlan: () => void;
  currentPage: string;
  setCurrentPage: (p: string) => void;
}

function computeAIScores(r: MaintenanceRequest) {
  const safetyMap: Record<string, number> = {
    Critical: 92, High: 78, Medium: 62, Low: 45,
  };
  const deptBonus: Record<Department, number> = {
    Signalling: 10, Engineering: 5, Traction: 7, Electrical: 6, Telecom: 3,
  };
  const base = safetyMap[r.priority] + (deptBonus[r.department] || 0);
  const safety = Math.min(99, base);
  const operational = Math.min(99, Math.round(safety * 0.95 - 2 + Math.random() * 4));
  const assetCriticality = Math.min(99, Math.round(safety * 1.03));
  const urgency = Math.min(99, Math.round(safety * 0.9 + 5));
  const aiScore = Math.round(safety * 0.35 + operational * 0.25 + assetCriticality * 0.25 + urgency * 0.15);
  return { safetyScore: safety, operationalScore: operational, assetCriticalityScore: assetCriticality, urgencyScore: urgency, aiScore };
}

const initialRequests: MaintenanceRequest[] = [
  { id: "MR-1024", department: "Engineering", assetType: "Track", assetId: "T-21", section: "A12", workType: "Track Inspection", requestedDate: "08 Sep", preferredTime: "02:00", duration: 4, priority: "High", status: "Pending", staffRequired: 8, equipment: "Track geometry car", description: "Routine track inspection for geometry check on T-21.", safetyScore: 78, operationalScore: 72, assetCriticalityScore: 80, urgencyScore: 70, aiScore: 75 },
  { id: "MR-1025", department: "Signalling", assetType: "Signal", assetId: "S-42", section: "A12", workType: "Signal Inspection", requestedDate: "08 Sep", preferredTime: "02:00", duration: 2, priority: "Critical", status: "Pending", staffRequired: 4, equipment: "Signal test kit", description: "Critical signal S-42 inspection required urgently.", safetyScore: 92, operationalScore: 88, assetCriticalityScore: 95, urgencyScore: 90, aiScore: 91 },
  { id: "MR-1026", department: "Traction", assetType: "OHE", assetId: "OHE-07", section: "B07", workType: "OHE Maintenance", requestedDate: "09 Sep", preferredTime: "04:00", duration: 3, priority: "Medium", status: "Pending", staffRequired: 6, equipment: "OHE maintenance truck", description: "Overhead equipment maintenance on B07 corridor.", safetyScore: 62, operationalScore: 58, assetCriticalityScore: 65, urgencyScore: 55, aiScore: 61 },
  { id: "MR-1027", department: "Engineering", assetType: "Bridge", assetId: "B-18", section: "C03", workType: "Inspection", requestedDate: "09 Sep", preferredTime: "10:00", duration: 3, priority: "High", status: "Planned", staffRequired: 5, equipment: "Inspection equipment", description: "Bridge inspection on C03 section.", safetyScore: 80, operationalScore: 74, assetCriticalityScore: 82, urgencyScore: 72, aiScore: 77 },
  { id: "MR-1028", department: "Telecom", assetType: "Cable", assetId: "TC-03", section: "A13", workType: "Telecom Inspection", requestedDate: "10 Sep", preferredTime: "06:00", duration: 2, priority: "Medium", status: "Planned", staffRequired: 3, equipment: "Telecom test kit", description: "Telecom cable inspection on A13.", safetyScore: 55, operationalScore: 50, assetCriticalityScore: 58, urgencyScore: 48, aiScore: 53 },
  { id: "MR-1029", department: "Electrical", assetType: "Panel", assetId: "EP-11", section: "D04", workType: "Electrical Inspection", requestedDate: "10 Sep", preferredTime: "08:00", duration: 2, priority: "Low", status: "Pending", staffRequired: 2, equipment: "Electrical tester", description: "Routine electrical panel inspection.", safetyScore: 45, operationalScore: 40, assetCriticalityScore: 48, urgencyScore: 38, aiScore: 43 },
];

const initialBlocks: Block[] = [
  { id: "B-023", section: "A12", startTime: "02:00", endTime: "06:00", date: "07 Sep 2026", duration: 4, departments: ["Engineering", "Signalling"], activities: ["Track Inspection", "Signal Inspection"], priority: "Critical", status: "AI Recommended", requestIds: ["MR-1024", "MR-1025"], operationalImpact: "Low", aiReason: "Same track section. Compatible activities. High safety priority. Available maintenance window. Avoids busy operating period. Reduces duplicate block requirement." },
  { id: "B-024", section: "B07", startTime: "04:00", endTime: "07:00", date: "08 Sep 2026", duration: 3, departments: ["Traction"], activities: ["OHE Maintenance"], priority: "Medium", status: "AI Recommended", requestIds: ["MR-1026"], operationalImpact: "Medium", aiReason: "Optimal maintenance window. Traction block availability confirmed." },
  { id: "B-025", section: "C03", startTime: "10:00", endTime: "13:00", date: "08 Sep 2026", duration: 3, departments: ["Engineering"], activities: ["Bridge Inspection"], priority: "High", status: "Approved", requestIds: ["MR-1027"], operationalImpact: "Low", aiReason: "Low traffic window. Safety critical inspection." },
  { id: "B-026", section: "A13", startTime: "06:00", endTime: "08:00", date: "09 Sep 2026", duration: 2, departments: ["Telecom"], activities: ["Telecom Inspection"], priority: "Medium", status: "Approved", requestIds: ["MR-1028"], operationalImpact: "Low", aiReason: "Compatible with section availability. Telecom team assigned." },
];

const initialConflicts: Conflict[] = [
  { id: "C-014", section: "A12", requestId1: "MR-1024", requestId2: "MR-1025", conflictType: "Overlapping Time", severity: "High", suggestedAction: "Combine into one block", resolved: false },
  { id: "C-015", section: "C03", requestId1: "MR-1027", requestId2: "MR-1029", conflictType: "Section Overlap", severity: "Medium", suggestedAction: "Reschedule MR-1029 to next window", resolved: false },
  { id: "C-016", section: "B07", requestId1: "MR-1026", requestId2: "MR-1028", conflictType: "Resource Conflict", severity: "Medium", suggestedAction: "Separate by 2 hours", resolved: false },
  { id: "C-017", section: "A12", requestId1: "MR-1025", requestId2: "MR-1028", conflictType: "Staff Conflict", severity: "Critical", suggestedAction: "Reallocate staff from MR-1028", resolved: false },
  { id: "C-018", section: "D04", requestId1: "MR-1029", requestId2: "MR-1024", conflictType: "Equipment Conflict", severity: "High", suggestedAction: "Schedule separately with 1h gap", resolved: false },
  { id: "C-019", section: "A13", requestId1: "MR-1028", requestId2: "MR-1025", conflictType: "Time Overlap", severity: "Medium", suggestedAction: "Adjust window for MR-1028", resolved: false },
  { id: "C-020", section: "B07", requestId1: "MR-1026", requestId2: "MR-1027", conflictType: "Overlapping Time", severity: "Critical", suggestedAction: "Split into two sequential blocks", resolved: false },
];

const initialBundles: Bundle[] = [
  { id: "BN-001", section: "A12", requestIds: ["MR-1024", "MR-1025"], individualHours: 6, combinedHours: 4, reasons: ["Same section", "Compatible activities", "Common maintenance window", "Reduced duplicate block requirement"], status: "Suggested" },
  { id: "BN-002", section: "B07", requestIds: ["MR-1026"], individualHours: 3, combinedHours: 2, reasons: ["Same section", "Compatible with telecom inspection", "Optimal window"], status: "Suggested" },
];

const initialExecutionActivities: ExecutionActivity[] = [
  { id: "EA-001", requestId: "MR-1024", blockId: "B-023", department: "Engineering", section: "A12", activity: "Track Inspection", plannedStart: "02:00", plannedEnd: "06:00", actualStart: "02:10", actualEnd: "05:45", progress: 100, status: "Completed", delayMinutes: 0, delayReason: "", remarks: "Completed ahead of schedule. Track geometry within tolerance." },
  { id: "EA-002", requestId: "MR-1025", blockId: "B-023", department: "Signalling", section: "A12", activity: "Signal Inspection", plannedStart: "02:00", plannedEnd: "04:00", actualStart: "02:15", actualEnd: "", progress: 75, status: "In Progress", delayMinutes: 15, delayReason: "Equipment setup time exceeded", remarks: "Signal relay tests ongoing." },
  { id: "EA-003", requestId: "MR-1026", blockId: "B-024", department: "Traction", section: "B07", activity: "OHE Maintenance", plannedStart: "04:00", plannedEnd: "07:00", actualStart: "", actualEnd: "", progress: 0, status: "Planned", delayMinutes: 0, delayReason: "", remarks: "" },
  { id: "EA-004", requestId: "MR-1027", blockId: "B-025", department: "Engineering", section: "C03", activity: "Bridge Inspection", plannedStart: "10:00", plannedEnd: "13:00", actualStart: "10:05", actualEnd: "13:10", progress: 100, status: "Completed", delayMinutes: 0, delayReason: "", remarks: "Inspection complete. Minor crack noted on pier — flagged for follow-up." },
  { id: "EA-005", requestId: "MR-1028", blockId: "B-026", department: "Telecom", section: "A13", activity: "Telecom Inspection", plannedStart: "06:00", plannedEnd: "08:00", actualStart: "06:00", actualEnd: "", progress: 40, status: "Delayed", delayMinutes: 45, delayReason: "Cable fault found — additional repair required", remarks: "Team extended. Requesting block extension." },
  { id: "EA-006", requestId: "MR-1029", blockId: "B-027", department: "Electrical", section: "D04", activity: "Electrical Inspection", plannedStart: "08:00", plannedEnd: "10:00", actualStart: "", actualEnd: "", progress: 0, status: "Planned", delayMinutes: 0, delayReason: "", remarks: "" },
];

const initialPlanStatus: PlanStatus = {
  generated: false, approved: false, period: "07–13 Sep 2026",
  requestedBlocks: 23, optimizedBlocks: 16, conflictsBefore: 11, conflictsAfter: 2,
  hoursBefore: 72, hoursAfter: 54, availabilityBefore: 81, availabilityAfter: 94.8,
};

const AppContext = createContext<AppState | null>(null);

let requestCounter = 1030;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(initialRequests);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [conflicts, setConflicts] = useState<Conflict[]>(initialConflicts);
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles);
  const [planStatus, setPlanStatus] = useState<PlanStatus>(initialPlanStatus);
  const [executionActivities, setExecutionActivities] = useState<ExecutionActivity[]>(initialExecutionActivities);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const updateExecution = useCallback((id: string, patch: Partial<ExecutionActivity>) => {
    setExecutionActivities(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const addRequest = useCallback((r: Omit<MaintenanceRequest, "id" | "aiScore" | "safetyScore" | "operationalScore" | "assetCriticalityScore" | "urgencyScore">) => {
    const id = `MR-${requestCounter++}`;
    const scores = computeAIScores({ ...r, id } as MaintenanceRequest);
    setRequests(prev => [...prev, { ...r, id, ...scores }]);
    return id;
  }, []);

  const updateBlockStatus = useCallback((blockId: string, status: Block["status"]) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, status } : b));
  }, []);

  const updateBlockTime = useCallback((blockId: string, startTime: string, endTime: string) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, startTime, endTime } : b));
  }, []);

  const resolveConflict = useCallback((conflictId: string) => {
    setConflicts(prev => prev.map(c => c.id === conflictId ? { ...c, resolved: true } : c));
  }, []);

  const createBundledBlock = useCallback((bundleId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;
    setBundles(prev => prev.map(b => b.id === bundleId ? { ...b, status: "Created" } : b));
    const bundleRequests = requests.filter(r => bundle.requestIds.includes(r.id));
    const depts = [...new Set(bundleRequests.map(r => r.department))];
    const acts = bundleRequests.map(r => r.workType);
    const newBlock: Block = {
      id: `B-0${30 + blocks.length}`,
      section: bundle.section,
      startTime: "02:00",
      endTime: `0${2 + bundle.combinedHours}:00`,
      date: "07 Sep 2026",
      duration: bundle.combinedHours,
      departments: depts,
      activities: acts,
      priority: "High",
      status: "AI Recommended",
      requestIds: bundle.requestIds,
      operationalImpact: "Low",
      aiReason: bundle.reasons.join(". "),
    };
    setBlocks(prev => [...prev, newBlock]);
  }, [bundles, requests, blocks.length]);

  const generateOptimizedPlan = useCallback(() => {
    const optimizedBlocks: Block[] = [
      { id: "B-023", section: "A12", startTime: "02:00", endTime: "06:00", date: "07 Sep 2026", duration: 4, departments: ["Engineering", "Signalling"], activities: ["Track Inspection", "Signal Inspection"], priority: "Critical", status: "AI Recommended", requestIds: ["MR-1024", "MR-1025"], operationalImpact: "Low", aiReason: "Bundled: same section, compatible activities, critical priority window." },
      { id: "B-024", section: "B07", startTime: "04:00", endTime: "07:00", date: "08 Sep 2026", duration: 3, departments: ["Traction"], activities: ["OHE Maintenance"], priority: "Medium", status: "AI Recommended", requestIds: ["MR-1026"], operationalImpact: "Medium", aiReason: "Optimal traction window." },
      { id: "B-025", section: "C03", startTime: "10:00", endTime: "13:00", date: "08 Sep 2026", duration: 3, departments: ["Engineering"], activities: ["Bridge Inspection"], priority: "High", status: "Approved", requestIds: ["MR-1027"], operationalImpact: "Low", aiReason: "Low traffic window confirmed." },
      { id: "B-026", section: "A13", startTime: "06:00", endTime: "08:00", date: "09 Sep 2026", duration: 2, departments: ["Telecom"], activities: ["Telecom Inspection"], priority: "Medium", status: "Approved", requestIds: ["MR-1028"], operationalImpact: "Low", aiReason: "Telecom schedule compatible." },
      { id: "B-027", section: "D04", startTime: "08:00", endTime: "10:00", date: "10 Sep 2026", duration: 2, departments: ["Electrical"], activities: ["Electrical Inspection"], priority: "Low", status: "AI Recommended", requestIds: ["MR-1029"], operationalImpact: "Low", aiReason: "Lowest traffic window assigned." },
    ];
    setBlocks(optimizedBlocks);
    setPlanStatus(prev => ({ ...prev, generated: true }));
  }, []);

  const approvePlan = useCallback(() => {
    setBlocks(prev => prev.map(b => b.status === "AI Recommended" ? { ...b, status: "Approved" } : b));
    setPlanStatus(prev => ({ ...prev, approved: true, approvedAt: new Date().toLocaleTimeString() }));
  }, []);

  const rejectPlan = useCallback(() => {
    setPlanStatus(prev => ({ ...prev, generated: false, approved: false }));
  }, []);

  return (
    <AppContext.Provider value={{ requests, blocks, conflicts, bundles, planStatus, executionActivities, updateExecution, addRequest, updateBlockStatus, updateBlockTime, resolveConflict, createBundledBlock, generateOptimizedPlan, approvePlan, rejectPlan, currentPage, setCurrentPage }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
