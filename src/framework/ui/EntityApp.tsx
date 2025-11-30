import React, { useState } from 'react';
import type { EntityDefinition } from '../entities';
import { ListView, DetailView, FormView } from './index';
import './styles.css';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export interface EntityAppProps {
  entity: EntityDefinition;
  apiUrl: string;
}

export function EntityApp({ entity, apiUrl }: EntityAppProps) {
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

  return (
    <div className="entity-app">
      {mode === 'list' && (
        <ListView
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
