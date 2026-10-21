export type UserRole = 'student' | 'faculty' | 'hr_qa' | 'dean';

export interface DFDNode {
  id: string;
  label: string;
  description: string;
  type: 'external' | 'process' | 'datastore';
  x: number;
  y: number;
  color: string;
  icon: string;
  roles: UserRole[];
  details: string[];
}

export interface DFDFlow {
  id: string;
  from: string;
  to: string;
  label: string;
  description: string;
  roles: UserRole[];
  stepOrder: Record<UserRole, number | null>;
  hasReturnFlow?: boolean;
}

export const nodes: DFDNode[] = [
  {
    id: 'student-user',
    label: 'Student',
    description: 'Enrolled student who evaluates faculty',
    type: 'external',
    x: 50.71,
    y: 289.84,
    color: '#3b82f6',
    icon: 'GraduationCap',
    roles: ['student'],
    details: ['Authenticates via institutional ID', 'Submits evaluations', 'PII auto-redacted']
  },
  {
    id: 'faculty-user',
    label: 'Faculty',
    description: 'Teaching staff being evaluated',
    type: 'external',
    x: 33.21,
    y: 402.58,
    color: '#8b5cf6',
    icon: 'UserCog',
    roles: ['faculty'],
    details: ['Authenticates via faculty credentials', 'Views evaluation metrics', 'Receives TNA insights']
  },
  {
    id: 'hr-user',
    label: 'HR / QA',
    description: 'System administrator',
    type: 'external',
    x: 52.59,
    y: 546.88,
    color: '#ef4444',
    icon: 'Shield',
    roles: ['hr_qa'],
    details: ['Full system access', 'Manages evaluations', 'Verifies and releases']
  },
  {
    id: 'dean-user',
    label: 'Dean',
    description: 'Department oversight',
    type: 'external',
    x: 164.77,
    y: 841.43,
    color: '#f59e0b',
    icon: 'Building2',
    roles: ['dean'],
    details: ['Department analytics', 'Oversight sign-off', 'Aggregate reviews']
  },
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Login & session management',
    type: 'process',
    x: 649.17,
    y: 560,
    color: '#06b6d4',
    icon: 'Lock',
    roles: ['student', 'hr_qa', 'faculty', 'dean'],
    details: ['Argon2id hashing', 'Session tokens', 'Brute-force protection']
  },
  {
    id: 'eval-submit',
    label: 'Evaluation Submission',
    description: '3-step evaluation flow',
    type: 'process',
    x: 650.66,
    y: 256.28,
    color: '#3b82f6',
    icon: 'FileEdit',
    roles: ['student'],
    details: ['Select Program', 'Select Subject', 'Select Professor']
  },
  {
    id: 'sessions-store',
    label: 'Session Store',
    description: 'Active session management',
    type: 'datastore',
    x: 649.20,
    y: 851.29,
    color: '#475569',
    icon: 'Key',
    roles: ['student', 'hr_qa', 'faculty', 'dean'],
    details: ['SHA-256 tokens', 'HttpOnly cookies', '15-min timeout']
  },
  {
    id: 'pii-redaction',
    label: 'PII Redaction',
    description: 'Privacy protection',
    type: 'process',
    x: 1297.54,
    y: 58.61,
    color: '#ec4899',
    icon: 'EyeOff',
    roles: ['student', 'hr_qa'],
    details: ['Regex detection', 'Client & server-side', 'RA 10173 compliant']
  },
  {
    id: 'evaluations-db',
    label: 'Evaluations DB',
    description: 'PostgreSQL database',
    type: 'datastore',
    x: 1202.49,
    y: 330.67,
    color: '#64748b',
    icon: 'Database',
    roles: ['student', 'hr_qa', 'faculty', 'dean'],
    details: ['Row-level security', 'Per-transaction context', 'RLS policies']
  },
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    description: 'HR/QA management',
    type: 'process',
    x: 1306.34,
    y: 725.81,
    color: '#ef4444',
    icon: 'Settings',
    roles: ['hr_qa'],
    details: ['Manage terms', 'Configure criteria', 'Monitor audit']
  },
  {
    id: 'verify-release',
    label: 'Verify & Release',
    description: 'HR/QA release',
    type: 'process',
    x: 2125.50,
    y: 221.18,
    color: '#10b981',
    icon: 'CheckCircle',
    roles: ['hr_qa', 'faculty', 'dean'],
    details: ['E-signs release', 'RA 8792 compliant', 'SHA-256 hash']
  },
  {
    id: 'faculty-dashboard',
    label: 'Faculty Dashboard',
    description: 'Personal metrics',
    type: 'process',
    x: 1550,
    y: 560,
    color: '#8b5cf6',
    icon: 'BarChart3',
    roles: ['faculty'],
    details: ['View results', 'TNA insights', 'E-sign acknowledgment']
  },
  {
    id: 'dean-oversight',
    label: 'Dean Oversight',
    description: 'Department analytics',
    type: 'process',
    x: 1450.47,
    y: 779.91,
    color: '#f59e0b',
    icon: 'ClipboardCheck',
    roles: ['dean'],
    details: ['Aggregate reviews', 'Drill-down metrics', '7-day sign-off']
  },
  {
    id: 'tna-engine',
    label: 'TNA Engine',
    description: 'Training Needs Analysis',
    type: 'process',
    x: 1900,
    y: 240,
    color: '#14b8a6',
    icon: 'Brain',
    roles: ['hr_qa', 'faculty', 'dean'],
    details: ['Deterministic insights', 'Template-based', 'Cached snapshots']
  },
  {
    id: 'audit-service',
    label: 'Audit Service',
    description: 'Append-only audit trail',
    type: 'process',
    x: 1900,
    y: 560,
    color: '#6366f1',
    icon: 'FileText',
    roles: ['hr_qa'],
    details: ['SHA-256 hash chain', 'Append-only', 'Tamper detection']
  },
  {
    id: 'reports',
    label: 'Report Generator',
    description: 'PDF & Excel export',
    type: 'process',
    x: 1715.10,
    y: -77.58,
    color: '#0ea5e9',
    icon: 'FileOutput',
    roles: ['hr_qa', 'dean', 'faculty'],
    details: ['PDF generation', 'Excel export', 'Verification receipts']
  },
  {
    id: 'audit-db',
    label: 'Audit Log',
    description: 'Immutable storage',
    type: 'datastore',
    x: 2250,
    y: 560,
    color: '#475569',
    icon: 'HardDrive',
    roles: ['hr_qa'],
    details: ['Append-only table', 'Hash chain', 'WORM backups']
  }
];

export const flows: DFDFlow[] = [
  { id: 'f1', from: 'student-user', to: 'auth', label: 'Login credentials', description: 'Student authenticates', roles: ['student'], stepOrder: { student: 1, hr_qa: null, faculty: null, dean: null } },
  { id: 'f2', from: 'auth', to: 'sessions-store', label: 'Session token', description: 'Session created', roles: ['student', 'hr_qa', 'faculty', 'dean'], stepOrder: { student: 2, hr_qa: 2, faculty: 2, dean: 2 }, hasReturnFlow: true },
  { id: 'f3', from: 'auth', to: 'eval-submit', label: 'Authenticated session', description: 'Access granted', roles: ['student'], stepOrder: { student: 3, hr_qa: null, faculty: null, dean: null } },
  { id: 'f4', from: 'eval-submit', to: 'pii-redaction', label: 'Raw evaluation', description: 'PII scanning', roles: ['student'], stepOrder: { student: 4, hr_qa: null, faculty: null, dean: null } },
  { id: 'f5', from: 'pii-redaction', to: 'evaluations-db', label: 'Redacted evaluation', description: 'Stored', roles: ['student', 'hr_qa'], stepOrder: { student: 5, hr_qa: null, faculty: null, dean: null } },
  { id: 'f6', from: 'evaluations-db', to: 'audit-db', label: 'Audit entry', description: 'Logged', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: null } },
  { id: 'f7', from: 'hr-user', to: 'auth', label: 'Admin credentials', description: 'HR/QA authenticates', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: 1, faculty: null, dean: null } },
  { id: 'f8', from: 'auth', to: 'admin-dashboard', label: 'Full access', description: 'Dashboard access', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: 3, faculty: null, dean: null } },
  { id: 'f9', from: 'admin-dashboard', to: 'evaluations-db', label: 'Query evaluations', description: 'Query data', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: 4, faculty: null, dean: null }, hasReturnFlow: true },
  { id: 'f10', from: 'admin-dashboard', to: 'verify-release', label: 'Review & e-sign', description: 'Release', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: 5, faculty: null, dean: null } },
  { id: 'f11', from: 'verify-release', to: 'evaluations-db', label: 'Release update', description: 'Status update', roles: ['hr_qa', 'faculty', 'dean'], stepOrder: { student: null, hr_qa: 6, faculty: null, dean: null } },
  { id: 'f12', from: 'admin-dashboard', to: 'audit-service', label: 'Verify audit', description: 'Chain verification', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: 7, faculty: null, dean: null } },
  { id: 'f13', from: 'audit-service', to: 'audit-db', label: 'Read audit log', description: 'Read entries', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: null }, hasReturnFlow: true },
  { id: 'f14', from: 'faculty-user', to: 'auth', label: 'Faculty credentials', description: 'Faculty authenticates', roles: ['faculty'], stepOrder: { student: null, hr_qa: null, faculty: 1, dean: null } },
  { id: 'f15', from: 'auth', to: 'faculty-dashboard', label: 'Scoped data', description: 'Role-scoped data', roles: ['faculty'], stepOrder: { student: null, hr_qa: null, faculty: 2, dean: null }, hasReturnFlow: true },
  { id: 'f16', from: 'verify-release', to: 'faculty-dashboard', label: 'Released results', description: 'View results', roles: ['faculty'], stepOrder: { student: null, hr_qa: null, faculty: 3, dean: null } },
  { id: 'f17', from: 'faculty-dashboard', to: 'tna-engine', label: 'Request insights', description: 'TNA request', roles: ['faculty'], stepOrder: { student: null, hr_qa: null, faculty: 4, dean: null }, hasReturnFlow: true },
  { id: 'f18', from: 'dean-user', to: 'auth', label: 'Dean credentials', description: 'Dean authenticates', roles: ['dean'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: 1 } },
  { id: 'f19', from: 'auth', to: 'dean-oversight', label: 'Department scope', description: 'Department data', roles: ['dean'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: 2 } },
  { id: 'f20', from: 'verify-release', to: 'dean-oversight', label: 'Released aggregates', description: 'Aggregates', roles: ['dean'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: 3 } },
  { id: 'f21', from: 'dean-oversight', to: 'tna-engine', label: 'Department analysis', description: 'TNA analysis', roles: ['dean'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: 4 }, hasReturnFlow: true },
  { id: 'f22', from: 'dean-oversight', to: 'verify-release', label: 'Oversight sign-off', description: 'E-sign', roles: ['dean'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: 5 } },
  { id: 'f23', from: 'tna-engine', to: 'reports', label: 'Analytics data', description: 'Feed reports', roles: ['hr_qa', 'dean', 'faculty'], stepOrder: { student: null, hr_qa: 8, faculty: 5, dean: 6 }, hasReturnFlow: true },
  { id: 'f24', from: 'reports', to: 'faculty-user', label: 'PDF/Excel reports', description: 'Faculty reports', roles: ['faculty'], stepOrder: { student: null, hr_qa: null, faculty: 6, dean: null }, hasReturnFlow: true },
  { id: 'f25', from: 'reports', to: 'dean-user', label: 'Department reports', description: 'Dean reports', roles: ['dean'], stepOrder: { student: null, hr_qa: null, faculty: null, dean: 7 }, hasReturnFlow: true },
  { id: 'f26', from: 'reports', to: 'hr-user', label: 'System reports', description: 'HR/QA reports', roles: ['hr_qa'], stepOrder: { student: null, hr_qa: 9, faculty: null, dean: null }, hasReturnFlow: true }
];

export const roleDescriptions: Record<UserRole, { title: string; subtitle: string; color: string; steps: number }> = {
  student: { title: 'Student', subtitle: 'Submit evaluations', color: '#3b82f6', steps: 5 },
  faculty: { title: 'Faculty', subtitle: 'View results & insights', color: '#8b5cf6', steps: 6 },
  hr_qa: { title: 'HR / QA', subtitle: 'Administer & release', color: '#ef4444', steps: 9 },
  dean: { title: 'Dean', subtitle: 'Oversee & analytics', color: '#f59e0b', steps: 7 }
};
