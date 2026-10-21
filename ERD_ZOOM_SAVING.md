# ERD Zoom Saving Feature

## Overview
The ERD mode now supports saving zoom levels for specific entities, allowing you to create a customized viewing experience for each entity in your database schema.

## New Keyboard Shortcuts

### Ctrl+Alt+Space - Save Zoom for Selected Entity
Saves the current zoom/pan state for the currently selected entity.

**How to use:**
1. Click on an entity to select it
2. Zoom and pan to your preferred view
3. Press `Ctrl+Alt+Space`
4. You'll see a confirmation toast: "✅ Zoom saved for [entity-name]"

**Behavior:**
- Only works in ERD mode
- Requires an entity to be selected first
- Shows a warning if no entity is selected
- Saves the complete viewport state (position, zoom level)
- Can save multiple zooms for different entities

### Ctrl+Shift+Space - Export All Data
Exports all ERD data including entity positions, label positions, current zoom, saved zooms, and selected entity.

**Exported data structure:**
```json
{
  "mode": "erd",
  "entityPositions": {
    "users": { "x": 100, "y": 200 },
    "posts": { "x": 400, "y": 200 }
  },
  "labelPositions": {
    "users-posts": { "t": 0.5, "scale": 1 }
  },
  "zoom": {
    "x": 0,
    "y": 0,
    "width": 2700,
    "height": 1200
  },
  "savedZooms": {
    "users": {
      "x": 50,
      "y": 150,
      "width": 800,
      "height": 600
    },
    "posts": {
      "x": 350,
      "y": 150,
      "width": 1000,
      "height": 700
    }
  },
  "selectedEntity": "users"
}
```

## Implementation Details

### State Management
Added `savedZooms` state to `ERDCanvas.tsx`:
```typescript
const [savedZooms, setSavedZooms] = useState<Record<string, { 
  x: number; 
  y: number; 
  width: number; 
  height: number 
}>>({});
```

### Exposed Methods
Added two new methods to `ERDCanvasHandle` interface:
- `getSavedZooms()`: Returns all saved zoom configurations
- `saveZoomForEntity(entityId: string)`: Saves current viewport for an entity

### Keyboard Handler
Updated the keyboard event handler in `App.tsx` to:
1. Detect `Ctrl+Alt+Space` for saving zooms
2. Show visual feedback (toast notifications)
3. Include `savedZooms` in the exported data

## User Interface Updates

### Header Controls
The header now shows both shortcuts in ERD mode:
```
[Ctrl+Alt+Space Save Zoom] | [Ctrl+Shift+Space Save & Share Positions]
```

### Visual Feedback
- **Success Toast** (cyan): Shows when zoom is saved successfully
- **Warning Toast** (red): Shows when trying to save zoom without selecting an entity
- Toasts auto-dismiss after 2 seconds

## Use Cases

### 1. Entity Documentation
Save optimal zoom levels for each entity to create a guided tour of your schema:
- Save zoom for `users` showing all relationships
- Save zoom for `posts` showing foreign keys
- Save zoom for `comments` showing nested relationships

### 2. Presentation Mode
Create predefined views for different audiences:
- Developer view: Zoomed in on specific entities
- Manager view: Zoomed out showing overall structure
- DBA view: Focused on indexes and constraints

### 3. Collaboration
Share your preferred views with team members:
- Export your saved zooms
- Team members can import and use the same views
- Ensures consistent understanding of the schema

## Technical Notes

### Zoom State Structure
Each saved zoom contains the complete viewport state:
- `x`, `y`: Top-left corner position
- `width`, `height`: Viewport dimensions

This allows perfect restoration of the exact view, including:
- Pan position
- Zoom level
- Visible area

### Data Persistence
Saved zooms are:
- Stored in component state
- Exported with `Ctrl+Shift+Space`
- Can be imported by sharing the JSON
- Not persisted to localStorage (yet)

### Performance
- Minimal overhead: Only stores viewport coordinates
- No impact on rendering performance
- Fast lookup by entity ID

## Future Enhancements

Potential improvements:
1. **Auto-restore**: Automatically apply saved zoom when selecting an entity
2. **Zoom presets**: Save multiple zooms per entity (e.g., "overview", "detail")
3. **Zoom transitions**: Smooth animation when switching between saved zooms
4. **LocalStorage persistence**: Remember saved zooms across sessions
5. **Zoom history**: Navigate through zoom history with undo/redo
6. **Zoom sharing**: Generate shareable links for specific entity views

## Example Workflow

1. **Setup your view:**
   - Select the `users` entity
   - Zoom in to see all user attributes clearly
   - Pan to center the entity

2. **Save the zoom:**
   - Press `Ctrl+Alt+Space`
   - See confirmation: "✅ Zoom saved for users"

3. **Repeat for other entities:**
   - Select `posts` entity
   - Adjust zoom to show relationships
   - Press `Ctrl+Alt+Space`

4. **Export everything:**
   - Press `Ctrl+Shift+Space`
   - Copy the JSON data
   - Share with your team or assistant

5. **Import later:**
   - Share the JSON with the assistant
   - All positions and zooms are restored
   - Your custom views are preserved

## Troubleshooting

**Q: I pressed Ctrl+Alt+Space but nothing happened**
A: Make sure you're in ERD mode and have selected an entity first.

**Q: Can I save multiple zooms for the same entity?**
A: Currently, each entity can only have one saved zoom. The new zoom will overwrite the previous one.

**Q: Where are the saved zooms stored?**
A: They're stored in component state and exported with Ctrl+Shift+Space. They're not persisted to localStorage yet.

**Q: Can I apply a saved zoom automatically when selecting an entity?**
A: This is a planned feature for future enhancement.
