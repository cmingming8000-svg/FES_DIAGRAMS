import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, GraduationCap, UserCog, Shield } from 'lucide-react';
import { SADClientType, sadClientTypes } from '../data/sadData';

interface ClientPopupProps {
  onSelectClient: (client: SADClientType) => void;
  onClose: () => void;
}

const clientIcons: Record<SADClientType, React.ReactNode> = {
  student: <GraduationCap className="w-6 h-6" />,
  faculty: <UserCog className="w-6 h-6" />,
  hr_qa: <Shield className="w-6 h-6" />,
  dean: <Shield className="w-6 h-6" />
};

export default function ClientPopup({ onSelectClient, onClose }: ClientPopupProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        className="fixed top-20 right-6 z-50"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[320px] select-none">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Select Client Type</h3>
              <p className="text-xs text-slate-400 mt-0.5">Choose which client flow to visualize</p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {sadClientTypes.map((client) => (
              <motion.button
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group flex items-center gap-3"
              >
                <div style={{ color: client.color }}>{clientIcons[client.id]}</div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">{client.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{client.description}</div>
                </div>
              </motion.button>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-500 text-center">
            Click a client type to trace its flow through the system
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
