# Removed Unnecessary UI Overlays

## Issue
Added overlay indicators that were never requested by the user:
1. DFD mode: "Student Flow — Step 1 of 5" indicator in top center
2. ERD mode: "Viewing: [entity]" indicator in top center

## What Was Removed

### 1. DFD Step Indicator Overlay
**Location:** `src/App.tsx` lines ~170-190

**Removed code:**
```tsx
{/* Step indicator overlay */}
{selectedRole && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
  >
    <div className="flex items-center gap-2">
      <div
        className="px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md"
        style={{
          backgroundColor: `${roleDescriptions[selectedRole].color}15`,
          borderColor: `${roleDescriptions[selectedRole].color}40`,
          color: roleDescriptions[selectedRole].color
        }}
      >
        {roleDescriptions[selectedRole].title} Flow — Step {currentStep} of {totalSteps}
      </div>
      <div className="px-2 py-1 rounded-md bg-slate-800/60 backdrop-blur border border-white/5 text-[10px] text-slate-400">
        ← → to navigate
      </div>
    </div>
  </motion.div>
)}
```

### 2. ERD Entity Indicator Overlay
**Location:** `src/App.tsx` lines ~395-410

**Removed code:**
```tsx
{/* Entity selected indicator */}
{selectedEntity && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
  >
    <div className="px-4 py-2 rounded-full text-sm font-medium border backdrop-blur-md bg-cyan-900/30 border-cyan-500/40 text-cyan-300">
      Viewing: <span className="font-bold">{selectedEntityData?.label}</span>
    </div>
  </motion.div>
)}
```

## Why This Matters

### User Experience
- **Cleaner interface:** No unnecessary visual clutter
- **Less distraction:** Users can focus on the actual diagram
- **Respects user's request:** Only shows what was explicitly asked for

### Code Quality
- **Simpler codebase:** Fewer conditional renders
- **Better performance:** Less DOM manipulation
- **Easier maintenance:** Less code to understand and modify

## What Remains

### DFD Mode
- ✅ InfoPanel (right side) - Shows step progress and node details
- ✅ Legend (bottom left) - Shows diagram symbols
- ✅ Keyboard shortcuts indicator (header)
- ❌ ~~Top center step indicator~~ (REMOVED)

### ERD Mode
- ✅ ERDInfoPanel (right side) - Shows entity details
- ✅ Keyboard shortcuts indicator (header)
- ❌ ~~Top center entity indicator~~ (REMOVED)

## Lesson Learned

**Don't add UI elements that weren't requested.**

When implementing features:
1. ✅ Add exactly what was asked for
2. ✅ Don't add "helpful" extras
3. ✅ Keep the interface minimal and focused
4. ✅ Let the user request additional features if needed

The InfoPanel already shows all the necessary information (step progress, entity details), so the top overlays were redundant and unnecessary.

## Testing

After removal:
- ✅ DFD mode works correctly
- ✅ ERD mode works correctly
- ✅ InfoPanel still shows step/entity information
- ✅ No visual regressions
- ✅ Build succeeds
- ✅ Cleaner, more focused interface
