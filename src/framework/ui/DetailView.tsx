import type { EntityDefinition } from '../entities';
import { ArrowLeft, Pencil } from 'lucide-react';
import './styles.css';

export interface DetailViewProps {
  entity: EntityDefinition;
  item: any;
  onEdit?: () => void;
  onBack?: () => void;
}

export function DetailView({ entity, item, onEdit, onBack }: DetailViewProps) {
  return (
    <div className="detail-view-container">
      <div className="detail-view-header">
        <h1 className="detail-view-title">{entity.name} Details</h1>
        <div>
          {onBack && (
            <button onClick={onBack} className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="btn btn-primary">
              <Pencil size={16} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      <div className="detail-card">
        {Object.entries(entity.schema).map(([fieldName, field]) => (
          <div key={fieldName} className="detail-field">
            <label className="detail-field-label">
              {fieldName}
            </label>
            <div className="detail-field-value">
              {formatDetailValue(item[fieldName], field)}
            </div>
          </div>
        ))}

        <div className="detail-metadata">
          <div className="detail-metadata-content">
            <div><span className="detail-metadata-label">ID:</span> {item.id}</div>
            {item.createdAt && <div><span className="detail-metadata-label">Created:</span> {new Date(item.createdAt).toLocaleString()}</div>}
            {item.updatedAt && <div><span className="detail-metadata-label">Updated:</span> {new Date(item.updatedAt).toLocaleString()}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDetailValue(value: any, field: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="detail-field-empty">Not set</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="detail-field-empty">Empty list</span>;
    }
    return (
      <ul>
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
