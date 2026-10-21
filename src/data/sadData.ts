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
  { id: 'faculty', label: 'Faculty', description: 'View results', color: '#8b5cf6' },
  { id: 'hr_qa', label: 'HR/QA', description: 'Manage system', color: '#ef4444' },
  { id: 'dean', label: 'Dean', description: 'Oversight', color: '#f59e0b' }
];

export const sadFlowSequences: Record<SADClientType, SADFlowStep[]> = {
  student: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'student-client', connectionId: 'c1', description: 'Student accesses web interface' },
    { componentId: 'load-balancer', connectionId: 'c4', description: 'Request routed' },
    { componentId: 'web-server', connectionId: 'c20', description: 'Static assets' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Authentication' },
    { componentId: 'session-store', connectionId: 'c16', description: 'Session stored' },
    { componentId: 'evaluation-service', connectionId: 'c8', description: 'Evaluation processed' },
    { componentId: 'pii-redaction-service', connectionId: 'c14', description: 'PII redacted' },
    { componentId: 'postgresql', description: 'Data saved' }
  ],
  faculty: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'faculty-client', connectionId: 'c2', description: 'Faculty accesses interface' },
    { componentId: 'load-balancer', connectionId: 'c5', description: 'Request routed' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Authentication' },
    { componentId: 'session-store', connectionId: 'c16', description: 'Session validated' },
    { componentId: 'evaluation-service', connectionId: 'c9', description: 'Results retrieved' },
    { componentId: 'postgresql', connectionId: 'c11', description: 'Data queried' },
    { componentId: 'tna-engine', connectionId: 'c12', description: 'TNA computed' },
    { componentId: 'postgresql', description: 'Results returned' }
  ],
  hr_qa: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'hr-qa-client', connectionId: 'c3', description: 'HR/QA accesses interface' },
    { componentId: 'load-balancer', connectionId: 'c5', description: 'Request routed' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Authentication' },
    { componentId: 'session-store', connectionId: 'c16', description: 'Session created' },
    { componentId: 'evaluation-service', connectionId: 'c8', description: 'Manage evaluations' },
    { componentId: 'pii-redaction-service', connectionId: 'c14', description: 'Verify PII' },
    { componentId: 'postgresql', connectionId: 'c18', description: 'Update data' },
    { componentId: 'audit-log', description: 'Actions logged' }
  ],
  dean: [
    { componentId: 'client-entry', description: 'Entry point' },
    { componentId: 'dean-client', connectionId: 'c15', description: 'Dean accesses interface' },
    { componentId: 'load-balancer', connectionId: 'c5', description: 'Request routed' },
    { componentId: 'api-server', connectionId: 'c6', description: 'API handles request' },
    { componentId: 'auth-service', connectionId: 'c10', description: 'Authentication' },
    { componentId: 'session-store', connectionId: 'c17', description: 'Session created' },
    { componentId: 'tna-engine', connectionId: 'c12', description: 'Analytics generated' },
    { componentId: 'postgresql', description: 'Data queried' },
    { componentId: 'evaluation-service', connectionId: 'c19', description: 'View summaries' },
    { componentId: 'audit-log', description: 'Access logged' }
  ]
};

export const components: SADComponent[] = [
  { id: 'client-entry', label: 'Client', description: 'Entry point', type: 'external', x: -1000, y: 0, color: '#06b6d4', tourOrder: 0 },
  { id: 'student-client', label: 'Student Client', description: 'Student interface', type: 'frontend', x: -800, y: -200, color: '#3b82f6', tourOrder: 1 },
  { id: 'faculty-client', label: 'Faculty Client', description: 'Faculty interface', type: 'frontend', x: -800, y: 0, color: '#8b5cf6', tourOrder: 2 },
  { id: 'hr-qa-client', label: 'HR/QA Client', description: 'Admin interface', type: 'frontend', x: -800, y: 150, color: '#ef4444', tourOrder: 3 },
  { id: 'dean-client', label: 'Dean Client', description: 'Analytics interface', type: 'frontend', x: -800, y: 300, color: '#f59e0b', tourOrder: 4 },
  { id: 'load-balancer', label: 'Load Balancer', description: 'Traffic distribution', type: 'service', x: -400, y: 0, color: '#f59e0b', tourOrder: 5 },
  { id: 'web-server', label: 'Web Server', description: 'Static assets', type: 'backend', x: 0, y: -200, color: '#10b981', tourOrder: 6 },
  { id: 'api-server', label: 'API Server', description: 'REST API', type: 'backend', x: 0, y: 0, color: '#06b6d4', tourOrder: 7 },
  { id: 'auth-service', label: 'Auth Service', description: 'Authentication', type: 'service', x: 0, y: 200, color: '#ec4899', tourOrder: 8 },
  { id: 'evaluation-service', label: 'Evaluation Service', description: 'Evaluation processing', type: 'service', x: 400, y: -200, color: '#14b8a6', tourOrder: 9 },
  { id: 'pii-redaction-service', label: 'PII Redaction', description: 'Privacy protection', type: 'service', x: 400, y: 0, color: '#f43f5e', tourOrder: 10 },
  { id: 'tna-engine', label: 'TNA Engine', description: 'Training analysis', type: 'service', x: 400, y: 200, color: '#8b5cf6', tourOrder: 11 },
  { id: 'postgresql', label: 'PostgreSQL', description: 'Primary database', type: 'database', x: 800, y: -100, color: '#6366f1', tourOrder: 12 },
  { id: 'audit-log', label: 'Audit Log', description: 'Audit trail', type: 'database', x: 800, y: 100, color: '#475569', tourOrder: 13 },
  { id: 'session-store', label: 'Session Store', description: 'Session management', type: 'database', x: 800, y: 300, color: '#0ea5e9', tourOrder: 14 }
];

export const connections: SADConnection[] = [
  { id: 'c1', from: 'student-client', to: 'load-balancer', label: 'HTTPS', protocol: 'HTTPS', description: 'Student requests' },
  { id: 'c2', from: 'faculty-client', to: 'load-balancer', label: 'HTTPS', protocol: 'HTTPS', description: 'Faculty requests' },
  { id: 'c3', from: 'hr-qa-client', to: 'load-balancer', label: 'HTTPS', protocol: 'HTTPS', description: 'HR/QA requests' },
  { id: 'c15', from: 'dean-client', to: 'load-balancer', label: 'HTTPS', protocol: 'HTTPS', description: 'Dean requests' },
  { id: 'c4', from: 'load-balancer', to: 'web-server', label: 'HTTP', protocol: 'HTTP', description: 'Static assets' },
  { id: 'c5', from: 'load-balancer', to: 'api-server', label: 'HTTP', protocol: 'HTTP', description: 'API requests' },
  { id: 'c6', from: 'api-server', to: 'auth-service', label: 'Internal', protocol: 'Internal', description: 'Auth calls' },
  { id: 'c7', from: 'api-server', to: 'evaluation-service', label: 'Internal', protocol: 'Internal', description: 'Evaluation ops' },
  { id: 'c8', from: 'evaluation-service', to: 'pii-redaction-service', label: 'Internal', protocol: 'Internal', description: 'PII redaction' },
  { id: 'c9', from: 'evaluation-service', to: 'postgresql', label: 'TCP', protocol: 'TCP/5432', description: 'DB queries' },
  { id: 'c10', from: 'auth-service', to: 'session-store', label: 'Internal', protocol: 'Internal', description: 'Session mgmt' },
  { id: 'c11', from: 'api-server', to: 'tna-engine', label: 'Internal', protocol: 'Internal', description: 'TNA ops' },
  { id: 'c12', from: 'tna-engine', to: 'postgresql', label: 'TCP', protocol: 'TCP/5432', description: 'TNA storage' },
  { id: 'c13', from: 'api-server', to: 'audit-log', label: 'TCP', protocol: 'TCP/5432', description: 'Audit writes' },
  { id: 'c14', from: 'pii-redaction-service', to: 'postgresql', label: 'TCP', protocol: 'TCP/5432', description: 'Redacted data' },
  { id: 'c16', from: 'session-store', to: 'evaluation-service', label: 'Internal', protocol: 'Internal', description: 'Session validation' },
  { id: 'c17', from: 'session-store', to: 'tna-engine', label: 'Internal', protocol: 'Internal', description: 'Session validation' },
  { id: 'c18', from: 'postgresql', to: 'audit-log', label: 'TCP', protocol: 'TCP/5432', description: 'Audit trail' },
  { id: 'c19', from: 'evaluation-service', to: 'audit-log', label: 'TCP', protocol: 'TCP/5432', description: 'Audit logging' },
  { id: 'c20', from: 'web-server', to: 'api-server', label: 'HTTP', protocol: 'HTTP', description: 'Request forwarding' }
];
