import { useState } from 'react';
import type { EntityDefinition, FieldType } from '../entities';
import { Save, X } from 'lucide-react';
import './styles.css';

export interface FormViewProps {
  entity: EntityDefinition;
  initialData?: any;
  apiUrl: string;
  onSuccess?: (item: any) => void;
  onCancel?: () => void;
}

export function FormView({ entity, initialData, apiUrl, onSuccess, onCancel }: FormViewProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const [fieldName, field] of Object.entries(entity.schema)) {
      const value = formData[fieldName];

      if (field.isRequired && (value === undefined || value === null || value === '')) {
        newErrors[fieldName] = 'This field is required';
      }

      if (field.type === 'number' && 'min' in field && field._min !== undefined) {
        if (value < field._min) {
          newErrors[fieldName] = `Value must be at least ${field._min}`;
        }
      }

      if (field.type === 'number' && 'max' in field && field._max !== undefined) {
        if (value > field._max) {
          newErrors[fieldName] = `Value must be at most ${field._max}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `${apiUrl}/${initialData.id}` : apiUrl;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      const result = await response.json();
      onSuccess?.(result);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-view-container">
      <h1 className="form-view-title">{initialData?.id ? 'Edit' : 'Create'} {entity.name}</h1>

      <form onSubmit={handleSubmit} className="form-card">
        {Object.entries(entity.schema).map(([fieldName, field]) => {
          // Skip hidden fields
          if (field.ui?.hidden) return null;

          const ui = field.ui || {};
          const labelText = ui.label !== undefined ? ui.label : fieldName;
          const showLabel = !ui.hideLabel && labelText !== null;
          
          // Calculate field width style - use percentage width instead of grid
          const widthStyle: React.CSSProperties = {};
          if (ui.width !== undefined) {
            widthStyle.width = `${ui.width * 100}%`;
            widthStyle.display = 'inline-block';
            widthStyle.verticalAlign = 'top';
            if (ui.width < 1) {
              widthStyle.paddingRight = '12px';
            }
          }
          
          return (
            <div 
              key={fieldName} 
              className="form-group"
              style={widthStyle}
            >
              {showLabel && (
                <label className={`form-label ${ui.floatingLabel ? 'floating' : ''}`}>
                  {labelText}
                  {field.isRequired && <span className="required"> *</span>}
                </label>
              )}
              {renderField(fieldName, field, formData[fieldName], (value) => handleChange(fieldName, value))}
              {ui.help && (
                <div className="form-help">
                  {ui.help}
                </div>
              )}
              {errors[fieldName] && (
                <div className="form-error">
                  {errors[fieldName]}
                </div>
              )}
            </div>
          );
        })}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={submitting}
            className="btn btn-primary"
          >
            <Save size={16} />
            <span>{submitting ? 'Saving...' : 'Save'}</span>
          </button>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="btn btn-secondary"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function renderField(
  fieldName: string,
  field: FieldType,
  value: any,
  onChange: (value: any) => void
): React.ReactNode {
  const ui = field.ui || {};
  const isReadOnly = ui.readOnly || false;
  const placeholderText = ui.placeholder || '';
  
  // Build class names
  const baseClasses = ['form-input'];
  if (ui.bold) baseClasses.push('bold');
  if (ui.large) baseClasses.push('large');
  
  // Build inline styles
  const inlineStyle: React.CSSProperties = {};
  if (ui.alignLeft) inlineStyle.textAlign = 'left';
  if (ui.alignRight) inlineStyle.textAlign = 'right';
  if (ui.alignCenter) inlineStyle.textAlign = 'center';
  
  // Handle color (can be string or function)
  const colorValue = typeof ui.color === 'function' ? ui.color(value) : ui.color;
  if (colorValue) inlineStyle.color = colorValue;
  
  // Merge custom styles
  const finalStyle = { ...inlineStyle, ...ui.style };
  
  // Helper to wrap value with prefix/suffix
  const wrapValue = (displayValue: React.ReactNode): React.ReactNode => {
    const prefixText = typeof ui.prefix === 'function' ? ui.prefix(value) : ui.prefix;
    const suffixText = typeof ui.suffix === 'function' ? ui.suffix(value) : ui.suffix;
    
    if (!prefixText && !suffixText) return displayValue;
    
    return (
      <div className="input-wrapper">
        {prefixText && <span className="input-prefix">{prefixText}</span>}
        {displayValue}
        {suffixText && <span className="input-suffix">{suffixText}</span>}
      </div>
    );
  };

  if (field.type === 'enum') {
    return wrapValue(
      <select 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className={baseClasses.join(' ')}
        style={finalStyle}
        disabled={isReadOnly}
      >
        <option value="">{placeholderText || 'Select...'}</option>
        {field.values.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'number') {
    return wrapValue(
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={baseClasses.join(' ')}
        style={finalStyle}
        min={'_min' in field ? field._min : undefined}
        max={'_max' in field ? field._max : undefined}
        placeholder={placeholderText}
        readOnly={isReadOnly}
      />
    );
  }

  if (field.type === 'date') {
    const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
    return wrapValue(
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        className={baseClasses.join(' ')}
        style={finalStyle}
        readOnly={isReadOnly}
      />
    );
  }

  if (field.type === 'richtext') {
    return wrapValue(
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className={baseClasses.concat('form-textarea').join(' ')}
        style={finalStyle}
        placeholder={placeholderText}
        readOnly={isReadOnly}
      />
    );
  }

  if (field.type === 'boolean') {
    return wrapValue(
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        className={baseClasses.join(' ')}
        style={finalStyle}
        disabled={isReadOnly}
      />
    );
  }

  if (field.type === 'file' && field.isArray) {
    return wrapValue(
      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          onChange(files.map(f => f.name));
        }}
        className={baseClasses.join(' ')}
        style={finalStyle}
        disabled={isReadOnly}
      />
    );
  }

  if (field.type === 'file') {
    return wrapValue(
      <input
        type="file"
        onChange={(e) => onChange(e.target.files?.[0]?.name || null)}
        className={baseClasses.join(' ')}
        style={finalStyle}
        disabled={isReadOnly}
      />
    );
  }

  // Default: string input
  return wrapValue(
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={baseClasses.join(' ')}
      style={finalStyle}
      placeholder={placeholderText}
      readOnly={isReadOnly}
    />
  );
}
