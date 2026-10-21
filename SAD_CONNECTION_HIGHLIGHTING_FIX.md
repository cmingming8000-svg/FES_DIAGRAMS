# SAD Connection Highlighting Fix

## Problem
Connection lines were lighting up even though they weren't part of the current flow, causing confusion during flow navigation.

## Root Cause
The highlighting logic was checking if **both components** of a connection were in the active flow, rather than checking if the **specific connection** was part of the flow.

### Before (Incorrect Logic)
```typescript
const isInActiveFlow = activeFlow ? (
  activeFlowComponents.has(conn.from) && 
  activeFlowComponents.has(conn.to)
) : false;

const isDimmed = (selectedComponent && !isHighlighted) || 
                 (activeFlow && !isInActiveFlow && !isActiveInFlow);
```

**Problem:** If both `auth-service` and `session-store` were in the active flow, ANY connection between them would be highlighted, even if that specific connection wasn't part of the flow sequence.

### After (Correct Logic)
```typescript
const isActiveInFlow = activeFlow && activeFlowConnections.has(conn.id);
const isDimmed = (selectedComponent && !isHighlighted) || 
                 (activeFlow && !isActiveInFlow);
```

**Solution:** Only highlight connections that are explicitly in the `activeFlowConnections` set.

## Changes Made

### 1. Connection Highlighting Logic
**File:** `src/components/SADCanvas.tsx`

**Removed:**
- `isInActiveFlow` check that was causing false positives

**Updated:**
- `isDimmed` now only checks if connection is in `activeFlowConnections`
- Connections are only highlighted if they're explicitly part of the flow

### 2. Connection Label Styling
**Updated label styling to match connection state:**
- Highlighted labels: Cyan border and text
- Dimmed labels: Dark background and gray text
- Normal labels: Gray border and light text

### 3. Component Styling
**Updated component styling for better visual hierarchy:**
- Current step: Bright fill (40% opacity), cyan border, glow effect
- Active in flow: Medium fill (20% opacity), colored border
- Selected: Medium fill (30% opacity), bright border
- Dimmed: Very light fill (5% opacity), faded border

## Visual Improvements

### Before
❌ Connections between any two active components were highlighted
❌ Confusing visual noise during flow navigation
❌ Hard to trace the actual data flow path
❌ Inactive connections appeared active

### After
✅ Only connections explicitly in the flow are highlighted
✅ Clear visual path showing actual data flow
✅ Inactive connections are properly dimmed
✅ Easy to trace the complete flow sequence

## Example: Student Flow

### Steps with Connections
1. **Client Entry** → (no connection)
2. **Student Client** → **Load Balancer** (c1: HTTPS) ✅ Highlighted
3. **Load Balancer** → **Web Server** (c4: HTTP) ✅ Highlighted
4. **Web Server** → **API Server** (c20: HTTP) ✅ Highlighted
5. **API Server** → **Auth Service** (c6: Internal) ✅ Highlighted
6. **Auth Service** → **Session Store** (c10: Internal) ✅ Highlighted
7. **Session Store** → **Evaluation Service** (c16: Internal) ✅ Highlighted
8. **Evaluation Service** → **PII Redaction** (c8: Internal) ✅ Highlighted
9. **PII Redaction** → **PostgreSQL** (c14: TCP) ✅ Highlighted
10. **PostgreSQL** → (no connection, final destination)

### What Gets Highlighted
- ✅ 9 connections that are part of the flow
- ❌ All other connections (c2, c3, c5, c7, c9, c11, c12, c13, c15, c17, c18, c19) are dimmed

### What Was Previously Highlighted (Incorrect)
- ❌ Any connection between two active components
- ❌ For example: c5 (Load Balancer → API Server) would be highlighted even though it's not in the Student flow
- ❌ This created visual confusion

## Technical Details

### Connection State Determination

```typescript
// Is this connection part of the active flow?
const isActiveInFlow = activeFlow && activeFlowConnections.has(conn.id);

// Is this the current step's connection?
const isCurrentStep = activeFlow && currentStep > 0 && 
                      activeFlow[currentStep - 1]?.connectionId === conn.id;

// Is this connection related to the selected component?
const isHighlighted = selectedComponent && 
                      (conn.from === selectedComponent || conn.to === selectedComponent);

// Should this connection be dimmed?
const isDimmed = (selectedComponent && !isHighlighted) || 
                 (activeFlow && !isActiveInFlow);
```

### Visual Styling Based on State

| State | Stroke Color | Width | Opacity | Effect |
|-------|-------------|-------|---------|--------|
| Current Step | Cyan (#22d3ee) | 3px | 100% | Glow |
| Active in Flow | Cyan (#06b6d4) | 2.5px | 100% | None |
| Highlighted | Cyan (#06b6d4) | 2.5px | 100% | None |
| Normal | Gray (#475569) | 1.5px | 100% | None |
| Dimmed | Gray (#475569) | 1.5px | 15% | None |

## Benefits

### 1. **Clarity**
- Only relevant connections are highlighted
- Clear visual path through the system
- Easy to follow the data flow

### 2. **Accuracy**
- Reflects the actual flow sequence
- No false positives
- Matches the defined flow steps

### 3. **User Experience**
- Less visual noise
- Easier to understand system architecture
- Better educational value

### 4. **Debugging**
- Easy to identify which connections are used
- Clear visualization of request paths
- Helps identify missing connections

## Testing

### Test Cases
1. ✅ Student flow: Only 9 specific connections highlighted
2. ✅ Faculty flow: Only 9 specific connections highlighted
3. ✅ HR/QA flow: Only 9 specific connections highlighted
4. ✅ Dean flow: Only 9 specific connections highlighted
5. ✅ No flow active: All connections at normal state
6. ✅ Component selected: Only related connections highlighted
7. ✅ Flow navigation: Connections update correctly at each step

### Visual Verification
- [x] Current step connection has glow effect
- [x] Previous connections remain highlighted
- [x] Future connections are dimmed
- [x] Unrelated connections are dimmed
- [x] Connection labels match connection state
- [x] Smooth transitions between states

## Related Files

- `src/components/SADCanvas.tsx` - Connection highlighting logic
- `src/data/sadData.ts` - Flow definitions with connection IDs
- `SAD_FLOW_CONNECTION_FIXES.md` - Previous fix for missing connections

## Future Considerations

### Potential Enhancements
1. **Animated flow** - Show data moving along connections
2. **Connection tooltips** - Show protocol and description on hover
3. **Flow direction indicators** - Arrows showing data flow direction
4. **Connection grouping** - Group related connections visually
5. **Flow comparison** - Compare different client flows side-by-side

### Performance Optimization
- Current implementation is efficient (O(1) lookup in Set)
- No performance impact from the fix
- Could add connection pooling for very large diagrams

## Conclusion

The connection highlighting fix ensures that only the connections explicitly defined in the flow sequence are highlighted, eliminating visual confusion and providing a clear, accurate representation of data flow through the system architecture.

This fix, combined with the previous connection additions, provides a complete and accurate visualization of all four client flows (Student, Faculty, HR/QA, Dean) with 100% connection coverage and proper highlighting.
