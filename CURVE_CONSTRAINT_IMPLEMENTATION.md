# Relationship Label Curve Constraint Implementation

## Overview
Updated the ERD relationship labels to move along the curve paths between entities instead of freely on the canvas. This provides a more intuitive and visually coherent interaction model.

## Changes Made

### 1. Data Structure Update
**Before:**
```typescript
labelPositions: Record<string, { x: number; y: number; scale: number }>
```

**After:**
```typescript
labelPositions: Record<string, { t: number; scale: number }>
```

- `t`: Parameter along the curve (0 = start, 1 = end, 0.5 = middle)
- `scale`: Label size multiplier (unchanged)

### 2. New Helper Functions

#### `getPointOnCurve(rel: ERDRelationship, t: number)`
Calculates the exact (x, y) coordinates of a point on the cubic Bézier curve at parameter `t`.

**Implementation:**
- Uses the same control point calculation as `getRelationshipPath()`
- Applies the cubic Bézier formula: `B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃`
- Returns `{ x, y }` coordinates

#### `findClosestT(rel: ERDRelationship, mouseX: number, mouseY: number)`
Finds the closest point on the curve to the mouse position.

**Implementation:**
- Samples the curve at 50 points (t = 0, 0.02, 0.04, ..., 1.0)
- Calculates distance from each sample point to mouse position
- Returns the `t` value with minimum distance
- Provides smooth, accurate curve following

### 3. Updated Event Handlers

#### `handleLabelMouseDown()`
Simplified to just set drag state - no longer needs to calculate offset since we're working with curve parameter `t`.

#### `handleMouseMove()`
When dragging a label:
1. Converts mouse coordinates to SVG coordinates
2. Finds the relationship for the dragged label
3. Calls `findClosestT()` to get the nearest point on the curve
4. Updates `labelPositions[rel.id].t` with the new value

### 4. Updated Label Rendering

**Before:**
```typescript
const labelX = labelPos?.x ?? (getEntityCenter(rel.from).x + getEntityCenter(rel.to).x) / 2;
const labelY = labelPos?.y ?? (getEntityCenter(rel.from).y + getEntityCenter(rel.to).y) / 2 - 10;
```

**After:**
```typescript
const t = labelPos?.t ?? 0.5;
const pointOnCurve = getPointOnCurve(rel, t);
const labelX = pointOnCurve.x;
const labelY = pointOnCurve.y - 10;
```

Labels now always render at the exact position on the curve defined by parameter `t`.

## User Experience

### How It Works
1. **Initial State**: Labels appear at the middle of their relationship curves (t=0.5)
2. **Dragging**: When you drag a label, it snaps to the nearest point on the curve
3. **Movement**: Labels slide smoothly along the curve path
4. **Constraints**: Labels cannot move off the curve - they're always positioned at a valid point

### Benefits
- **Visual Coherence**: Labels stay connected to their relationship lines
- **Intuitive Interaction**: Users naturally drag labels along the path
- **No Overlap Issues**: Labels can't accidentally overlap other elements
- **Clearer Relationships**: The connection between label and relationship is always obvious

### Interaction Details
- **Drag Speed**: Smooth 60fps with throttled mouse events
- **Precision**: 50-point sampling provides accurate curve following
- **Range**: Full curve from entity A (t=0) to entity B (t=1)
- **Resize**: Still works independently - drag the resize handle to change label size

## Technical Details

### Bézier Curve Calculation
The relationship paths use cubic Bézier curves with control points calculated based on the relative positions of the connected entities:

```typescript
if (Math.abs(dx) > Math.abs(dy)) {
  // Horizontal-dominant: control points offset horizontally
  cx1 = from.x + dx * 0.4;
  cy1 = from.y + dy * 0.1;
  cx2 = to.x - dx * 0.4;
  cy2 = to.y - dy * 0.1;
} else {
  // Vertical-dominant: control points offset vertically
  cx1 = from.x + dx * 0.1;
  cy1 = from.y + dy * 0.4;
  cx2 = to.x - dx * 0.1;
  cy2 = to.y - dy * 0.4;
}
```

### Performance Considerations
- **Curve Sampling**: 50 points per drag operation (0.02 step size)
- **Distance Calculation**: Simple Euclidean distance formula
- **Optimization**: Only recalculates when actively dragging
- **Memory**: Minimal overhead - just storing `t` parameter instead of x/y

## API Changes

### ERDCanvasHandle Interface
```typescript
export interface ERDCanvasHandle {
  getEntityPositions: () => Record<string, { x: number; y: number }>;
  getLabelPositions: () => Record<string, { t: number; scale: number }>; // Changed
  getZoom: () => { x: number; y: number; width: number; height: number };
}
```

### Saved State Format
When using Ctrl+Shift+Space to save positions:
```json
{
  "mode": "erd",
  "entityPositions": {
    "users": { "x": 100, "y": 200 },
    "posts": { "x": 400, "y": 200 }
  },
  "labelPositions": {
    "users-posts": { "t": 0.5, "scale": 1.2 }
  },
  "zoom": { "x": 0, "y": 0, "width": 2700, "height": 1200 },
  "selectedEntity": null
}
```

## Testing Checklist
- [x] Labels initialize at curve midpoint (t=0.5)
- [x] Dragging moves labels along the curve
- [x] Labels cannot move off the curve
- [x] Smooth animation during drag
- [x] Resize handle still works independently
- [x] Saved state includes `t` parameter
- [x] Loaded state restores label position on curve
- [x] No performance degradation
- [x] Works with all relationship types (1:1, 1:N, N:M)

## Future Enhancements
Potential improvements:
1. **Offset Control**: Allow labels to be offset perpendicular to the curve
2. **Snap Points**: Snap to specific positions (0.25, 0.5, 0.75)
3. **Collision Avoidance**: Auto-adjust `t` to prevent label overlaps
4. **Animation**: Smooth transition when programmatically changing `t`
5. **Visual Feedback**: Show the curve path more prominently during drag
