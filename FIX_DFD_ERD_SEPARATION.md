# Fix: Separated DFD and ERD Keyboard Handlers

## Issue
The DFD mode's keyboard shortcut handling was incorrectly modified when adding ERD functionality. The user correctly pointed out that DFD should not have been touched after ERD was implemented.

## Problem
When implementing the ERD zoom saving feature (Ctrl+Alt+Space), I moved the Ctrl+Shift+Space handler from `DFDCanvas.tsx` to `App.tsx` and modified it to handle both DFD and ERD modes. This was incorrect because:

1. DFD's original Ctrl+Shift+Space handler was working perfectly in `DFDCanvas.tsx`
2. Moving it to `App.tsx` created unnecessary coupling
3. It violated the principle of not modifying working code
4. It made the codebase harder to maintain

## Solution
Restored the original separation of concerns:

### DFD Mode (Unchanged)
- **Ctrl+Shift+Space**: Handled internally by `DFDCanvas.tsx`
- Saves node positions only
- Shows modal with JSON export
- No changes to original behavior

### ERD Mode (New Features Only)
- **Ctrl+Alt+Space**: Save zoom for selected entity
- **Ctrl+Shift+Space**: Export all ERD data (positions, labels, zooms, saved zooms)
- Both handlers in `App.tsx` with `viewMode === 'erd'` check

## Code Changes

### 1. Restored DFD Handler in DFDCanvas.tsx
```typescript
// Keyboard shortcut to save node positions (Ctrl+Shift+Space) - DFD mode only
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      // ... original DFD save logic
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [nodePositions]);
```

### 2. Updated App.tsx Keyboard Handler
```typescript
} else if (viewMode === 'erd' && e.ctrlKey && e.altKey && e.code === 'Space') {
  // Ctrl+Alt+Space: Save current zoom for selected entity (ERD mode only)
  // ... ERD zoom save logic
} else if (viewMode === 'erd' && e.ctrlKey && e.shiftKey && e.code === 'Space') {
  // Ctrl+Shift+Space: Export all ERD data (ERD mode only)
  // ... ERD export logic
}
```

### 3. Removed DFD Ref from App.tsx
- Removed `dfdCanvasRef` since DFD handles its own shortcuts
- Removed `DFDCanvasHandle` import
- Removed `ref={dfdCanvasRef}` from DFDCanvas component

### 4. Updated Header UI
```tsx
{viewMode === 'erd' && (
  <div>
    [Ctrl+Alt+Space Save Zoom] | [Ctrl+Shift+Space Export All]
  </div>
)}
{viewMode === 'dfd' && (
  <div>
    [Ctrl+Shift+Space Save Positions]
  </div>
)}
```

## Benefits

### 1. Separation of Concerns
- DFD manages its own keyboard shortcuts
- ERD shortcuts are managed in App.tsx
- No cross-contamination between modes

### 2. Maintainability
- Changes to ERD don't affect DFD
- Changes to DFD don't affect ERD
- Each mode is self-contained

### 3. Clear Intent
- Code clearly shows which shortcuts belong to which mode
- No conditional logic mixing modes
- Easier to understand and modify

### 4. No Breaking Changes
- DFD behavior is exactly as it was
- ERD gets new features without affecting DFD
- Users see no difference in DFD mode

## Testing Checklist

- [x] DFD Ctrl+Shift+Space works as before
- [x] DFD shows modal with node positions
- [x] ERD Ctrl+Alt+Space saves zoom for selected entity
- [x] ERD Ctrl+Shift+Space exports all data
- [x] Header shows correct shortcuts for each mode
- [x] No console errors
- [x] Build succeeds
- [x] DFD and ERD operate independently

## Key Takeaway

**Never modify working code when adding new features.** Instead:
1. Add new functionality alongside existing code
2. Use conditional logic to separate concerns
3. Keep each feature self-contained
4. Test that existing functionality remains unchanged

This incident reinforced the importance of:
- Reading the user's requirements carefully
- Not making assumptions about what can be changed
- Preserving existing behavior when adding features
- Maintaining clear separation between different modes/features
