import { motion } from 'framer-motion';
import { UserRole, roleDescriptions } from '../data/dfdData';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
  selectedRole: UserRole | null;
}

const roles: UserRole[] = ['student', 'faculty', 'hr_qa', 'dean'];

const roleIcons: Record<UserRole, string> = {
  student: '🎓',
  faculty: '👨‍🏫',
  hr_qa: '🛡️',
  dean: '🏛️'
};

export default function RoleSelector({ onSelectRole, selectedRole }: RoleSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">Select Your Role</h2>
        <p className="text-slate-400 text-sm">Choose a role to trace its data flow through the system</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {roles.map((role) => {
          const desc = roleDescriptions[role];
          const isSelected = selectedRole === role;
          return (
            <motion.button
              key={role}
              onClick={() => onSelectRole(role)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-4 py-4 rounded-xl border-2 transition-all duration-300 text-left min-w-[160px] ${
                isSelected
                  ? 'border-white/40 bg-white/10 shadow-lg'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
              }`}
              style={{
                boxShadow: isSelected ? `0 0 20px ${desc.color}33` : undefined
              }}
            >
              {isSelected && (
                <motion.div
                  layoutId="role-indicator"
                  className="absolute inset-0 rounded-xl border-2"
                  style={{ borderColor: desc.color }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="text-2xl mb-2">{roleIcons[role]}</div>
              <div className="font-semibold text-white text-sm">{desc.title}</div>
              <div className="text-xs text-slate-400 mt-1 leading-tight">{desc.subtitle}</div>
              <div className="mt-2 text-xs px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: `${desc.color}22`, color: desc.color }}>
                {desc.steps} steps
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
