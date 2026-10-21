# SAD Simple Auto-Follow

## Overview
SAD mode now uses a simple auto-follow behavior that automatically centers the view on the selected component, without relying on saved zoom levels.

## Implementation

### Simple Auto-Follow Logic
```typescript
useEffect(() => {
  if (!selectedComponent || manualControl) return;

  const pos = componentPositions[selectedComponent];
  if (!pos) return;

  // Calculate target viewBox centered on the component
  const padding = 300;
  const targetWidth = 1200;
  const targetHeight = 600;
  
  const targetViewBox = {
    x: pos.x + COMPONENT_WIDTH / 2 - targetWidth / 2,
    y: pos.y + COMPONENT_HEIGHT / 2 - targetHeight / 2,
    width: targetWidth,
    height: targetHeight
  };

  // Animate to target
  const duration = 600;
  const startTime = performance.now();
  const startViewBox = { ...viewBoxRef.current };

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out-cubic)
    const eased = 1 - Math.pow(1 - progress, 3);

    setViewBox({
      x: startViewBox.x + (targetViewBox.x - startViewBox.x) * eased,
      y: startViewBox.y + (targetViewBox.y - startViewBox.y) * eased,
      width: startViewBox.width + (targetViewBox.width - startViewBox.width) * eased,
      height: startViewBox.height + (targetViewBox.height - startViewBox.height) * eased
    });

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}, [selectedComponent, manualControl, componentPositions]);
```

## Behavior

### What It Does
- **Automatically centers** the view on the selected component
- **Uses fixed zoom level** (1200x600 viewport)
- **Smooth animation** with 600ms duration
- **Ease-out-cubic easing** for natural movement
- **Respects manual control** - won't auto-follow if user is panning/zooming

### What It Doesn't Do
- ❌ Doesn't use saved zoom levels
- ❌ Doesn't remember custom zoom per component
- ❌ Doesn't zoom in/out based on component importance
- ❌ Doesn't adjust zoom based on component size

## Comparison: ERD vs SAD Auto-Follow

| Feature | ERD | SAD |
|---------|-----|-----|
| **Auto-zoom behavior** | Uses saved zoom per entity | Simple center on component |
| **Zoom level** | Custom per entity | Fixed (1200x600) |
| **Saved zooms** | Yes (Ctrl+Alt+Space) | Yes (but not used for auto-follow) |
| **Animation** | 600ms ease-out-cubic | 600ms ease-out-cubic |
| **Manual override** | 2s timeout | 2s timeout |
| **Complexity** | Higher (saved zooms) | Lower (simple center) |

## Use Cases

### When Simple Auto-Follow Works Well
- ✅ **Architecture diagrams** - All components are similar size
- ✅ **System overviews** - Consistent zoom level is fine
- ✅ **Flow navigation** - Just need to see the current component
- ✅ **Quick exploration** - Don't need custom zoom per component

### When Saved Zooms Would Be Better
- ❌ **Complex schemas** - Some entities need more detail
- ❌ **Nested structures** - Different zoom levels for different depths
- ❌ **Detailed inspection** - Need to zoom in on specific components
- ❌ **Presentation mode** - Custom zoom for each step

## User Experience

### Flow Navigation
1. User clicks **Client** node
2. Selects client type (Student/Faculty/Admin)
3. Flow starts at step 1
4. View **automatically centers** on the first component
5. User presses **→** to go to next step
6. View **smoothly pans** to center on next component
7. Continues through the flow...

### Manual Control
- User can **pan/zoom manually** at any time
- Manual control **temporarily disables** auto-follow (2s)
- After 2s of no interaction, auto-follow **re-enables**
- Next step selection will auto-follow again

## Benefits of Simple Approach

### 1. **Simplicity**
- No need to save zoom levels
- No extra keyboard shortcuts needed
- Predictable behavior

### 2. **Consistency**
- Every component shown at same zoom level
- Easy to compare components
- Uniform visual experience

### 3. **Performance**
- No saved zoom state to manage
- Simpler state management
- Faster initialization

### 4. **Maintainability**
- Less code to maintain
- Fewer edge cases
- Easier to understand

## Technical Details

### Viewport Calculation
```typescript
const targetWidth = 1200;  // Fixed width
const targetHeight = 600;  // Fixed height

const targetViewBox = {
  x: pos.x + COMPONENT_WIDTH / 2 - targetWidth / 2,  // Center on component
  y: pos.y + COMPONENT_HEIGHT / 2 - targetHeight / 2,
  width: targetWidth,
  height: targetHeight
};
```

### Animation
- **Duration**: 600ms
- **Easing**: ease-out-cubic (`1 - Math.pow(1 - progress, 3)`)
- **Frame rate**: requestAnimationFrame (60fps)
- **Smooth**: Interpolates all viewBox properties

### Manual Control Detection
- Triggered by: pan, zoom, drag
- Timeout: 2000ms
- Resets automatically after timeout
- Prevents conflicts with auto-follow

## Future Enhancements

### Possible Improvements
1. **Configurable zoom level** - Let users set default zoom
2. **Zoom based on component type** - Different zoom for databases vs services
3. **Zoom based on flow step** - Zoom in for detailed steps
4. **Toggle auto-follow** - Let users disable it
5. **Zoom animation speed** - Configurable duration
6. **Padding control** - Adjust space around component

### When to Add Saved Zooms
Consider adding saved zooms if:
- Users request custom zoom per component
- Components vary greatly in complexity
- Need to show detail in some components
- Presentation mode requires custom views

## Conclusion

SAD mode now uses a simple, predictable auto-follow behavior that centers the view on the selected component with a fixed zoom level. This provides a clean, consistent user experience for navigating through architectural flows without the complexity of saved zoom levels.

The approach prioritizes simplicity and consistency over customization, making it ideal for architecture diagrams where all components are shown at a similar level of detail.
