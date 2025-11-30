import React from 'react';
import type { EntityDefinition } from '../entities';

export interface DetailViewProps {
  entity: EntityDefinition;
  item: any;
  onEdit?: () => void;
  onBack?: () => void;
}

export function DetailView({ entity, item, onEdit, onBack }: DetailViewProps) {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{entity.name} Details</h1>
        <div>
          {onBack && (
            <button onClick={onBack} style={{ marginRight: '8px', padding: '8px 16px', cursor: 'pointer' }}>
              Back
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '600px' }}>
        {Object.entries(entity.schema).map(([fieldName, field]) => (
          <div key={fieldName} style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
              {fieldName}
            </label>
            <div style={{ color: '#555' }}>
              {formatDetailValue(item[fieldName], field)}
            </div>
          </div>
        ))}

        <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>ID: {item.id}</div>
            {item.createdAt && <div>Created: {new Date(item.createdAt).toLocaleString()}</div>}
            {item.updatedAt && <div>Updated: {new Date(item.updatedAt).toLocaleString()}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDetailValue(value: any, field: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span style={{ color: '#999', fontStyle: 'italic' }}>Not set</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>Empty list</span>;
    }
    return (
      <ul style={{ margin: 0, paddingLeft: '20px' }}>
        {value.map((item, i) => (
          <li key={i}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  if (field.type === 'date') {
    return new Date(value).toLocaleString();
  }

  if (field.type === 'richtext') {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{value}</div>;
  }

  if (field.type === 'boolean') {
    return value ? '✓ Yes' : '✗ No';
  }

  return String(value);
}
