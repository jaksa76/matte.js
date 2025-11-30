import { EntityRegistry } from './registry';

// Type system for field definitions
export type FieldType = 
  | StringField
  | NumberField
  | DateField
  | EnumField
  | RichTextField
  | FileField
  | BooleanField;

export interface BaseField {
  type: string;
  isRequired: boolean;
  default?: any;
  isArray: boolean;
}

export class StringField implements BaseField {
  type = 'string' as const;
  isRequired = false;
  isArray = false;
  _default?: string;
  _minLength?: number;
  _maxLength?: number;

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
    return field;
  }
}

export class NumberField implements BaseField {
  type = 'number' as const;
  isRequired = false;
  isArray = false;
  _default?: number;
  _min?: number;
  _max?: number;

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
    return field;
  }
}

export class DateField implements BaseField {
  type = 'date' as const;
  isRequired = false;
  isArray = false;
  _default?: Date;

  default(value: Date): this {
    this._default = value;
    return this;
  }

  required(): DateField {
    const field = new DateField();
    field.isRequired = true;
    field._default = this._default;
    return field;
  }
}

export class EnumField implements BaseField {
  type = 'enum' as const;
  isRequired = false;
  isArray = false;
  _default?: string;
  values: readonly string[];

  constructor(values: readonly string[]) {
    this.values = values;
  }

  default(value: string): EnumField {
    const field = new EnumField(this.values);
    field._default = value;
    field.isRequired = this.isRequired;
    return field;
  }

  required(): EnumField {
    const field = new EnumField(this.values);
    field.isRequired = true;
    field._default = this._default;
    return field;
  }
}

export class RichTextField implements BaseField {
  type = 'richtext' as const;
  isRequired = false;
  isArray = false;
  _default?: string;

  default(value: string): this {
    this._default = value;
    return this;
  }

  required(): RichTextField {
    const field = new RichTextField();
    field.isRequired = true;
    field._default = this._default;
    return field;
  }
}

export class FileField implements BaseField {
  type = 'file' as const;
  isRequired = false;
  isArray = false;
  _default?: string;
  _maxSize?: number;
  _allowedTypes?: string[];

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
    return new FileFieldArray();
  }

  required(): FileField {
    const field = new FileField();
    field.isRequired = true;
    field._default = this._default;
    field._maxSize = this._maxSize;
    field._allowedTypes = this._allowedTypes;
    return field;
  }
}

export class FileFieldArray implements BaseField {
  type = 'file' as const;
  isRequired = false;
  isArray = true;
  _default?: string[];
  _maxSize?: number;
  _allowedTypes?: string[];

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
    return field;
  }
}

export class BooleanField implements BaseField {
  type = 'boolean' as const;
  isRequired = false;
  isArray = false;
  _default?: boolean;

  default(value: boolean): this {
    this._default = value;
    return this;
  }

  required(): BooleanField {
    const field = new BooleanField();
    field.isRequired = true;
    field._default = this._default;
    return field;
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

// Entity definition
export interface EntitySchema {
  [fieldName: string]: FieldType;
}

export interface EntityDefinition {
  name: string;
  schema: EntitySchema;
  owned: boolean;
}

// Entity definition functions
export function ownedEntity(name: string, schema: EntitySchema): EntityDefinition {
  const definition: EntityDefinition = {
    name,
    schema,
    owned: true,
  };
  
  // Register the entity
  EntityRegistry.register(definition);
  
  return definition;
}

export function entity(name: string, schema: EntitySchema): EntityDefinition {
  const definition: EntityDefinition = {
    name,
    schema,
    owned: false,
  };
  
  // Register the entity
  EntityRegistry.register(definition);
  
  return definition;
}
