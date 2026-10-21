# Entity Relationship Diagram (ERD) Features

## Overview
The ERD view provides an interactive database schema visualization with all the modern interaction patterns from the DFD view, adapted for entity-relationship exploration.

## Implemented Features

### ✅ Core Interaction Features (from DFD)

1. **Draggable Entities**
   - Click and drag any entity to reposition it
   - Positions are independent per view mode
   - Smooth drag interactions with GPU acceleration

2. **Zoom & Pan**
   - Mouse wheel to zoom in/out
   - Click and drag on empty space to pan
   - Zoom controls in top-right corner
   - Zoom percentage indicator
   - Reset view button

3. **Position Saving**
   - Press `Ctrl+Shift+Space` to save entity positions
   - Downloads JSON file with positions
   - Shows modal with copyable JSON
   - Share with assistant to make permanent

4. **Entity Selection & Highlighting**
   - Click entity to select it
   - Related entities are highlighted
   - Unrelated entities are dimmed
   - Smooth transitions between states

5. **Info Panel**
   - Shows entity details when selected
   - Displays all attributes with types
   - Shows PK/FK indicators
   - Lists all relationships
   - Color-coded by attribute type

6. **Performance Optimizations**
   - React.memo for component optimization
   - useMemo for expensive calculations
   - Throttled mouse events (60fps)
   - GPU acceleration hints
   - No expensive SVG filters

### 🎯 ERD-Specific Features

1. **Entity Visualization**
   - Color-coded entity headers
   - Attribute list with type indicators
   - Primary Key (PK) markers in amber
   - Foreign Key (FK) markers in cyan
   - Attribute type color coding:
     - String: Blue
     - Number: Green
     - Date: Yellow
     - Boolean: Purple
     - UUID: Cyan
     - JSON: Pink
     - Enum: Red

2. **Relationship Visualization**
   - Curved connection lines between entities
   - Cardinality markers (1, N) at both ends
   - Relationship labels on connections
   - Highlighted when related entity is selected
   - Dimmed when unrelated

3. **Relationship Details**
   - Shows relationship name
   - Displays cardinality (1:1, 1:N, N:N)
   - Indicates direction (→ or ←)
   - Marks optional relationships
   - Links to related entities

4. **Attribute Type System**
   - Visual color coding for each type
   - Type badges with background colors
   - Consistent color scheme across all entities
   - Easy to identify data types at a glance

## Database Schema (FES System)

### Entities (9 total)

1. **users** - System users with role-based access
   - Attributes: id, institutional_id, email, password_hash, role, is_active, created_at

2. **academic_terms** - Semesters/quarters for evaluations
   - Attributes: id, name, start_date, end_date, is_active, is_released

3. **evaluation_criteria** - Evaluation domains and criteria
   - Attributes: id, domain, criterion, weight, is_active

4. **evaluations** - Student evaluations of faculty
   - Attributes: id, student_id (FK), faculty_id (FK), term_id (FK), feedback_text, submitted_at, is_released

5. **evaluation_ratings** - Individual criterion ratings
   - Attributes: id, evaluation_id (FK), criterion_id (FK), rating

6. **tna_snapshots** - Training Needs Analysis results
   - Attributes: id, faculty_id (FK), term_id (FK), insights, input_fingerprint, created_at

7. **audit_logs** - Immutable audit trail (append-only)
   - Attributes: id, action, entity_type, entity_id, user_id (FK), prev_hash, hash, created_at

8. **sessions** - Active user sessions
   - Attributes: id, user_id (FK), token_hash, expires_at, last_active_at

9. **release_signatures** - HR/QA e-signatures for releases
   - Attributes: id, term_id (FK), signed_by (FK), tracking_id, document_hash, signed_at

### Relationships (11 total)

1. users → evaluations (1:N) - submits_as_student
2. users → evaluations (1:N) - evaluated_as_faculty
3. academic_terms → evaluations (1:N) - has_evaluations
4. evaluations → evaluation_ratings (1:N) - has_ratings
5. evaluation_criteria → evaluation_ratings (1:N) - rated_in
6. users → tna_snapshots (1:N) - has_tna
7. academic_terms → tna_snapshots (1:N) - term_tna
8. users → audit_logs (1:N) - performed_actions
9. users → sessions (1:N) - has_sessions
10. academic_terms → release_signatures (1:N) - has_signatures (optional)
11. users → release_signatures (1:N) - signed_by

## Usage Guide

### Viewing the Schema
1. Switch to ERD mode using the dropdown in the header
2. All entities are displayed with their attributes
3. Relationships are shown as curved lines with cardinality markers

### Exploring Relationships
1. Click any entity to select it
2. Related entities are highlighted
3. Info panel shows all relationships for that entity
4. Click another entity to explore its relationships

### Customizing Layout
1. Drag entities to arrange them logically
2. Group related entities together
3. Use zoom/pan to navigate large schemas
4. Save positions with `Ctrl+Shift+Space`

### Understanding the Visualization
- **Entity Headers**: Color-coded by entity type
- **PK Markers**: Amber "PK" indicates primary key
- **FK Markers**: Cyan "FK" indicates foreign key
- **Attribute Types**: Color-coded for quick identification
- **Relationship Lines**: Show data flow direction
- **Cardinality**: 1 or N markers at line ends

## Technical Implementation

### Performance
- No SVG filters (unlike early DFD versions)
- Text labels instead of icon components
- Throttled mouse events
- GPU-accelerated transforms
- Memoized calculations

### Interactions
- Smooth drag and drop
- Animated transitions
- Hover effects
- Selection highlighting
- Zoom/pan with momentum

### Data Structure
```typescript
interface ERDEntity {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  color: string;
  attributes: ERDAttribute[];
}

interface ERDRelationship {
  id: string;
  from: string;
  to: string;
  fromCardinality: '1' | 'N';
  toCardinality: '1' | 'N';
  label: string;
  description: string;
  isOptional: boolean;
}
```

## Future Enhancements

Potential features for future versions:
- [ ] Relationship explorer (step through FK chains)
- [ ] Schema documentation links
- [ ] Export to SQL/Prisma schema
- [ ] Entity grouping/clustering
- [ ] Search/filter entities
- [ ] Minimap for large schemas
- [ ] Auto-layout algorithms
- [ ] Relationship path highlighting
