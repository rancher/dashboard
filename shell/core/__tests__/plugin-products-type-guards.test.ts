import {
  isProductSinglePage,
  isProductChildGroup,
  isProductChildWithComponent,
  isProductChildWithType,
  hasNameProperty,
  hasTypeProperty,
} from '@shell/core/plugin-products-type-guards';

describe('plugin-products-type-guards', () => {
  describe('isProductSinglePage', () => {
    it('should return true when product has a component', () => {
      const product = {
        name: 'my-product', label: 'My Product', component: { name: 'Page' }
      };

      expect(isProductSinglePage(product)).toBe(true);
    });

    it('should return false when product has no component', () => {
      const product = { name: 'my-product', label: 'My Product' };

      expect(isProductSinglePage(product)).toBe(false);
    });
  });

  describe('isProductChildGroup', () => {
    it('should return true when child has children array', () => {
      const child = {
        name: 'group', label: 'Group', children: []
      } as any;

      expect(isProductChildGroup(child)).toBe(true);
    });

    it('should return false when child has no children', () => {
      const child = {
        name: 'page', label: 'Page', component: { name: 'Page' }
      } as any;

      expect(isProductChildGroup(child)).toBe(false);
    });
  });

  describe('isProductChildWithComponent', () => {
    it('should return true for custom page with component and no children', () => {
      const child = {
        name: 'page', label: 'Page', component: { name: 'Page' }
      } as any;

      expect(isProductChildWithComponent(child)).toBe(true);
    });

    it('should return false for group with component and children', () => {
      const child = {
        name: 'group', label: 'Group', component: { name: 'Page' }, children: []
      } as any;

      expect(isProductChildWithComponent(child)).toBe(false);
    });

    it('should return false for resource page with type', () => {
      const child = { type: 'pod' } as any;

      expect(isProductChildWithComponent(child)).toBe(false);
    });
  });

  describe('isProductChildWithType', () => {
    it('should return true for resource page with type string', () => {
      const child = { type: 'provisioning.cattle.io.cluster' } as any;

      expect(isProductChildWithType(child)).toBe(true);
    });

    it('should return false for custom page with component', () => {
      const child = {
        name: 'page', label: 'Page', component: { name: 'Page' }
      } as any;

      expect(isProductChildWithType(child)).toBe(false);
    });

    it('should return false for group with type', () => {
      const child = {
        name: 'group', label: 'Group', type: 'pod', children: []
      } as any;

      expect(isProductChildWithType(child)).toBe(false);
    });
  });

  describe('hasNameProperty', () => {
    it('should return true when child has name string', () => {
      const child = { name: 'test', label: 'Test' } as any;

      expect(hasNameProperty(child)).toBe(true);
    });

    it('should return false when child has no name', () => {
      const child = { type: 'pod' } as any;

      expect(hasNameProperty(child)).toBe(false);
    });
  });

  describe('hasTypeProperty', () => {
    it('should return true when child has type string', () => {
      const child = { type: 'pod' } as any;

      expect(hasTypeProperty(child)).toBe(true);
    });

    it('should return false when child has no type', () => {
      const child = {
        name: 'page', label: 'Page', component: { name: 'Page' }
      } as any;

      expect(hasTypeProperty(child)).toBe(false);
    });
  });
});
