import { motion } from 'framer-motion';

interface LegendProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Legend({ isExpanded, onToggle }: LegendProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-6 z-30 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl"
      >
        <h3 className="text-sm font-bold text-white">Legend</h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4">
          <div className="space-y-3 text-xs">
            <div>
              <div className="text-slate-400 font-semibold mb-1.5">Node Types</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 rounded-md border-2 border-blue-500 bg-blue-500/20" />
                  <span className="text-slate-300">External Entity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-purple-500 bg-purple-500/20" />
                  <span className="text-slate-300">Process</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 rounded-sm border-2 border-slate-500 bg-slate-500/20" />
                  <span className="text-slate-300">Data Store</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-semibold mb-1.5">Data Flows</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-cyan-400 rounded" />
                  <span className="text-slate-300">Active Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-emerald-400 rounded border-dashed" style={{ borderTop: '2px dashed #34d399' }} />
                  <span className="text-slate-300">Return Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-slate-600 rounded" />
                  <span className="text-slate-300">Inactive Flow</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-semibold mb-1.5">Node States</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/30 border-2 border-cyan-400" />
                  <span className="text-slate-300">Current Step</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-500/30 border-2 border-slate-400" />
                  <span className="text-slate-300">Highlighted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-800/50 border border-slate-700 opacity-30" />
                  <span className="text-slate-300">Dimmed</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-semibold mb-1.5">Controls</div>
              <div className="space-y-1 text-slate-300">
                <div>• Click AUTH node to select role</div>
                <div>• Click nodes to view details</div>
                <div>• Scroll to zoom, drag to pan</div>
                <div>• ← → keys to navigate steps</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
