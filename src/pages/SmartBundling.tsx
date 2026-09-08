import { useApp } from "../store/AppContext";
import { Layers, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function SmartBundling() {
  const { bundles, requests, createBundledBlock } = useApp();

  const getRequest = (id: string) => requests.find(r => r.id === id);

  const compatibilityNote = (b: typeof bundles[0]) => {
    const reqs = b.requestIds.map(id => getRequest(id)).filter(Boolean);
    const sections = [...new Set(reqs.map(r => r!.section))];
    if (sections.length > 1) return "Note: Activities span multiple sections — bundling not recommended.";
    return null;
  };

  return (
    <div className="p-5">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Smart Bundling</h1>
        <p className="text-sm text-gray-500">Identify compatible maintenance activities that can share a maintenance block</p>
      </div>

      <div className="mb-4 bg-amber-50 border border-amber-200 rounded p-3 flex gap-2 text-xs text-amber-800">
        <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
        <span>Bundling considers: same section · time compatibility · activity compatibility · operational constraints. Incompatible activities are not combined.</span>
      </div>

      <div className="space-y-4">
        {bundles.map(bundle => {
          const saving = bundle.individualHours - bundle.combinedHours;
          const note = compatibilityNote(bundle);
          const bundleRequests = bundle.requestIds.map(id => getRequest(id)).filter(Boolean);
          const section = bundleRequests[0]?.section || bundle.section;

          return (
            <div key={bundle.id} className={`bg-white border rounded overflow-hidden ${bundle.status === "Created" ? "border-emerald-300" : "border-gray-200"}`}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={15} className="text-[#0f2040]" />
                  <span className="font-semibold text-gray-800">Section {section}</span>
                  <span className="font-mono text-xs text-gray-400">{bundle.id}</span>
                  {bundle.status === "Created" && (
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-medium">Block Created</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>Saving: <span className="font-mono font-bold text-emerald-600">{saving}h</span></span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Included Activities</div>
                    <div className="space-y-2">
                      {bundleRequests.map(r => r && (
                        <div key={r.id} className="flex items-center justify-between text-sm border border-gray-100 rounded p-2">
                          <div>
                            <div className="font-mono text-xs font-bold text-gray-700">{r.id}</div>
                            <div className="text-xs text-gray-500">{r.workType}</div>
                          </div>
                          <span className="font-mono text-xs text-gray-600">{r.duration}h</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 mb-2">Hours Comparison</div>
                    <div className="space-y-2">
                      <div className="border border-gray-100 rounded p-2">
                        <div className="text-xs text-gray-500">Individual requirement</div>
                        <div className="font-mono text-lg font-bold text-gray-700">{bundle.individualHours}h</div>
                      </div>
                      <div className="border border-emerald-200 bg-emerald-50 rounded p-2">
                        <div className="text-xs text-emerald-700">Recommended combined</div>
                        <div className="font-mono text-lg font-bold text-emerald-700">{bundle.combinedHours}h</div>
                      </div>
                      <div className="border border-blue-200 bg-blue-50 rounded p-2">
                        <div className="text-xs text-blue-700">Potential saving</div>
                        <div className="font-mono text-lg font-bold text-blue-700">{saving}h</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 mb-2">Bundling Reasons</div>
                    <div className="space-y-1.5">
                      {bundle.reasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <CheckCircle size={11} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {note && (
                  <div className="mb-3 bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-700">{note}</div>
                )}

                <div className="flex gap-2">
                  {bundle.status !== "Created" && !note && (
                    <button
                      onClick={() => createBundledBlock(bundle.id)}
                      className="bg-[#0f2040] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1a3056] transition-colors"
                    >
                      Create Combined Block
                    </button>
                  )}
                  {bundle.status === "Created" && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle size={14} />
                      Combined block created and added to Block Planner
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {bundles.length === 0 && (
          <div className="bg-white border border-gray-200 rounded p-8 text-center text-sm text-gray-400">
            No bundling opportunities detected for current requests.
          </div>
        )}
      </div>
    </div>
  );
}
