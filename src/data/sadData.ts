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

export type SADClientType = 'student' | 'faculty' | 'hr_qa' | 'dean';

export interface SADFlowStep {
  componentId: string;
  connectionId?: string;
  description: string;
}

export const sadClientTypes: { id: SADClientType; label: string; description: string; color: string }[] = [
  { id: 'student', label: 'Student', description: 'Submit evaluations', color: '#3b82f6' },
  { id: 'faculty', label: 'Faculty', description: 'View evaluation results', color: '#8b5cf6' },
  { id: 'hr_qa', label: 'HR/QA', description: 'Manage system & release evaluations', color: '#ef4444' },
  { id: 'dean', label: 'Dean', description: 'Oversight & analytics', color: '#f59e0b' }
];

export const sadFlowSequences: Record<SADClientType, SADFlowStep[]> = {
  student: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'student-client', connectionId: 'c1', description: 'Student accesses web interface' },
    { componentId: 'load-balancer', connectionId: 'c4', description: 'Request routed through load balancer' },
    { componentId: 'web-server', connectionId: 'c20', description: 'Static assets served, forwards to API' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles evaluation request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Authentication & session created' },
    { componentId: 'session-store', connectionId: 'c16', description: 'Session stored, validates for evaluation' },
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
    { componentId: 'session-store', connectionId: 'c16', description: 'Session validated for evaluation access' },
    { componentId: 'evaluation-service', connectionId: 'c9', description: 'Evaluation results retrieved' },
    { componentId: 'postgresql', connectionId: 'c11', description: 'Data queried from database' },
    { componentId: 'tna-engine', connectionId: 'c12', description: 'TNA insights computed' },
    { componentId: 'postgresql', description: 'Results returned to faculty' }
  ],
  hr_qa: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'hr-qa-client', connectionId: 'c3', description: 'HR/QA accesses admin interface' },
    { componentId: 'load-balancer', connectionId: 'c5', description: 'Request routed through load balancer' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles admin request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'HR/QA authentication' },
    { componentId: 'session-store', connectionId: 'c16', description: 'Admin session created, validates for evaluation' },
    { componentId: 'evaluation-service', connectionId: 'c8', description: 'Manage evaluations & criteria' },
    { componentId: 'pii-redaction-service', connectionId: 'c14', description: 'Verify PII redaction' },
    { componentId: 'postgresql', connectionId: 'c18', description: 'Update evaluation data, triggers audit' },
    { componentId: 'audit-log', description: 'All admin actions logged' }
  ],
  dean: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'dean-client', connectionId: 'c15', description: 'Dean accesses analytics interface' },
    { componentId: 'load-balancer', connectionId: 'c5', description: 'Request routed through load balancer' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles analytics request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Dean authentication' },
    { componentId: 'session-store', connectionId: 'c17', description: 'Dean session created, validates for analytics' },
    { componentId: 'tna-engine', connectionId: 'c12', description: 'Generate department analytics' },
    { componentId: 'postgresql', description: 'Query aggregated data' },
    { componentId: 'evaluation-service', connectionId: 'c19', description: 'View evaluation summaries, logs access' },
    { componentId: 'audit-log', description: 'Access logged for compliance' }
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
    id: 'hr-qa-client',
    label: 'HR/QA Client',
    description: 'Web interface for system management',
    type: 'frontend',
    x: -800,
    y: 150,
    color: '#ef4444',
    tourOrder: 3
  },
  {
    id: 'dean-client',
    label: 'Dean Client',
    description: 'Web interface for oversight & analytics',
    type: 'frontend',
    x: -800,
    y: 300,
    color: '#f59e0b',
    tourOrder: 4
  },
  {
    id: 'load-balancer',
    label: 'Load Balancer',
    description: 'Distributes traffic across servers',
    type: 'service',
    x: -400,
    y: 0,
    color: '#f59e0b',
    tourOrder: 5
  },
  {
    id: 'web-server',
    label: 'Web Server',
    description: 'Serves static assets and handles requests',
    type: 'backend',
    x: 0,
    y: -200,
    color: '#10b981',
    tourOrder: 6
  },
  {
    id: 'api-server',
    label: 'API Server',
    description: 'Node.js/Express REST API',
    type: 'backend',
    x: 0,
    y: 0,
    color: '#06b6d4',
    tourOrder: 7
  },
  {
    id: 'auth-service',
    label: 'Auth Service',
    description: 'Authentication & session management',
    type: 'service',
    x: 0,
    y: 200,
    color: '#ec4899',
    tourOrder: 8
  },
  {
    id: 'evaluation-service',
    label: 'Evaluation Service',
    description: 'Handles evaluation submissions and processing',
    type: 'service',
    x: 400,
    y: -200,
    color: '#14b8a6',
    tourOrder: 9
  },
  {
    id: 'pii-redaction-service',
    label: 'PII Redaction Service',
    description: 'Automated PII detection and redaction',
    type: 'service',
    x: 400,
    y: 0,
    color: '#f43f5e',
    tourOrder: 10
  },
  {
    id: 'tna-engine',
    label: 'TNA Engine',
    description: 'Training Needs Analysis computation',
    type: 'service',
    x: 400,
    y: 200,
    color: '#8b5cf6',
    tourOrder: 11
  },
  {
    id: 'postgresql',
    label: 'PostgreSQL',
    description: 'Primary relational database',
    type: 'database',
    x: 800,
    y: -100,
    color: '#6366f1',
    tourOrder: 12
  },
  {
    id: 'audit-log',
    label: 'Audit Log',
    description: 'Append-only audit trail storage',
    type: 'database',
    x: 800,
    y: 100,
    color: '#475569',
    tourOrder: 13
  },
  {
    id: 'session-store',
    label: 'Session Store',
    description: 'In-memory session management',
    type: 'database',
    x: 800,
    y: 300,
    color: '#0ea5e9',
    tourOrder: 14
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
    from: 'hr-qa-client',
    to: 'load-balancer',
    label: 'HTTPS',
    protocol: 'HTTPS',
    description: 'HR/QA requests'
  },
  {
    id: 'c15',
    from: 'dean-client',
    to: 'load-balancer',
    label: 'HTTPS',
    protocol: 'HTTPS',
    description: 'Dean requests'
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
  },
  {
    id: 'c16',
    from: 'session-store',
    to: 'evaluation-service',
    label: 'Internal',
    protocol: 'Internal',
    description: 'Session validation for evaluations'
  },
  {
    id: 'c17',
    from: 'session-store',
    to: 'tna-engine',
    label: 'Internal',
    protocol: 'Internal',
    description: 'Session validation for analytics'
  },
  {
    id: 'c18',
    from: 'postgresql',
    to: 'audit-log',
    label: 'TCP',
    protocol: 'TCP/5432',
    description: 'Audit trail from database operations'
  },
  {
    id: 'c19',
    from: 'evaluation-service',
    to: 'audit-log',
    label: 'TCP',
    protocol: 'TCP/5432',
    description: 'Evaluation actions logged'
  },
  {
    id: 'c20',
    from: 'web-server',
    to: 'api-server',
    label: 'HTTP',
    protocol: 'HTTP',
    description: 'Dynamic request forwarding'
  }
];
