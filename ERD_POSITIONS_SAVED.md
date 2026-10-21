# ERD Positions Saved Permanently

## Overview
Your custom ERD layout has been permanently saved to the source code. All entity positions, label positions, zoom levels, and saved zooms are now hardcoded.

## What Was Updated

### 1. Entity Positions (`src/data/erdData.ts`)
All 9 entities now have their custom positions:

```typescript
users:                 x: -286.02,  y: -255.79
academic_terms:        x: 207.32,   y: -302.53
evaluation_criteria:   x: 579.47,   y: 245.53
evaluations:           x: -601.02,  y: 521.61
evaluation_ratings:    x: 63.00,    y: 247.43
tna_snapshots:         x: 107.61,   y: 527.73
audit_logs:            x: -1003.02, y: 433.12
sessions:              x: -845.99,  y: -255.02
release_signatures:    x: -248.41,  y: 532.05
```

### 2. Label Positions (`src/components/ERDCanvas.tsx`)
All 11 relationship labels now have their custom curve positions (t values):

```typescript
r1  (users → evaluations):         t: 0.58
r2  (users → evaluations):         t: 0.50
r3  (academic_terms → evaluations): t: 0.74
r4  (evaluations → ratings):       t: 0.50
r5  (criteria → ratings):          t: 0.56
r6  (users → tna_snapshots):       t: 0.50
r7  (terms → tna_snapshots):       t: 0.48
r8  (users → audit_logs):          t: 0.46
r9  (users → sessions):            t: 0.52
r10 (terms → signatures):          t: 0.36
r11 (users → signatures):          t: 0.64
```

### 3. Initial ViewBox (`src/components/ERDCanvas.tsx`)
The initial zoom/pan state is now:

```typescript
{
  x: -1159.10,
  y: -524.84,
  width: 2698.19,
  height: 1199.19
}
```

### 4. Saved Zooms (`src/components/ERDCanvas.tsx`)
All 9 entity-specific zoom levels are now pre-loaded:

- **users**: Zoomed to show user details
- **academic_terms**: Zoomed to show term relationships
- **sessions**: Zoomed in (smaller viewport: 1405x624)
- **evaluation_ratings**: Zoomed to show rating details
- **evaluation_criteria**: Zoomed in (smaller viewport: 1426x634)
- **evaluations**: Zoomed to show evaluation flow
- **audit_logs**: Zoomed to show audit trail
- **tna_snapshots**: Zoomed to show TNA data
- **release_signatures**: Zoomed to show signature flow

## How to Use

### View Your Layout
1. Switch to ERD mode using the mode switcher
2. Your custom layout loads automatically
3. All entities are in their saved positions
4. All labels are on their saved curve positions
5. The view starts at your saved zoom level

### Use Saved Zooms
Each entity has a pre-saved zoom level. When you select an entity, you can manually zoom to that level or use it as a reference.

### Make Further Changes
If you want to adjust the layout:
1. Drag entities to new positions
2. Drag labels along their curves
3. Resize labels using the resize handle
4. Zoom/pan to your preferred view
5. Press `Ctrl+Alt+Space` to save zoom for an entity
6. Press `Ctrl+Shift+Space` to export all data
7. Share the new JSON to update the source code

## Technical Details

### Files Modified
1. `src/data/erdData.ts` - Entity positions
2. `src/components/ERDCanvas.tsx` - Label positions, initial viewBox, saved zooms

### Data Structure
The saved data includes:
- **Entity positions**: x, y coordinates for each entity
- **Label positions**: t parameter (0-1) along the curve, scale multiplier
- **ViewBox**: x, y, width, height for the initial view
- **Saved zooms**: Per-entity zoom configurations

### Persistence
All data is now hardcoded in the source files. Changes persist across:
- Page refreshes
- Browser restarts
- Different devices (when deployed)

## Next Steps

Your ERD layout is now permanent. You can:
1. ✅ Continue using the diagram as-is
2. ✅ Make further adjustments and save again
3. ✅ Share the layout with others (it's in the source code)
4. ✅ Deploy the application with your custom layout

## Notes

- The layout uses negative coordinates, which is fine - the viewBox handles this
- Label positions use curve parameters (t values) instead of absolute coordinates
- Saved zooms allow quick navigation to entity-specific views
- All positions are preserved exactly as you arranged them
