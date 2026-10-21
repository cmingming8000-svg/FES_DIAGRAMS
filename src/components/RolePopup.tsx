import { motion, AnimatePresence } from 'framer-motion';
import { UserRole, roleDescriptions } from '../data/dfdData';

interface RolePopupProps {
  onSelectRole: (role: UserRole) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const roles: UserRole[] = ['student', 'faculty', 'hr_qa', 'dean'];

const roleIcons: Record<UserRole, string> = {
  student: 'STU',
  faculty: 'FAC',
  hr_qa: 'HR',
  dean: 'DEAN'
};

export default function RolePopup({ onSelectRole, onClose, position }: RolePopupProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -10 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        className="fixed z-50"
        style={{
          left: `${position.x + 20}px`,
          top: `${position.y - 100}px`,
        }}
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[320px] select-none">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Choose Login Role</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select how you want to enter the system</p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => {
              const desc = roleDescriptions[role];
              return (
                <motion.button
                  key={role}
                  onClick={() => onSelectRole(role)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-3 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                >
                  <div className="text-sm font-bold mb-1" style={{ color: desc.color }}>{roleIcons[role]}</div>
                  <div className="font-semibold text-white text-xs">{desc.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{desc.subtitle}</div>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-500 text-center">
            Click a role to trace its data flow
          </div>
        </div>
        {/* Arrow pointing left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-4 h-4 bg-slate-900/95 border-l border-b border-white/10 -rotate-45" />
      </motion.div>
    </AnimatePresence>
  );
}
