import { useState } from 'react';
import type { EntityDefinition } from '../entities';
import { ListView, GridView, DetailView, FormView } from './index';
import './styles.css';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';
type ViewType = 'grid' | 'list';

export interface EntityAppProps {
  entity: EntityDefinition;
  apiUrl: string;
  viewType?: ViewType;
}

export function EntityApp({ entity, apiUrl, viewType = 'grid' }: EntityAppProps) {
  const [mode, setMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  // Choose the view component based on viewType prop
  const ViewComponent = viewType === 'list' ? ListView : GridView;

  return (
    <div className="entity-app">
      {mode === 'list' && (
        <ViewComponent
          entity={entity}
          apiUrl={apiUrl}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      )}

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
