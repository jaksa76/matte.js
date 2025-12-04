import { EntityRegistry } from './registry';

// Type system for field definitions
export type FieldType = 
  | StringField
  | NumberField
  | DateField
  | EnumField
  | RichTextField
  | FileField
  | BooleanField
  | FieldGroup;

// UI customization metadata
export interface UIMetadata {
  label?: string | null;
  hideLabel?: boolean;
  floatingLabel?: boolean;
  width?: number;
  alignLeft?: boolean;
  alignRight?: boolean;
  alignCenter?: boolean;
  placeholder?: string;
  help?: string;
  prefix?: string | ((value: any) => string);
  suffix?: string | ((value: any) => string);
  hidden?: boolean;
  readOnly?: boolean;
  bold?: boolean;
  large?: boolean;
  color?: string | ((value: any) => string);
  style?: Record<string, any>;
}

export interface BaseField {
  type: string;
  isRequired: boolean;
  default?: any;
  isArray: boolean;
  ui?: UIMetadata;
}

export class StringField implements BaseField {
  type = 'string' as const;
  isRequired = false;
  isArray = false;
  _default?: string;
  _minLength?: number;
  _maxLength?: number;
  ui: UIMetadata = {};

  default(value: string): this {
    this._default = value;
    return this;
  }

  minLength(length: number): this {
    this._minLength = length;
    return this;
  }

  maxLength(length: number): this {
    this._maxLength = length;
    return this;
  }

  required(): StringField {
    const field = new StringField();
    field.isRequired = true;
    field._default = this._default;
    field._minLength = this._minLength;
    field._maxLength = this._maxLength;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this {
    this.ui.label = text;
    return this;
  }

  hideLabel(): this {
    this.ui.hideLabel = true;
    return this;
  }

  floatingLabel(): this {
    this.ui.floatingLabel = true;
    return this;
  }

  width(value: number): this {
    this.ui.width = value;
    return this;
  }

  alignLeft(): this {
    this.ui.alignLeft = true;
    return this;
  }

  alignRight(): this {
    this.ui.alignRight = true;
    return this;
  }

  alignCenter(): this {
    this.ui.alignCenter = true;
    return this;
  }

  placeholder(text: string): this {
    this.ui.placeholder = text;
    return this;
  }

  help(text: string): this {
    this.ui.help = text;
    return this;
  }

  prefix(text: string | ((value: any) => string)): this {
    this.ui.prefix = text;
    return this;
  }

  suffix(text: string | ((value: any) => string)): this {
    this.ui.suffix = text;
    return this;
  }

  hidden(): this {
    this.ui.hidden = true;
    return this;
  }

  readOnly(): this {
    this.ui.readOnly = true;
    return this;
  }

  bold(): this {
    this.ui.bold = true;
    return this;
  }

  large(): this {
    this.ui.large = true;
    return this;
  }

  color(value: string | ((val: any) => string)): this {
    this.ui.color = value;
    return this;
  }

  style(css: Record<string, any>): this {
    this.ui.style = css;
    return this;
  }
}

export class NumberField implements BaseField {
  type = 'number' as const;
  isRequired = false;
  isArray = false;
  _default?: number;
  _min?: number;
  _max?: number;
  ui: UIMetadata = {};

  default(value: number): this {
    this._default = value;
    return this;
  }

  min(value: number): this {
    this._min = value;
    return this;
  }

  max(value: number): this {
    this._max = value;
    return this;
  }

  required(): NumberField {
    const field = new NumberField();
    field.isRequired = true;
    field._default = this._default;
    field._min = this._min;
    field._max = this._max;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this { this.ui.label = text; return this; }
  hideLabel(): this { this.ui.hideLabel = true; return this; }
  floatingLabel(): this { this.ui.floatingLabel = true; return this; }
  width(value: number): this { this.ui.width = value; return this; }
  alignLeft(): this { this.ui.alignLeft = true; return this; }
  alignRight(): this { this.ui.alignRight = true; return this; }
  alignCenter(): this { this.ui.alignCenter = true; return this; }
  placeholder(text: string): this { this.ui.placeholder = text; return this; }
  help(text: string): this { this.ui.help = text; return this; }
  prefix(text: string | ((value: any) => string)): this { this.ui.prefix = text; return this; }
  suffix(text: string | ((value: any) => string)): this { this.ui.suffix = text; return this; }
  hidden(): this { this.ui.hidden = true; return this; }
  readOnly(): this { this.ui.readOnly = true; return this; }
  bold(): this { this.ui.bold = true; return this; }
  large(): this { this.ui.large = true; return this; }
  color(value: string | ((val: any) => string)): this { this.ui.color = value; return this; }
  style(css: Record<string, any>): this { this.ui.style = css; return this; }
}

export class DateField implements BaseField {
  type = 'date' as const;
  isRequired = false;
  isArray = false;
  _default?: Date;
  ui: UIMetadata = {};

  default(value: Date): this {
    this._default = value;
    return this;
  }

  required(): DateField {
    const field = new DateField();
    field.isRequired = true;
    field._default = this._default;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this { this.ui.label = text; return this; }
  hideLabel(): this { this.ui.hideLabel = true; return this; }
  floatingLabel(): this { this.ui.floatingLabel = true; return this; }
  width(value: number): this { this.ui.width = value; return this; }
  alignLeft(): this { this.ui.alignLeft = true; return this; }
  alignRight(): this { this.ui.alignRight = true; return this; }
  alignCenter(): this { this.ui.alignCenter = true; return this; }
  placeholder(text: string): this { this.ui.placeholder = text; return this; }
  help(text: string): this { this.ui.help = text; return this; }
  prefix(text: string | ((value: any) => string)): this { this.ui.prefix = text; return this; }
  suffix(text: string | ((value: any) => string)): this { this.ui.suffix = text; return this; }
  hidden(): this { this.ui.hidden = true; return this; }
  readOnly(): this { this.ui.readOnly = true; return this; }
  bold(): this { this.ui.bold = true; return this; }
  large(): this { this.ui.large = true; return this; }
  color(value: string | ((val: any) => string)): this { this.ui.color = value; return this; }
  style(css: Record<string, any>): this { this.ui.style = css; return this; }
}

export class EnumField implements BaseField {
  type = 'enum' as const;
  isRequired = false;
  isArray = false;
  _default?: string;
  values: readonly string[];
  ui: UIMetadata = {};

  constructor(values: readonly string[]) {
    this.values = values;
  }

  default(value: string): EnumField {
    const field = new EnumField(this.values);
    field._default = value;
    field.isRequired = this.isRequired;
    field.ui = { ...this.ui };
    return field;
  }

  required(): EnumField {
    const field = new EnumField(this.values);
    field.isRequired = true;
    field._default = this._default;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this { this.ui.label = text; return this; }
  hideLabel(): this { this.ui.hideLabel = true; return this; }
  floatingLabel(): this { this.ui.floatingLabel = true; return this; }
  width(value: number): this { this.ui.width = value; return this; }
  alignLeft(): this { this.ui.alignLeft = true; return this; }
  alignRight(): this { this.ui.alignRight = true; return this; }
  alignCenter(): this { this.ui.alignCenter = true; return this; }
  placeholder(text: string): this { this.ui.placeholder = text; return this; }
  help(text: string): this { this.ui.help = text; return this; }
  prefix(text: string | ((value: any) => string)): this { this.ui.prefix = text; return this; }
  suffix(text: string | ((value: any) => string)): this { this.ui.suffix = text; return this; }
  hidden(): this { this.ui.hidden = true; return this; }
  readOnly(): this { this.ui.readOnly = true; return this; }
  bold(): this { this.ui.bold = true; return this; }
  large(): this { this.ui.large = true; return this; }
  color(value: string | ((val: any) => string)): this { this.ui.color = value; return this; }
  style(css: Record<string, any>): this { this.ui.style = css; return this; }
}

export class RichTextField implements BaseField {
  type = 'richtext' as const;
  isRequired = false;
  isArray = false;
  _default?: string;
  ui: UIMetadata = {};

  default(value: string): this {
    this._default = value;
    return this;
  }

  required(): RichTextField {
    const field = new RichTextField();
    field.isRequired = true;
    field._default = this._default;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this { this.ui.label = text; return this; }
  hideLabel(): this { this.ui.hideLabel = true; return this; }
  floatingLabel(): this { this.ui.floatingLabel = true; return this; }
  width(value: number): this { this.ui.width = value; return this; }
  alignLeft(): this { this.ui.alignLeft = true; return this; }
  alignRight(): this { this.ui.alignRight = true; return this; }
  alignCenter(): this { this.ui.alignCenter = true; return this; }
  placeholder(text: string): this { this.ui.placeholder = text; return this; }
  help(text: string): this { this.ui.help = text; return this; }
  prefix(text: string | ((value: any) => string)): this { this.ui.prefix = text; return this; }
  suffix(text: string | ((value: any) => string)): this { this.ui.suffix = text; return this; }
  hidden(): this { this.ui.hidden = true; return this; }
  readOnly(): this { this.ui.readOnly = true; return this; }
  bold(): this { this.ui.bold = true; return this; }
  large(): this { this.ui.large = true; return this; }
  color(value: string | ((val: any) => string)): this { this.ui.color = value; return this; }
  style(css: Record<string, any>): this { this.ui.style = css; return this; }
}

export class FileField implements BaseField {
  type = 'file' as const;
  isRequired = false;
  isArray = false;
  _default?: string;
  _maxSize?: number;
  _allowedTypes?: string[];
  ui: UIMetadata = {};

  default(value: string): this {
    this._default = value;
    return this;
  }

  maxSize(bytes: number): this {
    this._maxSize = bytes;
    return this;
  }

  allowedTypes(types: string[]): this {
    this._allowedTypes = types;
    return this;
  }

  array(): FileFieldArray {
    const field = new FileFieldArray();
    field.ui = { ...this.ui };
    return field;
  }

  required(): FileField {
    const field = new FileField();
    field.isRequired = true;
    field._default = this._default;
    field._maxSize = this._maxSize;
    field._allowedTypes = this._allowedTypes;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this { this.ui.label = text; return this; }
  hideLabel(): this { this.ui.hideLabel = true; return this; }
  floatingLabel(): this { this.ui.floatingLabel = true; return this; }
  width(value: number): this { this.ui.width = value; return this; }
  alignLeft(): this { this.ui.alignLeft = true; return this; }
  alignRight(): this { this.ui.alignRight = true; return this; }
  alignCenter(): this { this.ui.alignCenter = true; return this; }
  placeholder(text: string): this { this.ui.placeholder = text; return this; }
  help(text: string): this { this.ui.help = text; return this; }
  prefix(text: string | ((value: any) => string)): this { this.ui.prefix = text; return this; }
  suffix(text: string | ((value: any) => string)): this { this.ui.suffix = text; return this; }
  hidden(): this { this.ui.hidden = true; return this; }
  readOnly(): this { this.ui.readOnly = true; return this; }
  bold(): this { this.ui.bold = true; return this; }
  large(): this { this.ui.large = true; return this; }
  color(value: string | ((val: any) => string)): this { this.ui.color = value; return this; }
  style(css: Record<string, any>): this { this.ui.style = css; return this; }
}

export class FileFieldArray implements BaseField {
  type = 'file' as const;
  isRequired = false;
  isArray = true;
  _default?: string[];
  _maxSize?: number;
  _allowedTypes?: string[];
  ui: UIMetadata = {};

  default(value: string[]): this {
    this._default = value;
    return this;
  }

  maxSize(bytes: number): this {
    this._maxSize = bytes;
    return this;
  }

  allowedTypes(types: string[]): this {
    this._allowedTypes = types;
    return this;
  }

  required(): FileFieldArray {
    const field = new FileFieldArray();
    field.isRequired = true;
    field._default = this._default;
    field._maxSize = this._maxSize;
    field._allowedTypes = this._allowedTypes;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this { this.ui.label = text; return this; }
  hideLabel(): this { this.ui.hideLabel = true; return this; }
  floatingLabel(): this { this.ui.floatingLabel = true; return this; }
  width(value: number): this { this.ui.width = value; return this; }
  alignLeft(): this { this.ui.alignLeft = true; return this; }
  alignRight(): this { this.ui.alignRight = true; return this; }
  alignCenter(): this { this.ui.alignCenter = true; return this; }
  placeholder(text: string): this { this.ui.placeholder = text; return this; }
  help(text: string): this { this.ui.help = text; return this; }
  prefix(text: string | ((value: any) => string)): this { this.ui.prefix = text; return this; }
  suffix(text: string | ((value: any) => string)): this { this.ui.suffix = text; return this; }
  hidden(): this { this.ui.hidden = true; return this; }
  readOnly(): this { this.ui.readOnly = true; return this; }
  bold(): this { this.ui.bold = true; return this; }
  large(): this { this.ui.large = true; return this; }
  color(value: string | ((val: any) => string)): this { this.ui.color = value; return this; }
  style(css: Record<string, any>): this { this.ui.style = css; return this; }
}

export class BooleanField implements BaseField {
  type = 'boolean' as const;
  isRequired = false;
  isArray = false;
  _default?: boolean;
  ui: UIMetadata = {};

  default(value: boolean): this {
    this._default = value;
    return this;
  }

  required(): BooleanField {
    const field = new BooleanField();
    field.isRequired = true;
    field._default = this._default;
    field.ui = { ...this.ui };
    return field;
  }

  // UI Customization methods
  label(text: string): this { this.ui.label = text; return this; }
  hideLabel(): this { this.ui.hideLabel = true; return this; }
  floatingLabel(): this { this.ui.floatingLabel = true; return this; }
  width(value: number): this { this.ui.width = value; return this; }
  alignLeft(): this { this.ui.alignLeft = true; return this; }
  alignRight(): this { this.ui.alignRight = true; return this; }
  alignCenter(): this { this.ui.alignCenter = true; return this; }
  placeholder(text: string): this { this.ui.placeholder = text; return this; }
  help(text: string): this { this.ui.help = text; return this; }
  prefix(text: string | ((value: any) => string)): this { this.ui.prefix = text; return this; }
  suffix(text: string | ((value: any) => string)): this { this.ui.suffix = text; return this; }
  hidden(): this { this.ui.hidden = true; return this; }
  readOnly(): this { this.ui.readOnly = true; return this; }
  bold(): this { this.ui.bold = true; return this; }
  large(): this { this.ui.large = true; return this; }
  color(value: string | ((val: any) => string)): this { this.ui.color = value; return this; }
  style(css: Record<string, any>): this { this.ui.style = css; return this; }
}

// Field Group for organizing fields
export class FieldGroup implements BaseField {
  type = 'group' as const;
  isRequired = false;
  isArray = false;
  _default?: any;
  ui: UIMetadata = {};
  
  label: string | null;
  children: (FieldDefinition | FieldBuilder<any> | FieldGroup | any)[]; // 'any' allows FieldSelector from views.ts
  horizontal: boolean;
  _collapsible?: boolean;
  _id?: string;
  _border?: string;
  _padding?: string;

  constructor(label: string | null, children: (FieldDefinition | FieldBuilder<any> | FieldGroup | any)[], horizontal = false) {
    this.label = label;
    this.children = children;
    this.horizontal = horizontal;
  }

  collapsible(): this {
    this._collapsible = true;
    return this;
  }

  id(value: string): this {
    this._id = value;
    return this;
  }

  border(value: string): this {
    this._border = value;
    return this;
  }

  padding(value: string): this {
    this._padding = value;
    return this;
  }

  // Required method for BaseField interface (not really applicable to groups)
  required(): FieldGroup {
    return this;
  }
}

// Field factory (the 't' object)
export const t = {
  string: () => new StringField(),
  number: () => new NumberField(),
  date: () => new DateField(),
  enum: <T extends readonly string[]>(values: T) => new EnumField(values),
  richtext: () => new RichTextField(),
  file: () => new FileField(),
  boolean: () => new BooleanField(),
};

// Field definition with name (for array-based schemas)
export interface FieldDefinition {
  name: string;
  field: FieldType;
}

// Helper function to create a field definition
export function field(name: string, fieldType: FieldType): FieldDefinition {
  return { name, field: fieldType };
}

// Wrapper class to allow method chaining on shortcut helpers
class FieldBuilder<T extends FieldType> {
  constructor(public name: string, public fieldType: T) {}

  // Proxy all field type methods
  required(): this {
    this.fieldType = this.fieldType.required() as T;
    return this;
  }

  default(value: any): this {
    if ('default' in this.fieldType && typeof this.fieldType.default === 'function') {
      this.fieldType = this.fieldType.default(value) as T;
    }
    return this;
  }

  // StringField methods
  minLength(length: number): this {
    if ('minLength' in this.fieldType) {
      (this.fieldType as any).minLength(length);
    }
    return this;
  }

  maxLength(length: number): this {
    if ('maxLength' in this.fieldType) {
      (this.fieldType as any).maxLength(length);
    }
    return this;
  }

  // NumberField methods
  min(value: number): this {
    if ('min' in this.fieldType) {
      (this.fieldType as any).min(value);
    }
    return this;
  }

  max(value: number): this {
    if ('max' in this.fieldType) {
      (this.fieldType as any).max(value);
    }
    return this;
  }

  // FileField methods
  array(): this {
    if ('array' in this.fieldType) {
      this.fieldType = (this.fieldType as any).array();
    }
    return this;
  }

  maxSize(bytes: number): this {
    if ('maxSize' in this.fieldType) {
      (this.fieldType as any).maxSize(bytes);
    }
    return this;
  }

  allowedTypes(types: string[]): this {
    if ('allowedTypes' in this.fieldType) {
      (this.fieldType as any).allowedTypes(types);
    }
    return this;
  }

  // UI Customization methods
  label(text: string): this {
    if ('label' in this.fieldType) {
      (this.fieldType as any).label(text);
    }
    return this;
  }

  hideLabel(): this {
    if ('hideLabel' in this.fieldType) {
      (this.fieldType as any).hideLabel();
    }
    return this;
  }

  floatingLabel(): this {
    if ('floatingLabel' in this.fieldType) {
      (this.fieldType as any).floatingLabel();
    }
    return this;
  }

  width(value: number): this {
    if ('width' in this.fieldType) {
      (this.fieldType as any).width(value);
    }
    return this;
  }

  alignLeft(): this {
    if ('alignLeft' in this.fieldType) {
      (this.fieldType as any).alignLeft();
    }
    return this;
  }

  alignRight(): this {
    if ('alignRight' in this.fieldType) {
      (this.fieldType as any).alignRight();
    }
    return this;
  }

  alignCenter(): this {
    if ('alignCenter' in this.fieldType) {
      (this.fieldType as any).alignCenter();
    }
    return this;
  }

  placeholder(text: string): this {
    if ('placeholder' in this.fieldType) {
      (this.fieldType as any).placeholder(text);
    }
    return this;
  }

  help(text: string): this {
    if ('help' in this.fieldType) {
      (this.fieldType as any).help(text);
    }
    return this;
  }

  prefix(text: string | ((value: any) => string)): this {
    if ('prefix' in this.fieldType) {
      (this.fieldType as any).prefix(text);
    }
    return this;
  }

  suffix(text: string | ((value: any) => string)): this {
    if ('suffix' in this.fieldType) {
      (this.fieldType as any).suffix(text);
    }
    return this;
  }

  hidden(): this {
    if ('hidden' in this.fieldType) {
      (this.fieldType as any).hidden();
    }
    return this;
  }

  readOnly(): this {
    if ('readOnly' in this.fieldType) {
      (this.fieldType as any).readOnly();
    }
    return this;
  }

  bold(): this {
    if ('bold' in this.fieldType) {
      (this.fieldType as any).bold();
    }
    return this;
  }

  large(): this {
    if ('large' in this.fieldType) {
      (this.fieldType as any).large();
    }
    return this;
  }

  color(value: string | ((val: any) => string)): this {
    if ('color' in this.fieldType) {
      (this.fieldType as any).color(value);
    }
    return this;
  }

  style(css: Record<string, any>): this {
    if ('style' in this.fieldType) {
      (this.fieldType as any).style(css);
    }
    return this;
  }

  // Convert to FieldDefinition
  toFieldDefinition(): FieldDefinition {
    return { name: this.name, field: this.fieldType };
  }
}

// Shortcut helpers for common field types
export function string(name: string): FieldBuilder<StringField> {
  return new FieldBuilder(name, t.string());
}

export function number(name: string): FieldBuilder<NumberField> {
  return new FieldBuilder(name, t.number());
}

export function date(name: string): FieldBuilder<DateField> {
  return new FieldBuilder(name, t.date());
}

export function richtext(name: string): FieldBuilder<RichTextField> {
  return new FieldBuilder(name, t.richtext());
}

export function file(name: string): FieldBuilder<FileField> {
  return new FieldBuilder(name, t.file());
}

export function boolean(name: string): FieldBuilder<BooleanField> {
  return new FieldBuilder(name, t.boolean());
}

// Group helpers
export function group(labelOrChildren: string | null | (FieldDefinition | FieldBuilder<any> | FieldGroup | any)[], children?: (FieldDefinition | FieldBuilder<any> | FieldGroup | any)[]): FieldGroup {
  if (Array.isArray(labelOrChildren)) {
    return new FieldGroup(null, labelOrChildren, false);
  }
  return new FieldGroup(labelOrChildren, children || [], false);
}

export function hgroup(labelOrChildren: string | null | (FieldDefinition | FieldBuilder<any> | FieldGroup | any)[], children?: (FieldDefinition | FieldBuilder<any> | FieldGroup | any)[]): FieldGroup {
  if (Array.isArray(labelOrChildren)) {
    return new FieldGroup(null, labelOrChildren, true);
  }
  return new FieldGroup(labelOrChildren, children || [], true);
}

// Entity definition
export interface EntitySchema {
  [fieldName: string]: FieldType;
}

export type EntitySchemaDefinition = (FieldDefinition | FieldBuilder<any> | FieldGroup)[];

export type AccessLevel = 'unauthenticated' | 'authenticated' | 'owner';
export type Lifecycle = 'default' | 'instancePerUser' | 'singleton';

export interface EntityDefinition {
  name: string;
  schema: EntitySchema;
  owned: boolean;
  fieldOrder: string[]; // Field order is always preserved
  groups?: FieldGroup[]; // Groups for organizing fields
  readLevel?: AccessLevel;
  writeLevel?: AccessLevel;
  lifecycle?: Lifecycle;
}

// Helper to convert array schema to object schema
function normalizeSchema(schemaDefinition: EntitySchemaDefinition): { schema: EntitySchema; fieldOrder: string[]; groups: FieldGroup[] } {
  const schema: EntitySchema = {};
  const fieldOrder: string[] = [];
  const groups: FieldGroup[] = [];
  
  function processItem(item: FieldDefinition | FieldBuilder<any> | FieldGroup) {
    if (item instanceof FieldGroup) {
      groups.push(item);
      // Process children recursively
      for (const child of item.children) {
        processItem(child);
      }
    } else {
      // Handle both FieldDefinition and FieldBuilder
      const fieldDef = item instanceof FieldBuilder ? item.toFieldDefinition() : item;
      schema[fieldDef.name] = fieldDef.field;
      fieldOrder.push(fieldDef.name);
    }
  }
  
  for (const item of schemaDefinition) {
    processItem(item);
  }
  
  return { schema, fieldOrder, groups };
}

// Validation function for entity definitions
export function validateEntityDefinition(definition: EntityDefinition): void {
  const { readLevel = 'unauthenticated', writeLevel = 'unauthenticated', lifecycle = 'default' } = definition;
  
  // Access level hierarchy: unauthenticated < authenticated < owner
  const levels: Record<AccessLevel, number> = {
    unauthenticated: 0,
    authenticated: 1,
    owner: 2,
  };
  
  // Check lifecycle constraints first
  // instancePerUser cannot have unauthenticated readLevel
  if (lifecycle === 'instancePerUser' && readLevel === 'unauthenticated') {
    throw new Error(
      `Entity ${definition.name} with lifecycle 'instancePerUser' cannot have readLevel 'unauthenticated'`
    );
  }
  
  // singleton cannot have owner readLevel or writeLevel
  if (lifecycle === 'singleton' && (readLevel === 'owner' || writeLevel === 'owner')) {
    throw new Error(
      `Entity ${definition.name} with lifecycle 'singleton' cannot have readLevel or writeLevel set to 'owner'`
    );
  }
  
  // writeLevel must not exceed readLevel
  if (levels[writeLevel] < levels[readLevel]) {
    throw new Error(
      `Invalid access levels for ${definition.name}: writeLevel (${writeLevel}) must not be more permissive than readLevel (${readLevel})`
    );
  }
}

// Entity builder class
class EntityBuilder implements EntityDefinition {
  private definition: EntityDefinition;
  
  constructor(definition: EntityDefinition) {
    this.definition = definition;
  }
  
  // Expose EntityDefinition properties
  get name() { return this.definition.name; }
  get schema() { return this.definition.schema; }
  get owned() { return this.definition.owned; }
  get fieldOrder() { return this.definition.fieldOrder; }
  get groups() { return this.definition.groups; }
  get readLevel() { return this.definition.readLevel; }
  get writeLevel() { return this.definition.writeLevel; }
  get lifecycle() { return this.definition.lifecycle; }
  
  readLevel(level: AccessLevel): this {
    this.definition.readLevel = level;
    return this;
  }
  
  writeLevel(level: AccessLevel): this {
    this.definition.writeLevel = level;
    return this;
  }
  
  lifecycle(mode: Lifecycle): this {
    this.definition.lifecycle = mode;
    return this;
  }
  
  build(): EntityDefinition {
    // Validate before returning
    validateEntityDefinition(this.definition);
    return this.definition;
  }
}

// Entity definition functions with builder support
type EntityOrBuilder = EntityDefinition & {
  readLevel(level: AccessLevel): EntityBuilder;
  writeLevel(level: AccessLevel): EntityBuilder;
  lifecycle(mode: Lifecycle): EntityBuilder;
  build(): EntityDefinition;
};

export function ownedEntity(
  name: string, 
  schemaDefinition: EntitySchemaDefinition
): EntityOrBuilder {
  const { schema, fieldOrder, groups } = normalizeSchema(schemaDefinition);
  
  const definition: EntityDefinition = {
    name,
    schema,
    owned: true,
    fieldOrder,
    groups: groups.length > 0 ? groups : undefined,
    readLevel: 'unauthenticated',
    writeLevel: 'unauthenticated',
    lifecycle: 'default',
  };
  
  return new EntityBuilder(definition) as any;
}

export function entity(
  name: string, 
  schemaDefinition: EntitySchemaDefinition
): EntityOrBuilder {
  const { schema, fieldOrder, groups } = normalizeSchema(schemaDefinition);
  
  const definition: EntityDefinition = {
    name,
    schema,
    owned: false,
    fieldOrder,
    groups: groups.length > 0 ? groups : undefined,
    readLevel: 'unauthenticated',
    writeLevel: 'unauthenticated',
    lifecycle: 'default',
  };
  
  return new EntityBuilder(definition) as any;
}

// Shorthand helpers for common entity types
export function privateEntity(
  name: string,
  schemaDefinition: EntitySchemaDefinition
): EntityOrBuilder {
  return ownedEntity(name, schemaDefinition)
    .readLevel('owner')
    .writeLevel('owner') as any;
}

export function sharedEntity(
  name: string,
  schemaDefinition: EntitySchemaDefinition
): EntityOrBuilder {
  return entity(name, schemaDefinition)
    .readLevel('unauthenticated')
    .writeLevel('authenticated') as any;
}

export function singletonEntity(
  name: string,
  schemaDefinition: EntitySchemaDefinition
): EntityOrBuilder {
  return entity(name, schemaDefinition)
    .lifecycle('singleton')
    .readLevel('authenticated')
    .writeLevel('authenticated') as any;
}
