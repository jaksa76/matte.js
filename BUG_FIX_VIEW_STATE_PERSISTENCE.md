# Bug Fix: View State Not Resetting on Navigation

## Issue

When navigating between different entity pages in the multi-page app, the React component state was not being reset. This caused the following problems:

1. **View mode state persisted**: If a user started creating an entity on one page (entering "create" mode), then navigated to a different entity page, the form view would remain visible instead of showing the grid/list view.

2. **Stale state leaking**: Internal state like `selectedItem` and `mode` would persist across different entity pages, causing UI inconsistencies.

## Root Cause

The bug was in `/src/framework/ui/ViewRenderer.tsx`. When rendering the `EntityViewRenderer` component:

```tsx
export function ViewRenderer({ page }: ViewRendererProps) {
  const view = page.view;

  if (view.viewType === 'entity') {
    return <EntityViewRenderer view={view} />;  // ❌ No key prop
  }
  // ...
}
```

**Why this was a problem:**

React reuses component instances when the component type is the same. When navigating from `/project` to `/task`:

1. Both pages use `EntityViewRenderer`
2. React sees the same component type and reuses the existing instance
3. The component's internal state (`mode`, `selectedItem`) is preserved
4. Only the `view` prop changes, but the state hooks don't reset

This violates the principle that each page should start with fresh state.

## Solution

Added a `key` prop using the unique `page.id` to force React to remount the component when switching pages:

```tsx
export function ViewRenderer({ page }: ViewRendererProps) {
  const view = page.view;

  if (view.viewType === 'entity') {
    // ✅ Use page.id as key to force remount when navigating
    return <EntityViewRenderer key={page.id} view={view} />;
  } else if (view.viewType === 'instance') {
    return <InstanceViewRenderer key={page.id} view={view} />;
  }
  // ...
}
```

**How this fixes it:**

- When `page.id` changes (e.g., from "project-grid" to "task-grid"), React sees a different key
- React unmounts the old `EntityViewRenderer` instance (destroying its state)
- React mounts a new `EntityViewRenderer` instance with fresh initial state
- Each page now starts with `mode='list'` and `selectedItem=null`

## Tests Added

### E2E Tests (tests/e2e/app.spec.ts)

Added comprehensive data persistence tests:

1. **should persist entities across navigation** - Verifies entities created on one page are still visible after navigating to another page and back

2. **should persist entities after page reload** - Verifies database persistence works across full page reloads

3. **should refetch data when navigating back to a page** - Verifies that external changes (via API) are picked up when navigating back to a page

4. **should reset view mode when navigating between pages** - ⭐ **This test catches the bug**
   - Starts creating an entity (enters form view)
   - Navigates to a different entity page
   - Verifies the grid view is shown (not form view)
   - Navigates back
   - Verifies state was reset (grid view, not form view)

### Unit Tests (tests/unit/view-renderer.test.tsx)

Added tests to verify the key prop strategy:

1. **should use page.id as key for entity views** - Verifies different pages have different IDs

2. **should have unique page ids for different entities** - Ensures the key mechanism works for preventing state reuse

## Test Results

**Before fix:** The "should reset view mode when navigating between pages" test would fail because the form view would remain visible after navigation.

**After fix:** All tests pass:

```
✓ Data Persistence › should persist entities across navigation
✓ Data Persistence › should persist entities after page reload  
✓ Data Persistence › should refetch data when navigating back to a page
✓ Data Persistence › should reset view mode when navigating between pages
```

**Full test suite:** 21/22 tests passing (1 skipped, unrelated)

## Files Changed

1. `/src/framework/ui/ViewRenderer.tsx` - Added `key={page.id}` prop
2. `/tests/e2e/app.spec.ts` - Added 4 data persistence E2E tests
3. `/tests/unit/view-renderer.test.tsx` - Added 2 unit tests for key prop validation

## React Key Prop Pattern

This fix follows React's best practice of using the `key` prop to control component identity:

- **Same key** = React reuses the component instance (preserves state)
- **Different key** = React unmounts old instance and mounts new one (resets state)

This pattern is essential when:
- The same component type renders different logical entities
- You need to reset state when props change in a specific way
- Component internal state shouldn't persist across certain prop changes

## References

- React docs: [Lists and Keys](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- React docs: [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
