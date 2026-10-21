export type AttributeType = 'string' | 'number' | 'date' | 'boolean' | 'uuid' | 'json' | 'enum';

export interface ERDAttribute {
  name: string;
  type: AttributeType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
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
  tourOrder?: number;
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
    x: -286.02,
    y: -255.79,
    color: '#3b82f6',
    tourOrder: 1,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'institutional_id', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'email', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'password_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'role', type: 'enum', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_active', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'created_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'academic_terms',
    label: 'academic_terms',
    description: 'Semesters/quarters',
    x: 207.32,
    y: -302.53,
    color: '#10b981',
    tourOrder: 6,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'name', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'start_date', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'end_date', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_active', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_released', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'evaluation_criteria',
    label: 'evaluation_criteria',
    description: 'Evaluation domains',
    x: 582.38,
    y: 245.53,
    color: '#8b5cf6',
    tourOrder: 5,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'domain', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'criterion', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'weight', type: 'number', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_active', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'evaluations',
    label: 'evaluations',
    description: 'Student evaluations',
    x: -606.00,
    y: 480.96,
    color: '#ef4444',
    tourOrder: 3,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'student_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'faculty_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'term_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'academic_terms', isRequired: true },
      { name: 'feedback_text', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: false },
      { name: 'submitted_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'is_released', type: 'boolean', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'evaluation_ratings',
    label: 'evaluation_ratings',
    description: 'Criterion ratings',
    x: 63.00,
    y: 247.43,
    color: '#f59e0b',
    tourOrder: 4,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'evaluation_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'evaluations', isRequired: true },
      { name: 'criterion_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'evaluation_criteria', isRequired: true },
      { name: 'rating', type: 'number', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'tna_snapshots',
    label: 'tna_snapshots',
    description: 'TNA results',
    x: 107.61,
    y: 511.06,
    color: '#14b8a6',
    tourOrder: 7,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'faculty_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'term_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'academic_terms', isRequired: true },
      { name: 'insights', type: 'json', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'input_fingerprint', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'created_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'audit_logs',
    label: 'audit_logs',
    description: 'Audit trail',
    x: -834.63,
    y: 22.70,
    color: '#6366f1',
    tourOrder: 9,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'action', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'entity_type', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'entity_id', type: 'uuid', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'user_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'prev_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'created_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'sessions',
    label: 'sessions',
    description: 'Active sessions',
    x: -845.99,
    y: -255.02,
    color: '#475569',
    tourOrder: 2,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'user_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'token_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'expires_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'last_active_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  },
  {
    id: 'release_signatures',
    label: 'release_signatures',
    description: 'E-signatures',
    x: -248.41,
    y: 515.37,
    color: '#ec4899',
    tourOrder: 8,
    attributes: [
      { name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isRequired: true },
      { name: 'term_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'academic_terms', isRequired: true },
      { name: 'signed_by', type: 'uuid', isPrimaryKey: false, isForeignKey: true, references: 'users', isRequired: true },
      { name: 'tracking_id', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'document_hash', type: 'string', isPrimaryKey: false, isForeignKey: false, isRequired: true },
      { name: 'signed_at', type: 'date', isPrimaryKey: false, isForeignKey: false, isRequired: true }
    ]
  }
];

export const relationships: ERDRelationship[] = [
  { id: 'r1', from: 'users', to: 'evaluations', fromCardinality: '1', toCardinality: 'N', label: 'submits_as_student', description: 'Student submits', isOptional: false },
  { id: 'r2', from: 'users', to: 'evaluations', fromCardinality: '1', toCardinality: 'N', label: 'evaluated_as_faculty', description: 'Faculty evaluated', isOptional: false },
  { id: 'r3', from: 'academic_terms', to: 'evaluations', fromCardinality: '1', toCardinality: 'N', label: 'has_evaluations', description: 'Term evaluations', isOptional: false },
  { id: 'r4', from: 'evaluations', to: 'evaluation_ratings', fromCardinality: '1', toCardinality: 'N', label: 'has_ratings', description: 'Evaluation ratings', isOptional: false },
  { id: 'r5', from: 'evaluation_criteria', to: 'evaluation_ratings', fromCardinality: '1', toCardinality: 'N', label: 'rated_in', description: 'Criteria rated', isOptional: false },
  { id: 'r6', from: 'users', to: 'tna_snapshots', fromCardinality: '1', toCardinality: 'N', label: 'has_tna', description: 'Faculty TNA', isOptional: false },
  { id: 'r7', from: 'academic_terms', to: 'tna_snapshots', fromCardinality: '1', toCardinality: 'N', label: 'term_tna', description: 'Term TNA', isOptional: false },
  { id: 'r8', from: 'users', to: 'audit_logs', fromCardinality: '1', toCardinality: 'N', label: 'performed_actions', description: 'User actions', isOptional: false },
  { id: 'r9', from: 'users', to: 'sessions', fromCardinality: '1', toCardinality: 'N', label: 'has_sessions', description: 'User sessions', isOptional: false },
  { id: 'r10', from: 'academic_terms', to: 'release_signatures', fromCardinality: '1', toCardinality: 'N', label: 'has_signatures', description: 'Term signatures', isOptional: true },
  { id: 'r11', from: 'users', to: 'release_signatures', fromCardinality: '1', toCardinality: 'N', label: 'signed_by', description: 'Signed by', isOptional: false }
];

export const attributeTypeColors: Record<AttributeType, string> = {
  string: '#3b82f6',
  number: '#10b981',
  date: '#f59e0b',
  boolean: '#8b5cf6',
  uuid: '#06b6d4',
  json: '#ec4899',
  enum: '#ef4444'
};
