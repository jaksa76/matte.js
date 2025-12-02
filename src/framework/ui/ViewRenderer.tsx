import { useState } from 'react';
import type { Page, EntityView, InstanceView } from '../view-system';
import { ListView, GridView, DetailView, FormView } from './index';
import { viewRegistry } from './view-registry';
import './styles.css';

// Register built-in views
viewRegistry.registerEntityView('grid', GridView);
viewRegistry.registerEntityView('list', ListView);
viewRegistry.registerInstanceView('detail', DetailView);
viewRegistry.registerInstanceView('form', FormView);

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export interface ViewRendererProps {
  page: Page;
}

/**
 * ViewRenderer component handles rendering different view types
 * and manages the state for entity/instance views
 */
export function ViewRenderer({ page }: ViewRendererProps) {
  const view = page.view;

  if (view.viewType === 'entity') {
    // Use page.id as key to force component remount when navigating between different pages
    // This ensures state (mode, selectedItem) is reset when switching entities
    return <EntityViewRenderer key={page.id} view={view} />;
  } else if (view.viewType === 'instance') {
    return <InstanceViewRenderer key={page.id} view={view} />;
  }

  return (
    <div className="view-error">
      <h2>Unknown View Type</h2>
      <p>View type "{(view as any).viewType}" is not supported.</p>
    </div>
  );
}

/**
 * Renders EntityView (views that display collections)
 */
function EntityViewRenderer({ view }: { view: EntityView }) {
  const [mode, setMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const entity = view.entity;
  const apiUrl = `/api/${toKebabCase(entity.name)}`;

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    setMode('detail');
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setMode('edit');
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setMode('create');
  };

  const handleSuccess = () => {
    setMode('list');
    setSelectedItem(null);
  };

  const handleCancel = () => {
    setMode('list');
    setSelectedItem(null);
  };

  const handleBack = () => {
    setMode('list');
    setSelectedItem(null);
  };

  // Render the appropriate view based on viewId
  const renderCollectionView = () => {
    const viewId = view.viewId;
    const componentName = view.componentName || viewId;

    // Look up view component in registry
    const ViewComponent = viewRegistry.getEntityView(componentName);

    if (!ViewComponent) {
      const availableViews = viewRegistry.getEntityViewIds();
      return (
        <div className="view-error">
          <h2>Unknown Entity View</h2>
          <p>View component "{componentName}" is not registered.</p>
          <p>Available views: {availableViews.join(', ')}</p>
        </div>
      );
    }

    // Render the view component with standard props
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
  };

  return (
    <div className="entity-app">
      {mode === 'list' && renderCollectionView()}

      {mode === 'detail' && selectedItem && (
        <DetailView
          entity={entity}
          item={selectedItem}
          onEdit={() => setMode('edit')}
          onBack={handleBack}
        />
      )}

      {mode === 'create' && (
        <FormView
          entity={entity}
          apiUrl={apiUrl}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}

      {mode === 'edit' && selectedItem && (
        <FormView
          entity={entity}
          initialData={selectedItem}
          apiUrl={apiUrl}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

/**
 * Renders InstanceView (views that display a single instance)
 */
function InstanceViewRenderer({ view }: { view: InstanceView }) {
  const entity = view.entity;
  const viewId = view.viewId;
  const componentName = view.componentName || viewId;

  // For now, instance views would need additional context (which instance to show)
  // This is a placeholder implementation
  return (
    <div className="view-error">
      <h2>Instance View</h2>
      <p>Instance views ("{componentName}") require additional routing context.</p>
      <p>Instance views are typically rendered as part of an EntityView workflow.</p>
    </div>
  );
}

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
}
