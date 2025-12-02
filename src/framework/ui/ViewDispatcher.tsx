import { useState } from 'react';
import type { Page, EntityDisplay, InstanceDisplay } from '../view-system';
import { ListView, GridView, DetailView, FormView } from './index';
import { viewRegistry } from './view-registry';
import './styles.css';

// Register built-in views
viewRegistry.registerEntityView('grid', GridView);
viewRegistry.registerEntityView('list', ListView);
viewRegistry.registerInstanceView('detail', DetailView);
viewRegistry.registerInstanceView('form', FormView);

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export interface ViewDispatcherProps {
  page: Page;
}

/**
 * ViewDispatcher component handles rendering different view types
 * and manages the state for entity/instance views
 */
export function ViewDispatcher({ page }: ViewDispatcherProps) {
  const display = page.display;

  if (display.displayType === 'entity') {
    // Use page.id as key to force component remount when navigating between different pages
    // This ensures state (mode, selectedItem) is reset when switching entities
    return <EntityViewDispatcher key={page.id} display={display} />;
  } else if (display.displayType === 'instance') {
    return <InstanceViewDispatcher key={page.id} display={display} />;
  }

  return (
    <div className="view-error">
      <h2>Unknown Display Type</h2>
      <p>Display type "{(display as any).displayType}" is not supported.</p>
    </div>
  );
}

/**
 * Renders EntityDisplay (displays that show collections)
 */
function EntityViewDispatcher({ display }: { display: EntityDisplay }) {
  const [mode, setMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const entity = display.entity;
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

  // Render the appropriate view based on displayId
  const renderCollectionView = () => {
    const displayId = display.displayId;
    const componentName = display.componentName || displayId;

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
        {...display.metadata}
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
 * Renders InstanceDisplay (displays that show a single instance)
 */
function InstanceViewDispatcher({ display }: { display: InstanceDisplay }) {
  const entity = display.entity;
  const displayId = display.displayId;
  const componentName = display.componentName || displayId;

  // For now, instance views would need additional context (which instance to show)
  // This is a placeholder implementation
  return (
    <div className="view-error">
      <h2>Instance View</h2>
      <p>Instance views ("{componentName}") require additional routing context.</p>
      <p>Instance views are typically rendered as part of an EntityDisplay workflow.</p>
    </div>
  );
}

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
}
