import { describe, test, expect } from 'bun:test';
import { string, number, date, boolean, group, hgroup, ownedEntity } from '../../src/framework/entities';

describe('Field Customization', () => {
  describe('UI Metadata Methods', () => {
    test('label() sets custom label', () => {
      const field = string('firstName').label('First Name');
      expect(field.fieldType.ui?.label).toBe('First Name');
    });

    test('hideLabel() hides field label', () => {
      const field = string('name').hideLabel();
      expect(field.fieldType.ui?.hideLabel).toBe(true);
    });

    test('floatingLabel() enables floating label', () => {
      const field = string('email').floatingLabel();
      expect(field.fieldType.ui?.floatingLabel).toBe(true);
    });

    test('width() sets field width', () => {
      const field = string('name').width(0.5);
      expect(field.fieldType.ui?.width).toBe(0.5);
    });

    test('alignLeft() sets left alignment', () => {
      const field = string('name').alignLeft();
      expect(field.fieldType.ui?.alignLeft).toBe(true);
    });

    test('alignRight() sets right alignment', () => {
      const field = number('amount').alignRight();
      expect(field.fieldType.ui?.alignRight).toBe(true);
    });

    test('alignCenter() sets center alignment', () => {
      const field = number('score').alignCenter();
      expect(field.fieldType.ui?.alignCenter).toBe(true);
    });

    test('placeholder() sets placeholder text', () => {
      const field = string('email').placeholder('user@example.com');
      expect(field.fieldType.ui?.placeholder).toBe('user@example.com');
    });

    test('help() sets help text', () => {
      const field = string('password').help('Must be at least 8 characters');
      expect(field.fieldType.ui?.help).toBe('Must be at least 8 characters');
    });

    test('prefix() sets prefix string', () => {
      const field = number('price').prefix('$');
      expect(field.fieldType.ui?.prefix).toBe('$');
    });

    test('suffix() sets suffix string', () => {
      const field = number('age').suffix(' years');
      expect(field.fieldType.ui?.suffix).toBe(' years');
    });

    test('prefix() accepts function', () => {
      const prefixFn = (value: any) => value > 0 ? '+' : '';
      const field = number('change').prefix(prefixFn);
      expect(field.fieldType.ui?.prefix).toBe(prefixFn);
    });

    test('suffix() accepts function', () => {
      const suffixFn = (value: any) => value === 1 ? ' item' : ' items';
      const field = number('count').suffix(suffixFn);
      expect(field.fieldType.ui?.suffix).toBe(suffixFn);
    });

    test('hidden() hides field', () => {
      const field = string('internal').hidden();
      expect(field.fieldType.ui?.hidden).toBe(true);
    });

    test('readOnly() makes field read-only', () => {
      const field = string('computed').readOnly();
      expect(field.fieldType.ui?.readOnly).toBe(true);
    });

    test('bold() makes text bold', () => {
      const field = string('title').bold();
      expect(field.fieldType.ui?.bold).toBe(true);
    });

    test('large() makes text large', () => {
      const field = string('heading').large();
      expect(field.fieldType.ui?.large).toBe(true);
    });

    test('color() sets text color string', () => {
      const field = string('status').color('#00aa00');
      expect(field.fieldType.ui?.color).toBe('#00aa00');
    });

    test('color() accepts function', () => {
      const colorFn = (value: any) => value === 'active' ? 'green' : 'red';
      const field = string('status').color(colorFn);
      expect(field.fieldType.ui?.color).toBe(colorFn);
    });

    test('style() sets custom CSS', () => {
      const customStyle = { fontSize: '18px', fontWeight: 'bold' };
      const field = string('title').style(customStyle);
      expect(field.fieldType.ui?.style).toEqual(customStyle);
    });
  });

  describe('Method Chaining', () => {
    test('chains multiple UI methods', () => {
      const field = string('firstName')
        .label('First Name')
        .placeholder('Enter first name')
        .width(0.5)
        .help('Legal first name')
        .bold();
      
      expect(field.fieldType.ui?.label).toBe('First Name');
      expect(field.fieldType.ui?.placeholder).toBe('Enter first name');
      expect(field.fieldType.ui?.width).toBe(0.5);
      expect(field.fieldType.ui?.help).toBe('Legal first name');
      expect(field.fieldType.ui?.bold).toBe(true);
    });

    test('chains validation and UI methods', () => {
      const field = number('age')
        .min(0)
        .max(120)
        .suffix(' years')
        .alignCenter()
        .large();
      
      expect(field.fieldType._min).toBe(0);
      expect(field.fieldType._max).toBe(120);
      expect(field.fieldType.ui?.suffix).toBe(' years');
      expect(field.fieldType.ui?.alignCenter).toBe(true);
      expect(field.fieldType.ui?.large).toBe(true);
    });

    test('preserves UI metadata in required()', () => {
      const field = string('email')
        .placeholder('user@example.com')
        .help('Your email address')
        .required();
      
      expect(field.fieldType.isRequired).toBe(true);
      expect(field.fieldType.ui?.placeholder).toBe('user@example.com');
      expect(field.fieldType.ui?.help).toBe('Your email address');
    });
  });

  describe('Field Types Support', () => {
    test('StringField supports UI methods', () => {
      const field = string('name').bold().alignLeft();
      expect(field.fieldType.ui?.bold).toBe(true);
      expect(field.fieldType.ui?.alignLeft).toBe(true);
    });

    test('NumberField supports UI methods', () => {
      const field = number('price').prefix('$').alignRight();
      expect(field.fieldType.ui?.prefix).toBe('$');
      expect(field.fieldType.ui?.alignRight).toBe(true);
    });

    test('DateField supports UI methods', () => {
      const field = date('birthDate').label('Date of Birth').floatingLabel();
      expect(field.fieldType.ui?.label).toBe('Date of Birth');
      expect(field.fieldType.ui?.floatingLabel).toBe(true);
    });

    test('BooleanField supports UI methods', () => {
      const field = boolean('isActive').label('Active').prefix('Status:');
      expect(field.fieldType.ui?.label).toBe('Active');
      expect(field.fieldType.ui?.prefix).toBe('Status:');
    });
  });

  describe('Field Groups', () => {
    test('creates vertical group with label', () => {
      const g = group('Contact Info', [
        string('email'),
        string('phone'),
      ]);
      
      expect(g.label).toBe('Contact Info');
      expect(g.horizontal).toBe(false);
      expect(g.children).toHaveLength(2);
    });

    test('creates horizontal group with label', () => {
      const g = hgroup('Name', [
        string('firstName'),
        string('lastName'),
      ]);
      
      expect(g.label).toBe('Name');
      expect(g.horizontal).toBe(true);
      expect(g.children).toHaveLength(2);
    });

    test('creates nameless group', () => {
      const g = group([
        string('field1'),
        string('field2'),
      ]);
      
      expect(g.label).toBe(null);
      expect(g.children).toHaveLength(2);
    });

    test('creates nameless horizontal group', () => {
      const g = hgroup([
        string('field1'),
        string('field2'),
      ]);
      
      expect(g.label).toBe(null);
      expect(g.horizontal).toBe(true);
    });

    test('group supports collapsible()', () => {
      const g = group('Details', [string('field')]).collapsible();
      expect(g._collapsible).toBe(true);
    });

    test('group supports id()', () => {
      const g = group('Details', [string('field')]).id('details-section');
      expect(g._id).toBe('details-section');
    });

    test('group supports border()', () => {
      const g = group('Details', [string('field')]).border('1px solid #ccc');
      expect(g._border).toBe('1px solid #ccc');
    });

    test('group supports padding()', () => {
      const g = group('Details', [string('field')]).padding('10px');
      expect(g._padding).toBe('10px');
    });

    test('supports nested groups', () => {
      const g = group('Outer', [
        string('field1'),
        hgroup('Inner', [
          string('field2'),
          string('field3'),
        ]),
      ]);
      
      expect(g.children).toHaveLength(2);
      expect(g.children[1]).toBeInstanceOf(Object);
    });
  });

  describe('Entity with Field Customization', () => {
    test('creates entity with customized fields', () => {
      const Person = ownedEntity('Person', [
        string('firstName').hideLabel().width(0.5).placeholder('First name'),
        string('lastName').hideLabel().width(0.5).placeholder('Last name'),
        number('age').suffix(' years').alignCenter().large(),
        date('birthDate').label('Date of Birth').floatingLabel(),
      ]);
      
      expect(Person.schema.firstName.ui?.hideLabel).toBe(true);
      expect(Person.schema.firstName.ui?.width).toBe(0.5);
      expect(Person.schema.lastName.ui?.placeholder).toBe('Last name');
      expect(Person.schema.age.ui?.suffix).toBe(' years');
      expect(Person.schema.birthDate.ui?.label).toBe('Date of Birth');
    });

    test('creates entity with groups', () => {
      const Project = ownedEntity('Project', [
        string('name'),
        hgroup('Timeline', [
          date('startDate'),
          date('endDate'),
        ]),
        group('Budget', [
          number('estimated').prefix('$'),
          number('actual').prefix('$'),
        ]).collapsible(),
      ]);
      
      expect(Project.schema.name).toBeDefined();
      expect(Project.schema.startDate).toBeDefined();
      expect(Project.schema.endDate).toBeDefined();
      expect(Project.schema.estimated).toBeDefined();
      expect(Project.groups).toBeDefined();
      expect(Project.groups).toHaveLength(2);
    });

    test('preserves field order with groups', () => {
      const Task = ownedEntity('Task', [
        string('title'),
        group('Details', [
          string('description'),
          date('dueDate'),
        ]),
        string('status'),
      ]);
      
      expect(Task.fieldOrder).toEqual(['title', 'description', 'dueDate', 'status']);
    });
  });

  describe('Complex Scenarios', () => {
    test('conditional styling example', () => {
      const colorFn = (value: any) => value === 'completed' ? 'green' : 'orange';
      const Order = ownedEntity('Order', [
        string('status').bold().color(colorFn),
        number('total').prefix('$').alignRight().large().bold(),
      ]);
      
      expect(typeof Order.schema.status.ui?.color).toBe('function');
      expect(Order.schema.total.ui?.prefix).toBe('$');
      expect(Order.schema.total.ui?.bold).toBe(true);
    });

    test('responsive styling example', () => {
      const Task = ownedEntity('Task', [
        string('title').style({
          base: { gridColumn: 'span 2', fontSize: 'var(--font-lg)' },
          '@md': { gridColumn: 'span 1' },
        }),
      ]);
      
      expect(Task.schema.title.ui?.style).toBeDefined();
      expect(Task.schema.title.ui?.style.base).toBeDefined();
    });

    test('mixed groups and fields', () => {
      const Form = ownedEntity('Form', [
        string('header').large().bold(),
        hgroup('Name Fields', [
          string('firstName').width(0.5),
          string('lastName').width(0.5),
        ]),
        string('email').width(1),
        group('Address', [
          string('street'),
          hgroup(null, [
            string('city').width(0.5),
            string('zip').width(0.5),
          ]),
        ]).collapsible().border('1px solid var(--border)'),
      ]);
      
      expect(Form.fieldOrder).toContain('header');
      expect(Form.fieldOrder).toContain('firstName');
      expect(Form.fieldOrder).toContain('email');
      expect(Form.groups).toHaveLength(3); // 2 named hgroups + 1 named group + 1 nested hgroup
    });
  });
});
