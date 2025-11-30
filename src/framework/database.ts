import type { EntityDefinition, FieldType } from './entities';
import { Database } from 'bun:sqlite';

export interface DatabaseAdapter {
  initialize(): Promise<void>;
  createTable(entity: EntityDefinition): Promise<void>;
  insert(tableName: string, data: Record<string, any>): Promise<any>;
  findById(tableName: string, id: string): Promise<any>;
  findAll(tableName: string, filters?: Record<string, any>): Promise<any[]>;
  update(tableName: string, id: string, data: Record<string, any>): Promise<any>;
  delete(tableName: string, id: string): Promise<void>;
}

export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
  }

  async initialize(): Promise<void> {
    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
  }

  async createTable(entity: EntityDefinition): Promise<void> {
    const tableName = this.toSnakeCase(entity.name);
    const columns: string[] = [];

    // Add ID column
    columns.push('id TEXT PRIMARY KEY');

    // Add owner column for owned entities
    if (entity.owned) {
      columns.push('owner_id TEXT NOT NULL');
    }

    // Add timestamp columns
    columns.push('created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP');
    columns.push('updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP');

    // Add schema fields
    for (const [fieldName, field] of Object.entries(entity.schema)) {
      const columnName = this.toSnakeCase(fieldName);
      const columnDef = this.fieldToColumnDefinition(fieldName, field);
      if (columnDef) {
        columns.push(columnDef);
      }
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns.join(',\n        ')}
      )
    `;

    this.db.run(createTableSQL);

    // Create indexes
    if (entity.owned) {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_${tableName}_owner ON ${tableName}(owner_id)`);
    }
  }

  private fieldToColumnDefinition(fieldName: string, field: FieldType): string {
    const columnName = this.toSnakeCase(fieldName);
    let sqlType: string;

    if (field.isArray) {
      // Arrays stored as JSON
      sqlType = 'TEXT';
    } else {
      switch (field.type) {
        case 'string':
        case 'richtext':
        case 'file':
        case 'enum':
          sqlType = 'TEXT';
          break;
        case 'number':
          sqlType = 'REAL';
          break;
        case 'date':
          sqlType = 'TEXT'; // Store as ISO string
          break;
        case 'boolean':
          sqlType = 'INTEGER'; // 0 or 1
          break;
        default:
          sqlType = 'TEXT';
      }
    }

    let definition = `${columnName} ${sqlType}`;

    if (field.isRequired) {
      definition += ' NOT NULL';
    }

    if (field._default !== undefined) {
      if (field.type === 'string' || field.type === 'enum') {
        definition += ` DEFAULT '${field._default}'`;
      } else if (field.type === 'number' || field.type === 'boolean') {
        definition += ` DEFAULT ${field._default}`;
      }
    }

    return definition;
  }

  async insert(tableName: string, data: Record<string, any>): Promise<any> {
    const id = data.id || this.generateId();
    const now = new Date().toISOString();

    const record = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };

    const columns = Object.keys(record);
    const values = Object.values(record).map(v => this.serializeValue(v));
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    this.db.run(sql, ...values);

    return this.findById(tableName, id);
  }

  async findById(tableName: string, id: string): Promise<any> {
    const sql = `SELECT * FROM ${tableName} WHERE id = ?`;
    const row = this.db.query(sql).get(id);
    return row ? this.deserializeRow(row) : null;
  }

  async findAll(tableName: string, filters?: Record<string, any>): Promise<any[]> {
    let sql = `SELECT * FROM ${tableName}`;
    const params: any[] = [];

    if (filters && Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters).map(([key, _]) => {
        params.push(filters[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY created_at DESC';

    const rows = this.db.query(sql).all(...params);
    return rows.map(row => this.deserializeRow(row));
  }

  async update(tableName: string, id: string, data: Record<string, any>): Promise<any> {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updated_at: now,
    };

    const setClauses = Object.keys(updateData).map(key => `${key} = ?`);
    const values = Object.values(updateData).map(v => this.serializeValue(v));

    const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ?`;
    
    this.db.run(sql, ...values, id);

    return this.findById(tableName, id);
  }

  async delete(tableName: string, id: string): Promise<void> {
    const sql = `DELETE FROM ${tableName} WHERE id = ?`;
    this.db.run(sql, id);
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private serializeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (Array.isArray(value) || typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  }

  private deserializeRow(row: any): any {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (value === null) {
        result[key] = null;
      } else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  close(): void {
    this.db.close();
  }
}
