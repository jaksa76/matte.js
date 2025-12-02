# Quick Reference: Adding a New View Type

## 5-Minute Quick Start

### 1. Create Your View Component (`.tsx` file)

```tsx
import type { EntityDefinition } from '../framework/entities';
import { useEntityData, LoadingSpinner, ErrorDisplay } from '../framework/ui';

interface MyViewProps {
  entity: EntityDefinition;
  apiUrl: string;
  onSelect?: (item: any) => void;
  onEdit?: (item: any) => void;
  onCreate?: () => void;
  // Add custom props from metadata
  myCustomOption?: string;
}

function MyView({ entity, apiUrl, myCustomOption, ...handlers }: MyViewProps) {
  const { items, loading, error, refresh } = useEntityData(apiUrl);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={refresh} />;
  
  return (
    <div className="my-view">
      <h1>{entity.name}s - {myCustomOption}</h1>
      {/* Your custom rendering here */}
    </div>
  );
}
```

### 2. Register It

```tsx
import { viewRegistry } from '../framework/ui';

viewRegistry.registerEntityView('my-view', MyView);
```

### 3. Use It

```typescript
import { createEntityView, createPage } from '../framework/view-system';

const page = createPage(
  'products-custom',
  'Products',
  'products',
  createEntityView('my-view', Product, {
    metadata: { myCustomOption: 'hello' }
  })
);

app.register(page);
```

## Available Utilities

### Hooks

```typescript
// For collection views (lists, grids, etc.)
const { items, loading, error, refresh, deleteItem } = useEntityData(apiUrl);

// For single-item views (details, forms, etc.)
const { item, loading, error, refresh, updateItem } = useInstanceData(apiUrl, itemId);
```

### Components

```tsx
<LoadingSpinner message="Custom message..." />
<ErrorDisplay error={errorMsg} onRetry={handleRetry} />
<EmptyState message="No items" icon={<Icon />} />
<ActionButtons onView={fn} onEdit={fn} onDelete={fn} />
```

### Registry

```typescript
// Register
viewRegistry.registerEntityView('view-id', Component);
viewRegistry.registerInstanceView('view-id', Component);

// Query
viewRegistry.hasEntityView('view-id');
viewRegistry.getEntityView('view-id');
viewRegistry.getEntityViewIds();
```

## Common Patterns

### Pattern: Respect Entity Schema

```tsx
{Object.entries(entity.schema)
  .filter(([_, field]) => !field.ui?.hidden)
  .map(([fieldName, field]) => {
    const ui = field.ui || {};
    const label = ui.label ?? fieldName;
    const value = item[fieldName];
    
    return (
      <div key={fieldName}>
        {!ui.hideLabel && <label>{label}</label>}
        <span>{value}</span>
      </div>
    );
  })}
```

### Pattern: Apply Field Styling

```tsx
const style: React.CSSProperties = {};
if (ui.alignRight) style.textAlign = 'right';
if (ui.bold) style.fontWeight = 'bold';

const color = typeof ui.color === 'function' 
  ? ui.color(value) 
  : ui.color;
if (color) style.color = color;

<span style={style}>{value}</span>
```

### Pattern: Prefix/Suffix

```tsx
const prefix = typeof ui.prefix === 'function' ? ui.prefix(value) : ui.prefix;
const suffix = typeof ui.suffix === 'function' ? ui.suffix(value) : ui.suffix;
const display = `${prefix || ''}${value}${suffix || ''}`;
```

### Pattern: Format Values

```tsx
function formatValue(value: any, field: any): string {
  if (value === null || value === undefined) return '-';
  if (field.type === 'date') return new Date(value).toLocaleDateString();
  if (field.type === 'boolean') return value ? '✓' : '✗';
  if (Array.isArray(value)) return `${value.length} items`;
  return String(value);
}
```

## Prop Types

### EntityView Props (Collections)

```typescript
interface MyEntityViewProps {
  entity: EntityDefinition;    // Required
  apiUrl: string;              // Required
  onSelect?: (item: any) => void;
  onEdit?: (item: any) => void;
  onCreate?: () => void;
  // ... custom metadata props
}
```

### InstanceView Props (Single Items)

```typescript
interface MyInstanceViewProps {
  entity: EntityDefinition;    // Required
  item: any;                   // Required
  onEdit?: () => void;
  onBack?: () => void;
  // ... custom metadata props
}
```

## Factory Function Template

```typescript
export function myView(entity: EntityDefinition, options?: {
  pageName?: string;
  pagePath?: string;
  customFields?: FieldSelector[];
  myCustomOption?: string;
}) {
  const entityForView = options?.customFields 
    ? getCustomizedEntity(entity, options.customFields)
    : entity;
    
  const view = createEntityView('my-view', entityForView, {
    displayName: options?.pageName || `${entity.name}s`,
    metadata: {
      myCustomOption: options?.myCustomOption,
    },
  });

  return createPage(
    `${entity.name}-my-view`,
    options?.pageName || entity.name,
    options?.pagePath || toKebabCase(entity.name),
    view
  );
}
```

## Checklist

- [ ] Component created as `.tsx` file
- [ ] Uses `useEntityData` or `useInstanceData` hook
- [ ] Handles loading/error states with shared components
- [ ] Respects `entity.schema` and `field.ui` metadata
- [ ] Registered with `viewRegistry`
- [ ] Props interface defined
- [ ] Factory function created (optional)
- [ ] Example usage documented

## Full Documentation

See `docs/adding-new-view-types.md` for complete guide with examples.
