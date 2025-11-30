import React, { useState } from 'react';
import type { EntityDefinition, FieldType } from '../entities';

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
    <div style={{ padding: '20px' }}>
      <h1>{initialData?.id ? 'Edit' : 'Create'} {entity.name}</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        {Object.entries(entity.schema).map(([fieldName, field]) => (
          <div key={fieldName} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              {fieldName}
              {field.isRequired && <span style={{ color: 'red' }}> *</span>}
            </label>
            {renderField(fieldName, field, formData[fieldName], (value) => handleChange(fieldName, value))}
            {errors[fieldName] && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {errors[fieldName]}
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ padding: '8px 16px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Cancel
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
  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  };

  if (field.type === 'enum') {
    return (
      <select 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        <option value="">Select...</option>
        {field.values.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={inputStyle}
        min={'_min' in field ? field._min : undefined}
        max={'_max' in field ? field._max : undefined}
      />
    );
  }

  if (field.type === 'date') {
    const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
    return (
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        style={inputStyle}
      />
    );
  }

  if (field.type === 'richtext') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        style={inputStyle}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 'auto' }}
      />
    );
  }

  if (field.type === 'file' && field.isArray) {
    return (
      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          onChange(files.map(f => f.name));
        }}
        style={inputStyle}
      />
    );
  }

  if (field.type === 'file') {
    return (
      <input
        type="file"
        onChange={(e) => onChange(e.target.files?.[0]?.name || null)}
        style={inputStyle}
      />
    );
  }

  // Default: string input
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}
