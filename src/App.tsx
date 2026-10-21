import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DFDCanvas from './components/DFDCanvas';
import InfoPanel from './components/InfoPanel';
import RolePopup from './components/RolePopup';
import Legend from './components/Legend';
import { nodes, flows, UserRole, roleDescriptions } from './data/dfdData';

function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(true);

  // Get flows relevant to the selected role
  const roleFlows = useMemo(() => {
    if (!selectedRole) return [];
    return flows.filter((f) => f.stepOrder[selectedRole] !== null);
  }, [selectedRole]);

  // Get active flow IDs for the current step and role
  const activeFlowIds = useMemo(() => {
    if (!selectedRole) return [];
    return roleFlows
      .filter((f) => {
        const step = f.stepOrder[selectedRole];
        return step !== null && step <= currentStep;
      })
      .map((f) => f.id);
  }, [selectedRole, currentStep, roleFlows]);

  // Get highlighted node IDs based on active flows
  const highlightedNodeIds = useMemo(() => {
    if (!selectedRole) return [];
    const nodeIds = new Set<string>();
    roleFlows
      .filter((f) => {
        const step = f.stepOrder[selectedRole];
        return step !== null && step <= currentStep;
      })
      .forEach((f) => {
        nodeIds.add(f.from);
        nodeIds.add(f.to);
      });
    return Array.from(nodeIds);
  }, [selectedRole, currentStep, roleFlows]);

  // Total steps for the role
  const totalSteps = useMemo(() => {
    if (!selectedRole) return 0;
    return roleDescriptions[selectedRole].steps;
  }, [selectedRole]);

  // Selected node data
  const selectedNodeData = useMemo(() => {
    return nodes.find((n) => n.id === selectedNode) || null;
  }, [selectedNode]);

  const handleSelectRole = useCallback((role: UserRole) => {
    setSelectedRole(role);
    setCurrentStep(1);
    setSelectedNode(null);
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSelectNode = useCallback((id: string) => {
    setSelectedNode((prev) => (prev === id ? null : id));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedRole(null);
    setCurrentStep(1);
    setSelectedNode(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentStep((prev) => Math.max(prev - 1, 1));
      } else if (e.key === 'Escape') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSteps, handleReset]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden select-none">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.08),transparent_50%)]" />

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-cyan-500/20">
                DF
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">FES Data Flow Diagram</h1>
                <p className="text-xs text-slate-400">Faculty Evaluation System — Interactive Visualization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedRole && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors border border-white/5"
                >
                  ↺ Reset View
                </motion.button>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-900/30 backdrop-blur border border-cyan-500/30 text-xs text-cyan-300">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Shift</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 font-mono text-[10px]">Space</kbd>
                <span className="ml-1">Save & Share Positions</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Interactive Mode
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Full width canvas */}
        <div className="flex-1 relative overflow-hidden">
            {/* Step indicator overlay */}
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md"
                    style={{
                      backgroundColor: `${roleDescriptions[selectedRole].color}15`,
                      borderColor: `${roleDescriptions[selectedRole].color}40`,
                      color: roleDescriptions[selectedRole].color
                    }}
                  >
                    {roleDescriptions[selectedRole].title} Flow — Step {currentStep} of {totalSteps}
                  </div>
                  <div className="px-2 py-1 rounded-md bg-slate-800/60 backdrop-blur border border-white/5 text-[10px] text-slate-400">
                    ← → to navigate
                  </div>
                </div>
              </motion.div>
            )}

            {/* Instructions overlay when no role selected */}
            {!selectedRole && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
              >
                <div className="px-4 py-2 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-sm text-slate-300">
                  Click the <span className="text-cyan-400 font-semibold">AUTH</span> node to login
                </div>
              </motion.div>
            )}

            {/* DFD Canvas */}
            <DFDCanvas
              nodes={nodes}
              flows={flows}
              selectedNode={selectedNode}
              activeFlowIds={activeFlowIds}
              highlightedNodeIds={highlightedNodeIds}
              currentStep={currentStep}
              role={selectedRole}
              onSelectNode={handleSelectNode}
              onAuthNodeClick={() => {
                setShowRolePopup(true);
              }}
            />

          {/* Role Selection Popup */}
          {showRolePopup && (
            <RolePopup
              onSelectRole={(role) => {
                handleSelectRole(role);
                setShowRolePopup(false);
              }}
              onClose={() => setShowRolePopup(false)}
            />
          )}

          {/* Legend */}
          <Legend isExpanded={legendExpanded} onToggle={() => setLegendExpanded(!legendExpanded)} />
        </div>

        {/* Footer */}
        <footer className="flex-shrink-0 px-6 py-2 border-t border-white/5">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between text-xs text-slate-500">
            <span>FES V0.0.2 — Account Manager Update Branch</span>
            <div className="flex items-center gap-4">
              <span>React 18 + TypeScript</span>
              <span>•</span>
              <span>PostgreSQL 16 + RLS</span>
              <span>•</span>
              <span>RA 8792 / RA 10173 Compliant</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
