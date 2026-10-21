import { motion, AnimatePresence } from 'framer-motion';
import { DFDNode, DFDFlow, UserRole, roleDescriptions } from '../data/dfdData';

interface InfoPanelProps {
  selectedNode: DFDNode | null;
  currentStep: number;
  role: UserRole | null;
  flows: DFDFlow[];
  allFlows: DFDFlow[];
  onNextStep: () => void;
  onPrevStep: () => void;
  totalSteps: number;
}

export default function InfoPanel({
  selectedNode,
  currentStep,
  role,
  flows,
  allFlows,
  onNextStep,
  onPrevStep,
  totalSteps
}: InfoPanelProps) {
  const currentFlow = flows.find((f) => {
    const step = f.stepOrder[role as UserRole];
    return step === currentStep;
  });

  const roleColor = role ? roleDescriptions[role].color : '#06b6d4';

  return (
    <div className="w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4 h-fit select-none">
      {/* Step Progress */}
      {role && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Flow Progress
            </span>
            <span className="text-xs font-bold" style={{ color: roleColor }}>
              Step {currentStep} / {totalSteps}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: roleColor }}
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex gap-1 justify-center flex-wrap">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full border transition-all ${
                  step <= currentStep
                    ? 'border-transparent'
                    : 'border-slate-600 bg-transparent'
                }`}
                style={{
                  backgroundColor: step <= currentStep ? roleColor : 'transparent'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current Flow */}
      <AnimatePresence mode="wait">
        {currentFlow && (
          <motion.div
            key={currentFlow.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-slate-800/50 border border-white/5"
          >
            <div className="text-xs text-slate-400 mb-1">Current Data Flow</div>
            <div className="font-semibold text-white text-sm mb-1">{currentFlow.label}</div>
            <div className="text-xs text-slate-300 leading-relaxed">{currentFlow.description}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {role && (
        <div className="flex gap-2">
          <button
            onClick={onPrevStep}
            disabled={currentStep <= 1}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={onNextStep}
            disabled={currentStep >= totalSteps}
            className="flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: currentStep >= totalSteps ? '#334155' : roleColor
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Selected Node Details */}
      <AnimatePresence mode="wait">
        {selectedNode && (
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedNode.icon}</span>
              <div>
                <div className="font-bold text-white text-sm">{selectedNode.label}</div>
                <div className="text-xs text-slate-400">{selectedNode.description}</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Details</div>
              {selectedNode.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedNode.color }} />
                  {detail}
                </div>
              ))}
            </div>

            {/* Connected flows */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Connected Flows</div>
              {allFlows
                .filter((f) => f.from === selectedNode.id || f.to === selectedNode.id)
                .slice(0, 4)
                .map((flow) => (
                  <div key={flow.id} className="text-xs text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-500">{flow.from === selectedNode.id ? '→' : '←'}</span>
                    {flow.label}
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedNode && !currentFlow && (
        <div className="text-center py-4 text-slate-500 text-sm">
          Click on a node to see details
        </div>
      )}
    </div>
  );
}
