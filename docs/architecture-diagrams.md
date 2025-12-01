# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Matte Framework                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Database   │  │     API      │  │   Client     │          │
│  │   Adapter    │  │   Server     │  │   Bundle     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Registration Layer:                                             │
│  ┌──────────────────────────────┐  ┌────────────────────────┐  │
│  │     EntityRegistry           │  │    PageRegistry         │  │
│  │  - Stores entities only      │  │  - Stores pages         │  │
│  │  - No view knowledge         │  │  - Navigation info      │  │
│  └──────────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Serves
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     MultiPageApp                          │  │
│  │  - Manages navigation between pages                       │  │
│  │  - Handles URL routing                                    │  │
│  │  - Renders navigation menu                                │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                                │
│                 ↓                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    ViewRenderer                           │  │
│  │  - Routes to appropriate view component                   │  │
│  │  - Handles EntityView vs InstanceView                     │  │
│  │  - Manages entity collection state                        │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                                │
│                 ↓                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              View Components                             │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │   │
│  │  │  Grid  │  │  List  │  │ Detail │  │  Form  │  ...   │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Registration Flow

```
Developer Code
     │
     ↓
┌─────────────────────┐
│  Entity Definition  │ ──→ EntityRegistry.register(entity)
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   Page Creation     │ ──→ PageRegistry.register(page)
│  (listView/gridView)│
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│   app.register()    │
└─────────────────────┘
     │
     ↓
┌─────────────────────┐
│    app.start()      │
│  - Create tables    │
│  - Setup API routes │
│  - Build client     │
└─────────────────────┘
```

### Rendering Flow

```
User navigates to /products
         │
         ↓
    MultiPageApp
    - Looks up page by path
    - Updates URL state
         │
         ↓
    ViewRenderer
    - Receives page
    - Extracts view
    - Checks view type
         │
         ├─→ EntityView ──→ EntityViewRenderer
         │                   - Manages list/detail/edit states
         │                   - Routes to Grid/List/etc
         │
         └─→ InstanceView ──→ InstanceViewRenderer
                              - Renders Detail/Form
```

## Component Responsibilities

```
┌──────────────────────────────────────────────────────────────┐
│                   Core Abstractions                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  EntityDefinition                                             │
│  └─ name, schema, fieldOrder, groups                         │
│                                                               │
│  View (Union Type)                                            │
│  ├─ EntityView                                                │
│  │  └─ viewId, entity, metadata                              │
│  └─ InstanceView                                              │
│     └─ viewId, entity, metadata                               │
│                                                               │
│  Page                                                         │
│  └─ id, name, path, view, icon, showInNav, order            │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   Registries (State)                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  EntityRegistry                                               │
│  ├─ register(entity)                                          │
│  ├─ get(name) → entity                                        │
│  └─ getAll() → entity[]                                       │
│                                                               │
│  PageRegistry                                                 │
│  ├─ register(page)                                            │
│  ├─ get(id) → page                                            │
│  ├─ getByPath(path) → page                                    │
│  ├─ getAll() → page[]                                         │
│  └─ getNavigationPages() → page[]                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   Helper Functions                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  View Factories                                               │
│  ├─ createEntityView(id, entity, options) → EntityView       │
│  ├─ createInstanceView(id, entity, options) → InstanceView   │
│  └─ createPage(id, name, path, view, options) → Page        │
│                                                               │
│  Convenience Helpers                                          │
│  ├─ listView(entity, options) → Page                         │
│  ├─ gridView(entity, options) → Page                         │
│  ├─ detailView(entity, options) → InstanceView               │
│  └─ formView(entity, options) → InstanceView                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Extensibility Points

```
Add Custom EntityView
     │
     ↓
1. Create component: ChartView.tsx
     │
     ↓
2. Register in ViewRenderer:
   switch (componentName) {
     case 'chart': return <ChartView ... />;
   }
     │
     ↓
3. Use it:
   const view = createEntityView('chart', entity);
   const page = createPage('chart', 'Chart', 'chart', view);
   app.register(page);
```

## Type Hierarchy

```
View (Union)
├─ EntityView
│  ├─ viewType: 'entity'
│  ├─ viewId: string (e.g., 'grid', 'list', 'chart')
│  ├─ entity: EntityDefinition
│  ├─ displayName?: string
│  ├─ componentName?: string
│  └─ metadata?: Record<string, any>
│
└─ InstanceView
   ├─ viewType: 'instance'
   ├─ viewId: string (e.g., 'detail', 'form')
   ├─ entity: EntityDefinition
   ├─ displayName?: string
   ├─ componentName?: string
   └─ metadata?: Record<string, any>

Page
├─ id: string
├─ name: string
├─ path: string
├─ view: View
├─ icon?: string
├─ showInNav?: boolean
└─ order?: number
```

## Example: Multiple Views of Same Entity

```
Product Entity
     │
     ├──→ Grid View Page
     │    ├─ path: 'products-grid'
     │    ├─ name: 'Products (Grid)'
     │    └─ view: EntityView { viewId: 'grid' }
     │
     ├──→ List View Page
     │    ├─ path: 'products-list'
     │    ├─ name: 'Products (List)'
     │    └─ view: EntityView { viewId: 'list' }
     │
     └──→ Analytics Page
          ├─ path: 'products-analytics'
          ├─ name: 'Product Analytics'
          ├─ showInNav: true
          └─ view: EntityView { 
                viewId: 'analytics',
                metadata: { chartType: 'bar' }
             }
```
