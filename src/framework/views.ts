import type { EntityDefinition, UIMetadata } from './entities';
import { FieldGroup } from './entities';
import type { EntityDisplay, InstanceDisplay, Page } from './view-system';
import { createEntityDisplay, createInstanceDisplay, createPage } from './view-system';

/**
 * Helper function to get entity with custom field configurations applied
 */
export function getCustomizedEntity(
  entity: EntityDefinition,
  customFields?: FieldSelector[]
): EntityDefinition {
  if (!customFields) {
    return entity;
  }

  // Create a modified copy of the entity with custom UI metadata
  const customizedEntity: EntityDefinition = {
    ...entity,
    schema: { ...entity.schema },
    groups: entity.groups ? [...entity.groups] : undefined,
  };

  // First, hide all fields by default in custom views
  const allFieldNames = new Set<string>();
  for (const fieldName of Object.keys(customizedEntity.schema)) {
    allFieldNames.add(fieldName);
    const field = customizedEntity.schema[fieldName];
    customizedEntity.schema[fieldName] = {
      ...field,
      ui: {
        ...(field.ui || {}),
        hidden: true,
      },
    } as any; // Type assertion needed due to complex field types
  }

  // Process custom field selectors
  function applySelector(selector: FieldSelector | FieldGroup) {
    if (selector instanceof FieldGroup) {
      // Process group children recursively
      for (const child of selector.children) {
        applySelector(child); // Recursively process all children (FieldSelector or FieldGroup)
      }
    } else if (selector instanceof FieldSelector) {
      const fieldName = selector.fieldName;
      if (allFieldNames.has(fieldName) && customizedEntity.schema[fieldName]) {
        const field = customizedEntity.schema[fieldName];
        customizedEntity.schema[fieldName] = {
          ...field,
          ui: {
            ...(field.ui || {}),
            ...selector.uiMetadata,
            hidden: false, // Un-hide selected fields
          },
        } as any; // Type assertion needed due to complex field types
      }
    }
  }

  for (const selector of customFields) {
    applySelector(selector);
  }

  return customizedEntity;
}

/**
 * Field selector for custom views
 */
export class FieldSelector {
  public uiMetadata: UIMetadata = {};

  constructor(public fieldName: string) {}

  // Alignment methods
  alignLeft(): this {
    this.uiMetadata.alignLeft = true;
    return this;
  }

  alignRight(): this {
    this.uiMetadata.alignRight = true;
    return this;
  }

  alignCenter(): this {
    this.uiMetadata.alignCenter = true;
    return this;
  }

  // Styling methods
  bold(): this {
    this.uiMetadata.bold = true;
    return this;
  }

  large(): this {
    this.uiMetadata.large = true;
    return this;
  }

  color(value: string | ((val: any) => string)): this {
    this.uiMetadata.color = value;
    return this;
  }

  // Width
  width(value: number): this {
    this.uiMetadata.width = value;
    return this;
  }

  // Label customization
  label(text: string | null): this {
    this.uiMetadata.label = text;
    return this;
  }

  hideLabel(): this {
    this.uiMetadata.hideLabel = true;
    return this;
  }

  // Text customization
  prefix(value: string | ((val: any) => string)): this {
    this.uiMetadata.prefix = value;
    return this;
  }

  suffix(value: string | ((val: any) => string)): this {
    this.uiMetadata.suffix = value;
    return this;
  }

  // State
  readOnly(): this {
    this.uiMetadata.readOnly = true;
    return this;
  }

  hidden(): this {
    this.uiMetadata.hidden = true;
    return this;
  }
}

/**
 * Select a field for custom view configuration
 */
export function show(fieldName: string): FieldSelector {
  return new FieldSelector(fieldName);
}

// ============================================================================
// View Factory Functions
// ============================================================================

/**
 * Create a page with list view for an entity
 */
export function listView(entity: EntityDefinition, options?: {
  pageName?: string;
  pagePath?: string;
  customFields?: FieldSelector[];
}): Page {
  const entityForView = options?.customFields 
    ? getCustomizedEntity(entity, options.customFields)
    : entity;
    
  const display = createEntityDisplay('list', entityForView, {
    displayName: options?.pageName || `${entity.name} List`,
  });

  return createPage(
    `${entity.name}-list`,
    options?.pageName || entity.name,
    options?.pagePath || toKebabCase(entity.name),
    display
  );
}

/**
 * Create a page with grid view for an entity
 */
export function gridView(entity: EntityDefinition, options?: {
  pageName?: string;
  pagePath?: string;
  customFields?: FieldSelector[];
}): Page {
  const entityForView = options?.customFields 
    ? getCustomizedEntity(entity, options.customFields)
    : entity;
    
  const display = createEntityDisplay('grid', entityForView, {
    displayName: options?.pageName || `${entity.name} Grid`,
  });

  return createPage(
    `${entity.name}-grid`,
    options?.pageName || entity.name,
    options?.pagePath || toKebabCase(entity.name),
    display
  );
}

/**
 * Create a custom grid view with specific field configurations
 * @deprecated Use gridView with customFields option instead
 */
export function customGridView(
  entity: EntityDefinition, 
  fields: (FieldSelector | FieldGroup)[]
): Page {
  return gridView(entity, { customFields: fields as FieldSelector[] });
}

/**
 * Create a detail view (InstanceDisplay) for an entity
 */
export function detailView(entity: EntityDefinition, options?: {
  customFields?: FieldSelector[];
}): InstanceDisplay {
  const entityForView = options?.customFields 
    ? getCustomizedEntity(entity, options.customFields)
    : entity;
    
  return createInstanceDisplay('detail', entityForView, {
    displayName: `${entity.name} Detail`,
  });
}

/**
 * Create a form view (InstanceDisplay) for an entity
 */
export function formView(entity: EntityDefinition, options?: {
  customFields?: FieldSelector[];
}): InstanceDisplay {
  const entityForView = options?.customFields 
    ? getCustomizedEntity(entity, options.customFields)
    : entity;
    
  return createInstanceDisplay('form', entityForView, {
    displayName: `${entity.name} Form`,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
}
