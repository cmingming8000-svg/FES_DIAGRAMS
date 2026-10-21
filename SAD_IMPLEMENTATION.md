# SAD (System Architecture Diagram) Mode Implementation

## Overview
Added a third visualization mode: System Architecture Diagram (SAD), which displays the infrastructure and system components of the FES application.

## Features Implemented

### Core Features (Matching DFD and ERD)
✅ **Interactive Canvas** - Draggable components with smooth animations  
✅ **Zoom/Pan** - Mouse wheel zoom, drag to pan  
✅ **Click Selection** - Click components to select and highlight  
✅ **Auto-Zoom** - Automatically zooms to saved zoom level when selecting  
✅ **Arrow Key Tour** - Navigate through components with ← → keys  
✅ **Position Saving** - Ctrl+Shift+Space to export positions  
✅ **Saved Zooms** - Each component can have its own saved zoom level  
✅ **Clean Interface** - No sidebars, no top-right controls  
✅ **Highlighting** - Related components and connections highlight  
✅ **Smooth Animations** - 600ms ease-out-cubic transitions  

### SAD-Specific Features

**1. Component Types**
- 🖥️ Frontend (Student, Faculty, Admin clients)
- ⚙️ Backend (Web Server, API Server)
- 🗄️ Database (PostgreSQL, Audit Log, Session Store)
- 🔧 Services (Auth, Evaluation, PII Redaction, TNA Engine)
- 🌐 External (Load Balancer)

**2. Connection Visualization**
- Bezier curves for smooth connections
- Protocol labels (HTTPS, HTTP, TCP, Internal)
- Directional arrows showing data flow
- Highlighted connections when component selected

**3. Tour Sequence (Logical Architecture Flow)**
1. Student Client (frontend entry point)
2. Faculty Client (frontend entry point)
3. Admin Client (frontend entry point)
4. Load Balancer (traffic distribution)
5. Web Server (static assets)
6. API Server (main backend)
7. Auth Service (authentication)
8. Evaluation Service (core business logic)
9. PII Redaction Service (privacy)
10. TNA Engine (analytics)
11. PostgreSQL (primary database)
12. Audit Log (compliance)
13. Session Store (session management)

## Data Structure

### Components (13 total)
```typescript
interface SADComponent {
  id: string;
  label: string;
  description: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'external';
  x: number;
  y: number;
  color: string;
  tourOrder?: number;
}
```

### Connections (14 total)
```typescript
interface SADConnection {
  id: string;
  from: string;
  to: string;
  label: string;        // Protocol (HTTPS, HTTP, TCP, Internal)
  protocol: string;
  description: string;
}
```

## File Structure

```
src/
├── data/
│   └── sadData.ts              # NEW: SAD data model
├── components/
│   ├── SADCanvas.tsx           # NEW: SAD canvas component
│   └── ModeSwitcher.tsx        # UPDATED: Added 'sad' mode
└── App.tsx                      # UPDATED: Integrated SAD mode
```

## Implementation Details

### 1. Data Model (`src/data/sadData.ts`)
- Defines 13 system components with positions and metadata
- Defines 14 connections between components
- Each component has a `tourOrder` for navigation sequence
- Components are color-coded by type

### 2. Canvas Component (`src/components/SADCanvas.tsx`)
- Based on ERDCanvas structure
- Uses SVG for rendering
- Implements drag-and-drop for components
- Implements zoom/pan with viewBox manipulation
- Implements auto-zoom with smooth animations
- Implements connection rendering with bezier curves
- Implements highlighting for selected component and related components

### 3. App Integration (`src/App.tsx`)
- Added `selectedComponent` state
- Added `sadTourSequence` memoized array
- Added `sadCanvasRef` for accessing canvas state
- Added `handleSelectComponent` callback
- Updated keyboard handler for SAD mode navigation
- Added SAD canvas rendering
- Updated header shortcuts for SAD mode
- Updated mode switcher to include SAD

## Keyboard Controls

### In SAD Mode:
- `→` or `↓` - Navigate to next component in tour
- `←` or `↑` - Navigate to previous component in tour
- `Ctrl+Alt+Space` - Save current zoom for selected component
- `Ctrl+Shift+Space` - Export all positions and zooms
- `Escape` - Reset view and selections

### Tour Behavior:
- Wraps around (last → first, first → last)
- Auto-zooms to saved zoom for each component
- Highlights selected component and related connections
- Dims unrelated components and connections

## Visual Design

### Component Styling:
- Rounded rectangles (8px radius)
- Color-coded by type
- Icon representation (emoji)
- Label and description text
- Selected state: bright border, filled background
- Dimmed state: 30% opacity

### Connection Styling:
- Bezier curves for smooth paths
- Arrow markers for direction
- Protocol labels in rounded boxes
- Selected state: cyan color, thicker line
- Dimmed state: 15% opacity

### Layout:
- Components arranged in logical architecture layers
- Frontend clients on left
- Load balancer in middle-left
- Servers in center
- Services on right
- Databases on far right
- Initial viewBox: (-1000, -400, 2200, 1000)

## State Management

### SAD State:
```typescript
const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
const sadCanvasRef = useRef<SADCanvasHandle>(null);

const sadTourSequence = useMemo(() => {
  return [...sadComponents]
    .filter(c => c.tourOrder !== undefined)
    .sort((a, b) => (a.tourOrder || 0) - (b.tourOrder || 0))
    .map(c => c.id);
}, []);
```

### Canvas Ref Methods:
```typescript
interface SADCanvasHandle {
  getComponentPositions: () => Record<string, { x: number; y: number }>;
  getZoom: () => { x: number; y: number; width: number; height: number };
  getSavedZooms: () => Record<string, { x: number; y: number; width: number; height: number }>;
  saveZoomForComponent: (componentId: string) => void;
}
```

## Mode Switching

When switching modes:
- DFD → ERD/SAD: Reset role, node, step
- ERD → DFD/SAD: Reset entity, tour index
- SAD → DFD/ERD: Reset component, tour index

All modes maintain independent state and don't interfere with each other.

## Performance Optimizations

✅ **React.memo** - Prevent unnecessary re-renders  
✅ **useMemo** - Memoize tour sequence and related components  
✅ **useCallback** - Memoize event handlers  
✅ **Throttled mouse events** - 16ms throttle for 60fps  
✅ **GPU acceleration** - willChange and translateZ(0) hints  
✅ **Efficient highlighting** - Set-based related component lookup  

## Comparison with DFD and ERD

| Feature | DFD | ERD | SAD |
|---------|-----|-----|-----|
| Draggable nodes | ✅ | ✅ | ✅ |
| Zoom/Pan | ✅ | ✅ | ✅ |
| Click selection | ✅ | ✅ | ✅ |
| Auto-zoom | ❌ | ✅ | ✅ |
| Arrow key tour | ✅ (steps) | ✅ (entities) | ✅ (components) |
| Position saving | ✅ | ✅ | ✅ |
| Saved zooms | ❌ | ✅ | ✅ |
| Ctrl+Alt+Space (save zoom) | ❌ | ✅ | ✅ |
| Ctrl+Shift+Space (export) | ✅ | ✅ | ✅ |
| Sidebars | ❌ | ❌ | ❌ |
| Top-right controls | ❌ | ❌ | ❌ |
| Smooth animations | ✅ | ✅ | ✅ |
| Highlighting | ✅ | ✅ | ✅ |
| Connection labels | ✅ (data types) | ✅ (relationships) | ✅ (protocols) |

## Use Cases

### 1. Architecture Documentation
- Visual representation of system architecture
- Shows how components interact
- Displays communication protocols

### 2. Onboarding
- New developers can understand system structure
- See data flow through infrastructure
- Understand component responsibilities

### 3. Troubleshooting
- Identify potential bottlenecks
- Understand component dependencies
- Trace request paths through system

### 4. Planning
- Visualize infrastructure changes
- Plan component additions
- Document system evolution

## Future Enhancements

Potential improvements:
1. **Component Details Panel** - Show component metadata on hover
2. **Connection Details** - Show protocol details, bandwidth, latency
3. **Health Indicators** - Show component status (up/down/warning)
4. **Metrics Overlay** - Show real-time metrics (CPU, memory, requests)
5. **Deployment Zones** - Group components by deployment zone/region
6. **Security Boundaries** - Show network boundaries and firewalls
7. **Scaling Indicators** - Show auto-scaling groups and instances
8. **Export to Image** - Export diagram as PNG/SVG
9. **Collaborative Editing** - Multiple users can edit simultaneously
10. **Version History** - Track architecture changes over time

## Testing Checklist

- [x] SAD mode loads correctly
- [x] Components are draggable
- [x] Zoom/pan works with mouse wheel
- [x] Click selects component
- [x] Auto-zoom works on selection
- [x] Arrow keys navigate tour
- [x] Tour wraps around
- [x] Highlighting works correctly
- [x] Connections render correctly
- [x] Protocol labels display
- [x] Ctrl+Alt+Space saves zoom for selected component
- [x] Ctrl+Shift+Space exports data
- [x] Mode switching resets state
- [x] Build succeeds without errors
- [x] No TypeScript errors
- [x] No console errors

## Conclusion

The SAD mode provides a comprehensive view of the FES system architecture, complementing the DFD (data flow) and ERD (data structure) views. It follows the same design principles as the other modes: clean interface, smooth interactions, and powerful features for exploring and documenting the system.

All three modes now work together to provide a complete picture of the FES system:
- **DFD**: How data flows through the system
- **ERD**: How data is structured and related
- **SAD**: How the system is built and connected

This triad of diagrams provides comprehensive documentation for developers, stakeholders, and operations teams.
