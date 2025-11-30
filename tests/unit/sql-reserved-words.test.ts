import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { SQLiteAdapter } from '../../src/framework/database';
import { ownedEntity, string, number } from '../../src/framework/entities';

describe('SQL Reserved Words', () => {
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    adapter = new SQLiteAdapter(':memory:');
    await adapter.initialize();
  });

  afterEach(() => {
    adapter.close();
  });

  test('handles "Order" entity name (SQL reserved word)', async () => {
    const Order = ownedEntity('Order', [
      string('status'),
      number('total'),
    ]);

    // Should not throw when creating table with reserved word name
    await adapter.createTable(Order);

    // Should be able to insert and retrieve data
    const inserted = await adapter.insert('order', { status: 'pending', total: 100, owner_id: 'user123' });
    
    expect(inserted).toBeDefined();
    expect(inserted?.status).toBe('pending');
    expect(inserted?.total).toBe(100);
    
    // Verify we can also retrieve it
    const retrieved = await adapter.findById('order', inserted.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe('pending');
    expect(retrieved?.total).toBe(100);
  });

  test('handles "User" entity name (SQL reserved word)', async () => {
    const User = ownedEntity('User', [
      string('name'),
      string('email'),
    ]);

    await adapter.createTable(User);

    const inserted = await adapter.insert('user', { name: 'John', email: 'john@example.com', owner_id: 'admin' });
    
    expect(inserted).toBeDefined();
    expect(inserted?.name).toBe('John');
    expect(inserted?.email).toBe('john@example.com');
  });

  test('handles "Group" entity name (SQL reserved word)', async () => {
    const Group = ownedEntity('Group', [
      string('name'),
      string('description'),
    ]);

    await adapter.createTable(Group);

    const inserted = await adapter.insert('group', { name: 'Admins', description: 'Admin group', owner_id: 'user1' });
    
    expect(inserted).toBeDefined();
    expect(inserted?.name).toBe('Admins');
    expect(inserted?.description).toBe('Admin group');
  });

  test('handles "Table" entity name (SQL reserved word)', async () => {
    const Table = ownedEntity('Table', [
      string('name'),
      number('seats'),
    ]);

    await adapter.createTable(Table);
  });

  test('handles multiple operations on reserved word entity', async () => {
    const Select = ownedEntity('Select', [
      string('option'),
      number('value'),
    ]);

    await adapter.createTable(Select);

    const item1 = await adapter.insert('select', { option: 'A', value: 1, owner_id: 'owner1' });
    const item2 = await adapter.insert('select', { option: 'B', value: 2, owner_id: 'owner1' });

    const all = await adapter.findAll('select', {});
    expect(all.length).toBe(2);

    const updated = await adapter.update('select', item1.id, { value: 10 });
    expect(updated?.value).toBe(10);

    await adapter.delete('select', item2.id);
    const remaining = await adapter.findAll('select', {});
    expect(remaining.length).toBe(1);
  });
});
