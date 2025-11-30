import { useState, useEffect } from 'react';
import type { EntityDefinition } from '../entities';
import { Plus, Eye, Pencil, Trash2, RefreshCw } from 'lucide-react';
import './styles.css';

export interface GridViewProps {
  entity: EntityDefinition;
  apiUrl: string;
  onSelect?: (item: any) => void;
  onEdit?: (item: any) => void;
  onCreate?: () => void;
}

export function GridView({ entity, apiUrl, onSelect, onEdit, onCreate }: GridViewProps) {
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
      setItems(Array.isArray(data) ? data : []);
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
    <div className="grid-view-container">
      <div className="grid-view-header">
        <h1 className="grid-view-title">{entity.name}s</h1>
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
        <div className="grid-cards">
          {items.map(item => (
            <div key={item.id} className="grid-card">
              <div className="grid-card-content">
                {Object.entries(entity.schema)
                  .filter(([_, field]) => !field.ui?.hidden)
                  .slice(0, 4)
                  .map(([fieldName, field]) => {
                    const ui = field.ui || {};
                    const labelText = ui.label !== undefined ? ui.label : fieldName;
                    const displayValue = formatValue(item[fieldName], field);
                    
                    // Build inline styles
                    const style: React.CSSProperties = {};
                    if (ui.alignLeft) style.textAlign = 'left';
                    if (ui.alignRight) style.textAlign = 'right';
                    if (ui.alignCenter) style.textAlign = 'center';
                    if (ui.bold) style.fontWeight = 'bold';
                    if (ui.large) style.fontSize = '1.1em';
                    
                    // Handle color
                    const colorValue = typeof ui.color === 'function' ? ui.color(item[fieldName]) : ui.color;
                    if (colorValue) style.color = colorValue;
                    
                    // Merge custom styles
                    const finalStyle = { ...style, ...ui.style };
                    
                    // Wrap with prefix/suffix
                    const prefixText = typeof ui.prefix === 'function' ? ui.prefix(item[fieldName]) : ui.prefix;
                    const suffixText = typeof ui.suffix === 'function' ? ui.suffix(item[fieldName]) : ui.suffix;
                    const wrappedValue = `${prefixText || ''}${displayValue}${suffixText || ''}`;
                    
                    return (
                      <div key={fieldName} className="grid-card-field">
                        {!ui.hideLabel && labelText && (
                          <span className="grid-card-label">{labelText}:</span>
                        )}
                        <span className="grid-card-value" style={finalStyle}>
                          {wrappedValue}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <div className="grid-card-actions">
                {onSelect && (
                  <button 
                    onClick={() => onSelect(item)} 
                    className="btn btn-secondary btn-sm"
                    title="View"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                )}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(item)} 
                    className="btn btn-info btn-sm"
                    title="Edit"
                  >
                    <Pencil size={14} />
                    <span>Edit</span>
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(item.id)} 
                  className="btn btn-danger btn-sm"
                  title="Delete"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
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
