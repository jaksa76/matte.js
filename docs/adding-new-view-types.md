# Adding New View Types to Matte.js

**Audience:** Framework developers  
**Last Updated:** December 2, 2025

This guide explains how to add a new view type to the Matte.js framework from scratch. It covers the complete process from creating a React component to integrating it into the view system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start: Adding a New View](#quick-start-adding-a-new-view)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [View Type Categories](#view-type-categories)
5. [Advanced Patterns](#advanced-patterns)
6. [Testing Your View](#testing-your-view)
7. [Design Considerations](#design-considerations)
8. [Refactoring Opportunities](#refactoring-opportunities)

---

## Architecture Overview

The Matte.js view system consists of several layers:

```
┌─────────────────────────────────────────┐
│  User Code (app.register)               │
├─────────────────────────────────────────┤
│  View Factory Functions (views.ts)      │
│  - listView(), gridView(), etc.         │
├─────────────────────────────────────────┤
│  View System (view-system.ts)           │
│  - EntityView, InstanceView types       │
│  - createEntityView(), createPage()     │
├─────────────────────────────────────────┤
│  Page Registry (page-registry.ts)       │
│  - Stores pages for routing             │
├─────────────────────────────────────────┤
│  ViewRenderer (ViewRenderer.tsx)        │
│  - Routes viewId to React component     │
├─────────────────────────────────────────┤
│  View Components (GridView.tsx, etc.)   │
│  - React components that render UI      │
└─────────────────────────────────────────┘
```

### Key Concepts

- **View Type**: Either `'entity'` (collection) or `'instance'` (single item)
- **View ID**: Unique identifier like `'grid'`, `'list'`, `'chart'`
- **Component Name**: Optional override for the React component to use
- **View Metadata**: Custom configuration passed to the component

---

## Quick Start: Adding a New View

**Example:** Adding a Kanban board view

### 1. Create the React Component

```tsx
// src/framework/ui/KanbanView.tsx
import { useState, useEffect } from 'react';
import type { EntityDefinition } from '../entities';
import './styles.css';

export interface KanbanViewProps {
  entity: EntityDefinition;
  apiUrl: string;
  statusField?: string; // Which field determines the column
  onSelect?: (item: any) => void;
  onEdit?: (item: any) => void;
  onCreate?: () => void;
}

export function KanbanView({ 
  entity, 
  apiUrl, 
  statusField = 'status',
  onSelect, 
  onEdit, 
  onCreate 
}: KanbanViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchItems();
  }, [apiUrl]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group items by status
  const statusField = entity.schema[statusField];
  const statuses = statusField?.type === 'enum' 
    ? statusField.values 
    : [...new Set(items.map(item => item[statusField]))];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="kanban-view">
      <h1>{entity.name} Kanban</h1>
      <div className="kanban-board">
        {statuses.map(status => (
          <div key={status} className="kanban-column">
            <h2>{status}</h2>
            {items
              .filter(item => item[statusField] === status)
              .map(item => (
                <div key={item.id} className="kanban-card">
                  {/* Render item fields */}
                  <div onClick={() => onSelect?.(item)}>
                    {Object.entries(entity.schema)
                      .filter(([_, field]) => !field.ui?.hidden)
                      .slice(0, 3)
                      .map(([fieldName, _]) => (
                        <div key={fieldName}>{item[fieldName]}</div>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Export the Component

```typescript
// src/framework/ui/index.ts
export { KanbanView } from './KanbanView';
export type { KanbanViewProps } from './KanbanView';
```

### 3. Register in ViewRenderer

```tsx
// src/framework/ui/ViewRenderer.tsx
import { ListView, GridView, DetailView, FormView, KanbanView } from './index';

// In EntityViewRenderer function, add to switch statement:
switch (componentName) {
  case 'grid':
    return <GridView {...props} />;
  case 'list':
    return <ListView {...props} />;
  case 'kanban':
    return (
      <KanbanView
        entity={entity}
        apiUrl={apiUrl}
        statusField={view.metadata?.statusField}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onCreate={handleCreate}
      />
    );
  default:
    return <div>Unknown view: {componentName}</div>;
}
```

### 4. Create a Factory Function (Optional)

```typescript
// src/framework/views.ts
export function kanbanView(entity: EntityDefinition, options?: {
  pageName?: string;
  pagePath?: string;
  statusField?: string;
  customFields?: FieldSelector[];
}): Page {
  const entityForView = options?.customFields 
    ? getCustomizedEntity(entity, options.customFields)
    : entity;
    
  const view = createEntityView('kanban', entityForView, {
    displayName: options?.pageName || `${entity.name} Kanban`,
    metadata: {
      statusField: options?.statusField || 'status',
    },
  });

  return createPage(
    `${entity.name}-kanban`,
    options?.pageName || `${entity.name} Board`,
    options?.pagePath || `${toKebabCase(entity.name)}-kanban`,
    view
  );
}
```

### 5. Use It!

```typescript
// User code
const Task = ownedEntity("Task", [
  string("title").required(),
  enum("status", ["Todo", "In Progress", "Done"]).required(),
  date("dueDate"),
]);

app.register(kanbanView(Task, {
  pageName: "Task Board",
  pagePath: "tasks",
  statusField: "status",
}));
```

---

## Step-by-Step Guide

### Step 1: Determine View Category

Choose the appropriate view type:

| View Type | When to Use | Examples |
|-----------|-------------|----------|
| **EntityView** | Displays multiple instances | Grid, List, Chart, Kanban, Calendar |
| **InstanceView** | Displays single instance | Detail, Form, Edit, Preview |

### Step 2: Define Component Props Interface

Create a TypeScript interface for your component props:

```typescript
export interface YourViewProps {
  entity: EntityDefinition;        // Always required
  
  // For EntityView:
  apiUrl: string;                   // API endpoint for collection
  onSelect?: (item: any) => void;   // When user clicks an item
  onEdit?: (item: any) => void;     // When user clicks edit
  onCreate?: () => void;            // When user clicks create
  
  // For InstanceView:
  item: any;                        // The instance to display
  onEdit?: () => void;
  onBack?: () => void;
  
  // Custom metadata:
  [key: string]: any;               // Any custom props from metadata
}
```

### Step 3: Implement the React Component

Follow this template structure:

```tsx
export function YourView({ entity, apiUrl, ... }: YourViewProps) {
  // 1. State management
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Data fetching (for EntityView)
  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Loading state
  if (loading) return <div className="loading">Loading...</div>;

  // 4. Error state
  if (error) return <div className="error">Error: {error}</div>;

  // 5. Main render
  return (
    <div className="your-view-container">
      {/* Your custom UI */}
    </div>
  );
}
```

### Step 4: Respect Entity Schema and UI Metadata

Your view should:

1. **Read field definitions** from `entity.schema`
2. **Respect `field.ui?.hidden`** to hide fields
3. **Apply styling** from `field.ui` properties:
   - `alignLeft`, `alignRight`, `alignCenter`
   - `bold`, `large`
   - `color` (can be string or function)
   - `prefix`, `suffix` (can be string or function)
   - `label`, `hideLabel`
   - `readOnly`
   - `width`

Example:

```tsx
{Object.entries(entity.schema)
  .filter(([_, field]) => !field.ui?.hidden)
  .map(([fieldName, field]) => {
    const ui = field.ui || {};
    const labelText = ui.label !== undefined ? ui.label : fieldName;
    const value = item[fieldName];
    
    // Build styles
    const style: React.CSSProperties = {};
    if (ui.alignRight) style.textAlign = 'right';
    if (ui.bold) style.fontWeight = 'bold';
    
    const colorValue = typeof ui.color === 'function' 
      ? ui.color(value) 
      : ui.color;
    if (colorValue) style.color = colorValue;
    
    // Apply prefix/suffix
    const prefixText = typeof ui.prefix === 'function' 
      ? ui.prefix(value) 
      : ui.prefix;
    const suffixText = typeof ui.suffix === 'function' 
      ? ui.suffix(value) 
      : ui.suffix;
    const displayValue = `${prefixText || ''}${value}${suffixText || ''}`;
    
    return (
      <div key={fieldName} style={style}>
        {!ui.hideLabel && labelText && <label>{labelText}:</label>}
        <span>{displayValue}</span>
      </div>
    );
  })}
```

### Step 5: Handle User Interactions

For EntityViews, call the appropriate callbacks:

```tsx
<button onClick={() => onCreate?.()}>Create New</button>
<button onClick={() => onSelect?.(item)}>View Details</button>
<button onClick={() => onEdit?.(item)}>Edit</button>
```

The ViewRenderer will handle transitioning to detail/form views.

### Step 6: Register in ViewRenderer

Add your view to the switch statement:

```tsx
// In EntityViewRenderer or InstanceViewRenderer
case 'your-view-id':
  return (
    <YourView
      entity={entity}
      apiUrl={apiUrl}
      {...view.metadata}  // Pass custom metadata as props
      onSelect={handleSelect}
      onEdit={handleEdit}
      onCreate={handleCreate}
    />
  );
```

### Step 7: Create Factory Function

Add a helper function in `views.ts`:

```typescript
export function yourView(entity: EntityDefinition, options?: {
  pageName?: string;
  pagePath?: string;
  customFields?: FieldSelector[];
  // Custom options specific to your view:
  yourCustomOption?: any;
}): Page {
  const entityForView = options?.customFields 
    ? getCustomizedEntity(entity, options.customFields)
    : entity;
    
  const view = createEntityView('your-view-id', entityForView, {
    displayName: options?.pageName || `${entity.name} View`,
    metadata: {
      yourCustomOption: options?.yourCustomOption,
      // Include any custom configuration
    },
  });

  return createPage(
    `${entity.name}-your-view`,
    options?.pageName || entity.name,
    options?.pagePath || toKebabCase(entity.name),
    view
  );
}
```

### Step 8: Export and Document

1. Export from `src/framework/ui/index.ts`
2. Export from `src/framework/views.ts`
3. Add to main exports in `src/framework/index.ts`
4. Document usage in README or docs

---

## View Type Categories

### EntityView (Collection Views)

Best for displaying multiple records:

#### Grid/Table Views
- **GridView**: Card-based grid layout
- **ListView**: Table/list layout
- **DataTable**: Advanced table with sorting, filtering, pagination

#### Specialized Collections
- **KanbanView**: Drag-and-drop columns by status
- **CalendarView**: Date-based layout
- **TimelineView**: Chronological display
- **MapView**: Geographic visualization
- **GalleryView**: Image-focused grid

#### Analytics Views
- **ChartView**: Bar, line, pie charts
- **DashboardView**: Metrics and KPIs
- **ReportView**: Formatted reports

### InstanceView (Single Item Views)

Best for displaying one record:

#### Display Views
- **DetailView**: Read-only detailed display
- **PreviewView**: Quick preview modal
- **PrintView**: Print-optimized layout

#### Edit Views
- **FormView**: Standard form editor
- **WizardView**: Multi-step form
- **InlineEditor**: In-place editing

---

## Advanced Patterns

### Pattern 1: Custom Metadata

Pass configuration to your view component:

```typescript
const chartView = createEntityView('chart', SalesData, {
  displayName: 'Sales Chart',
  metadata: {
    chartType: 'bar',
    xAxis: 'month',
    yAxis: 'revenue',
    groupBy: 'region',
  },
});
```

Access in component:

```tsx
export function ChartView({ entity, apiUrl, chartType, xAxis, yAxis }: ChartViewProps) {
  // Use chartType, xAxis, yAxis from metadata
}
```

### Pattern 2: Dynamic Component Selection

Override component name per instance:

```typescript
const view = createEntityView('custom', Product, {
  displayName: 'Product Showcase',
  componentName: 'ProductShowcaseView', // Different component
});
```

### Pattern 3: Nested Views

Render other views within your view:

```tsx
export function MasterDetailView({ entity, apiUrl }: MasterDetailViewProps) {
  const [selected, setSelected] = useState(null);
  
  return (
    <div className="master-detail">
      <div className="master">
        <ListView entity={entity} apiUrl={apiUrl} onSelect={setSelected} />
      </div>
      <div className="detail">
        {selected && <DetailView entity={entity} item={selected} />}
      </div>
    </div>
  );
}
```

### Pattern 4: View-Specific Field Filtering

Filter fields based on view requirements:

```typescript
// In your view component
const visibleFields = Object.entries(entity.schema)
  .filter(([_, field]) => {
    if (field.ui?.hidden) return false;
    // Chart views might only show numeric fields:
    if (yourViewType === 'chart' && field.type !== 'number') return false;
    return true;
  });
```

### Pattern 5: Custom Actions

Add view-specific actions:

```tsx
export function ArchiveView({ entity, apiUrl }: ArchiveViewProps) {
  const handleRestore = async (item: any) => {
    await fetch(`${apiUrl}/${item.id}/restore`, { method: 'POST' });
    // Refresh data
  };
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {/* Display item */}
          <button onClick={() => handleRestore(item)}>Restore</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing Your View

### Unit Testing

Create test file `tests/unit/your-view.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { YourView } from '../../src/framework/ui/YourView';
import { ownedEntity, string } from '../../src/framework/entities';

describe('YourView', () => {
  const testEntity = ownedEntity('Test', [
    string('name').required(),
    string('description'),
  ]);

  it('renders items', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: '1', name: 'Item 1', description: 'Desc 1' },
        ]),
      })
    );
    global.fetch = mockFetch as any;

    render(
      <YourView 
        entity={testEntity} 
        apiUrl="/api/test" 
      />
    );

    expect(await screen.findByText('Item 1')).toBeInTheDocument();
  });
});
```

### Integration Testing

Test the complete flow:

```typescript
// tests/integration/your-view.test.ts
import { Matte } from '../src/framework';
import { yourView } from '../src/framework/views';
import { ownedEntity, string } from '../src/framework/entities';

describe('YourView Integration', () => {
  it('registers and creates page correctly', () => {
    const app = new Matte();
    const entity = ownedEntity('Product', [string('name')]);
    
    const page = yourView(entity, { 
      pageName: 'Products',
      pagePath: 'products',
    });
    
    app.register(page);
    
    expect(page.view.viewId).toBe('your-view-id');
    expect(page.path).toBe('products');
  });
});
```

### Manual Testing

Create an example in `src/examples/`:

```typescript
// src/examples/your-view-example.ts
import { Matte } from '../framework';
import { ownedEntity, string, enum as enumField } from '../framework/entities';
import { yourView } from '../framework/views';

const app = new Matte();

const Task = ownedEntity("Task", [
  string("title").required(),
  enumField("status", ["New", "In Progress", "Done"]),
  string("description"),
]);

app.register(yourView(Task, {
  pageName: "Task View",
  pagePath: "tasks",
}));

app.start();
```

---

## Design Considerations

### 1. Performance

- **Virtualization**: For large datasets, use virtual scrolling
- **Pagination**: Implement server-side or client-side pagination
- **Memoization**: Use `React.memo` for expensive components
- **Lazy Loading**: Load data incrementally

```tsx
import { useMemo } from 'react';

export function YourView({ entity, apiUrl }: YourViewProps) {
  const visibleFields = useMemo(() => 
    Object.entries(entity.schema).filter(([_, f]) => !f.ui?.hidden),
    [entity]
  );
  
  // ... rest of component
}
```

### 2. Accessibility

- Add ARIA labels
- Support keyboard navigation
- Ensure color contrast
- Provide screen reader text

```tsx
<button 
  onClick={() => onEdit?.(item)}
  aria-label={`Edit ${item.name}`}
>
  <Pencil size={16} />
  <span className="sr-only">Edit</span>
</button>
```

### 3. Responsive Design

Make views work on all screen sizes:

```tsx
<div className="your-view">
  {/* Desktop: grid layout */}
  <div className="desktop-grid">...</div>
  
  {/* Mobile: list layout */}
  <div className="mobile-list">...</div>
</div>
```

```css
.desktop-grid { display: grid; }
.mobile-list { display: none; }

@media (max-width: 768px) {
  .desktop-grid { display: none; }
  .mobile-list { display: block; }
}
```

### 4. Error Handling

Provide clear error messages and recovery:

```tsx
if (error) {
  return (
    <div className="error-container">
      <h2>Unable to load data</h2>
      <p>{error.message}</p>
      <button onClick={retry}>Try Again</button>
    </div>
  );
}
```

### 5. Loading States

Show appropriate loading indicators:

```tsx
if (loading) {
  return (
    <div className="loading-state">
      <Spinner />
      <p>Loading {entity.name} data...</p>
    </div>
  );
}
```

---

## Refactoring Opportunities

### Current Pain Points

1. **Manual Switch Statement**: Every new view requires modifying ViewRenderer
2. **Boilerplate**: Similar fetching/error handling in each view
3. **Type Safety**: No compile-time check if viewId exists
4. **Discoverability**: Hard to know what views are available

### Proposed Improvements

#### 1. View Registry Pattern

Create a registry for view components:

```typescript
// src/framework/ui/view-registry.ts
type ViewComponent = React.ComponentType<any>;

class ViewComponentRegistry {
  private components = new Map<string, ViewComponent>();

  register(viewId: string, component: ViewComponent) {
    this.components.set(viewId, component);
  }

  get(viewId: string): ViewComponent | undefined {
    return this.components.get(viewId);
  }

  has(viewId: string): boolean {
    return this.components.has(viewId);
  }

  getAll(): Map<string, ViewComponent> {
    return new Map(this.components);
  }
}

export const viewRegistry = new ViewComponentRegistry();

// Register built-in views
viewRegistry.register('grid', GridView);
viewRegistry.register('list', ListView);
viewRegistry.register('detail', DetailView);
viewRegistry.register('form', FormView);
```

Then in ViewRenderer:

```tsx
// Instead of switch statement:
const ViewComponent = viewRegistry.get(componentName);

if (!ViewComponent) {
  return (
    <div className="view-error">
      <p>Unknown view: {componentName}</p>
      <p>Available: {Array.from(viewRegistry.getAll().keys()).join(', ')}</p>
    </div>
  );
}

return (
  <ViewComponent
    entity={entity}
    apiUrl={apiUrl}
    {...view.metadata}
    onSelect={handleSelect}
    onEdit={handleEdit}
    onCreate={handleCreate}
  />
);
```

Benefits:
- ✅ No more switch statement modifications
- ✅ Third-party views can self-register
- ✅ Runtime discovery of available views
- ✅ Easier testing (mock registry)

#### 2. Base View Hook

Extract common patterns into a reusable hook:

```typescript
// src/framework/ui/hooks/useEntityData.ts
export function useEntityData(apiUrl: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      await fetchItems();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
    deleteItem,
  };
}
```

Use in views:

```tsx
export function YourView({ entity, apiUrl, onSelect }: YourViewProps) {
  const { items, loading, error, refresh, deleteItem } = useEntityData(apiUrl);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={refresh} />;

  return (
    <div>
      {/* Just focus on rendering */}
    </div>
  );
}
```

#### 3. Field Renderer Component

Standardize field rendering:

```tsx
// src/framework/ui/components/FieldRenderer.tsx
export function FieldRenderer({ 
  field, 
  value, 
  fieldName, 
  entity 
}: FieldRendererProps) {
  const ui = field.ui || {};
  
  // All the styling logic in one place
  const style = buildFieldStyle(ui, value);
  const displayValue = formatFieldValue(value, field);
  const wrappedValue = applyPrefixSuffix(displayValue, ui, value);
  
  return (
    <div className="field" style={style}>
      {!ui.hideLabel && (
        <label>{ui.label ?? fieldName}</label>
      )}
      <span>{wrappedValue}</span>
    </div>
  );
}
```

Use in views:

```tsx
{Object.entries(entity.schema).map(([fieldName, field]) => (
  <FieldRenderer
    key={fieldName}
    field={field}
    fieldName={fieldName}
    value={item[fieldName]}
    entity={entity}
  />
))}
```

#### 4. Type-Safe View IDs

Use string literal types:

```typescript
// src/framework/view-system.ts
export type BuiltInViewId = 'grid' | 'list' | 'detail' | 'form';
export type CustomViewId = string & { __brand: 'CustomViewId' };
export type ViewId = BuiltInViewId | CustomViewId;

export interface BaseView {
  viewId: ViewId;
  // ...
}
```

### Implementation Plan

To implement these refactorings:

1. **Phase 1**: Add view registry (backward compatible)
2. **Phase 2**: Extract common hooks
3. **Phase 3**: Create field renderer component
4. **Phase 4**: Add type safety for view IDs
5. **Phase 5**: Update documentation and examples

Each phase maintains backward compatibility.

---

## Summary Checklist

When adding a new view type, ensure:

- [ ] React component created in `src/framework/ui/`
- [ ] Props interface defined with proper types
- [ ] Component respects `entity.schema` and `field.ui` metadata
- [ ] Loading and error states handled
- [ ] Component exported from `src/framework/ui/index.ts`
- [ ] Registered in ViewRenderer switch statement
- [ ] Factory function created in `views.ts` (optional)
- [ ] Factory function exported from `views.ts`
- [ ] Unit tests written
- [ ] Integration test added
- [ ] Example usage created in `src/examples/`
- [ ] Documentation updated
- [ ] Accessibility features included
- [ ] Responsive design implemented

---

## Additional Resources

- [View System Architecture](./view-system-architecture.md) - Architectural overview
- [Pluggable Views Guide](./pluggable-views-guide.md) - User-facing documentation
- [Entity Definition Guide](./entities.md) - Understanding entity schema
- [UI Metadata Reference](./ui-metadata.md) - Field styling options

---

## Examples in Codebase

Study these existing implementations:

- **GridView** (`src/framework/ui/GridView.tsx`) - Card-based layout
- **ListView** (`src/framework/ui/ListView.tsx`) - Table layout with sorting
- **DetailView** (`src/framework/ui/DetailView.tsx`) - Read-only instance display
- **FormView** (`src/framework/ui/FormView.tsx`) - Editable form with validation

---

**Questions or Issues?**  
Open an issue on GitHub or contact the framework team.
