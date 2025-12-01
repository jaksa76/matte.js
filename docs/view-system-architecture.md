# View System Architecture

## Overview

The Matte.js framework now supports a pluggable view system with clear separation of concerns between entities, views, pages, and navigation. This architecture allows developers to create custom views and control how entities are displayed without coupling the core framework to specific view implementations.

## Core Concepts

### 1. Entities
**Location:** `src/framework/entities.ts`

Entities define the data structure and validation rules. They are completely independent of how they're displayed.

```typescript
const Product = ownedEntity("Product", [
  string("name").required(),
  number("price").min(0),
  date("releaseDate"),
]);
```

### 2. Views
**Location:** `src/framework/view-system.ts`

Views define **how** entities are displayed. There are two types:

#### EntityView
Displays a **collection** of entity instances (e.g., GridView, ListView, ChartView).

```typescript
interface EntityView {
  viewType: 'entity';
  viewId: string;           // e.g., 'grid', 'list', 'chart'
  entity: EntityDefinition;
  displayName?: string;
  componentName?: string;   // Optional custom component
  metadata?: Record<string, any>;
}
```

#### InstanceView
Displays a **single** entity instance (e.g., DetailView, FormView).

```typescript
interface InstanceView {
  viewType: 'instance';
  viewId: string;           // e.g., 'detail', 'form'
  entity: EntityDefinition;
  displayName?: string;
  componentName?: string;
  metadata?: Record<string, any>;
}
```

### 3. Pages
**Location:** `src/framework/view-system.ts`

Pages are **navigation targets** that contain a view and define routing.

```typescript
interface Page {
  id: string;              // Unique identifier
  name: string;            // Display name in navigation
  path: string;            // URL path (without leading /)
  view: View;              // The view to render
  icon?: string;           // Optional icon for navigation
  showInNav?: boolean;     // Show in navigation menu (default: true)
  order?: number;          // Sort order in navigation
}
```

### 4. Registries

#### EntityRegistry
**Location:** `src/framework/registry.ts`

Stores entity definitions only. Does **not** know about views.

```typescript
EntityRegistry.register(entity);
const entity = EntityRegistry.get('Product');
```

#### PageRegistry
**Location:** `src/framework/page-registry.ts`

Stores page definitions and provides navigation information.

```typescript
PageRegistry.register(page);
const page = PageRegistry.getByPath('products');
const navPages = PageRegistry.getNavigationPages();
```

## Separation of Concerns

### Framework Layer (Matte class)
- Manages database, repositories, and API
- Provides registration API
- Does **not** know the exhaustive list of view types
- Only has a configurable default view ('grid' or 'list')

```typescript
const app = new Matte({ defaultView: 'grid' });
```

### View Layer
- Independent view implementations
- Built-in views: GridView, ListView, DetailView, FormView
- Custom views can be added without modifying the framework
- Views are looked up by `viewId` or `componentName`

### Routing Layer
- Client-side routing based on page paths
- Pages control which view is rendered
- URL structure: `/{page.path}`

## Usage Patterns

### Pattern 1: Simple Entity Registration
Registers an entity with the default view.

```typescript
const app = new Matte({ defaultView: 'grid' });
app.register(Product);
// Creates: /product with grid view
```

### Pattern 2: Helper Functions
Use built-in helper functions for common views.

```typescript
app.register(listView(Product));
app.register(gridView(Product, { 
  pageName: "All Products",
  pagePath: "products"
}));
```

### Pattern 3: Multiple Pages for Same Entity
Create different views of the same entity.

```typescript
app.register(gridView(Product, { 
  pageName: "Products (Grid)",
  pagePath: "products-grid"
}));

app.register(listView(Product, {
  pageName: "Products (List)", 
  pagePath: "products-list"
}));
```

### Pattern 4: Custom Views
Create custom views with metadata.

```typescript
const analyticsView = createEntityView('analytics', Order, {
  displayName: 'Order Analytics',
  componentName: 'OrderAnalyticsView',
  metadata: {
    chartType: 'bar',
    groupBy: 'status',
  },
});

const page = createPage(
  'order-analytics',
  'Analytics',
  'analytics',
  analyticsView,
  { icon: '📊', order: 10 }
);

app.register(page);
```

### Pattern 5: Hidden Pages
Create pages that don't appear in navigation.

```typescript
const reportView = createEntityView('grid', Order, {
  displayName: 'Internal Report',
});

const page = createPage(
  'internal-report',
  'Report',
  'internal/report',
  reportView,
  { showInNav: false }
);

app.register(page);
```

### Pattern 6: Field Customization
Customize which fields are shown and how they're styled.

```typescript
app.register(gridView(Event, {
  customFields: [
    hgroup(null, [
      show("date").alignLeft().hideLabel(),
      show("location").alignRight().hideLabel(),
    ]),
    show("name").large().bold().alignCenter(),
    // Other fields are hidden
  ],
}));
```

## Adding Custom Views

To add a custom view component:

1. **Create the view component** (e.g., `ChartView.tsx`)
2. **Register it in ViewRenderer** (`src/framework/ui/ViewRenderer.tsx`)
3. **Use it via the view system**:

```typescript
const chartView = createEntityView('chart', Product, {
  displayName: 'Product Chart',
  metadata: { chartType: 'pie' },
});

const page = createPage('products-chart', 'Chart', 'chart', chartView);
app.register(page);
```

### Example: Custom View Component

```tsx
// In ViewRenderer.tsx, add to switch statement:
case 'chart':
  return (
    <ChartView
      entity={entity}
      apiUrl={apiUrl}
      chartType={view.metadata?.chartType}
    />
  );
```

## Client-Side Architecture

### MultiPageApp
**Location:** `src/framework/ui/MultiPageApp.tsx`

- Handles navigation between pages
- Manages URL routing
- Renders the navigation menu
- Delegates rendering to ViewRenderer

### ViewRenderer
**Location:** `src/framework/ui/ViewRenderer.tsx`

- Determines view type (EntityView vs InstanceView)
- Routes to appropriate view component based on `viewId`
- Manages entity collection state (list, detail, create, edit)
- Provides error handling for unknown views

### View Components
**Locations:** `src/framework/ui/*.tsx`

- GridView, ListView, DetailView, FormView
- Each component is independent and reusable
- Components receive entity definition and callbacks
- No coupling to routing or framework internals

## Benefits

1. **Extensibility**: Add custom views without modifying core framework
2. **Flexibility**: Multiple views per entity, custom routing, hidden pages
3. **Separation of Concerns**: Entities, views, pages, and navigation are independent
4. **Type Safety**: Strong TypeScript types throughout
5. **Developer Experience**: Simple helper functions for common cases, powerful APIs for advanced use

## Migration from Old System

### Old API
```typescript
// Old: View type embedded in registry
app.register(listView(entity));  // Returns View object
app.register(customGridView(entity, fields));
```

### New API
```typescript
// New: View helpers return Page objects
app.register(listView(entity));  // Returns Page object
app.register(gridView(entity, { customFields: fields }));

// Advanced: Direct page creation
const page = createPage(id, name, path, view, options);
app.register(page);
```

The helper functions maintain backward compatibility while using the new architecture internally.
