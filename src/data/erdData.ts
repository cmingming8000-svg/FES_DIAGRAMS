export type AttributeType = 'string' | 'number' | 'date' | 'boolean' | 'uuid' | 'json' | 'enum';

export interface ERDAttribute {
  name: string;
  type: AttributeType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string; // Entity ID this FK points to
  isRequired: boolean;
  description?: string;
}

export interface ERDEntity {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  color: string;
  attributes: ERDAttribute[];
}

export interface ERDRelationship {
  id: string;
  from: string;
  to: string;
  fromCardinality: '1' | 'N';
  toCardinality: '1' | 'N';
  label: string;
  description: string;
  isOptional: boolean;
}

export const entities: ERDEntity[] = [
  {
    id: 'users',
    label: 'users',
    description: 'System users with role-based access',
    x: 100,
    y: 100,
    color: '#3b82f6',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true, description: 'Primary key' },
      { name: 'institutional_id', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'e.g., C24-001, M001' },
      { name: 'email', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'password_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'Argon2id hash' },
      { name: 'role', type: 'enum', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'student | faculty | hr_qa | dean' },
      { name: 'is_active', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'created_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
  {
    id: 'academic_terms',
    label: 'academic_terms',
    description: 'Semesters/quarters for evaluations',
    x: 500,
    y: 100,
    color: '#10b981',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'name', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'e.g., "Fall 2024"' },
      { name: 'start_date', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'end_date', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_active', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_released', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
  {
    id: 'evaluation_criteria',
    label: 'evaluation_criteria',
    description: 'Evaluation domains and criteria',
    x: 900,
    y: 100,
    color: '#8b5cf6',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'domain', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'Teaching, Assessment, etc.' },
      { name: 'criterion', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'weight', type: 'number', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_active', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
  {
    id: 'evaluations',
    label: 'evaluations',
    description: 'Student evaluations of faculty',
    x: 300,
    y: 450,
    color: '#ef4444',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'student_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'faculty_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'term_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'academic_terms', isRequired: true },
      { name: 'feedback_text', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: false, description: 'PII-redacted' },
      { name: 'submitted_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_released', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
  {
    id: 'evaluation_ratings',
    label: 'evaluation_ratings',
    description: 'Individual criterion ratings',
    x: 700,
    y: 450,
    color: '#f59e0b',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'evaluation_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'evaluations', isRequired: true },
      { name: 'criterion_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'evaluation_criteria', isRequired: true },
      { name: 'rating', type: 'number', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: '1-5 scale' },
    ]
  },
  {
    id: 'tna_snapshots',
    label: 'tna_snapshots',
    description: 'Training Needs Analysis results',
    x: 1100,
    y: 450,
    color: '#14b8a6',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'faculty_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'term_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'academic_terms', isRequired: true },
      { name: 'insights', type: 'json', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'input_fingerprint', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'created_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
  {
    id: 'audit_logs',
    label: 'audit_logs',
    description: 'Immutable audit trail (append-only)',
    x: 100,
    y: 800,
    color: '#6366f1',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'action', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'entity_type', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'entity_id', type: 'uuid', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'user_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'prev_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'SHA-256 hash chain' },
      { name: 'hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'created_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
  {
    id: 'sessions',
    label: 'sessions',
    description: 'Active user sessions',
    x: 500,
    y: 800,
    color: '#475569',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'user_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'token_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'SHA-256 of opaque token' },
      { name: 'expires_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'last_active_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
  {
    id: 'release_signatures',
    label: 'release_signatures',
    description: 'HR/QA e-signatures for releases',
    x: 900,
    y: 800,
    color: '#ec4899',
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'term_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'academic_terms', isRequired: true },
      { name: 'signed_by', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'tracking_id', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'FES-[timestamp]-[hash]' },
      { name: 'document_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true, description: 'SHA-256' },
      { name: 'signed_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
    ]
  },
];

export const relationships: ERDRelationship[] = [
  {
    id: 'r1',
    from: 'users',
    to: 'evaluations',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'submits_as_student',
    description: 'Student submits evaluations',
    isOptional: false,
  },
  {
    id: 'r2',
    from: 'users',
    to: 'evaluations',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'evaluated_as_faculty',
    description: 'Faculty receives evaluations',
    isOptional: false,
  },
  {
    id: 'r3',
    from: 'academic_terms',
    to: 'evaluations',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'has_evaluations',
    description: 'Term contains evaluations',
    isOptional: false,
  },
  {
    id: 'r4',
    from: 'evaluations',
    to: 'evaluation_ratings',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'has_ratings',
    description: 'Evaluation contains criterion ratings',
    isOptional: false,
  },
  {
    id: 'r5',
    from: 'evaluation_criteria',
    to: 'evaluation_ratings',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'rated_in',
    description: 'Criterion is rated in evaluations',
    isOptional: false,
  },
  {
    id: 'r6',
    from: 'users',
    to: 'tna_snapshots',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'has_tna',
    description: 'Faculty has TNA snapshots',
    isOptional: false,
  },
  {
    id: 'r7',
    from: 'academic_terms',
    to: 'tna_snapshots',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'term_tna',
    description: 'Term has TNA snapshots',
    isOptional: false,
  },
  {
    id: 'r8',
    from: 'users',
    to: 'audit_logs',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'performed_actions',
    description: 'User actions logged',
    isOptional: false,
  },
  {
    id: 'r9',
    from: 'users',
    to: 'sessions',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'has_sessions',
    description: 'User has active sessions',
    isOptional: false,
  },
  {
    id: 'r10',
    from: 'academic_terms',
    to: 'release_signatures',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'has_signatures',
    description: 'Term has release signatures',
    isOptional: true,
  },
  {
    id: 'r11',
    from: 'users',
    to: 'release_signatures',
    fromCardinality: '1',
    toCardinality: 'N',
    label: 'signed_by',
    description: 'HR/QA signed release',
    isOptional: false,
  },
];

export const attributeTypeColors: Record<AttributeType, string> = {
  string: '#3b82f6',
  number: '#10b981',
  date: '#f59e0b',
  boolean: '#8b5cf6',
  uuid: '#06b6d4',
  json: '#ec4899',
  enum: '#ef4444',
};
