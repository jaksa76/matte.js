import { describe, it, expect, beforeEach } from 'bun:test';
import { ownedEntity, string, number, date, richtext, hgroup } from '../../src/framework/entities';
import { listView, gridView, customGridView, show, FieldSelector, getCustomizedEntity } from '../../src/framework/views';

describe('Custom Views', () => {
  beforeEach(() => {
    // No setup needed
  });

  describe('FieldSelector', () => {
    it('should create a field selector with a field name', () => {
      const selector = show('name');
      expect(selector).toBeInstanceOf(FieldSelector);
      expect(selector.fieldName).toBe('name');
    });

    it('should support alignment methods', () => {
      const selector = show('name').alignCenter();
      expect(selector.uiMetadata.alignCenter).toBe(true);

      const selector2 = show('price').alignLeft();
      expect(selector2.uiMetadata.alignLeft).toBe(true);

      const selector3 = show('total').alignRight();
      expect(selector3.uiMetadata.alignRight).toBe(true);
    });

    it('should support styling methods', () => {
      const selector = show('title').bold().large();
      expect(selector.uiMetadata.bold).toBe(true);
      expect(selector.uiMetadata.large).toBe(true);
    });

    it('should support color customization', () => {
      const selector = show('status').color('red');
      expect(selector.uiMetadata.color).toBe('red');

      const selector2 = show('status').color((val) => val === 'active' ? 'green' : 'red');
      expect(typeof selector2.uiMetadata.color).toBe('function');
    });

    it('should support width customization', () => {
      const selector = show('name').width(0.5);
      expect(selector.uiMetadata.width).toBe(0.5);
    });

    it('should support label customization', () => {
      const selector = show('name').label('Full Name');
      expect(selector.uiMetadata.label).toBe('Full Name');

      const selector2 = show('id').hideLabel();
      expect(selector2.uiMetadata.hideLabel).toBe(true);
    });

    it('should support prefix and suffix', () => {
      const selector = show('price').prefix('$').suffix(' USD');
      expect(selector.uiMetadata.prefix).toBe('$');
      expect(selector.uiMetadata.suffix).toBe(' USD');
    });

    it('should support readOnly state', () => {
      const selector = show('createdAt').readOnly();
      expect(selector.uiMetadata.readOnly).toBe(true);
    });

    it('should support hidden state', () => {
      const selector = show('internalId').hidden();
      expect(selector.uiMetadata.hidden).toBe(true);
    });

    it('should support method chaining', () => {
      const selector = show('title')
        .label('Article Title')
        .bold()
        .large()
        .alignCenter()
        .width(1);

      expect(selector.uiMetadata.label).toBe('Article Title');
      expect(selector.uiMetadata.bold).toBe(true);
      expect(selector.uiMetadata.large).toBe(true);
      expect(selector.uiMetadata.alignCenter).toBe(true);
      expect(selector.uiMetadata.width).toBe(1);
    });
  });

  describe('View Types', () => {
    it('should create a list view page', () => {
      const entity = ownedEntity('Task', [
        string('title').required(),
        string('status'),
      ]);

      const page = listView(entity);
      expect(page.display.displayType).toBe('entity');
      expect(page.display.displayId).toBe('list');
      expect(page.display.entity).toBe(entity);
      expect(page.path).toBe('task');
    });

    it('should create a grid view page', () => {
      const entity = ownedEntity('Product', [
        string('name').required(),
        number('price'),
      ]);

      const page = gridView(entity);
      expect(page.display.displayType).toBe('entity');
      expect(page.display.displayId).toBe('grid');
      expect(page.display.entity).toBe(entity);
      expect(page.path).toBe('product');
    });

    it('should create a custom grid view page', () => {
      const entity = ownedEntity('Event', [
        string('name').required(),
        date('date'),
        string('location'),
      ]);

      const page = customGridView(entity, [
        show('name').bold(),
        show('date'),
      ]);

      expect(page.display.displayType).toBe('entity');
      expect(page.display.displayId).toBe('grid');
      expect(page.display.entity.schema.name.ui?.bold).toBe(true);
      expect(page.display.entity.schema.name.ui?.hidden).toBe(false);
      expect(page.display.entity.schema.location.ui?.hidden).toBe(true);
    });

    it('should allow custom page options', () => {
      const entity = ownedEntity('Product', [
        string('name').required(),
      ]);

      const page = gridView(entity, {
        pageName: 'All Products',
        pagePath: 'products',
      });

      expect(page.name).toBe('All Products');
      expect(page.path).toBe('products');
    });
  });

  describe('Custom View Entity Customization', () => {
    it('should hide fields not in custom view', () => {
      const entity = ownedEntity('Event', [
        string('name').required(),
        date('date'),
        string('location'),
        richtext('details'),
      ]);

      const customFields = [
        show('name'),
        show('date'),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      expect(customized.schema.name.ui?.hidden).toBe(false);
      expect(customized.schema.date.ui?.hidden).toBe(false);
      expect(customized.schema.location.ui?.hidden).toBe(true);
      expect(customized.schema.details.ui?.hidden).toBe(true);
    });

    it('should apply UI metadata from field selectors', () => {
      const entity = ownedEntity('Event', [
        string('name').required(),
        date('date'),
        string('location'),
      ]);

      const customFields = [
        show('name').bold().large().alignCenter(),
        show('date').alignLeft(),
        show('location').alignRight(),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      expect(customized.schema.name.ui?.bold).toBe(true);
      expect(customized.schema.name.ui?.large).toBe(true);
      expect(customized.schema.name.ui?.alignCenter).toBe(true);
      expect(customized.schema.date.ui?.alignLeft).toBe(true);
      expect(customized.schema.location.ui?.alignRight).toBe(true);
    });

    it('should preserve original entity schema', () => {
      const entity = ownedEntity('Product', [
        string('name').required(),
        number('price'),
      ]);

      const customFields = [
        show('name').bold(),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      // Original entity should not be modified
      expect(entity.schema.name.ui?.bold).toBeUndefined();
      expect(entity.schema.price.ui?.hidden).toBeUndefined();

      // Customized entity should have modifications
      expect(customized.schema.name.ui?.bold).toBe(true);
      expect(customized.schema.price.ui?.hidden).toBe(true);
    });

    it('should merge with existing UI metadata', () => {
      const entity = ownedEntity('Product', [
        string('name').required().label('Product Name'),
        number('price'),
      ]);

      const customFields = [
        show('name').bold(),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      // Should preserve original label and add new metadata
      expect(customized.schema.name.ui?.label).toBe('Product Name');
      expect(customized.schema.name.ui?.bold).toBe(true);
    });

    it('should handle field selector with color function', () => {
      const entity = ownedEntity('Task', [
        string('status'),
      ]);

      const colorFn = (val: string) => val === 'done' ? 'green' : 'red';
      const customFields = [
        show('status').color(colorFn),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      expect(customized.schema.status.ui?.color).toBe(colorFn);
    });

    it('should handle field selector with prefix and suffix functions', () => {
      const entity = ownedEntity('Product', [
        number('price'),
      ]);

      const prefixFn = (val: number) => val > 100 ? '$$' : '$';
      const customFields = [
        show('price').prefix(prefixFn).suffix(' USD'),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      expect(customized.schema.price.ui?.prefix).toBe(prefixFn);
      expect(customized.schema.price.ui?.suffix).toBe(' USD');
    });
  });

  describe('Custom View with Groups', () => {
    it('should handle hgroup in custom view', () => {
      const entity = ownedEntity('Event', [
        string('name').required(),
        date('date'),
        string('location'),
        richtext('details'),
      ]);

      const customFields = [
        show('name').large().bold(),
        hgroup(null, [
          show('date').alignLeft(),
          show('location').alignRight(),
        ]),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      // Name should be visible and styled
      expect(customized.schema.name.ui?.hidden).toBe(false);
      expect(customized.schema.name.ui?.large).toBe(true);
      expect(customized.schema.name.ui?.bold).toBe(true);

      // Fields in hgroup should be visible and styled
      expect(customized.schema.date.ui?.hidden).toBe(false);
      expect(customized.schema.date.ui?.alignLeft).toBe(true);
      expect(customized.schema.location.ui?.hidden).toBe(false);
      expect(customized.schema.location.ui?.alignRight).toBe(true);

      // Details should be hidden
      expect(customized.schema.details.ui?.hidden).toBe(true);
    });

    it('should handle nested groups in custom view', () => {
      const entity = ownedEntity('Article', [
        string('title'),
        string('author'),
        date('publishedAt'),
        string('category'),
      ]);

      const customFields = [
        show('title').bold(),
        hgroup(null, [
          show('author'),
          hgroup(null, [
            show('publishedAt'),
          ]),
        ]),
      ];

      const customized = getCustomizedEntity(entity, customFields);

      expect(customized.schema.title.ui?.hidden).toBe(false);
      expect(customized.schema.author.ui?.hidden).toBe(false);
      expect(customized.schema.publishedAt.ui?.hidden).toBe(false);
      expect(customized.schema.category.ui?.hidden).toBe(true);
    });
  });

  describe('View without custom fields', () => {
    it('should return original entity when no custom fields', () => {
      const entity = ownedEntity('Product', [
        string('name'),
        number('price'),
      ]);

      const customized = getCustomizedEntity(entity);

      expect(customized).toBe(entity);
    });

    it('should return original entity for undefined custom fields', () => {
      const entity = ownedEntity('Task', [
        string('title'),
      ]);

      const customized = getCustomizedEntity(entity, undefined);

      expect(customized).toBe(entity);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty custom fields array', () => {
      const entity = ownedEntity('Product', [
        string('name'),
        number('price'),
      ]);

      const customized = getCustomizedEntity(entity, []);

      // All fields should be hidden
      expect(customized.schema.name.ui?.hidden).toBe(true);
      expect(customized.schema.price.ui?.hidden).toBe(true);
    });

    it('should handle field selector for non-existent field', () => {
      const entity = ownedEntity('Product', [
        string('name'),
      ]);

      const customFields = [
        show('name').bold(),
        show('nonexistent').large(), // This field doesn't exist
      ];

      const customized = getCustomizedEntity(entity, customFields);

      // Should only apply to existing fields
      expect(customized.schema.name.ui?.bold).toBe(true);
      expect(customized.schema.name.ui?.hidden).toBe(false);
    });

    it('should handle multiple customizations to same field', () => {
      const entity = ownedEntity('Product', [
        string('name'),
      ]);

      const customFields = [
        show('name').bold(),
        show('name').large(), // Second customization to same field
      ];

      const customized = getCustomizedEntity(entity, customFields);

      // Both customizations should be applied
      expect(customized.schema.name.ui?.bold).toBe(true);
      expect(customized.schema.name.ui?.large).toBe(true);
    });
  });
});
