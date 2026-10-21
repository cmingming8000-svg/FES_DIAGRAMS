export interface SADComponent {
  id: string;
  label: string;
  description: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'external';
  x: number;
  y: number;
  color: string;
  tourOrder?: number;
}

export interface SADConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  protocol: string;
  description: string;
}

export type SADClientType = 'student' | 'faculty' | 'admin';

export interface SADFlowStep {
  componentId: string;
  connectionId?: string;
  description: string;
}

export const sadClientTypes: { id: SADClientType; label: string; description: string; color: string }[] = [
  { id: 'student', label: 'Student', description: 'Submit evaluations', color: '#3b82f6' },
  { id: 'faculty', label: 'Faculty', description: 'View evaluation results', color: '#8b5cf6' },
  { id: 'admin', label: 'HR/QA or Dean', description: 'Manage system & release', color: '#ef4444' }
];

export const sadFlowSequences: Record<SADClientType, SADFlowStep[]> = {
  student: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'student-client', connectionId: 'c1', description: 'Student accesses web interface' },
    { componentId: 'load-balancer', connectionId: 'c4', description: 'Request routed through load balancer' },
    { componentId: 'web-server', description: 'Static assets served' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles evaluation request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Authentication & session created' },
    { componentId: 'session-store', description: 'Session stored' },
    { componentId: 'evaluation-service', connectionId: 'c8', description: 'Evaluation processed' },
    { componentId: 'pii-redaction-service', connectionId: 'c14', description: 'PII redacted for privacy' },
    { componentId: 'postgresql', description: 'Evaluation data saved' }
  ],
  faculty: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'faculty-client', connectionId: 'c2', description: 'Faculty accesses web interface' },
    { componentId: 'load-balancer', connectionId: 'c5', description: 'Request routed through load balancer' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Authentication verified' },
    { componentId: 'session-store', description: 'Session validated' },
    { componentId: 'evaluation-service', connectionId: 'c9', description: 'Evaluation results retrieved' },
    { componentId: 'postgresql', connectionId: 'c11', description: 'Data queried from database' },
    { componentId: 'tna-engine', connectionId: 'c12', description: 'TNA insights computed' },
    { componentId: 'postgresql', description: 'Results returned to faculty' }
  ],
  admin: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'admin-client', connectionId: 'c3', description: 'Admin accesses web interface' },
    { componentId: 'load-balancer', connectionId: 'c5', description: 'Request routed through load balancer' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles admin request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Admin authentication' },
    { componentId: 'session-store', description: 'Admin session created' },
    { componentId: 'evaluation-service', connectionId: 'c9', description: 'System management operations' },
    { componentId: 'postgresql', connectionId: 'c13', description: 'Admin data operations' },
    { componentId: 'audit-log', description: 'All actions logged for compliance' },
    { componentId: 'tna-engine', description: 'System analytics & reporting' }
  ]
};

export const components: SADComponent[] = [
  {
    id: 'client-entry',
    label: 'Client',
    description: 'Entry point - click to select client type',
    type: 'external',
    x: -1000,
    y: 0,
    color: '#06b6d4',
    tourOrder: 0
  },
  {
    id: 'student-client',
    label: 'Student Client',
    description: 'Web browser interface for students',
    type: 'frontend',
    x: -800,
    y: -200,
    color: '#3b82f6',
    tourOrder: 1
  },
  {
    id: 'faculty-client',
    label: 'Faculty Client',
    description: 'Web browser interface for faculty',
    type: 'frontend',
    x: -800,
    y: 0,
    color: '#8b5cf6',
    tourOrder: 2
  },
  {
    id: 'admin-client',
    label: 'Admin Client',
    description: 'Web browser interface for HR/QA and Dean',
    type: 'frontend',
    x: -800,
    y: 200,
    color: '#ef4444',
    tourOrder: 3
  },
  {
    id: 'load-balancer',
    label: 'Load Balancer',
    description: 'Distributes traffic across servers',
    type: 'service',
    x: -400,
    y: 0,
    color: '#f59e0b',
    tourOrder: 4
  },
  {
    id: 'web-server',
    label: 'Web Server',
    description: 'Serves static assets and handles requests',
    type: 'backend',
    x: 0,
    y: -200,
    color: '#10b981',
    tourOrder: 5
  },
  {
    id: 'api-server',
    label: 'API Server',
    description: 'Node.js/Express REST API',
    type: 'backend',
    x: 0,
    y: 0,
    color: '#06b6d4',
    tourOrder: 6
  },
  {
    id: 'auth-service',
    label: 'Auth Service',
    description: 'Authentication & session management',
    type: 'service',
    x: 0,
    y: 200,
    color: '#ec4899',
    tourOrder: 7
  },
  {
    id: 'evaluation-service',
    label: 'Evaluation Service',
    description: 'Handles evaluation submissions and processing',
    type: 'service',
    x: 400,
    y: -200,
    color: '#14b8a6',
    tourOrder: 8
  },
  {
    id: 'pii-redaction-service',
    label: 'PII Redaction Service',
    description: 'Automated PII detection and redaction',
    type: 'service',
    x: 400,
    y: 0,
    color: '#f43f5e',
    tourOrder: 9
  },
  {
    id: 'tna-engine',
    label: 'TNA Engine',
    description: 'Training Needs Analysis computation',
    type: 'service',
    x: 400,
    y: 200,
    color: '#8b5cf6',
    tourOrder: 10
  },
  {
    id: 'postgresql',
    label: 'PostgreSQL',
    description: 'Primary relational database',
    type: 'database',
    x: 800,
    y: -100,
    color: '#6366f1',
    tourOrder: 11
  },
  {
    id: 'audit-log',
    label: 'Audit Log',
    description: 'Append-only audit trail storage',
    type: 'database',
    x: 800,
    y: 100,
    color: '#475569',
    tourOrder: 12
  },
  {
    id: 'session-store',
    label: 'Session Store',
    description: 'In-memory session management',
    type: 'database',
    x: 800,
    y: 300,
    color: '#0ea5e9',
    tourOrder: 13
  }
];

export const connections: SADConnection[] = [
  {
    id: 'c1',
    from: 'student-client',
    to: 'load-balancer',
    label: 'HTTPS',
    protocol: 'HTTPS',
    description: 'Student requests'
  },
  {
    id: 'c2',
    from: 'faculty-client',
    to: 'load-balancer',
    label: 'HTTPS',
    protocol: 'HTTPS',
    description: 'Faculty requests'
  },
  {
    id: 'c3',
    from: 'admin-client',
    to: 'load-balancer',
    label: 'HTTPS',
    protocol: 'HTTPS',
    description: 'Admin requests'
  },
  {
    id: 'c4',
    from: 'load-balancer',
    to: 'web-server',
    label: 'HTTP',
    protocol: 'HTTP',
    description: 'Static assets'
  },
  {
    id: 'c5',
    from: 'load-balancer',
    to: 'api-server',
    label: 'HTTP',
    protocol: 'HTTP',
    description: 'API requests'
  },
  {
    id: 'c6',
    from: 'api-server',
    to: 'auth-service',
    label: 'Internal',
    protocol: 'Internal',
    description: 'Authentication calls'
  },
  {
    id: 'c7',
    from: 'api-server',
    to: 'evaluation-service',
    label: 'Internal',
    protocol: 'Internal',
    description: 'Evaluation operations'
  },
  {
    id: 'c8',
    from: 'evaluation-service',
    to: 'pii-redaction-service',
    label: 'Internal',
    protocol: 'Internal',
    description: 'PII redaction requests'
  },
  {
    id: 'c9',
    from: 'evaluation-service',
    to: 'postgresql',
    label: 'TCP',
    protocol: 'TCP/5432',
    description: 'Database queries'
  },
  {
    id: 'c10',
    from: 'auth-service',
    to: 'session-store',
    label: 'Internal',
    protocol: 'Internal',
    description: 'Session management'
  },
  {
    id: 'c11',
    from: 'api-server',
    to: 'tna-engine',
    label: 'Internal',
    protocol: 'Internal',
    description: 'TNA computations'
  },
  {
    id: 'c12',
    from: 'tna-engine',
    to: 'postgresql',
    label: 'TCP',
    protocol: 'TCP/5432',
    description: 'TNA data storage'
  },
  {
    id: 'c13',
    from: 'api-server',
    to: 'audit-log',
    label: 'TCP',
    protocol: 'TCP/5432',
    description: 'Audit trail writes'
  },
  {
    id: 'c14',
    from: 'pii-redaction-service',
    to: 'postgresql',
    label: 'TCP',
    protocol: 'TCP/5432',
    description: 'Redacted data storage'
  }
];
