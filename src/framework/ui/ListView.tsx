import React, { useState, useEffect } from 'react';
import type { EntityDefinition } from './entities';

export interface ListViewProps {
  entity: EntityDefinition;
  apiUrl: string;
  onSelect?: (item: any) => void;
  onEdit?: (item: any) => void;
  onCreate?: () => void;
}

export function ListView({ entity, apiUrl, onSelect, onEdit, onCreate }: ListViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [apiUrl]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
      await fetchItems();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Error: {error}</p>
        <button onClick={fetchItems}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{entity.name}s</h1>
        {onCreate && (
          <button onClick={onCreate} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Create New {entity.name}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              {Object.keys(entity.schema).slice(0, 4).map(field => (
                <th key={field} style={{ padding: '12px', textAlign: 'left' }}>
                  {field}
                </th>
              ))}
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                {Object.keys(entity.schema).slice(0, 4).map(field => (
                  <td key={field} style={{ padding: '12px' }}>
                    {formatValue(item[field], entity.schema[field]!)}
                  </td>
                ))}
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {onSelect && (
                    <button 
                      onClick={() => onSelect(item)} 
                      style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}
                    >
                      View
                    </button>
                  )}
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item)} 
                      style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatValue(value: any, field: any): string {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return `${value.length} items`;
  if (field.type === 'date') return new Date(value).toLocaleDateString();
  if (field.type === 'richtext') return value.substring(0, 50) + (value.length > 50 ? '...' : '');
  return String(value);
}
