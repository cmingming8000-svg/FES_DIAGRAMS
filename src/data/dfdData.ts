export type UserRole = 'student' | 'hr_qa' | 'faculty' | 'dean';

export interface DFDNode {
  id: string;
  label: string;
  description: string;
  type: 'external' | 'process' | 'datastore' | 'system';
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
}

export const nodes: DFDNode[] = [
  // External Entities
  {
    id: 'student-user',
    label: 'Student',
    description: 'Enrolled student who evaluates faculty',
    type: 'external',
    x: 80,
    y: 120,
    color: '#3b82f6',
    icon: 'STU',
    roles: ['student'],
    details: [
      'Authenticates via institutional ID (e.g., C24-001)',
      'Submits evaluations for enrolled courses',
      'PII is auto-redacted before storage',
      'Cannot view evaluation results'
    ]
  },
  {
    id: 'faculty-user',
    label: 'Faculty',
    description: 'Teaching staff being evaluated',
    type: 'external',
    x: 80,
    y: 340,
    color: '#8b5cf6',
    icon: 'FAC',
    roles: ['faculty'],
    details: [
      'Authenticates via faculty credentials',
      'Views personal evaluation metrics after release',
      'Receives TNA-based development insights',
      'E-signs acknowledgment of results'
    ]
  },
  {
    id: 'hr-user',
    label: 'HR / QA',
    description: 'System administrator & quality assurance',
    type: 'external',
    x: 80,
    y: 560,
    color: '#ef4444',
    icon: 'HR',
    roles: ['hr_qa'],
    details: [
      'Full system administration access',
      'Manages academic terms & criteria',
      'Verifies and releases evaluations (e-signed)',
      'Manages accounts, audit logs, and TNA analytics'
    ]
  },
  {
    id: 'dean-user',
    label: 'Dean / Program Head',
    description: 'Department oversight authority',
    type: 'external',
    x: 80,
    y: 780,
    color: '#f59e0b',
    icon: 'DEAN',
    roles: ['dean'],
    details: [
      'Authenticates via department ID (e.g., M001)',
      'Views departmental aggregate analytics',
      'Drills down into individual faculty metrics',
      'Provides oversight sign-off within 7 days'
    ]
  },

  // Processes
  {
    id: 'auth',
    label: 'Authentication',
    description: 'Login & session management',
    type: 'process',
    x: 340,
    y: 440,
    color: '#06b6d4',
    icon: 'AUTH',
    roles: ['student', 'hr_qa', 'faculty', 'dean'],
    details: [
      'Argon2id password hashing',
      'Opaque 256-bit session tokens',
      '15-min idle timeout, 12-hr absolute lifetime',
      'Brute-force lockout after 5 failures',
      'CSRF protection via SameSite + custom headers'
    ]
  },
  {
    id: 'eval-submit',
    label: 'Evaluation Submission',
    description: '3-step evaluation flow',
    type: 'process',
    x: 340,
    y: 120,
    color: '#3b82f6',
    icon: 'EVAL',
    roles: ['student'],
    details: [
      'Step 1: Select Program',
      'Step 2: Select Subject',
      'Step 3: Select Professor',
      'Rate on 4 domains (1-5 scale)',
      'Submit feedback with PII redaction'
    ]
  },
  {
    id: 'pii-redaction',
    label: 'PII Redaction',
    description: 'Automated privacy protection (RA 10173)',
    type: 'process',
    x: 560,
    y: 120,
    color: '#ec4899',
    icon: 'PII',
    roles: ['student', 'hr_qa'],
    details: [
      'Regex-based PII detection',
      'Applied client-side AND server-side',
      'Student identity hidden from faculty/dean',
      'HR/QA retains verification visibility',
      'Complies with RA 10173 (Data Privacy Act)'
    ]
  },
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    description: 'HR/QA system management',
    type: 'process',
    x: 560,
    y: 560,
    color: '#ef4444',
    icon: 'ADM',
    roles: ['hr_qa'],
    details: [
      'Manage academic terms',
      'Configure evaluation criteria',
      'Manage faculty data & accounts',
      'View TNA analytics',
      'Monitor audit trail',
      'Activate/deactivate/unlock accounts'
    ]
  },
  {
    id: 'verify-release',
    label: 'Verify & Release',
    description: 'HR/QA evaluation release (e-signed)',
    type: 'process',
    x: 780,
    y: 340,
    color: '#10b981',
    icon: 'REL',
    roles: ['hr_qa', 'faculty', 'dean'],
    details: [
      'HR/QA reviews all submissions',
      'E-signs release (RA 8792 compliant)',
      'Tracking ID: FES-[timestamp]-[hash]',
      'Immediately grants faculty access',
      'Closes term to new submissions',
      'SHA-256 document hash stored'
    ]
  },
  {
    id: 'faculty-dashboard',
    label: 'Faculty Dashboard',
    description: 'Personal metrics & development',
    type: 'process',
    x: 780,
    y: 560,
    color: '#8b5cf6',
    icon: 'DASH',
    roles: ['faculty'],
    details: [
      'View personal evaluation results',
      'Cross-department aggregates (server-computed)',
      'TNA-based development insights',
      'E-sign acknowledgment',
      'Access after HR/QA release only'
    ]
  },
  {
    id: 'dean-oversight',
    label: 'Dean Oversight',
    description: 'Department analytics & sign-off',
    type: 'process',
    x: 780,
    y: 780,
    color: '#f59e0b',
    icon: 'OVRS',
    roles: ['dean'],
    details: [
      'Department aggregate reviews',
      'Drill-down into faculty metrics',
      'Cross-department comparisons',
      'Oversight sign-off (due within 7 days)',
      'Does NOT gate faculty access',
      'Access after HR/QA release'
    ]
  },
  {
    id: 'tna-engine',
    label: 'TNA Engine',
    description: 'Training Needs Analysis',
    type: 'process',
    x: 1000,
    y: 440,
    color: '#14b8a6',
    icon: 'TNA',
    roles: ['hr_qa', 'faculty', 'dean'],
    details: [
      'Deterministic individual insights',
      'Pre-approved template-based',
      'Department/institution analysis',
      'Cached in tna_snapshots',
      'Keyed by term + input fingerprint'
    ]
  },
  {
    id: 'audit-service',
    label: 'Audit Service',
    description: 'Append-only audit trail',
    type: 'process',
    x: 1000,
    y: 680,
    color: '#6366f1',
    icon: 'AUD',
    roles: ['hr_qa'],
    details: [
      'SHA-256 hash-chained entries',
      'Append-only (UPDATE/DELETE blocked)',
      'Runtime role: SELECT/INSERT only',
      'HR/QA can verify chain integrity',
      'Detects tampering attempts'
    ]
  },

  // Data Stores
  {
    id: 'evaluations-db',
    label: 'Evaluations DB',
    description: 'PostgreSQL with row-level security',
    type: 'datastore',
    x: 560,
    y: 340,
    color: '#64748b',
    icon: 'DB',
    roles: ['student', 'hr_qa', 'faculty', 'dean'],
    details: [
      'PostgreSQL 16 relational database',
      'Row-level security policies',
      'Per-transaction security context',
      'Foreign keys & indexes',
      'RLS on evaluations & evaluation_ratings'
    ]
  },
  {
    id: 'audit-db',
    label: 'Audit Log',
    description: 'Immutable audit trail storage',
    type: 'datastore',
    x: 1200,
    y: 680,
    color: '#475569',
    icon: 'LOG',
    roles: ['hr_qa'],
    details: [
      'Append-only table',
      'Triggers block UPDATE/DELETE/TRUNCATE',
      'SHA-256 hash chain',
      'Off-host log shipping recommended',
      'WORM backups complement security'
    ]
  },
  {
    id: 'sessions-store',
    label: 'Session Store',
    description: 'Active session management',
    type: 'datastore',
    x: 340,
    y: 680,
    color: '#475569',
    icon: 'SES',
    roles: ['student', 'hr_qa', 'faculty', 'dean'],
    details: [
      'SHA-256 of opaque tokens stored',
      'HttpOnly; Secure; SameSite=Strict cookies',
      '__Host- prefix for cookie binding',
      '15-min idle / 12-hr absolute timeout',
      'In-memory rate limit counters'
    ]
  },
  {
    id: 'reports',
    label: 'Report Generator',
    description: 'PDF & Excel export',
    type: 'process',
    x: 1200,
    y: 340,
    color: '#0ea5e9',
    icon: 'RPT',
    roles: ['hr_qa', 'dean', 'faculty'],
    details: [
      'PDF receipt generation (server-side)',
      'Excel export via exceljs',
      'Admin/Dean/Faculty print reports',
      'Agreement verification receipts',
      'Tracking ID verification endpoint'
    ]
  }
];

export const flows: DFDFlow[] = [
  // Student flows
  {
    id: 'f1',
    from: 'student-user',
    to: 'auth',
    label: 'Login credentials',
    description: 'Student authenticates with institutional ID and password',
    roles: ['student'],
    stepOrder: { student: 1, hr_qa: null, faculty: null, dean: null }
  },
  {
    id: 'f2',
    from: 'auth',
    to: 'sessions-store',
    label: 'Session token',
    description: 'Server creates session and stores SHA-256 hash of opaque token',
    roles: ['student', 'hr_qa', 'faculty', 'dean'],
    stepOrder: { student: 2, hr_qa: 1, faculty: 1, dean: 1 }
  },
  {
    id: 'f3',
    from: 'auth',
    to: 'eval-submit',
    label: 'Authenticated session',
    description: 'Student gains access to evaluation submission flow',
    roles: ['student'],
    stepOrder: { student: 3, hr_qa: null, faculty: null, dean: null }
  },
  {
    id: 'f4',
    from: 'eval-submit',
    to: 'pii-redaction',
    label: 'Raw evaluation data',
    description: 'Evaluation submitted with feedback text for PII scanning',
    roles: ['student'],
    stepOrder: { student: 4, hr_qa: null, faculty: null, dean: null }
  },
  {
    id: 'f5',
    from: 'pii-redaction',
    to: 'evaluations-db',
    label: 'Redacted evaluation',
    description: 'PII-stripped evaluation stored with student ID (hidden from faculty/dean)',
    roles: ['student', 'hr_qa'],
    stepOrder: { student: 5, hr_qa: null, faculty: null, dean: null }
  },
  {
    id: 'f6',
    from: 'evaluations-db',
    to: 'audit-db',
    label: 'Audit entry',
    description: 'Evaluation submission logged to immutable audit trail',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: null }
  },

  // HR/QA flows
  {
    id: 'f7',
    from: 'hr-user',
    to: 'auth',
    label: 'Admin credentials',
    description: 'HR/QA authenticates with admin credentials',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: 2, faculty: null, dean: null }
  },
  {
    id: 'f8',
    from: 'auth',
    to: 'admin-dashboard',
    label: 'Full access',
    description: 'HR/QA accesses complete admin dashboard with all tabs',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: 3, faculty: null, dean: null }
  },
  {
    id: 'f9',
    from: 'admin-dashboard',
    to: 'evaluations-db',
    label: 'Query evaluations',
    description: 'HR/QA queries all evaluations (sees student IDs for verification)',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: 4, faculty: null, dean: null }
  },
  {
    id: 'f10',
    from: 'admin-dashboard',
    to: 'verify-release',
    label: 'Review & e-sign',
    description: 'HR/QA reviews evaluations and e-signs release (RA 8792)',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: 5, faculty: null, dean: null }
  },
  {
    id: 'f11',
    from: 'verify-release',
    to: 'evaluations-db',
    label: 'Release status update',
    description: 'Term marked as released; faculty access granted; submissions closed',
    roles: ['hr_qa', 'faculty', 'dean'],
    stepOrder: { student: null, hr_qa: 6, faculty: null, dean: null }
  },
  {
    id: 'f12',
    from: 'admin-dashboard',
    to: 'audit-service',
    label: 'Verify audit chain',
    description: 'HR/QA verifies SHA-256 hash chain integrity',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: 7, faculty: null, dean: null }
  },
  {
    id: 'f13',
    from: 'audit-service',
    to: 'audit-db',
    label: 'Read audit log',
    description: 'Service reads append-only audit entries for verification',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: null }
  },

  // Faculty flows
  {
    id: 'f14',
    from: 'faculty-user',
    to: 'auth',
    label: 'Faculty credentials',
    description: 'Faculty authenticates with faculty credentials',
    roles: ['faculty'],
    stepOrder: { student: null, hr_qa: null, faculty: 2, dean: null }
  },
  {
    id: 'f15',
    from: 'auth',
    to: 'faculty-dashboard',
    label: 'Scoped data',
    description: 'Faculty receives role-scoped bootstrap data (own results only)',
    roles: ['faculty'],
    stepOrder: { student: null, hr_qa: null, faculty: 3, dean: null }
  },
  {
    id: 'f16',
    from: 'verify-release',
    to: 'faculty-dashboard',
    label: 'Released results',
    description: 'After HR/QA release, faculty can view their evaluation results',
    roles: ['faculty'],
    stepOrder: { student: null, hr_qa: null, faculty: 4, dean: null }
  },
  {
    id: 'f17',
    from: 'faculty-dashboard',
    to: 'tna-engine',
    label: 'Request insights',
    description: 'Faculty views TNA-based professional development recommendations',
    roles: ['faculty'],
    stepOrder: { student: null, hr_qa: null, faculty: 5, dean: null }
  },

  // Dean flows
  {
    id: 'f18',
    from: 'dean-user',
    to: 'auth',
    label: 'Dean credentials',
    description: 'Dean authenticates with department ID (e.g., M001)',
    roles: ['dean'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: 2 }
  },
  {
    id: 'f19',
    from: 'auth',
    to: 'dean-oversight',
    label: 'Department scope',
    description: 'Dean receives department-scoped data after HR/QA release',
    roles: ['dean'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: 3 }
  },
  {
    id: 'f20',
    from: 'verify-release',
    to: 'dean-oversight',
    label: 'Released aggregates',
    description: 'Dean accesses department aggregates (student IDs hidden)',
    roles: ['dean'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: 4 }
  },
  {
    id: 'f21',
    from: 'dean-oversight',
    to: 'tna-engine',
    label: 'Department analysis',
    description: 'Dean views department-level TNA snapshots and comparisons',
    roles: ['dean'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: 5 }
  },
  {
    id: 'f22',
    from: 'dean-oversight',
    to: 'verify-release',
    label: 'Oversight sign-off',
    description: 'Dean e-signs oversight within 7 days (does not gate faculty access)',
    roles: ['dean'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: 6 }
  },

  // Shared flows
  {
    id: 'f23',
    from: 'tna-engine',
    to: 'reports',
    label: 'Analytics data',
    description: 'TNA snapshots feed into report generation',
    roles: ['hr_qa', 'dean', 'faculty'],
    stepOrder: { student: null, hr_qa: 8, faculty: 6, dean: 7 }
  },
  {
    id: 'f24',
    from: 'reports',
    to: 'faculty-user',
    label: 'PDF/Excel reports',
    description: 'Faculty receives printable evaluation reports',
    roles: ['faculty'],
    stepOrder: { student: null, hr_qa: null, faculty: 7, dean: null }
  },
  {
    id: 'f25',
    from: 'reports',
    to: 'dean-user',
    label: 'Department reports',
    description: 'Dean receives department analytics reports',
    roles: ['dean'],
    stepOrder: { student: null, hr_qa: null, faculty: null, dean: 8 }
  },
  {
    id: 'f26',
    from: 'reports',
    to: 'hr-user',
    label: 'System reports',
    description: 'HR/QA receives institution-wide reports and verification receipts',
    roles: ['hr_qa'],
    stepOrder: { student: null, hr_qa: 9, faculty: null, dean: null }
  }
];

export const roleDescriptions: Record<UserRole, { title: string; subtitle: string; color: string; steps: number }> = {
  student: {
    title: 'Student',
    subtitle: 'Submit faculty evaluations anonymously',
    color: '#3b82f6',
    steps: 5
  },
  faculty: {
    title: 'Faculty',
    subtitle: 'View evaluation results & development insights',
    color: '#8b5cf6',
    steps: 7
  },
  hr_qa: {
    title: 'HR / QA',
    subtitle: 'Administer system & release evaluations',
    color: '#ef4444',
    steps: 9
  },
  dean: {
    title: 'Dean / Program Head',
    subtitle: 'Oversee department analytics & sign-off',
    color: '#f59e0b',
    steps: 8
  }
};
