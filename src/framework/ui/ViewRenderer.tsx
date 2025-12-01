import { useState } from 'react';
import type { Page, EntityView, InstanceView } from '../view-system';
import { ListView, GridView, DetailView, FormView } from './index';
import './styles.css';

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
    return <EntityViewRenderer view={view} />;
  } else if (view.viewType === 'instance') {
    return <InstanceViewRenderer view={view} />;
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

    // Default built-in views
    switch (componentName) {
      case 'grid':
        return (
          <GridView
            entity={entity}
            apiUrl={apiUrl}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        );
      case 'list':
        return (
          <ListView
            entity={entity}
            apiUrl={apiUrl}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onCreate={handleCreate}
          />
        );
      default:
        return (
          <div className="view-error">
            <h2>Unknown Entity View</h2>
            <p>View component "{componentName}" is not registered.</p>
            <p>Available views: grid, list</p>
          </div>
        );
    }
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
