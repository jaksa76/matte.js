import { useState, useEffect } from 'react';
import type { EntityDefinition } from './entities';
import { Plus, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';
import './styles.css';

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
      <div className="list-view-loading">
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-box">
          <p className="error-message">Error: {error}</p>
          <button onClick={fetchItems} className="btn btn-danger">
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="list-view-container">
      <div className="list-view-header">
        <h1 className="list-view-title">{entity.name}s</h1>
        {onCreate && (
          <button onClick={onCreate} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New {entity.name}</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">No items found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {Object.keys(entity.schema).slice(0, 4).map(field => (
                  <th key={field}>
                    {field}
                  </th>
                ))}
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  {Object.keys(entity.schema).slice(0, 4).map(field => (
                    <td key={field}>
                      {formatValue(item[field], entity.schema[field]!)}
                    </td>
                  ))}
                  <td className="actions-cell">
                    {onSelect && (
                      <button 
                        onClick={() => onSelect(item)} 
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    )}
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(item)} 
                        className="btn btn-info btn-sm"
                      >
                        <Pencil size={14} />
                        <span>Edit</span>
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
