import { useState, useEffect } from 'react';
import type { EntityDefinition } from '../entities';
import { Plus, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { EntityStub } from './EntityStub';
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
  const [stub] = useState(() => new EntityStub(entity, apiUrl));

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await stub.fetchAll();
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [apiUrl]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await stub.delete(id);
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
    <div className="list-view-container" data-testid="list-view">
      <div className="list-view-header">
        <h1 className="list-view-title">{entity.name}s</h1>
        {onCreate && (
          <button onClick={onCreate} className="btn btn-primary" data-testid="btn-create">
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
                {Object.entries(entity.schema)
                  .filter(([_, field]) => !field.ui?.hidden)
                  .slice(0, 4)
                  .map(([fieldName, field]) => {
                    const ui = field.ui || {};
                    const labelText = ui.label !== undefined ? ui.label : fieldName;
                    return (
                      <th key={fieldName}>
                        {labelText}
                      </th>
                    );
                  })}
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  {Object.entries(entity.schema)
                    .filter(([_, field]) => !field.ui?.hidden)
                    .slice(0, 4)
                    .map(([fieldName, field]) => {
                      const ui = field.ui || {};
                      const displayValue = formatValue(item[fieldName], field);
                      
                      // Build inline styles
                      const style: React.CSSProperties = {};
                      if (ui.alignLeft) style.textAlign = 'left';
                      if (ui.alignRight) style.textAlign = 'right';
                      if (ui.alignCenter) style.textAlign = 'center';
                      if (ui.bold) style.fontWeight = 'bold';
                      
                      // Handle color
                      const colorValue = typeof ui.color === 'function' ? ui.color(item[fieldName]) : ui.color;
                      if (colorValue) style.color = colorValue;
                      
                      // Wrap with prefix/suffix
                      const prefixText = typeof ui.prefix === 'function' ? ui.prefix(item[fieldName]) : ui.prefix;
                      const suffixText = typeof ui.suffix === 'function' ? ui.suffix(item[fieldName]) : ui.suffix;
                      const wrappedValue = `${prefixText || ''}${displayValue}${suffixText || ''}`;
                      
                      return (
                        <td key={fieldName} style={style}>
                          {wrappedValue}
                        </td>
                      );
                    })}
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
