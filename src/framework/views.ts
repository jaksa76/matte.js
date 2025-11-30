import type { EntityDefinition, UIMetadata, FieldType, EntitySchema } from './entities';
import { FieldGroup } from './entities';
import type { ViewType } from './registry';

/**
 * Base class for entity views
 */
export class View {
  constructor(
    public entity: EntityDefinition,
    public viewType: ViewType,
    public customFields?: FieldSelector[]
  ) {}

  /**
   * Get the entity with custom field configurations applied
   */
  getCustomizedEntity(): EntityDefinition {
    if (!this.customFields) {
      return this.entity;
    }

    // Create a modified copy of the entity with custom UI metadata
    const customizedEntity: EntityDefinition = {
      ...this.entity,
      schema: { ...this.entity.schema },
      groups: this.entity.groups ? [...this.entity.groups] : undefined,
    };

    // First, hide all fields by default in custom views
    const allFieldNames = new Set<string>();
    for (const fieldName of Object.keys(customizedEntity.schema)) {
      allFieldNames.add(fieldName);
      customizedEntity.schema[fieldName] = {
        ...customizedEntity.schema[fieldName],
        ui: {
          ...(customizedEntity.schema[fieldName].ui || {}),
          hidden: true,
        },
      };
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
          customizedEntity.schema[fieldName] = {
            ...customizedEntity.schema[fieldName],
            ui: {
              ...(customizedEntity.schema[fieldName].ui || {}),
              ...selector.uiMetadata,
              hidden: false, // Un-hide selected fields
            },
          };
        }
      }
    }

    for (const selector of this.customFields) {
      applySelector(selector);
    }

    return customizedEntity;
  }
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

/**
 * Wrap an entity to use list view
 */
export function listView(entity: EntityDefinition): View {
  return new View(entity, 'list');
}

/**
 * Wrap an entity to use grid view
 */
export function gridView(entity: EntityDefinition): View {
  return new View(entity, 'grid');
}

/**
 * Create a custom grid view with specific field configurations
 */
export function customGridView(entity: EntityDefinition, fields: (FieldSelector | FieldGroup)[]): View {
  return new View(entity, 'grid', fields as FieldSelector[]);
}
