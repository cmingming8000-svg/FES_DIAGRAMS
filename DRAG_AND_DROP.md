# Node Drag and Drop Feature

## Overview
All nodes in the Data Flow Diagram are now freely draggable. You can manually position nodes to create your ideal layout.

## How to Use

### Dragging Nodes
- **Click and drag** any node to move it to a new position
- Nodes can be moved freely without collision detection constraints
- The cursor changes to a grab icon when hovering over a node
- While dragging, the cursor changes to a grabbing icon

### Saving Positions
- Press **Ctrl + Shift + Space** to save all node positions
- Positions are saved to the browser's localStorage
- An alert will confirm when positions are saved
- The positions object is also logged to the console for easy copying

### Loading Saved Positions
- Saved positions are automatically loaded when the page refreshes
- Positions persist across browser sessions (stored in localStorage)

## Technical Details

### Position Storage
- Positions are stored in `localStorage` under the key `dfd-node-positions`
- Format: JSON object mapping node IDs to `{x, y}` coordinates
- Example:
  ```json
  {
    "student-user": { "x": 100, "y": 200 },
    "auth": { "x": 400, "y": 300 }
  }
  ```

### Auto-Follow Behavior
- When stepping through the flow, the view automatically pans to keep active nodes visible
- The auto-follow uses the current dragged positions (not original positions)
- Manual control temporarily disables auto-follow for 2 seconds

### Reset View
- The "Reset View" button in the header resets the viewport (zoom/pan) but does NOT reset node positions
- To reset node positions, clear localStorage or manually drag nodes back

## Tips
- Arrange nodes in a logical flow pattern (left to right or top to bottom)
- Use the zoom and pan features to get a better view while positioning
- Save frequently to avoid losing your layout
- Check the browser console after saving to see the exact position values
