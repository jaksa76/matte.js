# Pluggable View System - Implementation Guide

## Quick Start

### Basic Usage

```typescript
import { Matte, listView, gridView } from './framework';
import { ownedEntity, string, number } from './framework/entities';

const app = new Matte({ defaultView: 'grid' });

const Product = ownedEntity("Product", [
  string("name").required(),
  number("price").min(0),
]);

// Simple: Register with default view
app.register(Product);  // Creates page at /product with grid view

// Custom: Use specific view
app.register(listView(Product));  // Creates page at /product with list view

app.start();
```

### Advanced Usage

```typescript
import { 
  Matte, 
  createPage, 
  createEntityView,
  gridView, 
  show 
} from './framework';

const app = new Matte();

// Multiple pages for same entity
app.register(gridView(Product, {
  pageName: "Products (Grid)",
  pagePath: "products-grid",
}));

app.register(listView(Product, {
  pageName: "Products (List)",
  pagePath: "products-list",
}));

// Custom view with field customization
app.register(gridView(Product, {
  pageName: "Simple View",
  customFields: [
    show("name").bold().large(),
    show("price").prefix("$"),
  ]
}));

// Fully custom page
const analyticsView = createEntityView('analytics', Product, {
  metadata: { chartType: 'bar' }
});

const page = createPage(
  'product-analytics',
  'Analytics',
  'analytics',
  analyticsView,
  { icon: '📊', order: 10 }
);

app.register(page);
```

## Core Concepts

### 1. Entities
Define data structure and validation. Independent of display.

```typescript
const Product = ownedEntity("Product", [
  string("name").required(),
  number("price").min(0),
]);
```

### 2. Views
Define how entities are displayed. Two types:

**EntityView** - Shows collections:
```typescript
const gridView = createEntityView('grid', Product);
const listView = createEntityView('list', Product);
```

**InstanceView** - Shows single instances:
```typescript
const detailView = createInstanceView('detail', Product);
const formView = createInstanceView('form', Product);
```

### 3. Pages
Navigation targets containing a view:

```typescript
const page = createPage(
  'products',           // id
  'All Products',       // display name
  'products',           // URL path
  gridView,             // view
  { icon: '📦' }        // options
);
```

## API Reference

### Factory Functions

#### `createEntityView(viewId, entity, options?)`
Creates a view for entity collections.

```typescript
const view = createEntityView('grid', Product, {
  displayName: 'Product Grid',
  componentName: 'CustomGrid',  // Optional custom component
  metadata: { /* custom data */ }
});
```

#### `createInstanceView(viewId, entity, options?)`
Creates a view for single entities.

```typescript
const view = createInstanceView('detail', Product, {
  displayName: 'Product Details'
});
```

#### `createPage(id, name, path, view, options?)`
Creates a page with routing.

```typescript
const page = createPage('id', 'Name', 'path', view, {
  icon: '📋',
  showInNav: true,
  order: 1
});
```

### Helper Functions

#### `listView(entity, options?)`
Creates a page with list view.

```typescript
const page = listView(Product, {
  pageName: 'Products',
  pagePath: 'products',
  customFields: [show('name'), show('price')]
});
```

#### `gridView(entity, options?)`
Creates a page with grid view.

```typescript
const page = gridView(Product, {
  pageName: 'Product Grid',
  pagePath: 'products'
});
```

#### `show(fieldName)`
Selects a field for custom views.

```typescript
const customView = gridView(Product, {
  customFields: [
    show('name').bold().large(),
    show('price').prefix('$').alignRight(),
  ]
});
```

### Field Customization Methods

```typescript
show('fieldName')
  .label('Custom Label')
  .hideLabel()
  .bold()
  .large()
  .alignLeft()
  .alignRight()
  .alignCenter()
  .width(0.5)
  .prefix('$')
  .suffix(' USD')
  .color('red')
  .color((val) => val > 100 ? 'green' : 'red')
  .readOnly()
  .hidden()
```

### Registries

#### EntityRegistry
```typescript
EntityRegistry.register(entity);
const entity = EntityRegistry.get('Product');
const all = EntityRegistry.getAll();
EntityRegistry.clear();
```

#### PageRegistry
```typescript
PageRegistry.register(page);
const page = PageRegistry.get('id');
const page = PageRegistry.getByPath('products');
const all = PageRegistry.getAll();
const nav = PageRegistry.getNavigationPages();
PageRegistry.clear();
```

## Adding Custom Views

### Step 1: Create View Component

```tsx
// src/framework/ui/ChartView.tsx
export function ChartView({ entity, apiUrl, chartType }) {
  // Implementation
  return <div>Chart View</div>;
}
```

### Step 2: Register in ViewDispatcher

```tsx
// src/framework/ui/ViewDispatcher.tsx
function EntityViewDispatcher({ view }: { view: EntityView }) {
  // ...
  switch (componentName) {
    case 'grid':
      return <GridView ... />;
    case 'list':
      return <ListView ... />;
    case 'chart':  // Add this
      return <ChartView 
        entity={entity}
        apiUrl={apiUrl}
        chartType={view.metadata?.chartType}
      />;
    default:
      return <ErrorView />;
  }
}
```

### Step 3: Use the Custom View

```typescript
const chartView = createEntityView('chart', Product, {
  displayName: 'Product Chart',
  metadata: { chartType: 'pie' }
});

const page = createPage(
  'product-chart',
  'Chart',
  'products/chart',
  chartView,
  { icon: '📊' }
);

app.register(page);
```

## Examples

### Example 1: Multiple Views of Same Entity

```typescript
const Product = ownedEntity("Product", [...]);

// Grid view
app.register(gridView(Product, {
  pageName: "Products (Grid)",
  pagePath: "products-grid",
}));

// List view
app.register(listView(Product, {
  pageName: "Products (List)",
  pagePath: "products-list",
}));

// Custom view
app.register(gridView(Product, {
  pageName: "Simple View",
  pagePath: "products-simple",
  customFields: [show('name'), show('price')]
}));
```

### Example 2: Hidden Page

```typescript
const reportView = createEntityView('grid', Order);

const page = createPage(
  'internal-report',
  'Internal Report',
  'reports/internal',
  reportView,
  { showInNav: false }  // Won't appear in navigation
);

app.register(page);
```

### Example 3: Custom Navigation Order

```typescript
app.register(gridView(Dashboard, {
  pageName: "Dashboard",
  pagePath: "dashboard"
}));
// Use createPage to set order
const dashPage = PageRegistry.get('Dashboard-grid');
if (dashPage) {
  dashPage.order = 0;  // First in navigation
}

app.register(gridView(Reports, {
  pageName: "Reports",
  pagePath: "reports"
}));
// Set order through createPage
const reportsView = createEntityView('grid', Reports);
const reportsPage = createPage(
  'reports',
  'Reports',
  'reports',
  reportsView,
  { order: 100 }  // Last in navigation
);
```

### Example 4: Field Groups

```typescript
import { hgroup, show } from './framework';

app.register(gridView(Event, {
  customFields: [
    show('name').large().bold(),
    hgroup(null, [
      show('date').alignLeft(),
      show('location').alignRight(),
    ]),
  ]
}));
```

## Migration from Old API

### Before
```typescript
import { View, listView, gridView } from './framework';

app.register(listView(entity));
app.register(customGridView(entity, fields));
```

### After
```typescript
import { listView, gridView } from './framework';

// Helper functions now return Pages instead of Views
app.register(listView(entity));
app.register(gridView(entity, { customFields: fields }));
```

The helper functions maintain backward compatibility while using the new architecture.

## Best Practices

1. **Use helper functions** for common cases (listView, gridView)
2. **Use factory functions** for custom views (createEntityView, createPage)
3. **Set meaningful page names** for better navigation UX
4. **Use URL-friendly paths** (lowercase, hyphens)
5. **Set orders** for important pages to control navigation sequence
6. **Hide internal pages** with `showInNav: false`
7. **Add icons** to pages for visual navigation cues

## Troubleshooting

### "Unknown Entity View" Error
The view component isn't registered in ViewDispatcher. Add it to the switch statement.

### Page Not Appearing in Navigation
Check `showInNav` is not set to `false` in page options.

### Wrong View Rendering
Check the `viewId` matches a registered view component in ViewDispatcher.

### Path Conflicts
Ensure each page has a unique path. Use `PageRegistry.getByPath()` to check.

## Architecture Benefits

✅ **Extensible**: Add custom views without modifying framework  
✅ **Flexible**: Multiple views per entity, custom routing  
✅ **Type-Safe**: Strong TypeScript types throughout  
✅ **Testable**: Clear separation of concerns  
✅ **Maintainable**: Single responsibility for each component  
