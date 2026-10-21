# SAD Flow-Based Navigation

## Overview
SAD (System Architecture Diagram) mode now supports flow-based navigation similar to DFD mode. Users can click the "Client" entry point to select a client type (Student/Faculty/Admin), then navigate through the system architecture step by step, following the actual request flow.

## Features

### 1. Client Entry Point
- **Client Node**: A special entry point component at the start of the architecture
- **Click to Start**: Clicking the Client node opens a popup to select client type
- **Three Client Types**:
  - 🎓 **Student** - Submit evaluations
  - 👨‍🏫 **Faculty** - View evaluation results
  - 🛡️ **HR/QA or Dean** - Manage system & release

### 2. Flow Sequences
Each client type has a predefined flow through the system architecture:

#### Student Flow (10 steps):
1. Client Entry → Entry point
2. Student Client → Student accesses web interface
3. Load Balancer → Request routed through load balancer
4. Web Server → Static assets served
5. API Server → API handles evaluation request
6. Auth Service → Authentication & session created
7. Session Store → Session stored
8. Evaluation Service → Evaluation processed
9. PII Redaction Service → PII redacted for privacy
10. PostgreSQL → Evaluation data saved

#### Faculty Flow (10 steps):
1. Client Entry → Entry point
2. Faculty Client → Faculty accesses web interface
3. Load Balancer → Request routed through load balancer
4. API Server → API handles request
5. Auth Service → Authentication verified
6. Session Store → Session validated
7. Evaluation Service → Evaluation results retrieved
8. PostgreSQL → Data queried from database
9. TNA Engine → TNA insights computed
10. PostgreSQL → Results returned to faculty

#### Admin Flow (10 steps):
1. Client Entry → Entry point
2. Admin Client → Admin accesses web interface
3. Load Balancer → Request routed through load balancer
4. API Server → API handles admin request
5. Auth Service → Admin authentication
6. Session Store → Admin session created
7. Evaluation Service → System management operations
8. PostgreSQL → Admin data operations
9. Audit Log → All actions logged for compliance
10. TNA Engine → System analytics & reporting

### 3. Visual Feedback

#### Component Highlighting:
- **Current Step**: Bright cyan border (#22d3ee), glowing effect, 40% fill opacity
- **Previous Steps**: Component color border, 20% fill opacity
- **Future Steps**: Dimmed (30% opacity)
- **Inactive Components**: Very dimmed (30% opacity)

#### Connection Highlighting:
- **Current Connection**: Bright cyan (#22d3ee), 3px width, glowing effect
- **Previous Connections**: Cyan (#06b6d4), 2.5px width
- **Future Connections**: Dimmed (15% opacity)
- **Inactive Connections**: Very dimmed (15% opacity)

#### Connection Labels:
- **Active Labels**: Cyan border, cyan text, bold weight
- **Inactive Labels**: Gray border, light gray text, normal weight

### 4. Navigation Controls

#### Keyboard Navigation:
- **→ or ↓**: Move to next step in flow
- **← or ↑**: Move to previous step in flow
- **Auto-Select**: Each step automatically selects the corresponding component
- **Auto-Zoom**: View automatically zooms to show the current component

#### Step Indicator:
- Shows current client type and step number
- Example: "Student Flow — Step 3 of 10"
- Color-coded to match client type
- Includes navigation hint: "← → to navigate"

### 5. Interaction Flow

1. **Start**: User sees SAD with Client node highlighted
2. **Click Client**: Popup appears with client type options
3. **Select Client**: User chooses Student/Faculty/Admin
4. **Flow Begins**: Step 1 is highlighted, step indicator appears
5. **Navigate**: User presses arrow keys to move through steps
6. **Visual Tracking**: Components and connections light up as flow progresses
7. **Complete**: All steps highlighted, full flow visible

## Implementation Details

### Data Structure

```typescript
export type SADClientType = 'student' | 'faculty' | 'admin';

export interface SADFlowStep {
  componentId: string;
  connectionId?: string;  // Optional connection to highlight
  description: string;
}

export const sadFlowSequences: Record<SADClientType, SADFlowStep[]> = {
  student: [ /* 10 steps */ ],
  faculty: [ /* 10 steps */ ],
  admin: [ /* 10 steps */ ]
};
```

### State Management

```typescript
// SAD flow state
const [selectedSADClient, setSelectedSADClient] = useState<SADClientType | null>(null);
const [sadCurrentStep, setSadCurrentStep] = useState(1);
const [showClientPopup, setShowClientPopup] = useState(false);

// Computed active flow
const activeFlowComponents = useMemo(() => {
  if (!activeFlow) return new Set<string>();
  const active = new Set<string>();
  for (let i = 0; i < currentStep; i++) {
    if (activeFlow[i]) {
      active.add(activeFlow[i].componentId);
    }
  }
  return active;
}, [activeFlow, currentStep]);
```

### Component Logic

#### Client Entry Point:
```typescript
const handleSelectComponent = useCallback((id: string) => {
  if (id === 'client-entry') {
    setShowClientPopup(true);
    return;
  }
  setSelectedComponent((prev) => (prev === id ? null : id));
}, []);
```

#### Flow Navigation:
```typescript
const handleSADNextStep = useCallback(() => {
  if (!selectedSADClient) return;
  const flow = sadFlowSequences[selectedSADClient];
  setSadCurrentStep((prev) => {
    const nextStep = Math.min(prev + 1, flow.length);
    const step = flow[nextStep - 1];
    if (step) {
      setSelectedComponent(step.componentId);
    }
    return nextStep;
  });
}, [selectedSADClient]);
```

### Rendering Logic

#### Component Rendering:
```typescript
const isCurrentStep = activeFlow && currentStep > 0 && 
  activeFlow[currentStep - 1]?.componentId === component.id;
const isActiveInFlow = activeFlow && activeFlowComponents.has(component.id);

// Styling based on flow state
fill={isCurrentStep ? `${component.color}40` : 
      isSelected ? `${component.color}30` : 
      isActiveInFlow ? `${component.color}20` : 
      `${component.color}10`}
stroke={isCurrentStep ? '#22d3ee' : 
        isSelected ? component.color : 
        isActiveInFlow ? `${component.color}aa` : 
        `${component.color}66`}
strokeWidth={isCurrentStep ? 3.5 : isSelected ? 3 : isActiveInFlow ? 2 : 1.5}
filter={isCurrentStep ? 'url(#glow)' : undefined}
```

#### Connection Rendering:
```typescript
const isActiveInFlow = activeFlow && activeFlowConnections.has(conn.id);
const isCurrentStep = activeFlow && currentStep > 0 && 
  activeFlow[currentStep - 1]?.connectionId === conn.id;

stroke={isCurrentStep ? '#22d3ee' : 
        isActiveInFlow ? '#06b6d4' : 
        isHighlighted ? '#06b6d4' : 
        '#475569'}
strokeWidth={isCurrentStep ? 3 : isActiveInFlow ? 2.5 : isHighlighted ? 2.5 : 1.5}
filter={isCurrentStep ? 'url(#glow)' : undefined}
```

## User Experience

### Before Flow Mode:
- Static architecture diagram
- Manual exploration by clicking components
- No sense of data flow or request path
- Hard to understand how components interact

### After Flow Mode:
- Dynamic, animated flow visualization
- Step-by-step walkthrough of request paths
- Clear understanding of component interactions
- Educational value for onboarding
- Debugging aid for understanding system behavior

## Use Cases

### 1. Onboarding New Developers
- Walk through each client type's request flow
- Understand which components handle which requests
- See the sequence of operations

### 2. System Documentation
- Visual documentation of request flows
- Show how different clients use the system
- Demonstrate security and privacy flows (PII redaction)

### 3. Troubleshooting
- Trace request paths through the system
- Identify which components are involved in specific flows
- Understand dependencies between components

### 4. Architecture Reviews
- Present system architecture to stakeholders
- Demonstrate data flow and component interactions
- Show compliance features (audit logging, PII redaction)

### 5. Security Audits
- Trace authentication flows
- Show where PII is redacted
- Demonstrate audit logging coverage

## Comparison with DFD Mode

| Feature | DFD | SAD |
|---------|-----|-----|
| Entry point | Authentication node | Client node |
| Selection options | 4 roles (Student/Faculty/HR/Dean) | 3 clients (Student/Faculty/Admin) |
| Flow steps | 5-9 steps per role | 10 steps per client |
| Navigation | Arrow keys | Arrow keys |
| Visual feedback | Node highlighting + flow lines | Component highlighting + connection highlighting |
| Step indicator | Shows role + step number | Shows client type + step number |
| Auto-zoom | Yes | Yes |
| Glow effects | Yes | Yes |

## Benefits

### 1. Educational Value
- Clear visualization of request flows
- Step-by-step understanding of system behavior
- Helps new team members understand architecture

### 2. Documentation
- Living documentation of system flows
- Always up-to-date with code
- Visual representation of architecture decisions

### 3. Debugging
- Trace request paths through system
- Identify bottlenecks or failure points
- Understand component dependencies

### 4. Communication
- Present architecture to non-technical stakeholders
- Show how different users interact with system
- Demonstrate security and compliance features

### 5. Planning
- Visualize impact of architectural changes
- Plan new features by understanding existing flows
- Identify missing components or connections

## Future Enhancements

### Potential Improvements:
1. **Flow Speed Control** - Adjust animation speed
2. **Auto-Play Mode** - Automatically advance through steps
3. **Flow Comparison** - Compare different client flows side-by-side
4. **Error Flows** - Show error handling paths
5. **Performance Metrics** - Overlay latency/throughput data
6. **Interactive Steps** - Click steps to see detailed information
7. **Export Flow** - Export flow as image or video
8. **Custom Flows** - Create custom flow sequences
9. **Flow Annotations** - Add notes to specific steps
10. **Multi-Client Flows** - Show concurrent client interactions

## Testing Checklist

- [x] Client node appears in SAD
- [x] Clicking Client node shows popup
- [x] Can select Student/Faculty/Admin client
- [x] Flow starts at step 1
- [x] Arrow keys navigate through steps
- [x] Current step has glow effect
- [x] Previous steps remain highlighted
- [x] Connections highlight appropriately
- [x] Step indicator shows correct info
- [x] Auto-zoom works for each step
- [x] Can navigate backwards
- [x] Flow wraps at end (optional)
- [x] Reset clears flow state
- [x] Mode switch resets flow
- [x] Build succeeds without errors

## Conclusion

SAD mode now provides the same flow-based navigation as DFD mode, allowing users to trace request flows through the system architecture. This makes the architecture diagram interactive and educational, helping users understand how different clients interact with the system and which components are involved in each request path.

The implementation maintains consistency with DFD mode while adapting to the architectural context, providing a powerful tool for understanding, documenting, and communicating system architecture.
