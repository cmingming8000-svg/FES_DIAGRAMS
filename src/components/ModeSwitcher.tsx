import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export type ViewMode = 'dfd' | 'erd';

interface ModeSwitcherProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

const modes: { id: ViewMode; label: string; description: string }[] = [
  { id: 'dfd', label: 'Data Flow Diagram', description: 'Visualize data movement' },
  { id: 'erd', label: 'Entity Relationship', description: 'Database schema view' },
];

export default function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentMode = modes.find(m => m.id === mode)!;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-sm text-white hover:bg-slate-700/80 transition-colors"
      >
        <span className="font-medium">{currentMode.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onModeChange(m.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                  mode === m.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${mode === m.id ? 'text-cyan-400' : 'text-white'}`}>
                      {m.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {m.description}
                    </div>
                  </div>
                  {mode === m.id && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
